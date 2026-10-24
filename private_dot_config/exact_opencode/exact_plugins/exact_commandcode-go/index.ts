import { existsSync, readFileSync } from "node:fs"
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { buildGenerateBody, type OpenAIMessage, type OpenAITool } from "./src/convert"
import { streamGenerateEvents } from "./src/stream"
import { enrichWithPricing, fetchModels, type ModelEntry } from "./src/models"
import { resolveApiKey } from "./src/key"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROVIDER_ID = "commandcode"
const CC_VERSION = "0.26.20"
const API_BASE = "https://api.commandcode.ai"
const GENERATE_ROUTE = "/alpha/generate"
const MODELS_ROUTE = "/provider/v1/models"
const PROXY_PORT = 8798

let server: Server | null = null
let port = 0

function loadModelsJson(): ModelEntry[] {
  try {
    const modelsPath = join(__dirname, "models.json")
    return JSON.parse(readFileSync(modelsPath, "utf-8"))
  } catch {
    return []
  }
}

async function fetchGoModels(apiKey: string | undefined): Promise<ModelEntry[]> {
  const pricing = loadModelsJson()
  if (!apiKey) return pricing
  try {
    const fetched = await fetchModels(apiKey)
    if (fetched.length > 0) return enrichWithPricing(fetched, pricing)
  } catch {
    // fall through to bundled pricing when the live endpoint is unavailable
  }
  return pricing
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "cli",
    Authorization: `Bearer ${apiKey}`,
    "x-command-code-version": CC_VERSION,
    "x-cli-environment": "cli",
    "x-taste-learning": "false",
    "x-co-flag": "false",
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  })
  res.end(payload)
}

async function handleChatCompletions(
  req: IncomingMessage,
  res: ServerResponse,
  apiKey: string | undefined,
): Promise<void> {
  let raw = ""
  for await (const chunk of req) raw += chunk
  let body: {
    model?: string
    messages?: OpenAIMessage[]
    tools?: OpenAITool[]
    stream?: boolean
    stream_options?: { include_usage?: boolean }
    temperature?: number
    max_tokens?: number
  }
  try {
    body = raw ? JSON.parse(raw) : {}
  } catch {
    sendJson(res, 400, { error: { message: "Invalid JSON body", type: "invalid_request_error" } })
    return
  }

  if (!apiKey) {
    sendJson(res, 401, {
      error: {
        message:
          "Not authenticated with Command Code. Set COMMANDCODE_API_KEY in ~/.config/opencode2/.env (or ~/.config/opencode/.env / ~/.commandcode/auth.json) and restart.",
        type: "authentication_error",
      },
    })
    return
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  const stream = body.stream !== false
  const includeUsage = body.stream_options?.include_usage !== false
  const model = typeof body.model === "string" ? body.model : ""

  const generateBody = buildGenerateBody({
    model,
    messages,
    tools: body.tools,
    maxTokens: body.max_tokens,
    temperature: body.temperature,
  })

  const events = streamGenerateEvents(`${API_BASE}${GENERATE_ROUTE}`, generateBody, buildHeaders(apiKey), req.signal)

  if (!stream) {
    let content = ""
    let reasoning = ""
    let usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
    let finishReason = "stop"
    for await (const event of events) {
      if (event.kind === "text") content += event.text
      else if (event.kind === "reasoning") reasoning += event.text
      else if (event.kind === "finish") {
        finishReason = event.finishReason
        usage = event.usage
      } else if (event.kind === "error") content += `\n\n[command-code error] ${event.text}`
    }
    const payload = {
      id: `chatcmpl_${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content,
            ...(reasoning ? { reasoning_content: reasoning } : {}),
          },
          finish_reason: finishReason,
        },
      ],
      ...(includeUsage
        ? {
            usage: {
              prompt_tokens: usage.inputTokens,
              completion_tokens: usage.outputTokens,
              total_tokens: usage.inputTokens + usage.outputTokens,
            },
          }
        : {}),
    }
    sendJson(res, 200, payload)
    return
  }

  const completionId = `chatcmpl_${Date.now()}`
  const created = Math.floor(Date.now() / 1000)
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  })
  const encoder = new TextEncoder()
  const send = (payload: unknown) => res.write(`data: ${JSON.stringify(payload)}\n\n`)

  send({
    id: completionId,
    object: "chat.completion.chunk",
    created,
    model,
    choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }],
  })

  let finishReason = "stop"
  let usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
  try {
    for await (const event of events) {
      if (event.kind === "text" && event.text) {
        send({
          id: completionId,
          object: "chat.completion.chunk",
          created,
          model,
          choices: [{ index: 0, delta: { content: event.text }, finish_reason: null }],
        })
      } else if (event.kind === "reasoning" && event.text) {
        send({
          id: completionId,
          object: "chat.completion.chunk",
          created,
          model,
          choices: [{ index: 0, delta: { reasoning_content: event.text }, finish_reason: null }],
        })
      } else if (event.kind === "tool_call") {
        send({
          id: completionId,
          object: "chat.completion.chunk",
          created,
          model,
          choices: [
            {
              index: 0,
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    id: event.id,
                    type: "function",
                    function: { name: event.name, arguments: event.arguments },
                  },
                ],
              },
              finish_reason: null,
            },
          ],
        })
      } else if (event.kind === "finish") {
        finishReason = event.finishReason
        usage = event.usage
      } else if (event.kind === "error") {
        send({
          id: completionId,
          object: "chat.completion.chunk",
          created,
          model,
          choices: [{ index: 0, delta: { content: `\n\n[command-code error] ${event.text}` }, finish_reason: null }],
        })
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    send({
      id: completionId,
      object: "chat.completion.chunk",
      created,
      model,
      choices: [{ index: 0, delta: { content: `\n\n[command-code error] ${message}` }, finish_reason: null }],
    })
  }

  send({
    id: completionId,
    object: "chat.completion.chunk",
    created,
    model,
    choices: [{ index: 0, delta: {}, finish_reason: finishReason }],
    ...(includeUsage
      ? {
          usage: {
            prompt_tokens: usage.inputTokens,
            completion_tokens: usage.outputTokens,
            total_tokens: usage.inputTokens + usage.outputTokens,
          },
        }
      : {}),
  })
  res.write("data: [DONE]\n\n")
  res.end()
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, apiKey: string | undefined): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`)
  const pathname = url.pathname

  if (req.method === "GET" && (pathname === "/health" || pathname === "/v1/health")) {
    sendJson(res, 200, { ok: true, provider: PROVIDER_ID })
    return
  }

  if (req.method === "GET" && pathname === "/v1/models") {
    const models = await fetchGoModels(apiKey)
    sendJson(res, 200, {
      object: "list",
      data: models.map((m) => ({ id: m.id, object: "model", owned_by: "command-code" })),
    })
    return
  }

  if (req.method === "POST" && pathname === "/v1/chat/completions") {
    await handleChatCompletions(req, res, apiKey)
    return
  }

  sendJson(res, 404, { error: { message: "Not Found", type: "not_found" } })
}

function startProxy(apiKey: string | undefined): void {
  if (server) return
  server = createServer((req, res) => {
    void handleRequest(req, res, apiKey).catch((err) => {
      const message = err instanceof Error ? err.message : String(err)
      try {
        sendJson(res, 500, { error: { message, type: "server_error" } })
      } catch {
        // response already sent
      }
    })
  })
  server.on("error", (err) => {
    console.error(`[commandcode-go] proxy error: ${err.message}`)
  })
  server.listen(PROXY_PORT, "127.0.0.1")
  port = PROXY_PORT
}

function stopProxy(): void {
  if (server) {
    server.close()
    server = null
    port = 0
  }
}

export default {
  id: "opencode.commandcode-go",
  setup: async (ctx) => {
    const apiKey = resolveApiKey()

    if (ctx.provider?.transform) {
      await ctx.provider.transform((providers: any) => {
        providers.update(PROVIDER_ID, (provider: any) => {
          provider.name = "Command Code"
          provider.package = "aisdk:@ai-sdk/openai-compatible"
          provider.settings = {
            ...(provider.settings ?? {}),
            baseURL: `http://127.0.0.1:${PROXY_PORT}/v1`,
            apiKey: "commandcode-go",
          }
        })
      })
    }

    if (ctx.model?.transform) {
      await ctx.model.transform((modelsCatalog: any) => {
        const models = loadModelsJson()
        for (const entry of models) {
          modelsCatalog.update(PROVIDER_ID, entry.id, (model: any) => {
            model.name = entry.name
            model.capabilities = {
              tools: entry.tool_call,
              input: ["text"],
              output: ["text"],
            }
            model.limit = {
              context: entry.limit.context || 0,
              output: entry.limit.output || 0,
            }
            model.cost = [
              {
                input: entry.cost.input,
                output: entry.cost.output,
                cache: { read: entry.cost.cache_read ?? 0, write: entry.cost.cache_write ?? 0 },
              },
            ]
            model.settings = {
              ...(model.settings ?? {}),
              baseURL: `http://127.0.0.1:${PROXY_PORT}/v1`,
              apiKey: "commandcode-go",
            }
          })
        }
      })
    }

    startProxy(apiKey)

    return async () => {
      stopProxy()
    }
  },
}
