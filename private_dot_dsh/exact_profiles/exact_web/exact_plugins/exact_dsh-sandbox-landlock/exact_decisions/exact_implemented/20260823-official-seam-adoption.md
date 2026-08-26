# Decision Record — 插件改用官方 node-addon-landlock-run JS seam

## Problem

首版手写了 launcher 定位（含无条件 `npm root -g` spawn）、mkdtemp/touch 功能
探针、`--ro/--rw`/exit 125 方言字面量——全是 `@deepseek-ai/node-addon-landlock-run`
JS seam 的既有物。前一份决策记录以「profile pnpm 闭包不暴露 `@deepseek-ai/*`
给插件」为由放弃 import，但该实测只否决 **bare specifier**；seam 是自包含 ESM，
按绝对路径动态 import 不需要任何解析闭包。

## Decision

`apply()` 改 async：定位 dsh 安装目录（argv[1] 上溯两级，懒 `npm root -g`
兜底）→ 绝对路径 `import()` seam → 用其 `launcherPath()/probe()/grantArgs()/
LAUNCHER_BIN/LAUNCHER_FAILURE_EXIT` 生成 confine 结果。探针判定直接作为
`enforcement` 上报（full/partial/unusable，unusable 拒绝挂载保持 fail-closed）。
runner 失败规则补上官方同款 `informationalLines: ['landlock-run: partial
enforcement (older Landlock ABI)']`，修复老 ABI 内核上 exit-125 子进程被误判
runner 失败的潜伏 bug。同时删除 `confine()` 的 danger-full-access 分支：
三个生产消费方（dsh-bash-sandbox run/start、dsh-pwsh-sandbox、dsh-terminal-bash）
都在调用前短路 DFA，该分支不可达且 gate 未覆盖。

## Alternatives & Why

- **保留手写、仅把 npm spawn 改懒**：最小改动，但方言拼写仍会随 launcher CLI
  契约演进漂移，放弃。
- **createRequire 同步 require seam**：seam 是 `"type": "module"` ESM，require
  不可用；为保 sync apply 而手搓 probe 解析得不偿失，接受 async apply
  （cordis loader `_start` await fiber，异步插件语义受支持）。

## 关键事实

- 耦合未新增：旧代码本就硬编码拼写同一棵 dsh node_modules 树的平台二进制包
  路径；现在只是改读它旁边的 JS seam。
- index.mjs 100 → 73 行；gate 从测内部纯函数改为 mock ctx 驱动真实 `apply()`
  全链路（seam 定位 + 真探针 + provide + confine 形状），并移除写死的用户路径。
