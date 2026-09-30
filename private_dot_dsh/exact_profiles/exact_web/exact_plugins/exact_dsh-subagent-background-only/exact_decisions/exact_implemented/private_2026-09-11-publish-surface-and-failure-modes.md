# 2026-09-11 — 发布面收窄 + 两处失败模式显式化

## Problem

`find-code-simplifications` 复查（含真引擎探针）发现三件事：

1. 入口 `src/index.ts` 把三个引擎耦合的改写助手
   （`isContinuableDeclaration` / `patchDefinition` / `patchAgentTools`）一起导出，
   而它们的参数类型 `ToolDefinitionLike` / `AgentLike` 并不导出——发布出去就是
   "不可命名参数的公共 API"，得背 semver。全仓消费者只有测试。
2. `hasBackgroundParam` / `stripBackgroundParam` 各自带一条"扁平 `parameters`"分支：
   真实生产者 `tool-subagent` 恒经 `defineTool` → `parameterSchemaSpecToJsonSchema`，
   产出必为 `{type:'object', properties, required?}`；而 `isContinuableDeclaration`
   只读 `parameters.properties[...]`，所以扁平形态**永远走不到剥离**。
3. 两处会静默半途而废：判定用 "durable id + Defaults to true."，改 description 却用
   另一句字面量 `replace`——上游只改后者就变成"schema 删了参数、提示词还在教模型传它"。

## Decision

- 拆出 `src/patch.ts`：改写逻辑（含上游文案常量 `UPSTREAM_WORDING`）都住这里，
  入口只留 `name` / `inject` / `apply`。`package.spec` 加断言：入口不 re-export 助手。
  发布面 = cordis 契约。
- 删掉两条扁平分支：`propertiesOf()` 一个取值口，语义就是"引擎保证的编译形态"。
- 判定与改写同源：`backgroundDescription()` 认不到那句 false 引导就返回 `undefined`，
  `patchDefinition` 随之**拒改并告警**（`leave the prompt teaching a parameter the
  schema no longer declares`），而不是留半成品。
- `refusals` WeakSet 并入 `JUDGED` 标记：一个对象只判定一次，"拒改告警只打一次"
  由早退自然得到，少一个模块级可变状态。
- 去掉外层 `ctx.effect(...)` 与手工 disposer：真引擎探针实测 `ctx.tools.guard()`、
  `ctx.on()` 都由调用方 fiber 持有，插件卸载即摘（guard 从 "denied by probe" 变
  `undefined`，`tools/change` 监听停止触发）。原写法等于把框架的所有权又实现了一遍，
  还暗示了一个并不存在的回滚。
- console 重复前缀修复：warn 的 logger 行是 `subagent-background-only: …`，console 行是
  `[subagent-background-only] …`（此前 console 是 `[x] x: …`，与 README 描述不符）。

## Alternatives considered

- **就地覆盖 system prompt 的 `tool:<toolName>` 段**：不采纳。该段与工具注册在同一个
  layer；带 `modelSelectionSettings: true` 的行（shipped standard/ptc/cordis 的
  `subagent` 都是）走 `installScoped()` 进 agent 自有 layer，插件再从 `agent.ctx`
  注册同名段会抛 `prompt section "tool:subagent" is already registered in this scope`；
  只在 preset standing layer 的行才盖得住，而那要求把段名与 `TOOL_SUBAGENT` order
  常量抄进插件。收益（一句陈旧引导）不值这份上游耦合 —— 记为已知残留，根治留给上游的
  "只允许后台" `backgroundMode`。
- **把入口助手降级为不导出**：做不到——测试要直接驱动它们；测试走 `apply()` 会丢掉
  逐工具断言。
- **删除 `engine.spec` 手抄的上游文案，改为挂真 `tool-subagent`**：手抄确实会漂，
  但代价是把 fake provider + sessionProjections 的装配搬进测试。改为折中：文案逐字对齐
  真实产出，并加一条漂移断言——`src/patch.ts` 依赖的每句字面量都必须仍出现在本机
  `dsh-tool-subagent/lib/index.js` 里，上游改文案时测试先炸。
- **去掉 `hasBackgroundParam` 的提前返回**（合并进判定）：不采纳。`enableRunInBackground:
  false` 的行本就无参数，删掉提前返回会让它每次 top-up 都刷一条"拒改"告警。

## Consequences

- 上游只改那句 false 引导时：插件拒改 + 告警，模型参数照旧可见（安全的失败方向），
  不再出现"schema 与提示词互相矛盾"。
- 已知残留：system prompt 段仍教 `run_in_background: false`，模型可能试传一次并被参数
  校验拒绝。README 已写明。
- 改写仍是单向的：卸下插件不还原定义，须重启宿主重新注册；插件内的 disposer 只管
  guard 与监听。
- 发布面只剩 `apply` / `inject` / `name`，`lib/index.d.ts` 从 5.9 kB 降到 1.8 kB。
