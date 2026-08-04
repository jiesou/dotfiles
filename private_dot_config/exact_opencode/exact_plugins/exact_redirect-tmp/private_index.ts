import path from "path"
import type { Plugin } from "@opencode-ai/plugin"

function isBlockedTmpWrite(filePath: string): boolean {
  return path.resolve(filePath) === "/tmp"
}

const BLOCKED_MSG =
  `Not allowed to access /tmp, use /tmp/opencode/..." instead.`

function isBlockedTmpBash(command: string): boolean {
  const idx = command.indexOf("/tmp")
  if (idx === -1) return false

  if (idx > 0 && /[a-zA-Z0-9]/.test(command[idx - 1])) return false

  const after = command.slice(idx + 4)

  if (after === "" || after === "/") return true

  if (after.startsWith("/")) {
    if (command.includes("git clone")) {
      return !after.startsWith("/opencode")
    }
    return false
  }

  return true
}

const notified = new Set<string>()

export const RedirectTmp: Plugin = async ({ client }) => {
  return {
    "tool.execute.before": async (input, output) => {
      const sessionID = input.sessionID
      if (notified.has(sessionID)) return

      const args = output.args as { filePath?: string; command?: string } | undefined
      const filePath = args?.filePath
      const command = args?.command

      if (filePath && isBlockedTmpWrite(filePath)) {
        notified.add(sessionID)
      } else if (command && isBlockedTmpBash(command)) {
        notified.add(sessionID)
      } else {
        return
      }

      try {
        await client.session.prompt({
          path: { id: sessionID },
          body: {
            noReply: true,
            parts: [{ type: "text", text: BLOCKED_MSG }],
          },
        })
      } catch (err) {
        notified.delete(sessionID)
        console.error("RedirectTmp inject failed", err)
      }
    },
  }
}
