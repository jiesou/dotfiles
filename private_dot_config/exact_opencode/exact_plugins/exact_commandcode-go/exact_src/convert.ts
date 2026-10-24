type WireTextPart = { type: "text"; text: string }
type WireReasoningPart = { type: "reasoning"; text: string }
type WireToolCallPart = {
  type: "tool-call"
  toolCallId: string
  toolName: string
  input: Record<string, unknown>
}
type WireToolResultPart = {
  type: "tool-result"
  toolCallId: string
  toolName: string
  output: { type: "text" | "error-text"; value: string }
}

type WireUserContent = WireTextPart[]
type WireAssistantContent = Array<WireTextPart | WireReasoningPart | WireToolCallPart>
type WireToolContent = WireToolResultPart[]

export type WireMessage =
  | { role: "user"; content: WireUserContent }
  | { role: "assistant"; content: WireAssistantContent }
  | { role: "tool"; content: WireToolContent }

export type WireTool = {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export type GenerateBody = {
  config: {
    workingDir: string
    date: string
    environment: string
    structure: string[]
    isGitRepo: boolean
    currentBranch: string
    mainBranch: string
    gitStatus: string
    recentCommits: string[]
  }
  memory: null
  taste: null
  skills: null
  permissionMode: "standard" | "auto-accept" | "plan"
  mode: string
  params: {
    model: string
    messages: WireMessage[]
    tools: WireTool[]
    system?: string
    max_tokens: number
    stream: boolean
    temperature?: number
    reasoning_effort?: string
  }
}

export type OpenAIMessage = {
  role?: string
  content?: unknown
  tool_calls?: Array<{
    id?: string
    type?: string
    function?: { name?: string; arguments?: string }
  }>
  tool_call_id?: string
  name?: string
}

export type OpenAITool = {
  type?: string
  function?: {
    name?: string
    description?: string
    parameters?: Record<string, unknown>
  }
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content
    .map((part) => {
      if (!part || typeof part !== "object") return ""
      const p = part as { type?: string; text?: string }
      if (p.type === "text" && typeof p.text === "string") return p.text
      return ""
    })
    .join("\n")
    .trim()
}

export function openaiToolsToWire(tools: OpenAITool[] | undefined): WireTool[] {
  if (!Array.isArray(tools)) return []
  return tools
    .map((t) => {
      const name = t.function?.name
      if (!name) return null
      return {
        name,
        description: t.function?.description || name,
        input_schema:
          (t.function?.parameters as Record<string, unknown>) || {
            type: "object",
            properties: {},
          },
      }
    })
    .filter((t): t is WireTool => Boolean(t))
}

export function openaiMessagesToWire(messages: OpenAIMessage[]): { system: string; messages: WireMessage[] } {
  const systemParts: string[] = []
  const wire: WireMessage[] = []

  for (const msg of messages) {
    const role = msg.role || ""
    if (role === "system" || role === "developer") {
      const text = extractTextContent(msg.content)
      if (text) systemParts.push(text)
      continue
    }

    if (role === "user") {
      const text = extractTextContent(msg.content)
      if (!text) continue
      wire.push({ role: "user", content: [{ type: "text", text }] })
      continue
    }

    if (role === "assistant") {
      const content: WireAssistantContent = []
      const text = extractTextContent(msg.content)
      if (text) content.push({ type: "text", text })
      if (Array.isArray(msg.tool_calls)) {
        for (const tc of msg.tool_calls) {
          const id = tc.id || ""
          const name = tc.function?.name || ""
          if (!id || !name) continue
          let input: Record<string, unknown> = {}
          try {
            input = JSON.parse(tc.function?.arguments || "{}") as Record<string, unknown>
          } catch {
            input = { raw: tc.function?.arguments || "" }
          }
          content.push({ type: "tool-call", toolCallId: id, toolName: name, input })
        }
      }
      if (content.length > 0) wire.push({ role: "assistant", content })
      continue
    }

    if (role === "tool") {
      const toolCallId = msg.tool_call_id || ""
      if (!toolCallId) continue
      wire.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId,
            toolName: msg.name || "",
            output: { type: "text", value: extractTextContent(msg.content) },
          },
        ],
      })
    }
  }

  return { system: systemParts.join("\n\n"), messages: wire }
}

export function buildGenerateBody(params: {
  model: string
  messages: OpenAIMessage[]
  tools?: OpenAITool[]
  system?: string
  maxTokens?: number
  temperature?: number
  effort?: string
  workingDir?: string
}): GenerateBody {
  const { system, messages } = openaiMessagesToWire(params.messages)
  const combinedSystem = [params.system, system].filter(Boolean).join("\n\n")

  return {
    config: {
      workingDir: params.workingDir ?? process.cwd() ?? "/",
      date: new Date().toISOString().slice(0, 10),
      environment: process.platform,
      structure: [],
      isGitRepo: false,
      currentBranch: "",
      mainBranch: "",
      gitStatus: "",
      recentCommits: [],
    },
    memory: null,
    taste: null,
    skills: null,
    permissionMode: "auto-accept",
    mode: "agent",
    params: {
      model: params.model,
      messages,
      tools: openaiToolsToWire(params.tools),
      ...(combinedSystem ? { system: combinedSystem } : {}),
      max_tokens: params.maxTokens ?? 32_768,
      stream: true,
      ...(typeof params.temperature === "number" ? { temperature: params.temperature } : {}),
      ...(params.effort ? { reasoning_effort: params.effort } : {}),
    },
  }
}
