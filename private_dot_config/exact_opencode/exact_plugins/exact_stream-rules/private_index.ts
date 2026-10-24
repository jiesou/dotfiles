import path from "path"

interface Rule {
  id: string
  match: (v: string) => boolean
  prompt: string
  reject?: boolean
}

const wildcard = (pattern: string) => (v: string) => {
  let escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".")
  if (escaped.endsWith(" .*")) {
    escaped = escaped.slice(0, -3) + "( .*)?"
  }
  return new RegExp("^" + escaped + "$", "s").test(v)
}

const isBlockedTmp = (command: string): boolean => {
  const idx = command.indexOf("/tmp")
  if (idx === -1) return false
  if (idx > 0 && /[a-zA-Z0-9]/.test(command[idx - 1])) return false
  const rest = command.slice(idx + 4)
  const subPath = rest.length > 1 && rest.startsWith("/")
  if (subPath) {
    if (command.includes("git clone")) {
      return !command.includes("/tmp/opencode") && !command.includes("/tmp/agent")
    }
    return false
  }
  if (command.includes("tmux")) {
    return false
  }
  return true
}

const isBlockedTmpWrite = (filePath: string): boolean => {
  const resolved = path.resolve(filePath)
  return resolved === "/tmp"
}

const isWideSearch = (v: string): boolean => {
  if (!/(?:^|[\s;&|(])(rg|ripgrep|grep|egrep|fgrep|find|fd|fdfind|locate|plocate)(?=[\s"']|$)/.test(v)) return false
  if (/\[timed out after \d+ms\]/.test(v)) return true
  const rest = v.replace(/ after \d+ms/g, " ")
  const numbers = rest.match(/\d+/g) ?? []
  return numbers.some((n) => +n >= 20000)
}

const claudeRe = /(^|[\s/~])(\.claude)([/\s]|$)|(\bCLAUDE\.md\b)/i

const RULES: Rule[] = [
  {
    id: "blocked-tmp",
    match: isBlockedTmp,
    reject: true,
    prompt: 'Regardless of file policy: Not allowed to access /tmp, use /tmp/opencode/..." or "/tmp/agents/..." instead.',
  },
  {
    id: "rm-to-trash",
    match: (v) =>
      (wildcard("rm *")(v) || wildcard("\"rm *")(v) || wildcard("* rm *")(v) || wildcard("* -delete*")(v)) &&
      !wildcard("* rm */tmp/*")(v),
    reject: true,
    prompt: "Use `gio trash` command (best effort) or `mv` (immediate fallback if `gio trash` fails) instead of rm except in tmpdir",
  },
  {
    id: "confirm-public",
    match: (v) => /\bgh\s+(?:issue|pr)\s+(create|comment)\b|mcp__gh__create_(?:issue|pull_request)\b/.test(v),
    reject: true,
    prompt:
      "Users must explicitly confirm before publishing public content. Public issue/PR create is irreversible. If user's confirmation is given, call the same command again. BTW: did you checked `.github/ISSUE_TEMPLATE`? Follow template!",
  },
  {
    id: "confirm-git-reset",
    match: (v) => v.includes("git reset --hard"),
    reject: true,
    prompt: "Users must explicitly confirm before `git reset --hard`. Is it irreversible? If user's confirmation is given, call the same command again.",
  },
  {
    id: "confirm-git-push-force",
    match: (v) => v.includes("git push --force"),
    reject: true,
    prompt: "Users must explicitly confirm before `git push --force`. Is it irreversible? If user's confirmation is given, call the same command again.",
  },
  {
    id: "no-long-sleep",
    match: (v) => {
      const match = v.match(/\bsleep\s+(\d+)/)
      return match ? +match[1] > 20 : false
    },
    reject: true,
    prompt: "Correctly await via script/target matching—instead of using `sleep [long duration]` to poll (invalid). Tip: Don't \"poll\" the subagent settle, just return and it will notify",
  },
  {
    id: "install-hierarchy",
    match: (v) =>
      !(
        v.includes("tmux") ||
        v.includes("ssh") ||
        v.includes("devcontainer") ||
        v.includes("docker exec") ||
        v.includes("podman exec")
      ) &&
      ((v.includes(" install") && v.includes(" -g")) ||
        v.includes(" install --global") ||
        v.includes(" i -g") ||
        v.includes("yarn global") ||
        v.includes("sudo dnf install") ||
        v.includes("sudo apt install") ||
        v.includes("sudo apt-get install")),
    reject: true,
    prompt: `安装方式优先级：
1. uvx/npx 直接使用（高度优先）
2. brew install（npm 没有的情况下优先）
3. curl 一个静态链接二进制到 ~/.local/bin
4. devcontainer 内处理
你也许应该派子任务去研究，这个软件可以以哪种方式安装
不应 pip 或 npm i -g 或 dnf 或 apt 在主机 *全局* 安装任何东西（试都别想试）`,
  },
  {
    id: "pip-to-uv",
    match: (v) => v.includes("pip ") && v.includes(" install") && !v.includes("uv pip") && !v.includes("uvx"),
    reject: true,
    prompt: "Use `uvx` or `uv venv` + `uv pip` instead of `pip install` directly",
  },
  {
    id: "claude-notice",
    match: (v) => claudeRe.test(v),
    prompt: [
      "NOTICE: You are OpenCode, not Claude Code",
      "Global configuration: ~/.config/opencode/",
      "Status/database: ~/.local/share/opencode/",
      "Agent Skills: ~/.agents/skills",
    ].join("\n"),
  },
  {
    id: "wide-search",
    match: isWideSearch,
    prompt: "别全屏搜了！全盘搜索浪费时间！找不到就找不到：先想\"这东西按项目约定应该在哪\"，在**明确的范围**里找； —— 值得花代价的才派 subagent 去拿原始信息源（gh / fetch 全文）",
  },
  {
    id: "opencode-repo",
    match: (v) => v.includes("opencode-ai/opencode"),
    prompt: "The GitHub repository for opencode.ai is anomalyco/opencode (formerly sst/opencode), NOT opencode-ai/opencode (it is a standalone, old, go-implemented agent, now archived).",
  },
  {
    id: "mihomo-repo",
    match: (v) => v.includes("MetaCubeX/mihomo"),
    prompt: "The GitHub repository for Mihomo Kernel is https://github.com/MetaCubeX/mihomo/tree/Meta",
  },
  {
    id: "prefer-gh",
    match: (v) => v.includes("curl") && v.includes("api.github.com"),
    prompt: "Prefer using `gh` cli over `curl https://api.github.com/...`. gh offers more requests limits.",
  },
  {
    id: "context7-fallback",
    match: (v) => v.includes("context7__query-docs") || v.includes("context7"),
    prompt: "Use web search when Context7 can't find something",
  },
  {
    id: "web-search-freshness",
    match: (v) => v.includes("web_search") || v.includes("mcp__tinyfish__search"),
    prompt: "The future is now—don't go back to 2025. And your knowledge is SUPER OUTDATED.\nUse broad search keywords instead of searching for outdated products.\n\"You reap what you sow. Seek new, get new; Seek old, get old.",
  },
  {
    id: "markitdown-pdf",
    match: (v) => v.includes(".pdf") || v.includes(" pdf "),
    prompt: "Use the `markitdown` skill to read PDF files.",
  },
]

function scanStrings(v: unknown): string[] {
  if (typeof v === "string") return [v]
  if (typeof v === "number") return [String(v)]
  if (Array.isArray(v)) return v.flatMap(scanStrings)
  if (v && typeof v === "object") return Object.values(v).flatMap(scanStrings)
  return []
}

const notifiedSessions = new Set<string>()

export default {
  id: "opencode.stream-rules",
  setup: async (ctx) => {
    await ctx.tool.hook("execute.before", async (event) => {
      const sessionID = event.sessionID
      const args = event.input as Record<string, unknown> | undefined
      const allText = scanStrings(args).join(" ")

      // Special check for blocked /tmp writes
      const filePath = typeof args?.filePath === "string" ? args.filePath : typeof args?.path === "string" ? args.path : undefined
      if (filePath && isBlockedTmpWrite(filePath)) {
        throw new Error('Regardless of file policy: Not allowed to access /tmp, use /tmp/opencode/..." or "/tmp/agents/..." instead.')
      }

      for (const rule of RULES) {
        if (!rule.match(allText)) continue

        if (rule.reject) {
          throw new Error(rule.prompt)
        }

        const noticeKey = `${sessionID}:${rule.id}`
        if (!notifiedSessions.has(noticeKey)) {
          notifiedSessions.add(noticeKey)
          await ctx.session.synthetic({
            sessionID,
            text: rule.prompt,
          }).catch(() => {})
        }
      }
    })
  },
}
