import type { Plugin } from "@opencode-ai/plugin"

interface Rule {
  match: (v: string) => boolean
  notice: string
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

const claudeRe =
  /(^|[\s/~])(\.claude)([/\s]|$)|(\bCLAUDE\.md\b)/i

const RULES: Rule[] = [
  {
    match: (v) => claudeRe.test(v),
    notice: [
      "Notice: You are OpenCode, not Claude Code",
      "Global configuration: ~/.config/opencode/",
      "Status/database: ~/.local/share/opencode/",
      "Agent Skills: ~/.agents/skills",
    ].join("\n"),
  },
  {
    match: (v) => v.includes("opencode-ai/opencode"),
    notice:
      "NOTICE: The GitHub repository for opencode.ai is anomalyco/opencode, not " +
      "opencode-ai/opencode (it is a standalone, old, go-implemented agent, now archived).",
  },
  {
    match: (v) =>
      wildcard("rm *")(v) || wildcard("\"rm *")(v) || wildcard("* rm *")(v),
    notice: "NOTICE: USE mv instead of rm",
  },
]

function scanArgs(v: unknown, match: Rule["match"]): boolean {
  if (typeof v === "string") return match(v)
  if (Array.isArray(v)) return v.some((x) => scanArgs(x, match))
  if (v && typeof v === "object") return Object.values(v).some((x) => scanArgs(x, match))
  return false
}

const notified = new Set<string>()

export const RedirectNotice: Plugin = async ({ client }) => {
  return {
    "tool.execute.before": async (input, output) => {
      const sessionID = input.sessionID
      if (notified.has(sessionID)) return

      const rule = RULES.find((r) => scanArgs(output.args, r.match))
      if (!rule) return

      notified.add(sessionID)

      await client.session.prompt({
        path: { id: sessionID },
        body: {
          noReply: true,
          parts: [{ type: "text", text: rule.notice }],
        },
      })
    },
  }
}
