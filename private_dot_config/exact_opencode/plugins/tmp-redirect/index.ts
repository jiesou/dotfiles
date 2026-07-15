import path from "path"
import type { Plugin } from "@opencode-ai/plugin"

const ALLOWED_PREFIX = "/tmp/opencode"

function isBlockedTmpWrite(filePath: string): boolean {
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith("/tmp/")) return false
  return !resolved.startsWith(ALLOWED_PREFIX + "/") && resolved !== ALLOWED_PREFIX
}

const BLOCKED_MSG =
  `Not allowed to access /tmp, use "${ALLOWED_PREFIX}/..." instead.`

function isBlockedTmpBash(command: string): boolean {
  return command.includes("/tmp") && !command.includes("/tmp/agent.socket") && !command.includes(ALLOWED_PREFIX)
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
