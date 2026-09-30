# 2026-09-10 — shadow 方案实测无效；改为原地改写定义

## Problem

在 headless profile 对照实测 `dsh-subagent-background-only`（诊断探针只进
headless，web profile 未动）。结论：**遮蔽方案完全无效，且静默**，模型始终
看到 `run_in_background`。

实测证据：

- 包装 `agent.ctx.tools.register` 后：85 次投递 shadow，**85 次全部抛错，0 次成功**：
  `Error: tool "subagent" is already registered in this scope`
- schema 侧 48 次观测（含 45 次 `tools/change`）`hasBackgroundParam` 全为 `true`。
- 插件里 `try { … } catch { continue }` 把错误整个吞掉，永久静默 no-op。
- 直接问模型"subagent 有没有该参数"它答"没有"——那是模型臆测自己的 schema，
  与 `ctx.tools.schemas(scope)` 实测输出矛盾，**不可作为验证依据**。

## Root cause

`tool-subagent` 带 `modelSelectionSettings: true` 时走 `installScoped()`，用
`candidate.ctx.inject([...], …)` 把工具注册进 **agent 自己的 layer**。本插件的
shadow 也走 `agent.ctx.tools.register(...)` → **同一个 layer**，`dsh-scope` 的
`NamedEntries.insert()` 对同层重名直接抛错。

且 `view()` 中 agent 自有 layer 是**最后应用、无条件覆盖**所有继承层，所以注册到
作用域链任何一层都无法遮蔽它。`decisions/implemented/2026-09-08-shadow-no-param.md`
里"scoped registrations shadow globals / 自己 layer 免于自己的 restrict"的推理，
在"目标定义本身就注册在同一个 agent layer"时完全不成立。

## Decision

放弃遮蔽，改为**原地改写 agent 解析到的定义本体**（`tools.register` 一次都不调）：

- `view()` 借出定义对象本体，`schemaOf()` 投影时才读 `description`/`parameters`，
  故原地改对模型目录与 dispatch 同时生效。
- schema 删 `run_in_background`（含 `required` 同名项），description 去掉教 false
  的引导，`execute` 包一层强制注入 `true`。
- `Symbol.for(...)` 标记幂等，`agent/created` + `tools/change` 双入口 top-up。
- **剥离前必须确认是 continuable 声明**，因为
  `{ runInBackground: request.run_in_background ?? options.continuable }`：
  `one-shot` 下删参数会把默认路由翻成前台。判别读工具自述（description 承诺
  durable subagent id + 参数自述 `Defaults to true.`），双信号一致才动手，否则
  拒改并告警。
- **不再吞异常**：改写失败一律 warn。这次要是没吞，插件第一次跑就会自己喊出来。

实测（headless，终版构建）：模型答 `subagent` 参数为 `description, prompt`，
且指出 `run_in_background` 只在 `subagent_fork` 里——与真实逐工具声明吻合；
真实调用返回 `started subagent <id>`，确为后台。

## Alternatives considered

- **退回 v1 guard**：按名拦显式 `false`。用户明确拒绝——放弃了"参数从 schema
  消失"这一核心目标。
- **在 preset standing layer 遮蔽**：不可行。`view()` 里 agent 自有 layer 最后
  应用且无条件覆盖，任何继承层都盖不住。
- **`tools.restrict`**：不可行。`restrict` 只过滤**继承面**（`admits()` 只作用于
  inherited），对自有 layer 无效，且不允许命名 scope 自己注册的工具。
- **上游加配置**：现有 `enableRunInBackground: false` 语义相反（强制前台，且模型
  传 `true` 时直接抛错），不是所需。

## Consequences

- `subagent` 的 `run_in_background` 真正从模型 schema 消失，默认后台路由不变。
- one-shot 配置的 `subagent_fork`（如 dsh-headless）被拒改 + 告警，行为保持原样
  ——这是有意的安全边界，避免静默翻成前台。
- 原地改写依赖 `tool-subagent` 的自述文案作为模式判别；上游改文案会退化为
  "拒改 + 告警"（安全方向失败），不会翻车成前台。上游改文案时需同步
  `CONTINUABLE_DESCRIPTION_HINT` / `CONTINUABLE_PARAM_HINT`。
- 若上游将来把该工具注册到 agent 层之外，遮蔽路线会重新可行，但原地改写仍能工作。
