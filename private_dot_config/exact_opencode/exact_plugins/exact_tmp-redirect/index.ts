import path from "path"
import type { Plugin } from "@opencode-ai/plugin"

function isBlockedTmpWrite(filePath: string): boolean {
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith("/tmp/")) return false
  if (resolved === "/tmp/opencode") return false
  if (resolved.startsWith("/tmp/opencode/")) return false
  if (resolved === "/tmp/agent.socket") return false
  const rest = resolved.slice("/tmp/".length)
  return !rest.includes("/")
}

const BLOCKED_MSG =
  `Not allowed to access /tmp, use /tmp/opencode/..." instead.`

function isBlockedTmpBash(command: string): boolean {
  if (!command.includes("/tmp")) return false
  for (const m of command.matchAll(/\/tmp\/[^\s"'`()]+/g)) {
    let p = m[0].replace(/[;&|<>*%]+$/, "")
    const rest = p.slice("/tmp/".length)
    if (rest.includes("/")) continue
    if (rest === "agent.socket") continue
    if (rest === "opencode" || rest.startsWith("opencode/")) continue
    return true
  }
  return false
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
