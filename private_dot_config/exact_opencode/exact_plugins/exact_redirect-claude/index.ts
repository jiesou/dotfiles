import type { Plugin } from "@opencode-ai/plugin"

const NOTICE = [
  "Notice: You are OpenCode, not Claude Code",
  "Global configuration: ~/.config/opencode/",
  "Status/database: ~/.local/share/opencode/",
  "Agent Skills: ~/.agents/skills",
].join("\n")

const CLAUDE_CODE_RE = /(^|[\s/~])(\.claude)([/\s]|$)/i
const CLAUDE_MD_RE = /\bCLAUDE\.md\b/i

function isClaudeRef(p: string): boolean {
  return CLAUDE_CODE_RE.test(p) || CLAUDE_MD_RE.test(p)
}

function scanArgs(v: unknown): boolean {
  if (typeof v === "string") return isClaudeRef(v)
  if (Array.isArray(v)) return v.some(scanArgs)
  if (v && typeof v === "object") return Object.values(v).some(scanArgs)
  return false
}

const notified = new Set<string>()

export const RedirectClaude: Plugin = async ({ client }) => {
  return {
    "tool.execute.before": async (input, output) => {
      const sessionID = input.sessionID
      if (notified.has(sessionID)) return

      if (!scanArgs(output.args)) return

      notified.add(sessionID)

      try {
        await client.session.prompt({
          path: { id: sessionID },
          body: {
            noReply: true,
            parts: [{ type: "text", text: NOTICE }],
          },
        })
      } catch (err) {
        notified.delete(sessionID)
        console.error("RedirectClaude inject failed", err)
      }
    },
  }
}
