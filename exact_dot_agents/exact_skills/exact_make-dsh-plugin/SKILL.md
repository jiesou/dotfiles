---
name: make-dsh-plugin
description: Create DeepSeek Harness plugins.
license: MIT
metadata:
  author: dsh-external/plugin-registry
  version: "3.1.0"
requires:
  bins:
    - dsh
---

# 创建官方 bundle / cordis 插件

本 skill 构建 **0811 官方形态**的插件：外部插件统一是 npm 包，经 web
profile 安装——声明 `dsh.bundle` 的走层栈（重启生效），纯 Cordis 包走
profile `cordis.patch.yml` insert 行（配置 HMR 实时生效）。**没有**
repository-plugin、`__ModuleLoader__` 之外的旧协议、`dsh registry` CLI——
旧机制已于 2026-08 移除（0811 起 repository-plugins 机制删除）。

**权威契约内嵌在本 skill 的 `references/`**（bundle + entry + skill + MCP 在
`bundle-plugins.md` 与 `entry-contract.md`、验证在 `install-and-verify.md`、
规范在 `dev-conventions.md`、坑在 `gotchas.md`）——开发不需要任何仓库文档。
到达对应阶段时读对应 reference。

## 何时使用

- 用户想为 dsh 开发新插件（工具、skill 包、MCP server、事件监听、服务、
  命令、prompt、浏览器 UI）。
- 用户要 bundle 插件 / 纯 cordis 插件的脚手架 / 示例 / 模板。
- 插件挂载失败且原因是 entry 契约或安装通道。

## Step 0：选择插件形态

按插件分发什么选官方路径。`dsh` 字段 strict——能力面声明：

| 需求 | 官方路径 | 安装通道 | 起点 |
|---|---|---|---|
| 纯 skill 包（无代码） | npm 包 + `dsh.skills` | bundle（或 insert 行） | Step 2（skills） |
| MCP server | npm 包 + `dsh.mcpServers` | bundle（或 insert 行） | Step 2（mcp） |
| Node 工具 / 事件 / 服务 | npm 包 + Cordis entry（`main`） | insert 行（实时） | Step 3 |
| Node + 浏览器 UI | npm 包 + Cordis entry + `dsh.client` | bundle | Step 3 + 4 |
| 带组合层（多行 insert/config/disabled 随包分发） | npm 包 + `dsh.bundle` | bundle 层栈 | 读 `references/bundle-plugins.md` |

**核心判据**（0811 分类）：包是否声明 `dsh.bundle.patch`。声明 = 一层组合
patch（多个 insert/config/disabled 行）→ `dsh plugin --profile web add` 进层栈，
**重启生效**；无声明 = 单个 Cordis 插件 → profile `cordis.patch.yml` insert
行，**配置 HMR 实时生效**。带 UI 的独立插件两类皆可（自渲染 client 在
bundle 里照常工作）——选型看是否需要组合层，而非 UI 形态。

## Step 1：仓库布局

`my-plugin/` 根即 npm 包（bundle 形态包根 = 仓库根）：

```
my-plugin/
├── package.json            # name/version + main/exports + dsh.bundle/dsh.client
├── cordis.patch.yml        # dsh.bundle 声明的组合层（insert 挂载自身）
├── src/index.ts            # Node half 入口源码：完整 Cordis 插件（name/inject/apply）
├── lib/                    # tsdown 构建产物（lib/index.js，入库——git 源一行安装的前提）
├── client/  lib/client.js  # client bundle 源码 / 构建产物（dsh.client 通道）
├── tests/                  # vitest specs（门禁）
└── tsconfig.json  tsdown.config.ts
```

npm 包名默认应采用 `@user/package` 形式，不占全局命名空间

## Step 2：`package.json` + 能力面

按 `references/bundle-plugins.md` 与 `references/entry-contract.md` 的模板。
关键决策：

- `dsh.bundle.patch` → `cordis.patch.yml`（组合层，含 `- insert: - id: <自身> name: <包名>`）
- `dsh.client` 声明（platform web）+ `exports["./client"]`（有 client half 时）
- `main`/`exports["."]` 指向 Cordis entry（`name`/`inject`/`apply`）
- `inject` 声明 `ctx.get` 用到的全部服务（`settings`/`httpServer` 等）——
  **0811 cordis 严格注入**：未声明即抛 `cannot get property without inject`

### Skill 包（`dsh.skills`）与 MCP server（`dsh.mcpServers`）

声明写法（`dsh.skills` 相对路径列表 / `dsh.mcpServers` 的 server-id → 启动
配置映射）与 SKILL.md 写法规范（frontmatter / 正文模式 / <500 行，遵循
make-skill）见 `references/entry-contract.md` 对应小节——不要发明竞争格式。

## Step 3：Node half——Cordis entry

`src/index.ts` 导出完整 Cordis 插件（`name`/`inject`/`apply`），经 `pnpm build`（tsdown）编译为 `lib/index.js`——`main`/`exports["."]` 指向构建产物。用 `defineTool`
注册工具；服务/事件/命令/prompt 是完整 Cordis，无需声明。依赖解析是官方
运行时的职责（`@deepseek-ai/*`、`cordis`——profile pnpm 闭包注入，勿声明）。
在 `ctx.effect()`/`ctx.on()` 内注册，disable 时清理。

**检查点**：entry 可解析；工具已注册；inject 声明完整。

## Step 4：Client half（可选）——自渲染

带 UI 的插件声明 `dsh.client`（platform web）+ `exports["./client"]`，client
bundle 经 `__ModuleLoader__.load({id, factory})` 注册（factory 返回
`{name, apply}`，由 client 内核挂载时调用 `apply(ctx)`）。自渲染 DOM 逻辑
放 `apply` 内——**与填官方 hole 正交**（自渲染跑 bundle 照常，参考实现 `packages/plugin/console`）。

构建：esbuild CJS 输出 + 外层 `window.__ModuleLoader__.load` 包装（对齐
`packages/plugin/console` 的 tsdown banner/footer 模式）。

**检查点**：`__DSH_BOOT__` 含 client 行；`/plugins/<id>/client.js` 200；无
`loaded without registering` 报错。

## Step 5：安装与验证

安装通道（写法细则见 `references/install-and-verify.md` 与
`references/bundle-plugins.md`）：

- **bundle**：`dsh plugin --profile web add <包路径/git 源>`——声明 `dsh.bundle`
  的 npm 包；git 源一行（产物入库）或本地目录；装完**重启 web**
- **纯 cordis**：`dsh plugin --profile web add <包>` 装依赖 + profile
  `cordis.patch.yml` insert 行——**配置 HMR 实时挂载，零重启**

**写安装说明时必须给出用户可直接复制的命令**；验证按改动面（哪些需重启
web vs 只刷新）与挂载失败排查见 `references/install-and-verify.md`。

## Step 5b：发布到 GitHub

npm 包（或 git 源）是分发单元——设置好让用户能找到并安装。

**仓库 description**（一行：是什么），具体模板：

**仓库 topics（GitHub 标签）**

**生态标签**（固定少量，标识 dsh 生态身份）：
- `dsh`
- `dsh-plugin`
- `deepseek-harness`

**功能标签**（有意义——描述插件能力/领域，按插件实际内容定）：
- 能力：`tool` / `skill` / `mcp` / `command` / `ui`（按插件含什么）
- **领域/用途**（关键——让搜索命中「能干什么」）：如 `pet`（宠物）、
  `loop`（定时循环）、`terminal`（终端）、`status`（状态条）、`automation`
  （自动化）、`workflow`（工作流）等——从插件的核心功能提炼 1-2 个具体
  领域词，避免泛词

**原则**：想象用户搜什么词能找到这个插件——`dsh-plugin` 人人都有，
`<你的功能词>` 才是区分度。标签总数 3-6 个（生态 2-3 + 功能 2-3）。

用 `gh repo edit <owner>/<repo> --add-topic dsh --add-topic <功能词> ...`
打标签（不要忘了加）

**发布检查清单**（分享仓库前）：
- [ ] `package.json#main`/`exports` 指向 entry；`dsh.bundle.patch` → `cordis.patch.yml`
- [ ] `pnpm check` 通过（typecheck + vitest + build，重建产物已入库）
- [ ] README 有安装（`dsh plugin --profile web add` 含具体 ref）、使用、能力表
- [ ] 仓库 description + topics 已设置（见上）
- [ ] 安装冒烟：装 → 挂载 → boot log 干净

## Step 6：开发规范

可维护的插件遵循 `references/dev-conventions.md` 的纪律：门禁（自证测试）、
每个非平凡改动的决策记录、生成物不手改、首次环境行为沉淀为环境事实。

**README 规范**：
一切格式严格仿照 https://github.com/jiesou/dsh-commandcode-go-provider

- 中英双语
- 安装引导
- git hooks
- package.json release script

等内容都应该高度一致

同时，git tag 使用的版本号格式形如 0.1.0，前面不需要加 `v`

因此注意也应该 copy .npmrc

**进入迭代期时读 `references/dev-conventions.md`**。

## 坑（Gotchas）

高频坑（官方包未发布、ESM 缓存重启、严格注入、宿主 CSS 覆盖、entry 契约
失败时机等）见 `references/gotchas.md`（唯一清单家）；**先读它再动手**。

## 参考

- 本 skill 内嵌契约：
  - `references/bundle-plugins.md` — bundle 插件（dsh.bundle/dsh.client）开发
  - `references/entry-contract.md` — Cordis entry、dsh 字段（skills/mcpServers）、自渲染 client
  - `references/install-and-verify.md` — 按改动面验证
  - `references/gotchas.md` — 坑（官方包未发布、严格注入、ESM 缓存、宿主 CSS 覆盖）
  - `references/dev-conventions.md` — 门禁、决策记录
- 参考实现（仓库内可见）：`packages/plugin/console`（bundle + `__ModuleLoader__.load` client 的完整例子）
