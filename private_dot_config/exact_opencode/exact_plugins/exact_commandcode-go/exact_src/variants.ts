// Reasoning effort tiers per model, sourced from the Command Code CLI model
// catalog (command-code npm package). These are the values the Command Code
// backend actually accepts — the opencode default (low/medium/high) is too
// coarse for GPT-5.6 (xhigh/max) and DeepSeek V4 (high/max) families.
const CLI_EFFORTS: Record<string, string[]> = {
  "claude-sonnet-5": ["low", "medium", "high", "xhigh", "max"],
  "claude-sonnet-4-6": ["low", "medium", "high", "xhigh", "max"],
  "claude-fable-5": ["low", "medium", "high", "xhigh", "max"],
  "claude-opus-5": ["low", "medium", "high", "xhigh", "max"],
  "claude-opus-4-8": ["low", "medium", "high", "xhigh", "max"],
  "claude-opus-4-7": ["low", "medium", "high", "xhigh", "max"],
  "gpt-5.6-sol": ["low", "medium", "high", "xhigh", "max"],
  "gpt-5.6-terra": ["low", "medium", "high", "xhigh", "max"],
  "gpt-5.6-luna": ["low", "medium", "high", "xhigh", "max"],
  "gpt-5.5": ["low", "medium", "high", "xhigh"],
  "gpt-5.4": ["low", "medium", "high", "xhigh"],
  "gpt-5.3-codex": ["low", "medium", "high", "xhigh"],
  "gpt-5.4-mini": ["low", "medium", "high"],
  "deepseek/deepseek-v4-pro": ["high", "max"],
  "deepseek/deepseek-v4-flash": ["high", "max"],
  "zai-org/GLM-5.2": ["high", "max"],
  "Qwen/Qwen3.8-Max": ["low", "medium", "xhigh"],
  "google/gemini-3.6-flash": ["low", "medium", "high"],
  "google/gemini-3.5-flash": ["low", "medium", "high"],
  "google/gemini-3.5-flash-lite": ["low", "medium", "high"],
  "google/gemini-3.1-flash-lite": ["low", "medium", "high"],
  "sakana/fugu-ultra": ["high", "xhigh"],
  "xai/grok-4.5": ["low", "medium", "high"],
}

// Fallback for models not in the CLI catalog: opencode's conservative default
// for OpenAI-compatible reasoning models.
const DEFAULT_EFFORTS = ["low", "medium", "high"]

export function reasoningEffortsFor(id: string): string[] {
  const lower = id.toLowerCase()
  for (const [modelId, efforts] of Object.entries(CLI_EFFORTS)) {
    if (lower === modelId.toLowerCase()) return efforts
  }
  const efforts = [...DEFAULT_EFFORTS]
  if (lower.includes("deepseek-v4")) efforts.push("max")
  return efforts
}

export function reasoningVariants(id: string): Record<string, unknown> | undefined {
  const efforts = reasoningEffortsFor(id)
  if (!efforts) return undefined
  return Object.fromEntries(efforts.map(e => [e, { reasoningEffort: e }]))
}
