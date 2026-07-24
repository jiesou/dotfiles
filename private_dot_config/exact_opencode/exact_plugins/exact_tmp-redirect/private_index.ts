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

export const TmpRedirect: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      switch (input.tool) {
        case "write":
        case "edit": {
          const filePath = output.args.filePath as string | undefined
          if (filePath && isBlockedTmpWrite(filePath)) {
            throw new Error(BLOCKED_MSG)
          }
          break
        }
        case "bash": {
          const command = output.args.command as string | undefined
          if (command && isBlockedTmpBash(command)) {
            throw new Error(BLOCKED_MSG)
          }
          break
        }
      }
    },
  }
}
