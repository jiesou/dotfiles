const MODELS_URL = "https://api.cline.bot/api/v1/ai/cline/models"
const PROVIDER_ID = "cline-pass"

type OpenRouterModel = {
  id: string
  name: string
  family?: string
  created?: number
  description?: string
  context_length?: number
  top_provider?: {
    context_length?: number
    max_completion_tokens?: number
    is_moderated?: boolean
  }
  architecture?: {
    modality?: string
    input_modalities?: string[]
    output_modalities?: string[]
    tokenizer?: string
    instruct_type?: string | null
  }
  pricing: {
    prompt: string
    completion: string
    input_cache_read?: string
    input_cache_write?: string
    web_search?: string
  }
  supported_parameters?: string[]
  default_parameters?: Record<string, any>
  per_request_limits?: any
}

async function fetchFreeModels() {
  const res = await fetch(MODELS_URL)
  if (!res.ok) return []
  const body: { data: OpenRouterModel[] } = await res.json()
  return body.data.filter((m) => m.id.endsWith(":free"))
}

export default {
  id: "opencode.cline-free-models",
  setup: async (ctx) => {
    let freeModels: OpenRouterModel[] = []
    const refresh = async () => {
      freeModels = await fetchFreeModels()
      if (ctx.model?.reload) await ctx.model.reload()
    }

    if (ctx.model?.transform) {
      await ctx.model.transform((modelsCatalog: any) => {
        for (const m of freeModels) {
          const params = m.supported_parameters ?? []
          const supportsReasoning = params.some((p) =>
            ["reasoning", "reasoning_effort"].includes(p),
          )
          const supportsTools = params.includes("tools")

          const entry = {
            name: m.name,
            modelID: m.id,
            capabilities: {
              tools: supportsTools,
              input: (m.architecture?.input_modalities ?? ["text"]).filter(
                (x: string) => x !== "output",
              ),
              output: (m.architecture?.output_modalities ?? ["text"]).filter(
                (x: string) => x !== "input",
              ),
            },
            limit: {
              context: m.context_length || m.top_provider?.context_length || 0,
              output: m.top_provider?.max_completion_tokens || 0,
            },
            cost: [{ input: 0, output: 0, cache: { read: 0, write: 0 } }],
          }

          modelsCatalog.update(PROVIDER_ID, m.id, (model: any) => {
            Object.assign(model, entry)
          })
        }
      })
    }

    await refresh()
    const timer = setInterval(() => void refresh().catch(console.error), 60_000)
    return () => clearInterval(timer)
  },
}
