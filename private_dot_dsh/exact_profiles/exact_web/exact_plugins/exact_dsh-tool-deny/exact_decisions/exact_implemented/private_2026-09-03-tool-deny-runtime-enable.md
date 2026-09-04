# 决定：tool-deny 支持运行时启用的 MCP server（部分掩码 + tools/change 追踪 + guard 兜底）

**classification**: fix · **date**: 2026-09-03 · **supersedes**: 2026-08-15-tool-deny-visibility-mask.md

## Problem

denyTools 里混进任何一个未注册名（典型：已停用的 MCP server 的工具），
整张掩码一次都挂不上：`restrict()` 对整个 deny 列表做原子校验，
任一未知名即抛错。更糟的是重试 10 次后直接放弃，之后用户在 MCP 面板里
动态启用对应 server，新注册的工具永远拦不住——插件已不再看它们。

## Decision

三层修复（均在插件内，无需动 dsh 底层）：

1. **部分掩码**：从 `unknown global tool` 报错里解析出未知名，只对已知
   子集立即 `restrict()`，未知余量单独挂起。一个缺失名不再毒化存活工具。
2. **`tools/change` 追踪**：MCP server 启用/停用会触发 `tools/change`
   （Layer 回调 emit，先例：dsh-tool-subagent 的 reconcileComposedAgents）。
   每次触发对所有 agent 重试挂起的余量；重试耗尽后仍保留追踪，
   server 晚启用也照样补上掩码。
3. **执行兜底 `tools.guard()`**：全局 guard 按名匹配，覆盖尚不存在的工具
   （guard 不校验注册态）。掩码竞态窗口内的漏网调用也被拒绝，
   返回 `tool-deny: "<name>" is denied by denyTools` 的 isError 结果。

## Alternatives considered

- **只修部分掩码、不加 guard**：掩码补上前的竞态窗口仍可调用一次；
  guard 是零成本的第二道门。
- **pre-execute waterfall 自行拦截**：guard 就是官方为此设计的单调门禁，
  语义相同且自带 HMR disposer，无需手写 waterfall 监听。
- **动 dsh-tools 让 restrict 支持未知名**：上游原子校验是刻意设计
  （防配错名静默），不应为单个插件松动。

## Consequences

- `inject` 新增 `'tools'`（guard 注册需要）；成功掩码后重置 attempts/gaveUp，
  give-up 报错每个 agent 只打一次。
- guard 是执行层拒绝（模型仍看不见工具，调用只可能来自竞态/伪造），
  与「从一开始不存在」的可见性语义不冲突。
- 单测 `tests/mask.spec.ts`：部分掩码 / tools/change 补掩码 /
  guard 覆盖未注册名 / 耗尽后仍可补上。
