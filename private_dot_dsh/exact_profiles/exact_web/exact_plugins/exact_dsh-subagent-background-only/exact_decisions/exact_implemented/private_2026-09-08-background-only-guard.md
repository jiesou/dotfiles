## Problem

Agent 只能以后台方式派生子代理：前台（等待子代理结果）和一次性（one-shot）
调用不应暴露。内置 `tool-subagent` 的 `backgroundMode: continuable` 只是让
`run_in_background` 缺省为 true，模型显式传 `false` 照样走前台；one-shot
实例（codex / claude-code）根本没有后台语义。配置层面堵不住。

## Decision

纯 Cordis guard 插件 `dsh-subagent-background-only`：全局
`tools.guard()` 按名拦截，不注册任何工具、不碰 `startContinuable`：

- continuable 工具（`subagent` / `subagent_fork`）：只拦显式
  `run_in_background: false`。缺省在 continuable 实例上即后台，放行。
- one-shot 工具（`subagent_codex` / `subagent_claude_code`）：任何调用都拦。
- 其余工具（`send_message` / `interrupt_agent` / `job_*` 等）一律放行。

`inject = ['tools']`，`ctx.effect()` 持有 guard 句柄，disable 时清理。
纯 cordis 形态：profile `cordis.patch.yml` insert 行，HMR 实时生效。

## Alternatives considered

- `dsh-tool-deny` 屏蔽内置 `subagent`：连后台一起杀掉，不符合“只暴露后台”。
- 改 preset 把 `backgroundMode` 换成强制后台：配置无此语义，`enableRunInBackground: false`
  反而是强制前台。
- 注册自己的 `subagent_bg` 包装 `startContinuable`：重复造轮子；preset 的
  continuable 实例后台调用本就可用，只需拦住前台分支。
- PerryLink/dsh-background-agents：自带后台工具 + 面板的重型方案；需求只是
  “不暴露前台”，guard 一层足够。

## Consequences

- 模型调前台 subagent 时收到明确拒绝文案，引导其走后台。
- 后台调用零改动：guard 返回 undefined 即放行，无额外开销。
- preset 新增 one-shot 工具名时需同步 `ONESHOT_TOOLS` 名单。
