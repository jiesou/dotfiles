# 决定：跟进 tool-subagent 0.2.0-rc.2 的文案重写（判定锚点 + 拒改规则）

**classification**: fix · **date**: 2026-10-03

## Problem

`@deepseek-ai/dsh-tool-subagent` 0.2.0-rc.2 重写了 continuable 模式的全部模型可见文案：

| 锚点 | ≤ 0.1.x | 0.2.0-rc.2 |
|---|---|---|
| 工具 description | `immediately returns a durable subagent id` | `It runs in the background by default and returns a subagent id you can continue with \`send_message\`` |
| 参数 description | `Whether to run in the background and return a durable subagent id immediately. Defaults to true. …` | `Defaults to true. Set false only when your next action depends on the result.` |
| 工具 description 的 false 引导 | `Set \`run_in_background: false\` only when your next action depends on receiving the result.` | 不存在——教 `false` 的话搬进了**参数自己的** description |
| system prompt 段 `tool:<toolName>` | 含 `Set \`run_in_background: false\` …` | 只有 "Start independent … delegations together …" |

`durableId` 与 `falseTeaching` 两个锚点同时落空，于是 `isContinuableDeclaration` 判定
失败、`backgroundDescription` 也无从下手：插件从 9/30 起全程走
`REFUSAL_MODE`（日志 `subagent: declaration is not backgroundMode: continuable …`），
`run_in_background` 一直留在 schema 里——**静默退回上游默认行为**，正是本插件要消灭的形态。

## Decision

1. 锚点更新为 0.2.0-rc.2 的原文：`continuableId`（工具 description）、
   `paramDefaultsTrue` / `paramDefaultsFalse`（参数 description，未变）、
   `byDefault: 'runs in the background by default'`（改写锚点）。
2. 改写规则从"替换 false 引导句"变成"把 `by default` 改成 `always`"：现在唯一教 `false`
   的文本在参数 description 里，删参数即随之删除，插件不必再和提示词层搏斗。
3. 拒改规则换成**不依赖措辞的不变量**：改写后 description 若仍出现 `run_in_background`，
   说明上游又把引导搬回工具 description，此时拒改并告警（`REFUSAL_WORDING`）。旧的
   "锚点句找不到就拒改"会让纯装饰性重写也停摆，新规则只在真的会留下半成品时停。
4. `REFUSAL_MODE` 文案改为同时点明两个信号（description 缺 continuable 句 / 参数不是
   `Defaults to true.`），因为这次的失败原因正是前者，旧文案把锅全甩给参数、误导排查。

## Alternatives considered

- **放宽为"参数自述 `Defaults to true.` 即剥离"**：工具 description 是 continuable 的
  第二证据，去掉后 one-shot 行只要参数文案含 `Defaults to true.` 就会被误剥离，而
  `subagent_fork`（headless 配 one-shot）正是这类行。
- **改用输出 schema / 系统 prompt 段做结构化判定**：输出 schema 的 `oneOf`
  三支（background / continuable / foreground）与模式无关；系统 prompt 段名与 order
  常量是上游内部结构，抄进来更脆。
- **不再改写 description**：会留下"runs in the background by default"——参数已不存在，
  "by default" 是空头承诺，模型仍可能去猜一个开关。

## Consequences

- `UPSTREAM_WORDING` 的每个值仍被 `tests/engine.spec.ts` 在**已安装引擎的源码**里逐一
  断言，下次重写一样会红。
- 残留问题（system prompt 里教 `false`）由上游自己消除，README 的"已知残留"章节改写为
  版本变更表。
- 判定/改写仍只认 continuable 声明：`subagent_fork` 配 one-shot 时照旧拒改 + 告警。
