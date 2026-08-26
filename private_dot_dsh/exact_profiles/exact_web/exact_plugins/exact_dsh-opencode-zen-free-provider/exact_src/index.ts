import type { Context } from '@deepseek-ai/cordis'
import { assertUsableApiKey, resolveRetryPolicy, RetryPolicySchema } from '@deepseek-ai/dsh-llm'
import type { RetryPolicyConfig } from '@deepseek-ai/dsh-llm'
import { PiAiAdapter, type ResolvedPiAiProviderProfile } from '@deepseek-ai/dsh-llm-pi-ai'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import z from '@deepseek-ai/schemastery'
import { createHash } from 'node:crypto'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { createProvider, type AuthContext, type Context as PiContext, type CredentialStore, type Model, type SimpleStreamOptions, type ThinkingLevelMap, type ProviderStreams } from '@earendil-works/pi-ai'
import { getBuiltinModels } from '@earendil-works/pi-ai/providers/all'
// Cloned (and minimized) from @earendil-works/pi-ai's openai-completions module.
// See src/openai-completions.ts for the source URL + the only change (zenFetch).
// The cloned copy re-declares AssistantMessageEventStream as a separate class
// identity, so its stream functions are cast back to the package's types here.
// Runtime behavior is identical; only the (private) class identity differs.
import { stream as _piAgentStream, streamSimple as _piAgentStreamSimple, installZenUserAgent } from './openai-completions.js'
const piAgentStream = _piAgentStream as unknown as ProviderStreams['stream']
const piAgentStreamSimple = _piAgentStreamSimple as unknown as ProviderStreams['streamSimple']

export const name = 'opencode-zen-free-provider'
export const inject = ['llm', 'settings']

const NS = settingsNamespace('opencode-zen-free-provider')

export interface Config {
  /** Provider-owned model-request retry policy; omission uses normal defaults. */
  retryPolicy?: RetryPolicyConfig
}

export const Config: z<Config> = z.object({
  retryPolicy: RetryPolicySchema,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const resolveOpenCodeVersion = async (): Promise<string> => {
  try {
    const payload = await fetchJson('https://data.jsdelivr.com/v1/packages/npm/opencode-ai/resolved', {
      accept: 'application/json',
    })
    return typeof payload.version === 'string' && payload.version.length > 0
      ? payload.version
      : '1.18.18'
  } catch {
    return '1.18.18'
  }
}

const opencodeId = (prefix: 'ses' | 'msg', value: string): string => {
  const digest = createHash('sha256').update(`dsh-opencode-${prefix}\0${value}`).digest()
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let number = BigInt(`0x${digest.toString('hex')}`)
  let encoded = ''
  while (number > 0) {
    encoded = alphabet[Number(number % 62n)] + encoded
    number /= 62n
  }
  while (encoded.length < 14) encoded = `0${encoded}`
  return `${prefix}_${digest.toString('hex').slice(0, 12)}${encoded.slice(0, 14)}`
}

const lastUserContent = (context: PiContext): string => {
  for (let index = context.messages.length - 1; index >= 0; index -= 1) {
    const message = context.messages[index]
    if (message.role !== 'user') continue
    if (typeof message.content === 'string') return message.content
    return message.content.map(part => part.type === 'text' ? part.text : part.data).join('\0')
  }
  return ''
}

const zenApiHeaders = (model: Model<'openai-completions'>, context: PiContext, options: SimpleStreamOptions) => {
  const sessionId = options.sessionId ?? 'dsh-session-unknown'
  const requestSeed = `${sessionId}\0${lastUserContent(context)}`
  return {
    ...model.headers,
    'HTTP-Referer': 'https://opencode.ai',
    'x-opencode-project': 'global',
    'x-opencode-session': opencodeId('ses', sessionId),
    'x-opencode-request': opencodeId('msg', requestSeed),
    'x-opencode-client': 'cli',
  }
}

const normalizeReasoningContext = (model: Model<'openai-completions'>, context: PiContext): PiContext => {
  if (!model.reasoning) return context
  const messages = context.messages.map(message => {
    if (message.role !== 'assistant') return message
    const content = message.content.map(block =>
      block.type === 'thinking' && block.thinking.trim().length > 0 && block.thinkingSignature === undefined
        ? { ...block, thinkingSignature: 'reasoning_content' }
        : block,
    )
    return content === message.content ? message : { ...message, content }
  })
  return messages.some((message, index) => message !== context.messages[index]) ? { ...context, messages } : context
}

// OpenCode Zen reports non-credential refusals (ended free promotions, region
// blocks) over HTTP 401/403, and the harness classifies any 401/403 text as an
// AUTH failure whose message the UI replaces with "API key is invalid" — hiding
// the actual reason. Rewrite the Zen error envelope inside the terminal error
// event's `errorMessage` (e.g. `401: {"type":"ModelError","message":"..."}`) to
// `[opencode-zen <type>] <message>` before it reaches that classification.
// Genuine `AuthError` envelopes are left untouched so real key failures still
// surface as AUTH. The wire request and the transport's own error stay honest;
// only this provider's presentation string changes.
const rewriteZenRefusalMessage = (errorMessage: string): string => {
  const start = errorMessage.indexOf('{')
  const end = errorMessage.lastIndexOf('}')
  if (start < 0 || end <= start) return errorMessage
  let parsed: unknown
  try {
    parsed = JSON.parse(errorMessage.slice(start, end + 1))
  } catch {
    return errorMessage
  }
  if (!isRecord(parsed)) return errorMessage
  // Accept both the raw envelope (`{"type":"error","error":{...}}`) and the
  // SDK-unwrapped inner object (`{"type":"ModelError","message":"..."}`).
  const detail = parsed.type === 'error' && isRecord(parsed.error) ? parsed.error : parsed
  if (typeof detail.message !== 'string') return errorMessage
  if (detail.type === 'AuthError') return errorMessage
  const type = typeof detail.type === 'string' ? detail.type : 'Error'
  return `[opencode-zen ${type}] ${detail.message}`
}

interface ZenPushable {
  push(event: unknown): void
}

const sanitizeZenStream = <S extends ZenPushable>(stream: S): S => {
  const originalPush = stream.push.bind(stream)
  stream.push = (event: unknown) => {
    if (isRecord(event) && event.type === 'error' && isRecord(event.error) && typeof event.error.errorMessage === 'string') {
      event.error.errorMessage = rewriteZenRefusalMessage(event.error.errorMessage)
    }
    originalPush(event)
  }
  return stream
}

const zenApi = {
  stream: (model: Model<'openai-completions'>, context: PiContext, options: SimpleStreamOptions) =>
    sanitizeZenStream(piAgentStream({ ...model, headers: zenApiHeaders(model, context, options) }, normalizeReasoningContext(model, context), options)),
  streamSimple: (model: Model<'openai-completions'>, context: PiContext, options: SimpleStreamOptions) =>
    sanitizeZenStream(piAgentStreamSimple({ ...model, headers: zenApiHeaders(model, context, options) }, normalizeReasoningContext(model, context), options)),
}

async function fetchJson(url: string, headers: Record<string, string>) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
    const payload: unknown = await response.json()
    if (!isRecord(payload)) throw new Error(`${url}: unexpected response shape`)
    return payload
  } finally {
    clearTimeout(timer)
  }
}

export async function apply(ctx: Context, config: Config): Promise<void> {
  let current: () => Config = () => config
  const opencodeVersion = await resolveOpenCodeVersion()
  const opencodeUserAgent = `opencode/${opencodeVersion}`
  installZenUserAgent(opencodeUserAgent)
  const [zen, modelsDev] = await Promise.all([
    fetchJson('https://opencode.ai/zen/v1/models', {
      'User-Agent': opencodeUserAgent,
      accept: 'application/json',
    }),
    fetchJson('https://models.dev/api.json', { accept: 'application/json' }),
  ])
  if (!Array.isArray(zen.data)) throw new Error('zen models: unexpected response shape')
  if (!isRecord(modelsDev.opencode) || !isRecord(modelsDev.opencode.models)) {
    throw new Error('models.dev: no "opencode" provider')
  }
  const modelsById = modelsDev.opencode.models

  const models = (zen.data as unknown[])
    .filter((entry): entry is Record<string, unknown> =>
      isRecord(entry) && typeof entry.id === 'string' && entry.id.endsWith('-free'))
    .flatMap((entry): Model<'openai-completions'>[] => {
      const id = entry.id as string
      const metadata = modelsById[id]
      if (!isRecord(metadata)) return []
      const baseCompat = getBuiltinModels('opencode').find(base => base.id === id)?.compat
      const compat = baseCompat === undefined ? undefined : { ...baseCompat, requiresReasoningContentOnAssistantMessages: false }

      const option = (Array.isArray(metadata.reasoning_options) ? metadata.reasoning_options : [])
        .find(value => isRecord(value) && value.type === 'effort')
      const efforts = isRecord(option) && Array.isArray(option.values)
        ? option.values.filter((value): value is string => typeof value === 'string')
        : []
      // `off` is deliberately left unset (not 'none'): with no effort selected the
      // transport then omits `reasoning_effort` entirely instead of forcing 'none',
      // so OpenCode Zen keeps its own default thinking. ('none' would disable thinking.)
      const thinkingLevelMap: ThinkingLevelMap = {}
      for (const level of ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const) {
        thinkingLevelMap[level] = efforts.length === 0 || efforts.includes(level) ? level : null
      }

      const limit = isRecord(metadata.limit) ? metadata.limit : undefined
      const input = isRecord(metadata.modalities) && Array.isArray(metadata.modalities.input)
        ? metadata.modalities.input.filter((value): value is 'text' | 'image' => value === 'text' || value === 'image')
        : []
      return [{
        id,
        name: typeof metadata.name === 'string' ? metadata.name : id,
        api: 'openai-completions',
        provider: name,
        baseUrl: 'https://opencode.ai/zen/v1',
        headers: { 'User-Agent': opencodeUserAgent, 'HTTP-Referer': 'https://opencode.ai' },
        reasoning: true,
        thinkingLevelMap,
        input: input.length > 0 ? input : ['text'],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: id === 'mimo-v2.5-free' ? 1_048_576
          : typeof limit?.context === 'number' ? limit.context : 1_048_576,
        maxTokens: typeof limit?.output === 'number' ? limit.output : 32_768,
        ...(compat ? { compat } : {}),
      }]
    })
  if (models.length === 0) throw new Error('no OpenCode Zen free models resolved')
  ctx.logger.info('[%s] synced %d free model(s): %s', name, models.length, models.map(model => model.id).join(', '))

  const resolveSecretValue = async (envName: string): Promise<string | undefined> => {
    const credentials = ctx.get('credentials')
    if (credentials !== undefined) {
      const hit = await credentials.resolve(credentialRef(envName))
      if (hit !== undefined && hit.value.trim().length > 0) return hit.value.trim()
    }
    const ambient = launchEnvironmentOf(ctx).get(envName)
    if (ambient !== undefined && ambient.value.trim().length > 0) return ambient.value.trim()
    return undefined
  }

  const piAuth = (): { credentials: CredentialStore, authContext: AuthContext } => ({
    credentials: {
      async read() {
        return undefined
      },
      async list() {
        return []
      },
      async modify(_providerId, mutate) {
        return mutate(undefined)
      },
      async delete() {},
    },
    authContext: {
      async env(envName) {
        return await resolveSecretValue(envName)
      },
      async fileExists(path) {
        const expanded = path === '~' || path.startsWith('~/')
          ? `${homedir()}/${path.slice(1).replace(/^\//, '')}`
          : path
        try {
          await access(expanded)
          return true
        } catch {
          return false
        }
      },
    },
  })

  const adapter = new PiAiAdapter({
    resolveAttachments: () => ctx.get('attachments'),
    profiles: () => new Map<string, ResolvedPiAiProviderProfile>([[name, {
      provider: name,
      displayName: 'OpenCode Zen Free',
      apiKeyEnv: credentialRef('OPENCODE_ZEN_FREE_API_KEY'),
      streamIdleTimeoutMs: 300_000,
      maxRequestImageBytes: 20_971_520,
      requestImagePixelBudget: 4_194_304,
      requestImageMaxBytes: 1_048_576,
      retryPolicy: resolveRetryPolicy(current().retryPolicy, `${name}: retryPolicy`),
      piProvider: createProvider({
        id: name,
        name: 'OpenCodeZenFree',
        baseUrl: 'https://opencode.ai/zen/v1',
        auth: { apiKey: { name: 'OpenCodeZenFree', resolve: ({ credential }) => Promise.resolve({
          auth: credential?.key === undefined ? {} : { apiKey: credential.key },
          source: 'OpenCodeZenFree',
        }) } },
        models,
        api: zenApi,
      }),
      configuredMaxTokens: new Map(),
    }]]),
    auth: piAuth(),
    resolveApiKey: async (_provider, profile) => {
      const credentials = ctx.get('credentials')
      if (credentials !== undefined) {
        const hit = await credentials.resolve(profile.apiKeyEnv!)
        if (hit !== undefined) return assertUsableApiKey(hit.value, name, String(profile.apiKeyEnv))
      }
      // OpenCode Zen accepts the public route without a user API key.
      return 'public'
    },
  })

  ctx.llm.registerAdapter([name], adapter)

  installSettingsSection(ctx, NS, Config, config, {
    setSource: (source) => {
      current = source
    },
    onChange: () => {},
  })
}
