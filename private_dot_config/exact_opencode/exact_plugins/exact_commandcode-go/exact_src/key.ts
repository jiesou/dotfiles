import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

function readEnvFile(file: string, key: string): string | undefined {
  if (!existsSync(file)) return undefined
  try {
    for (const line of readFileSync(file, "utf-8").split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      if (trimmed.slice(0, eq).trim() === key) {
        const value = trimmed.slice(eq + 1).trim()
        if (value) return value
      }
    }
  } catch {
    // intentionally silent: unreadable env files are skipped
  }
  return undefined
}

export function resolveApiKey(): string | undefined {
  if (process.env.COMMANDCODE_API_KEY) return process.env.COMMANDCODE_API_KEY

  const v2 = readEnvFile(join(homedir(), ".config", "opencode2", ".env"), "COMMANDCODE_API_KEY")
  if (v2) return v2

  const v1 = readEnvFile(join(homedir(), ".config", "opencode", ".env"), "COMMANDCODE_API_KEY")
  if (v1) return v1

  const authPath = join(homedir(), ".commandcode", "auth.json")
  if (existsSync(authPath)) {
    try {
      const parsed = JSON.parse(readFileSync(authPath, "utf-8"))
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.apiKey === "string") return parsed.apiKey
        if (typeof parsed.commandcode === "string") return parsed.commandcode
        if (
          parsed.commandcode &&
          typeof parsed.commandcode === "object" &&
          parsed.commandcode.type === "oauth" &&
          typeof parsed.commandcode.access === "string"
        ) {
          return parsed.commandcode.access
        }
      }
    } catch {
      // intentionally silent: malformed auth.json is skipped
    }
  }

  return undefined
}
