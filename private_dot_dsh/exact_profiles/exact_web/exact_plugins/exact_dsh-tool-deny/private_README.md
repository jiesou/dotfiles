# dsh-tool-deny

<p align="center">按工具名把指定工具从 agent 可见性中移除——被拒绝的工具从一开始就不存在（不进模型请求、不可调用），其余工具一律不受影响。</p>

纯 Cordis 插件（无 `dsh.bundle`）：经 web profile 的 `cordis.patch.yml` insert 行挂载，**配置 HMR 实时生效，零重启**。

## 能力

| 能力面 | 说明 |
|---|---|
| 可见性掩码 | 对每个 agent 应用 `tools.restrict({ deny })`：被拒工具不出现在任何模型请求的工具清单中，执行层解析为 `UNKNOWN_TOOL`（与从未注册完全一致） |
| 覆盖范围 | `agent/created` + 挂载时采纳已存活 agent；子 agent 同样生效；agent 销毁/插件停用自动摘除掩码 |
| 顺序安全 | 若目标工具尚未注册（如 MCP server 启动发现未完成），带退避重试（最多 10 次）直至成功；若始终未注册（如对应 MCP server 已停用），**有界重试后报错并放弃**，日志明确列出缺失的工具名，绝不静默重试 |
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

保存后 web 面 HMR 实时挂载。启动日志应出现 `tool-deny: masked ... from agent ...`；目标工具从下一轮模型请求起不再出现。

> 诊断可见性：web profile 下 `ctx.logger` 无控制台导出（消息只进内部缓冲），
> 因此本插件同时向 `console` 输出 `[tool-deny]` 前缀的 warn/error——journal / 服务日志中一定能看到。
> 若出现 `gave up denying ... these tools never registered`，说明 `denyTools` 里配了不会注册的工具
> （典型：MCP server 已停用），应删除对应条目。

## 插件管理

已装插件用 plugin-registry 的**薄控制台**管理（浏览器面板）：管理 profile
插件安装态（bundle 层栈 + insert 行 + 启停），无需手改配置。安装：
`dsh plugin --profile web add <plugin-registry>/packages/plugin/console`

## 许可

MIT