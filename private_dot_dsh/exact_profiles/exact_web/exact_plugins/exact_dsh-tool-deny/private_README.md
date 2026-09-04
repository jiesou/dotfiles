# dsh-tool-deny

<p align="center">按工具名把指定工具从 agent 可见性中移除——被拒绝的工具从一开始就不存在（不进模型请求、不可调用），其余工具一律不受影响。</p>

纯 Cordis 插件（无 `dsh.bundle`）：经 web profile 的 `cordis.patch.yml` insert 行挂载，**配置 HMR 实时生效，零重启**。

## 能力

| 能力面 | 说明 |
|---|---|
| 可见性掩码 | 对每个 agent 应用 `tools.restrict({ deny })`：被拒工具不出现在任何模型请求的工具清单中，执行层解析为 `UNKNOWN_TOOL`（与从未注册完全一致） |
| 部分掩码 | 列表里混进未注册名时，只对存活工具立即掩码、未知名单独挂起——一个缺失名不再毒化整张掩码 |
| 事件卫生 | `tools/change` 是唯一的工具事件且是无载荷广播（任何注册/重组、包括我们自己的掩码成功都会触发），没有更细的订阅。handler 先读全局注册表预检、无新增静默跳过，突发事件去抖 300ms 合并，同一缺失集合只 warn 一次——启动不再刷屏，日志量与真实变化成正比 |
| 运行时启用追踪 | MCP 面板里动态启用的 server，其工具一注册就自动补上掩码；不再有时限耗尽的“放弃” |
| 执行兜底 | 全局 `tools.guard()` 按名拦截：掩码尚未补上（或竞态窗口）的调用也会被拒绝 |
| 覆盖范围 | `agent/created` + 挂载时采纳已存活 agent；子 agent 同样生效；agent 销毁/插件停用自动摘除掩码 |
| 配置项 | `denyTools: string[]`——要屏蔽的工具公开名列表（如 `mcp__linkup__linkup-research`） |

## 安装

```sh
cd /path/to/workspace
dsh plugin --profile web add /path/to/dsh-tool-deny
```

然后向 profile 的 `cordis.patch.yml`（`$DSH_HOME/profiles/web/cordis.patch.yml`）追加 insert 行：

```yaml
- insert:
    - id: tool-deny
      name: 'dsh-tool-deny'        # 必须带引号（YAML @ 开头是保留指示符）
      config:
        denyTools:
          - mcp__linkup__linkup-research
```

保存后 web 面 HMR 实时挂载。启动日志至多出现一行 `masked ... from N agent(s)`；目标工具从下一轮模型请求起不再出现。

> 诊断可见性：web profile 下 `ctx.logger` 无控制台导出（消息只进内部缓冲），
> 因此本插件同时向 `console` 输出 `[tool-deny]` 前缀的 warn/error——journal / 服务日志中一定能看到。
> 若出现 `... not registered (MCP server disabled or not yet discovered?)`，说明 `denyTools` 里配了
> 当前未注册的工具（典型：对应 MCP server 已停用）——插件会持续追踪，server 启用后自动补上掩码，无需任何操作。

## 插件管理

已装插件用 plugin-registry 的**薄控制台**管理（浏览器面板）：管理 profile
插件安装态（bundle 层栈 + insert 行 + 启停），无需手改配置。安装：
`dsh plugin --profile web add <plugin-registry>/packages/plugin/console`

## 许可

MIT