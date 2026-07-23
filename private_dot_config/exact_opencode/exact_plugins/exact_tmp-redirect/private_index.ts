import path from "path"
import type { Plugin } from "@opencode-ai/plugin"

function isBlockedTmpWrite(filePath: string): boolean {
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith("/tmp/")) return false
  if (resolved === "/tmp/opencode") return false
  if (resolved.startsWith("/tmp/opencode/")) return false
  if (resolved === "/tmp/agent.sock") return false
  const rest = resolved.slice("/tmp/".length)
  return !rest.includes("/")
}

const BLOCKED_MSG =
  `Not allowed to access /tmp, use /tmp/opencode/..." instead.`

function isBlockedTmpBash(command: string): boolean {
  const i = command.indexOf("/tmp")
  if (i === -1) return false
  if (command.includes("/tmp/")) return false
  if (i > 0 && /[a-zA-Z0-9]/.test(command[i - 1])) return false
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
