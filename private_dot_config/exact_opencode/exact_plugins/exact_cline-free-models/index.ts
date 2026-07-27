import type { Plugin } from "@opencode-ai/plugin"

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

function toModelEntry(m: OpenRouterModel): Record<string, any> {
  const params = m.supported_parameters ?? []
  const supportsReasoning = params.some((p) => ["reasoning", "reasoning_effort"].includes(p))
  const supportsTools = params.includes("tools")
  const supportsTemperature = params.includes("temperature")

  const entry: Record<string, any> = {
    name: m.name,
    id: m.id,
  }

  if (m.family) entry.family = m.family

  if (m.context_length || m.top_provider?.max_completion_tokens != null) {
    entry.limit = {}
    if (m.context_length) entry.limit.context = m.context_length
    if (m.top_provider?.max_completion_tokens != null) entry.limit.output = m.top_provider.max_completion_tokens
  }

  entry.cost = { input: 0, output: 0 }

  if (m.architecture?.input_modalities || m.architecture?.output_modalities) {
    entry.modalities = {}
    if (m.architecture.input_modalities) entry.modalities.input = m.architecture.input_modalities
    if (m.architecture.output_modalities) entry.modalities.output = m.architecture.output_modalities
  }

  if (supportsTools) entry.tool_call = true
  if (supportsReasoning) entry.reasoning = true
  if (supportsTemperature) entry.temperature = true

  if (supportsReasoning) {
    entry.interleaved = { field: "reasoning_details" }
  }

  return entry
}

export default (async () => {
  const freeModels = await fetchFreeModels()
  if (freeModels.length === 0) return {}

  return {
    config: async (cfg: Record<string, any>) => {
      const provider = cfg.provider?.[PROVIDER_ID]
      if (!provider) return

      const models: Record<string, any> = {}
      for (const m of freeModels) {
        models[m.id] = toModelEntry(m)
      }

      provider.models = {
        ...(provider.models || {}),
        ...models,
      }
    },
  }
}) satisfies Plugin
