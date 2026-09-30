## Problem

`run_in_background` 参数就不该出现在模型看到的 schema 里，而不是先给再拦。
v1 的 guard 方案有两个毛病：模型会看到参数（可能试错传 `false` 再被拒），
文案引导也被拒后才生效。

## Decision

Scope 遮蔽：每个 agent 的自有 layer 注册同名 `subagent` / `subagent_fork`
定义，盖住 preset 的全局定义（scoped registrations shadow globals）。
遮蔽版 schema 删掉 `run_in_background` 字段、description 去掉传 false 的
引导；body 把调用原样转发给被盖住的全局定义并注入
`run_in_background: true`。

- `inject` 从 `['tools']` 扩大到 `['agents', 'tools']`：挂载时采纳已存活
  agent + `agent/created` 逐个遮蔽 + `agent/disposed` 摘除。
- 同名注册在自己的 layer，不触发“同层重复”失败；自己 layer 免于自己的
  restrict，执行不受影响。
- one-shot 工具（`subagent_codex` / `subagent_claude_code`）无后台形态，
  不给遮蔽，保留 guard 直接拒绝。
- `defineTool` 走 `peerDependencies`（profile 闭包注入 `dsh-tools`），与
  本地 provider 插件惯例一致。

## Alternatives considered

- v1 guard 版：参数可见、拒绝后置，已被本决策取代（保留 one-shot 部分）。
- `dsh-tool-deny` 屏蔽内置：连后台一起杀掉，不符合需求。
- 注册新名工具（如 `subagent_bg`）：改名有学习成本，system prompt 引导文案
  还在教旧名。

## Consequences

- 模型看到的 `subagent`/`subagent_fork` 从一开始就没有 `run_in_background`
  参数：无试错、无拒绝、无前台分支。
- 后台调用零改动：遮蔽体只注入 `run_in_background: true` 后转发。
- preset 新增 one-shot 工具名时同步 `ONESHOT_TOOLS` 名单。
- 全局定义原样保留：其他不经过本插件的调用路径不受影响。
