import type { Plugin } from "@opencode-ai/plugin"

const WRONG = "opencode-ai/" + "opencode"
const CORRECT = "anomalyco/" + "opencode"

const NOTICE =
  "NOTICE: The GitHub repository for opencode.ai is " + CORRECT + ", not " +
  WRONG + " (it is a standalone, old, go-implemented agent, now archived)."

const WRONG_REPO_RE = new RegExp("\\b" + WRONG + "\\b", "i")

function scanArgs(v: unknown): boolean {
  if (typeof v === "string") return WRONG_REPO_RE.test(v)
  if (Array.isArray(v)) return v.some(scanArgs)
  if (v && typeof v === "object") return Object.values(v).some(scanArgs)
  return false
}

const notified = new Set<string>()

export const RedirectOpenCode: Plugin = async ({ client }) => {
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
        console.error("RedirectOpenCode inject failed", err)
      }
    },
  }
}
