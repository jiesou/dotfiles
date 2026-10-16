[English](#) | [简体中文](./README.zh-Hans.md)

# EasyEDA API Skill

An EasyEDA Pro API skill package for AI coding tools such as Claude Code, OpenCode, QwenCode, and any other tool that supports the [Agent Skills](https://agentskills.io/) standard.

This skill supports both online debugging of EasyEDA Pro through AI and extension development for EasyEDA Pro.
When developing EasyEDA extensions, AI can use the extension-development documentation, API references, type information, and usage examples provided by this skill to help with API lookup, code generation, and integration debugging.
If you want to analyze or modify EasyEDA document source files directly instead of operating through the API, this project also provides documentation for the source file formats.

- 📚 **Structured API documentation** — Automatically builds hierarchical indexes from reference docs for fast AI lookup
- 🧾 **Document source format specifications** — Explains project, schematic, and PCB source formats for direct source analysis and modification
- 🖥️ **CLI-driven** — Drives the `lceda-pro` CLI built into the desktop client (or `--mcp`)
- 🔌 **Legacy WebSocket Bridge** — A Node.js server for clients older than v4.1.60
- 🤖 **SKILL.md** — A complete skill instruction file

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Build API documentation

```bash
npm run build:docs
```

This reads the raw API documentation from the `reference/` directory and generates structured docs into the `docs/` directory.

### 3. Use from an AI coding tool

AI coding tools such as Claude Code, OpenCode, and QwenCode automatically read `SKILL.md`
for instructions and drive the editor through the CLI built into the desktop client
(v4.1.60+):

```bash
# Probe the endpoint
lceda-pro doctor

# List editor windows (one window = one session)
lceda-pro session list

# Execute EasyEDA code in a session
lceda-pro invoke --session "$S" --ext-uuid eda --code-file - < step.js
```

The CLI can also run as an MCP server: `lceda-pro --mcp stdio`.

### 4. Legacy: the WebSocket bridge

For clients older than v4.1.60 that have no CLI, this repo still ships a standalone bridge
server plus the `run-api-gateway` extension
(<https://jlcext.com/item/oshwhub-official/run-api-gateway>):

```bash
npm run server            # listens on the first free port in 49620-49629
curl http://localhost:49620/health
curl -X POST http://localhost:49620/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "return await eda.dmt_Project.getCurrentProjectInfo();"}'
```

It needs a separate process and an extension install, so prefer the built-in CLI above.

## One-Command Packaging

```bash
npm run pack
```

This performs the following steps:
1. Build API documentation (`docs/`)
2. Package `SKILL.md`, documentation, and the server into `dist/easyeda-api/`
3. Generate `dist/easyeda-api.zip` for upload

If the documentation has already been built, you can skip that step:

```bash
npm run pack:fast
```

### Publish to ClawHub

```bash
npx clawhub@latest publish dist/easyeda-api/
```

Or upload the zip file at https://clawhub.ai/upload

## Architecture

```
┌──────────────┐  CLI / MCP   ┌───────────────────────┐   local endpoint   ┌──────────┐
│   AI Agent   │ ◄──────────► │  lceda-pro            │ ◄────────────────► │  EasyEDA │
│ (Skill Tool) │              │  (built into client)  │                    │ (Client) │
└──────────────┘              └───────────────────────┘                    └──────────┘
```

## Response Envelope

Every CLI command returns the same JSON; only the top-level `ok` needs checking:

```json
{"ok": true,  "value": {}, "logs": [], "durationMs": 12}
{"ok": false, "error": {"code": "EXECUTION_ERROR", "message": "..."}}
```

## Directory Structure

```text
easyeda-api/
  SKILL.md              # AgentSkills standard skill definition
  README.md             # This file
  README.zh-Hans.md     # Chinese README
  package.json          # Project configuration
  references/           # Extension API reference (classes, enums, interfaces, types)
  format/               # EasyEDA document source format specs (project/schematic/pcb)
  guide/                # API development guides, including the full CLI reference (cli.md)
  user-guide/           # Getting and using extensions
  scripts/
    bridge-server.mjs   # Legacy WebSocket Bridge server (pre-v4.1.60 clients)
  node_modules/
```