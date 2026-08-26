# 决定：用 tools.restrict({ deny }) 可见性掩码实现「工具一开始就不存在」

**classification**: feature · **date**: 2026-08-15

## Problem

用户要求禁用 `mcp__linkup__linkup-research`，且明确不是「调用时拦截」：工具应
从一开始就不存在——不注册进模型视野、不可调用，同时其余 linkup 工具不受影响。

## Decision

采用 DSH 原生 `tools.restrict({ deny: [...] })`（dsh-tools ToolRuntime）：
对每个 agent 作用域应用按名字快照的拒绝掩码。掩码与 `view()` 同一 resolver 同时
服务 presentation / lookup / dispatch——被拒工具不进请求 schema、查不到、
执行解析为 `UNKNOWN_TOOL`，与「从未注册」完全一致；deny 掩码对后来出现且未点名
的全局工具保持放行，天然满足「只影响一个」。

生命周期：`agent/created` + 采纳已存活 agent；disposer 存于插件实例，插件
停用/重载时统一摘除；agent 销毁时其层随之消亡。顺序安全：`restrict()` 对未注册
名字抛错（「unknown global tool」），以 500ms→30s 退避重试兜底 MCP 发现未完成的
窗口。

## Alternatives considered

- **AgentFuse（dsh-agentfuse-plugin）pre-execute 门禁**：调用时 block，不符合
  「从一开始不存在」；且依赖 `workspace:*` 未发布 npm，独立安装不可行。
- **tool-palette allow 掩码**：白名单制，要保住其余工具需枚举全部工具名，新工具
  默认全隐藏，副作用过大。
- **MCP server 级启停**：粒度是整 server，会把同 server 其他工具一起带走。

## Consequences

- 插件 ~60 行，无第三方依赖（官方包由 profile pnpm 闭包注入）。
- 掩码是运行时可见性组合（非权限边界）——与 DSH 设计语义一致；重载后旧实例
  掩码在停用清理时摘除，新实例重新挂载。
- HMR 配置变更会短暂摘除再重挂掩码（秒级窗口），语义不变。