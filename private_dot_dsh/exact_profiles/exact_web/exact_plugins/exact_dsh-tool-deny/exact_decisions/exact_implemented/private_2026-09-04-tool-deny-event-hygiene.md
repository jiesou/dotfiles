# 决定：tool-deny 事件卫生重写（注册表预检 + 去抖，无重试计时器）

**classification**: fix · **date**: 2026-09-04 · **supersedes**: 2026-09-03-tool-deny-runtime-enable.md

## Problem

上一版修了“运行时启用拦不住”，但引入了两个新问题：

1. **启动刷屏**：同一条 warn＋masked 在一个 agent 上各打 754 遍。
   根因是监听姿势错了——`tools/change` 上挂了“无条件全量 restrict”，
   而它是 dsh-tools 里唯一的工具事件、无载荷广播：每次注册、每次 preset
   重组、甚至我们自己 `restrict()` 成功都会再 emit 一次。失败抛错打 warn、
   部分成功打 masked，成功又触发下一轮事件，跟其它同事件插件来回放大。
2. **漏配 4 个 tinyfish 新工具**：`batch_status` / `batch_cancel` /
   `cancel_run` / `run_web_automation_async` 在 denyTools 之外，模型仍可见。

用户点评一针见血：不该“打了日志再限流”，监听本身一开始就该干净；
问“能不能监听更细的”——翻完底层确认：**没有更细的事件**，
唯一 emit 就是 `tools/change`（MCP 的 register、preset 重组、subagent
装配全走它），只能让 handler 变干净。

## Decision

删掉整套 per-agent 重试计时器（`MAX_RETRIES` / `attempts` / `gaveUp` /
`scheduleRetry`），改成纯事件驱动的 reconcile：

1. **注册表预检**：handler 先读 `ctx.tools.view(undefined).restrictableNames`
   （全局注册名集合），只有“缺口里有新注册的”才调 `restrict()`；
   否则静默返回——不调用、不打日志。自己成功触发的事件回来一看无新增，
   自然终止，递归按构造终止。
2. **去抖 300ms**：一个 MCP server 注册 N 个工具 = 同一 tick 内 N 个事件，
   合并成一次 reconcile、一次注册表读取。
3. **日志按“真实变化”收敛**：每次 reconcile 至多一行
   `masked … from N agent(s)`（聚合所有 agent 的新增）；
   同一缺失集合只 warn 一次（`warnedMissing` 去重）。
4. **竞态单次内联兜底**：预检→调用之间注册表可能变化，失败时解析报错、
   对已知子集做一次内联 `restrict()`，余量留给下一次注册表事件——
   不再有时限耗尽的“放弃”概念。
5. **guard 保留**：仍是唯一的“未注册名”覆盖手段（掩码只能挂已注册名）。

## Alternatives considered

- **订阅更细的事件**：不存在。`dsh-tools` 唯一 emit 即 `tools/change`，
  无 payload；MCP client 自身不 emit 任何事件。
- **日志限流/采样**：治标——调用风暴本身还在（每事件 N 次 restrict 抛错），
  只是不打印；预检从根上消灭了无效调用。
- **轮询注册表**：事件已覆盖所有注册路径，轮询多余。

## Consequences

- `cordis.patch.yml` 的 denyTools 追加 4 个 tinyfish 新工具名。
- 单测 `tests/mask.spec.ts` 重写：部分掩码聚合日志 / tools/change 补掩码 /
  无关事件零调用零日志 / 缺失集合去重 / 突发去抖 / guard 兜底。
- 启动日志收敛到：至多一行 masked + 每个缺失集合一行 warn。
