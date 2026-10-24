export interface ModelEntry {
  id: string
  name: string
  tier: "premium" | "open-source"
  reasoning: boolean
  tool_call: boolean
  cost: { input: number; output: number; cache_read?: number; cache_write?: number }
  limit: { context: number; output: number }
}

export function isGoModel(id: string): boolean {
  const GO_PREMIUM_EXCEPTIONS = ["gpt-5.6-luna"]
  const GO_PREMIUM_PREFIX_EXCEPTIONS = ["meta/muse-spark-1.2-contributor"]
  const i = id.indexOf("/")
  if (i === -1) return GO_PREMIUM_EXCEPTIONS.includes(id)
  if (GO_PREMIUM_PREFIX_EXCEPTIONS.includes(id)) return true
  const prefix = id.slice(0, i + 1)
  if (["google/", "sakana/", "meta/"].includes(prefix)) return false
  return true
}

export async function fetchModels(apiKey: string): Promise<ModelEntry[]> {
  const res = await fetch("https://api.commandcode.ai/provider/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const body = (await res.json()) as { data: { id: string; name?: string; context_length?: number }[] }
  return body.data
    .filter((m) => isGoModel(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name ?? m.id.split("/").pop() ?? m.id,
      tier: "open-source" as const,
      reasoning: true,
      tool_call: true,
      cost: { input: 0, output: 0 },
      limit: { context: m.context_length ?? 0, output: 0 },
    }))
}

export function enrichWithPricing(fetched: ModelEntry[], pricing: ModelEntry[]): ModelEntry[] {
  const pricingMap = new Map(pricing.map((e) => [e.id, e]))
  return fetched.map((entry) => {
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
