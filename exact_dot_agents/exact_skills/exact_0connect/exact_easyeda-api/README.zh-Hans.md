[English](./README.md) | [简体中文](#)

# EasyEDA API Skill

供 AI 编程工具（Claude Code、OpenCode、QwenCode 等所有支持 [Agent Skills](https://agentskills.io/) 标准的工具）使用的 EasyEDA Pro API 技能包（Skill）。

这个 SKILL 不仅支持 AI 在线调试嘉立创EDA，也支持辅助开发嘉立创EDA扩展。
在开发嘉立创EDA扩展时，AI 可以使用本 SKILL 提供的扩展开发相关文档、API 参考、类型信息与调用示例，帮助完成接口查询、代码编写与联调验证。
如果用户准备自行分析或修改嘉立创EDA文档源码，而不是通过 API 操作，也可以使用本项目提供的文档源码格式说明。

- 📚 **结构化 API 文档** — 自动从参考文档生成分层索引，便于 AI 快速查阅
- 🧾 **文档源码格式规范** — 说明工程、原理图、PCB 文档源码格式，适合直接分析和修改源码的场景
- 🖥️ **CLI 驱动** — 通过客户端内置的 `lceda-pro` 命令行（或 `--mcp`）操作编辑器
- 🔌 **旧版 WebSocket Bridge** — 面向 v4.1.60 之前没有 CLI 的客户端
- 🤖 **SKILL.md** — 完整的技能指导文件

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 构建 API 文档

```bash
npm run build:docs
```

这会从 `reference/` 目录读取原始 API 文档，生成结构化文档到 `docs/` 目录。

### 3. 使用 AI 编程工具

AI 编程工具（Claude Code、OpenCode、QwenCode 等）会自动读取 `SKILL.md` 获取技能指导，
并通过桌面客户端内置的 CLI（v4.1.60 及以上）操作编辑器：

```bash
# 探测端点
lceda-pro doctor

# 列出编辑器窗口（一个窗口 = 一个会话）
lceda-pro session list

# 在会话中执行 EDA 代码
lceda-pro invoke --session "$S" --ext-uuid eda --code-file - < step.js
```

CLI 也可以作为 MCP 服务器运行：`lceda-pro --mcp stdio`。

### 4. 旧版：WebSocket Bridge

面向 v4.1.60 之前没有 CLI 的客户端，本仓库仍附带独立的 bridge 服务器和
`run-api-gateway` 扩展（<https://jlcext.com/item/oshwhub-official/run-api-gateway>）：

```bash
npm run server            # 在 49620-49629 中选取首个空闲端口
curl http://localhost:49620/health
curl -X POST http://localhost:49620/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "return await eda.dmt_Project.getCurrentProjectInfo();"}'
```

它需要额外进程和扩展安装，优先使用上面的内置 CLI。

## 一键打包

```bash
npm run pack
```

这会执行以下步骤：
1. 构建 API 文档（`docs/`）
2. 将 SKILL.md、文档、服务器打包到 `dist/easyeda-api/`
3. 生成 `dist/easyeda-api.zip` 用于上传

如果文档已构建好，可跳过构建步骤：

```bash
npm run pack:fast
```

### 发布到 ClawHub

```bash
npx clawhub@latest publish dist/easyeda-api/
```

或上传 zip 文件到 https://clawhub.ai/upload

## 架构

```
┌──────────────┐  CLI / MCP   ┌───────────────────────┐     本地端点       ┌──────────┐
│   AI Agent   │ ◄──────────► │  lceda-pro            │ ◄────────────────► │ EasyEDA  │
│ (Skill Tool) │              │  （客户端内置）        │                    │ (Client) │
└──────────────┘              └───────────────────────┘                    └──────────┘
```

## 返回结构

每条 CLI 命令返回同样的 JSON，只需检查最外层 `ok`：

```json
{"ok": true,  "value": {}, "logs": [], "durationMs": 12}
{"ok": false, "error": {"code": "EXECUTION_ERROR", "message": "..."}}
```

## 目录结构

```
easyeda-api/
  SKILL.md              # AgentSkills 标准技能定义
  README.md             # 英文 README
  README.zh-Hans.md     # 本文件
  package.json          # 项目配置
  references/           # 扩展 API 参考（类 / 枚举 / 接口 / 类型）
  format/               # 嘉立创EDA文档源码格式规范（project/schematic/pcb）
  guide/                # API 开发指南，含完整 CLI 参考（cli.md）
  user-guide/           # 扩展的获取与使用
  scripts/
    bridge-server.mjs   # 旧版 WebSocket Bridge 服务器（v4.1.60 之前的客户端）
  node_modules/
```
