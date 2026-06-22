---
name: agent-skills-install
description: add or manage Agent Skills via `npx skills`
---

## 安装工作流

### Step 1: 搜索 & 评估

先 web find 需求的功能

拿到结果后，对每个候选 skill 做 **可信度评估**：

| 维度 | 打分依据 |
|---|---|
| 社区评价，issue反馈 | 真实性、安全性 |
| ⭐ Star 数 | <100 不太可信 |
| 仓库活跃度 | 近期有 commit，有维护 |
| SKILL.md 质量 | 非空壳 |
| 依赖策略 | 是否引导 `pip add`、`apt`、`brew` 等系统级安装 |

尽可能查找官方来源的 Skills，例如 `vercel-labs/agent-skills`, `ComposioHQ/awesome-claude-skills`

然后 npx skills 用查找到对应的 skill 准确 repo 和名字

```bash
npx skills find <关键词>
```

### Step 2: 预览内容 & 检查依赖

安装前必须用 `gh` cli 之类的方式查看 skill 内容：

重点检查：
- **依赖安装方式** — skill 是否要求 `apt add`、`brew add`、`pip add --system` 等系统级装包
- **依赖类型** — 是否涉及 Python 包、Node 包、系统库、外部服务

### Step 3: 依赖安全策略

| 依赖类型 | 允许方式 | 禁止方式 |
|---|---|---|
| Python 包 | `uv venv` + `uv pip add` | 系统级 `pip add`、`apt add python-*` |
| Node 包 | `npx`、项目级 `npm add` | 全局 `npm add -g`、`brew add node` |
| 系统工具 | 检查是否可跳过或用替代方案 | `apt add`、`brew add`、`yum add` |
| Manim/ffmpeg 等重型依赖 | 记录在 notes 中，告知用户手动处理 | 脚本内自动执行系统安装 |

如果 skill 引导 agent 执行系统级包管理器命令（apt/brew/yum/pacman），**应当拒绝安装**，或 fork 修改依赖方式后再装。

### Step 4: 安装

只装到 `~/.agents/skills/`，scope user，agent **不选** OpenCode，默认 Universal 即可。

```bash
npx skills add -g -y <owner/repo> <skill-name>
```

`-g` flag 表示全局安装 (scope user-level)
`-y` flag 跳过确认

### Step 5: 安装后验证

- 确认 skill 在 `~/.agents/skills/<skill-name>/SKILL.md`
- 读取 SKILL.md 确认触发词和用法
- 如果有依赖需求，用 uv venv 创建独立的虚拟环境来管理

## 常用命令

```bash
npx skills find
npx skills add -g <repo> <name>
npx skills list
```

## 示例：安装 edulab

```bash
# 1. 搜索
npx skills find edulab

# 2. 安装
npx skills add -g -y wy51ai/edulab
npx skills add -g -y wy51ai/edulab

# 3. 用 uv 管理 Python 依赖
cd ~/agents/skills/edu-solid-geometry
uv venv .venv-edulab
uv pip add sympy
ln -s ~/agents/skills/edu-analytic-geometry/.venv-edulab ~/agents/skills/edu-solid-geometry/.venv-edulab
```
