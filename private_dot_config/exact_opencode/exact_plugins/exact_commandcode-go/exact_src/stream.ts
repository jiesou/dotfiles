export type StreamEvent =
  | { type: "text-delta"; text?: string }
  | { type: "reasoning-start" }
  | { type: "reasoning-delta"; text?: string }
  | { type: "reasoning-end" }
  | {
      type: "tool-call"
      toolCallId?: string
      toolName?: string
      input?: unknown
      args?: unknown
      providerExecuted?: boolean
    }
  | {
      type: "finish"
      finishReason?: string
      rawFinishReason?: string
      totalUsage?: {
        inputTokens?: number
        outputTokens?: number
        inputTokenDetails?: { cacheReadTokens?: number; cacheWriteTokens?: number }
      }
    }
  | { type: "error"; error?: unknown }
  | { type: string; [key: string]: unknown }

export type MappedEvent =
  | { kind: "text"; text: string }
  | { kind: "reasoning"; text: string }
  | { kind: "tool_call"; id: string; name: string; arguments: string; providerExecuted?: boolean }
  | { kind: "finish"; finishReason: string; usage: WireUsage }
  | { kind: "error"; text: string }

export type WireUsage = {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

export function emptyUsage(): WireUsage {
  return { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
}

export function mapStreamEvent(event: StreamEvent): MappedEvent {
  switch (event.type) {
    case "text-delta":
      return typeof event.text === "string" && event.text
        ? { kind: "text", text: event.text }
        : { kind: "error", text: "" }
    case "reasoning-delta":
      return typeof event.text === "string" && event.text
        ? { kind: "reasoning", text: event.text }
        : { kind: "error", text: "" }
    case "reasoning-start":
    case "reasoning-end":
      return { kind: "error", text: "" }
    case "tool-call": {
      const id = (typeof event.toolCallId === "string" && event.toolCallId) || ""
      const name = (typeof event.toolName === "string" && event.toolName) || "unknown"
      const raw = event.input ?? event.args ?? {}
      let args: string
      try {
        args =
          typeof raw === "string"
            ? raw
            : JSON.stringify(raw && typeof raw === "object" ? raw : { value: raw })
      } catch {
        args = "{}"
      }
      return { kind: "tool_call", id, name, arguments: args, providerExecuted: event.providerExecuted === true }
    }
    case "finish": {
      const usage = emptyUsage()
      const total = event.totalUsage as
        | { inputTokens?: number; outputTokens?: number; inputTokenDetails?: { cacheReadTokens?: number } }
        | undefined
      if (total) {
        usage.inputTokens = total.inputTokens ?? 0
        usage.outputTokens = total.outputTokens ?? 0
        usage.cacheReadTokens = total.inputTokenDetails?.cacheReadTokens ?? 0
      }
      const finishReason =
        event.finishReason === "tool-calls"
          ? "tool_calls"
          : event.finishReason === "length"
            ? "length"
            : "stop"
      return { kind: "finish", finishReason, usage }
    }
    case "error": {
      const err = event.error
      const text =
        typeof err === "string"
          ? err
          : err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Command Code stream error"
      return { kind: "error", text }
    }
    default:
      return { kind: "error", text: "" }
  }
}

export async function* readNdjsonLines(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string, void, unknown> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let idx: number
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim()
        buffer = buffer.slice(idx + 1)
        if (line) yield line
      }
    }
    const tail = buffer.trim()
    if (tail) yield tail
  } finally {
    reader.releaseLock()
  }
}

export async function* streamGenerateEvents(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  signal?: AbortSignal,
): AsyncGenerator<MappedEvent, void, unknown> {
  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    yield { kind: "error", text: `network error: ${err instanceof Error ? err.message : String(err)}` }
    return
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    yield { kind: "error", text: `POST /alpha/generate → ${res.status} ${text.slice(0, 500)}` }
    return
  }
  if (!res.body) {
    yield { kind: "error", text: "empty stream body" }
    return
  }
  for await (const line of readNdjsonLines(res.body)) {
    let parsed: StreamEvent
    try {
      parsed = JSON.parse(line) as StreamEvent
    } catch {
      continue
    }
    const mapped = mapStreamEvent(parsed)
    if (mapped.kind === "error" && mapped.text === "") continue
    yield mapped
  }
}
