---
name: openclash-troubleshoot
description: "OpenClash Troubleshooting and User Guide. Most network issues are unrelated to OpenClash; Use ONLY when the user explicitly points out an OpenClash issue"
disable-model-invocation: true
---

# OpenClash Troubleshoot

## **重要**

**首次回答用户之前：** 必须使用 webfetch 获取 OpenClash 官方用户指南 SKILL：

```
https://raw.githubusercontent.com/vernesong/OpenClash/dev/.github/skills/openclash-user-guide/SKILL.md
```

本指南包含：完整依赖清单、含精确修复方案的错误信息速查表、nftables/iptables 防火墙规则链、所有 LuCI 配置选项及 UCI 路径、DNS 设置与泄露防护、订阅/GEO 更新流程等。

**问题解决后：** 需要询问用户，是否将一样的配置同步应用到三台 OpenClash 上。然后调用 openclash-multi-host SKILL

## 行为原则（必须遵守）

- 给出 LuCI 操作路径 — 始终提供 Web 界面路径（如 服务 → OpenClash → 插件设置 → 流量控制），除非用户明确要求命令行。
- 查 Issues，不闭门造车 — 官方指南未覆盖时搜索 GitHub Issues：
   - 插件侧 → [OpenClash Issues](https://github.com/vernesong/OpenClash/issues)
   - 内核侧 → [Mihomo Issues](https://github.com/MetaCubeX/mihomo/issues)
- 先要日志，不盲猜 — 用户问题描述不完整时，要求其生成调试日志：LuCI「运行日志」→「生成日志」，或 SSH `bash /usr/share/openclash/openclash_debug.sh`。
- 解释原理，不只给步骤 — 说明底层原理（防火墙链变化、YAML 转换逻辑等）。
- 先查依赖，再查配置 — 功能异常时先对照官方指南的依赖清单检查完整性。指导用户在 LuCI「系统→软件包」安装缺失包。
- 绝不猜测 — 官方指南未覆盖时，按以下顺序主动查询外部资源（禁止凭记忆编造）：
   - [Mihomo Wiki](https://wiki.metacubex.one/config/)
   - [Meta-Docs](https://github.com/MetaCubeX/Meta-Docs)
   - [OpenClash 源码](https://github.com/vernesong/OpenClash/tree/dev)
   - [Mihomo 核心源码](https://github.com/MetaCubeX/mihomo/tree/Alpha)
   - [Smart 核心源码](https://github.com/vernesong/mihomo/tree/Alpha)

## 响应格式

回答始终包含：
- 来源说明：引用官方指南章节 / Issue 编号和 URL / 外部资源 URL
- LuCI 操作路径：如 服务 → OpenClash → 插件设置 → 流量控制
- 原理说明：对应防火墙链变化或 YAML 转换逻辑
