import { readFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { homedir } from "os"
import { reasoningVariants } from "./src/variants.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

interface ModelEntry {
  id: string
  name: string
  tier: "premium" | "open-source"
  reasoning: boolean
  tool_call: boolean
  cost: { input: number; output: number; cache_read?: number; cache_write?: number }
  limit: { context: number; output: number }
}

function toConfigKey(id: string): string {
  const slashIdx = id.indexOf("/")
  const short = slashIdx >= 0 ? id.slice(slashIdx + 1) : id
  return short.toLowerCase()
}

function loadModelsJson(): ModelEntry[] {
  const modelsPath = join(__dirname, "models.json")
  return JSON.parse(readFileSync(modelsPath, "utf-8"))
}

function isGoModel(id: string): boolean {
  // Go includes only open-source models plus a few premium exceptions:
  // GPT-5.6 Luna, Grok 4.5, Muse Spark 1.2 Contributor, and Qwen Max & Plus
  // (per https://commandcode.ai/docs/plans/go). Everything else premium
  // (Claude, other GPTs, Gemini, Muse Spark 1.1 / standard 1.2) is excluded.
  const GO_PREMIUM_EXCEPTIONS = ["gpt-5.6-luna"]
  const GO_PREMIUM_PREFIX_EXCEPTIONS = ["meta/muse-spark-1.2-contributor"]
  const i = id.indexOf("/")
  if (i === -1) return GO_PREMIUM_EXCEPTIONS.includes(id)
  if (GO_PREMIUM_PREFIX_EXCEPTIONS.includes(id)) return true
  const prefix = id.slice(0, i + 1)
  if (["google/", "sakana/", "meta/"].includes(prefix)) return false
  return true
}

async function fetchModels(apiKey: string): Promise<ModelEntry[]> {
  const res = await fetch("https://api.commandcode.ai/provider/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const { data } = await res.json() as { data: { id: string; name?: string; context_length?: number }[] }
  return data.filter(m => isGoModel(m.id)).map(m => ({
    id: m.id,
    name: m.name ?? m.id.split("/").pop()!,
    tier: "open-source" as const,
    reasoning: true,
    tool_call: true,
    cost: { input: 0, output: 0 },
    limit: { context: m.context_length ?? 0, output: 0 },
  }))
}

function enrichWithPricing(fetched: ModelEntry[], pricing: ModelEntry[]): ModelEntry[] {
  const pricingMap = new Map(pricing.map(e => [e.id, e]))
  return fetched.map(entry => {
    const p = pricingMap.get(entry.id)
    if (!p) return entry
    return {
      ...entry,
      reasoning: p.reasoning,
      tool_call: p.tool_call,
      cost: p.cost,
      limit: { context: entry.limit.context || p.limit.context, output: p.limit.output },
    }
  })
}

export default async function commandcodePlugin() {
  return {
    config: async (config: Record<string, unknown>) => {
      const providers = config.provider as Record<string, Record<string, unknown>> | undefined
      if (!providers) {
        (config as Record<string, unknown>).provider = { commandcode: {} }
      }
      const cc = ((config as Record<string, unknown>).provider as Record<string, Record<string, unknown>>)?.commandcode as Record<string, unknown> | undefined
      if (!cc) return

      if (!cc.npm) cc.npm = `file://${__dirname}`
      if (!cc.name) cc.name = "Command Code"
      if (!cc.env) cc.env = ["COMMANDCODE_API_KEY"]

      const apiKey = (() => {
        if (typeof cc.options === "object" && cc.options !== null && typeof (cc.options as Record<string, unknown>).apiKey === "string") {
          return (cc.options as Record<string, unknown>).apiKey as string
        }
        if (process.env.COMMANDCODE_API_KEY) return process.env.COMMANDCODE_API_KEY
        const envPath = join(homedir(), ".config", "opencode", ".env")
        if (!existsSync(envPath)) return undefined
        try {
          for (const line of readFileSync(envPath, "utf-8").split("\n")) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith("#")) continue
            const eq = trimmed.indexOf("=")
            if (eq === -1) continue
            if (trimmed.slice(0, eq).trim() === "COMMANDCODE_API_KEY") {
              return trimmed.slice(eq + 1).trim() || undefined
            }
          }
        } catch {}
        return undefined
      })()

      if (!cc.options && apiKey) {
        cc.options = { apiKey }
      }

      if (!cc.models) {
        const pricing = loadModelsJson()
        let models: ModelEntry[] = []

        if (apiKey) {
          try {
            models = await fetchModels(apiKey)
            models = enrichWithPricing(models, pricing)
          } catch {
            models = pricing.filter(m => isGoModel(m.id))
          }
        } else {
          models = pricing.filter(m => isGoModel(m.id))
        }

        const modelsObj: Record<string, unknown> = {}
        for (const entry of models) {
          const key = toConfigKey(entry.id)
          const costObj: Record<string, number> = { input: entry.cost.input, output: entry.cost.output }
          if (entry.cost.cache_read !== undefined) costObj.cache_read = entry.cost.cache_read
          if (entry.cost.cache_write !== undefined) costObj.cache_write = entry.cost.cache_write
          const modelConfig: Record<string, unknown> = {
            id: entry.id,
            name: entry.name,
            reasoning: entry.reasoning,
            tool_call: entry.tool_call,
            cost: costObj,
            limit: entry.limit,
          }
          if (entry.reasoning) {
            const variants = reasoningVariants(entry.id)
            if (variants) modelConfig.variants = variants
          }
          modelsObj[key] = modelConfig
        }
        cc.models = modelsObj
      }
    },

    auth: {
      provider: "commandcode",
      methods: [
        {
          type: "api",
          label: "API Key",
          authorize: async (inputs: Record<string, unknown> | undefined) => {
            const rawKey = inputs?.key
            if (typeof rawKey !== "string") return { type: "failed" as const }
            const key = rawKey.trim()
            if (!key) return { type: "failed" as const }
            return { type: "success" as const, key }
          },
        },
      ],
      loader: async (getAuth: () => Promise<{ type: string; key?: string } | null>) => {
        try {
          const auth = await getAuth()
          if (!auth) return {}
          if (auth.type === "api" && auth.key) return { apiKey: auth.key }
          return {}
        } catch {
          return {}
        }
      },
    },
  }
}
