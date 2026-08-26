# Decision Record — 用 Landlock-only provider 取代 bwrap 后端

## Problem

dsh 内置沙箱在 Linux 上硬编码优先 bwrap（`dsh-sandbox-local` 的
`linux: ["bwrap", "landlock"]`，rc.2 仍无 `preferredRunner` 配置）。bwrap 走
userns + 挂载拓扑改造，与「应用无感、不改世界」的目标相悖；一旦套在 uid=0
环境属主即失真。要求：**始终 Landlock**，且保留 allow-dir 的 writeDirs 面。

## Decision

bundle 插件 `dsh-sandbox-landlock`，复用 dsh-sandbox-allow-dir 验证过的组合
手法：patch 禁用 base 行（`id: sandbox`、`id: sandbox-allow-dir`）→ 新 id
挂本包 → `apply()` 里 `ctx.provide('sandbox', { confine })` 成唯一提供者。
confine 直接生成 landlock-run 原生方言（`--ro/--rw`），**不存在翻译层**；
挂载时功能探针，失败闭合。

## Alternatives & Why

- **`runnerCommand` 配置**：它仍注入 `bwrapProfileArgs(policy)`（bwrap 方言），
  需要翻译垫片且 enforcement 恒报 full；放弃。
- **sed 改 node_modules 选择链**：升级即丢，接口错误；放弃（allow-dir 决策记录同款理由）。
- **上游 `preferredRunner`**：根治正道，仍值得提 issue；在其落地前用本插件。
- **import 官方包**：profile pnpm 闭包不暴露 `@deepseek-ai/*` 给插件（allow-dir
  已实测）；改为按路径定位 launcher + 无依赖 plain-function plugin。

## 关键事实

- 服务按名注入：`SandboxBashExecutor.inject = [..., 'sandbox']`，禁用 base 后
  本包是唯一提供者，消费方零改动。
- 授权面镜像官方 `landlockProfileArgs`：read-only = `/dev/null`；
  workspace-write = `/dev/null` + `/tmp` + workspaceRoot（+writeDirs）。
- 拒绝方言 EACCES（'permission denied'）、runner 失败规则 exit 125 +
  'landlock-run:' 前缀，对齐官方 LANDLOCK 条目语义。
- 本机 kernel 7.0.12 / Landlock ABI 8 → enforcement: full 属实；老 ABI 内核上
  该声明会虚报（官方 runnerCommand 路径同病），README 已注明。
