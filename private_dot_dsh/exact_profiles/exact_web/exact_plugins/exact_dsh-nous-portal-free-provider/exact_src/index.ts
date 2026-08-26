/**
 * nous-portal-free-provider — Nous Portal free tier as a dsh LLM provider.
 *
 * The Portal's free tier serves a small $0 catalog (MiMo V2 Pro / Omni today)
 * through OAuth invoke JWTs — no paid API key, no subscription. This
 * plugin:
 *
 * 1. Registers a sign-in flow on `ctx.authorization`: the webui authorization
 *    page renders it as a button; running it opens the Portal device-code
 *    page (URL + code arrive as a notice) and commits the resulting grant as
 *    a credentials-service record under this plugin's scope.
 * 2. Resolves inference credentials per request from that record — automatic
 *    access-token refresh, cached in memory and
 *    single-flighted; refresh-token rotations are written back through
 *    `modifyRecord`, whose lock is what makes concurrent rotation safe.
 * 3. Registers a `nous-portal` provider route on `ctx.llm` whose models are
 *    the live-scanned free catalog, streamed through pi-ai's stock
 *    OpenAI-completions transport. A plain `sk-` API key (funded accounts)
 *    stored under NOUS_PORTAL_API_KEY wins when present.
 *
 * Free-tier refusals arrive as HTTP 401/403 JSON that the harness would
 * classify as AUTH and mask as "API key is invalid" — non-auth envelopes are
 * rewritten to `[nous-portal <type>] <message>` before that classification,
 * mirroring the opencode-zen provider's treatment of Zen refusals.
 *
 * @module nous-portal-free-provider
 */

import type { Context } from '@deepseek-ai/cordis'
import { assertUsableApiKey, resolveRetryPolicy } from '@deepseek-ai/dsh-llm'
import { PiAiAdapter } from '@deepseek-ai/dsh-llm-pi-ai'
import type { ResolvedPiAiProviderProfile } from '@deepseek-ai/dsh-llm-pi-ai'
import { AuthorizationSession } from '@deepseek-ai/dsh-authorization'
import { credentialKey, credentialRef } from '@deepseek-ai/dsh-credentials'
import type { GrantRecord } from '@deepseek-ai/dsh-credentials'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import {
  createProvider,
  type AuthContext,
  type Context as PiContext,
  type CredentialStore,
  type Model,
  type ProviderStreams,
  type SimpleStreamOptions,
} from '@earendil-works/pi-ai'
import { stream as openAiStream, streamSimple as openAiStreamSimple } from '@earendil-works/pi-ai/api/openai-completions'
import { deepEqualJson } from '@deepseek-ai/dsh-settings'
import { DEFAULT_INFERENCE_URL, DEFAULT_MODELS_URL, DEFAULT_PORTAL_URL, deviceCodeLogin, NousTokenManager, refreshAccessToken } from './oauth.js'
import type { NousPortalGrant } from './oauth.js'
import { fetchFreeModels } from './models.js'
import type { NousPortalModel } from './models.js'

export { DEFAULT_CLIENT_ID, DEFAULT_INFERENCE_URL, DEFAULT_PORTAL_URL, DEFAULT_SCOPE } from './oauth.js'
export { deviceCodeLogin, NousTokenManager, pollForToken, requestDeviceCode } from './oauth.js'
export type { DeviceCodeChallenge, InferenceCredential, NousPortalGrant } from './oauth.js'
export { fetchFreeModels, parseFreeModels } from './models.js'
export type { NousPortalModel } from './models.js'

export const name = 'nous-portal-free-provider'
export const inject = ['llm', 'settings']

const PROVIDER = 'nous-portal'
const DISPLAY_NAME = 'Nous Portal Free'
/** The one credential record this plugin owns: `<scope>/portal`. */
const RECORD_KEY = credentialKey(name, 'portal')

const DEFAULT_API_KEY_ENV = 'NOUS_PORTAL_API_KEY'
/** Catalog scan cadence; the free set rotates slowly. */
const REFRESH_MS = 15 * 60 * 1000

/**
 * pi-ai's thinking-level keys, in its own ladder order. Upstream effort ids
 * map onto these keys by name; the one special case is upstream `none`,
 * which lands on the `off` key with the wire value preserved — the standard
 * OpenAI-completions branch sends a string `off` value as `reasoning_effort`,
 * so selecting Off genuinely disables thinking where the endpoint allows it.
 */
const PI_THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Free-tier refusals ("OpenRouter free models are not supported", ended
// promotions) surface over HTTP 401/403 whose text the harness classifies as
// AUTH and replaces with "API key is invalid". Rewrite the JSON envelope in
// the terminal error event to `[nous-portal <type>] <message>` first;
// genuine auth failures keep surfacing as AUTH.
const rewriteRefusalMessage = (errorMessage: string): string => {
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
  const detail = parsed.type === 'error' && isRecord(parsed.error) ? parsed.error : parsed
  const message = [detail.message, isRecord(detail.error) ? detail.error.message : undefined, detail.detail]
    .find(value => typeof value === 'string')
  if (message === undefined) return errorMessage
  if (detail.type === 'authentication_error' || detail.code === 'invalid_api_key') return errorMessage
  const type = typeof detail.type === 'string' ? detail.type : 'Error'
  return `[nous-portal ${type}] ${message}`
}

interface Pushable {
  push(event: unknown): void
}

const sanitizeStream = <S extends Pushable>(stream: S): S => {
  const originalPush = stream.push.bind(stream)
  stream.push = (event: unknown) => {
    if (isRecord(event) && event.type === 'error' && isRecord(event.error) && typeof event.error.errorMessage === 'string') {
      event.error.errorMessage = rewriteRefusalMessage(event.error.errorMessage)
    }
    originalPush(event)
  }
  return stream
}

// DeepSeek-style reasoners replay assistant thinking blocks without a wire
// signature; marking them `reasoning_content` keeps the OpenAI-completions
// transport from mangling history on follow-up turns (same insurance the
// opencode-zen provider ships for mimo-v2.5-free).
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

/**
 * Translate preserved reasoning metadata into pi-ai's thinkingLevelMap:
 * every harness level declared explicitly (supported efforts by name,
 * `none` as the `off` wire value), everything else null. Returns undefined
 * for non-controllable models — the seam then offers no effort control,
 * which is exactly the truth for endpoints that think but take no argument.
 */
function buildThinkingLevelMap(reasoning: NousPortalModel['reasoning']): Record<string, string | null> | undefined {
  if (reasoning === undefined || !reasoning.controllable) return undefined
  const map: Record<string, string | null> = {}
  for (const level of PI_THINKING_LEVELS) map[level] = null
  const supported = reasoning.supportedEfforts ?? []
  if (supported.length === 0) {
    // Controllable endpoint that names no ladder: expose the standard four.
    for (const level of ['minimal', 'low', 'medium', 'high'] as const) map[level] = level
    return map
  }
  for (const effort of supported) {
    if (effort === 'none') {
      map.off = 'none'
      continue
    }
    if ((PI_THINKING_LEVELS as readonly string[]).includes(effort)) map[effort] = effort
    // An upstream id outside pi-ai's ladder has no key to land on; the raw
    // id survives in NousPortalReasoning.supportedEfforts for diagnostics.
  }
  return map
}

/**
 * Turn the live-scanned free listing into pi-ai model descriptors.
 */
function buildModels(scanned: readonly NousPortalModel[]): Model<'openai-completions'>[] {
  return scanned.map(entry => ({
    id: entry.id,
    name: entry.name ?? entry.id,
    api: 'openai-completions',
    // pi-ai resolves auth per model by `model.provider === Provider.id`; the
    // route key this plugin registers is PROVIDER, so descriptors must say
    // PROVIDER too — a mismatch surfaces as pi-ai's "Unknown provider" on the
    // first stream call.
    provider: PROVIDER,
    baseUrl: DEFAULT_INFERENCE_URL,
    headers: {},
    reasoning: entry.reasoning?.controllable === true,
    // Every level is declared explicitly: supported efforts map onto their
    // same-named pi-ai key (`none` onto `off`, wire value kept), and anything
    // the endpoint does not list is pinned to null so the selector never
    // offers it. With no effort selected the transport omits reasoning_effort
    // and the endpoint applies its own default (defaultEffort is a per-endpoint
    // fact pi-ai's Model shape cannot carry — documented in the README).
    thinkingLevelMap: buildThinkingLevelMap(entry.reasoning),
    input: entry.input ?? ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: entry.contextWindow ?? 262_144,
    maxTokens: entry.maxTokens ?? 32_768,
  }))
}

/** Narrow a stored record to this plugin's grant payload. */
function grantOf(record: unknown): NousPortalGrant | undefined {
  if (!isRecord(record) || record.kind !== 'grant') return undefined
  const payload = record.payload
  if (!isRecord(payload) || typeof payload.refreshToken !== 'string' || payload.refreshToken.length === 0) return undefined
  return payload as unknown as NousPortalGrant
}

export async function apply(ctx: Context): Promise<void> {
  const apiKeyRefName = DEFAULT_API_KEY_ENV

  /** Resolve one named secret through the credentials service, then ambient env. */
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

  const tokenManager = new NousTokenManager({
    resolveGrant: async (): Promise<NousPortalGrant | undefined> => {
      const credentials = ctx.get('credentials')
      if (credentials === undefined) return undefined
      return grantOf(await credentials.readRecord(RECORD_KEY))
    },
    // Run the whole read→POST→write cycle inside modifyRecord so no second
    // process can replay the same single-use refresh token (Portal revokes the
    // session on reuse). Always refresh against whatever refresh token is
    // currently on disk — if another process already rotated it, we advance
    // from the newest one instead of re-presenting a consumed token.
    refreshGrant: async (grant, signal) => {
      const credentials = ctx.get('credentials')
      if (credentials === undefined) {
        throw new Error('nous-portal: no credentials service to refresh the grant with')
      }
      let tokens: Awaited<ReturnType<typeof refreshAccessToken>> | undefined
      const record = await credentials.modifyRecord(RECORD_KEY, async (currentRecord) => {
        const current = grantOf(currentRecord)
        if (current === undefined) return currentRecord
        const used = current.refreshToken
        tokens = await refreshAccessToken(current, signal)
        const rotated = typeof tokens.refresh_token === 'string' && tokens.refresh_token.length > 0
          && tokens.refresh_token !== used
          ? tokens.refresh_token
          : undefined
        const inferenceBaseUrl = typeof tokens.inference_base_url === 'string' && tokens.inference_base_url.length > 0
          ? tokens.inference_base_url.replace(/\/+$/, '')
          : current.inferenceBaseUrl
        return {
          kind: 'grant',
          payload: { ...current, ...(rotated !== undefined ? { refreshToken: rotated } : {}), ...(inferenceBaseUrl !== undefined ? { inferenceBaseUrl } : {}) },
        } satisfies GrantRecord
      })
      const refreshed = tokens
      if (refreshed === undefined) {
        // modifyRecord left the record untouched (no stored grant): not signed in,
        // or another process advanced it while we waited — adopt its token.
        const stored = grantOf(record)
        if (stored === undefined) {
          throw new Error(
            'nous-portal: not signed in. Open the dsh authorization page and run the'
            + ' "Nous Portal Free" sign-in flow (or store NOUS_PORTAL_API_KEY for a funded account)',
          )
        }
        const rotated = stored.refreshToken !== grant.refreshToken ? stored.refreshToken : undefined
        return {
          accessToken: '',
          accessTokenExpiresAt: 0,
          ...(stored.inferenceBaseUrl !== undefined ? { inferenceBaseUrl: stored.inferenceBaseUrl } : {}),
          ...(rotated !== undefined ? { rotatedRefreshToken: rotated } : {}),
        }
      }
      return {
        accessToken: refreshed.access_token,
        accessTokenExpiresAt: Date.now() + (refreshed.expires_in ?? 900) * 1_000,
        ...(typeof refreshed.inference_base_url === 'string' && refreshed.inference_base_url.length > 0
          ? { inferenceBaseUrl: refreshed.inference_base_url.replace(/\/+$/, '') }
          : {}),
      }
    },
  })

// PiAiAuthInjection: what every collection this adapter builds resolves
// ambient auth through. Our route authenticates via apiKey resolution alone,
// so a minimal no-store implementation suffices; env/file answers mirror the
// official llm-pi-ai plugin's wiring over the harness credential plane.
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

  // --- Live free-catalog scan ---
  // The listing is public and rotates; scan on mount and refresh slowly. The
  // scanned catalog lives outside the settings-backed config so a scan cannot
  // be clobbered by a settings snapshot; profiles() reads the merged view.
  let scanned: NousPortalModel[] = []
  let refreshTimer: ReturnType<typeof setInterval> | undefined

  ctx.effect(() => () => {
    if (refreshTimer !== undefined) clearInterval(refreshTimer)
    refreshTimer = undefined
  })

  async function sync(): Promise<void> {
    const entries = await fetchFreeModels(DEFAULT_MODELS_URL)
    if (entries.length === 0) {
      throw new Error('no $0 models found in the live listing; keeping the previous catalog')
    }
    if (deepEqualJson(entries, scanned)) return
    scanned = entries
    ctx.logger.info('[%s] synced %d free model(s): %s', name, entries.length, entries.map(entry => entry.id).join(', '))
  }

  const adapter = new PiAiAdapter({
    resolveAttachments: () => ctx.get('attachments'),
    auth: piAuth(),
    profiles: (): Map<string, ResolvedPiAiProviderProfile> => new Map([[PROVIDER, {
      provider: PROVIDER,
      displayName: DISPLAY_NAME,
      apiKeyEnv: credentialRef(apiKeyRefName),
      streamIdleTimeoutMs: 300_000,
      maxRequestImageBytes: 20 * 1_048_576,
      requestImagePixelBudget: 4_194_304,
      requestImageMaxBytes: 1_048_576,
      retryPolicy: resolveRetryPolicy({ mode: 'always' }, `${name}: retryPolicy`),
      piProvider: createProvider<'openai-completions'>({
        id: PROVIDER,
        name: DISPLAY_NAME,
        baseUrl: DEFAULT_INFERENCE_URL,
        auth: {
          apiKey: {
            name: 'NousPortalFree',
            resolve: async ({ credential }) => {
              // A stored plain sk- key wins (funded / pay-as-you-go accounts).
              if (credential?.key !== undefined && credential.key.length > 0) {
                return { auth: { apiKey: credential.key }, source: 'NousPortalFree' }
              }
              const plainKey = await resolveSecretValue(apiKeyRefName)
              if (plainKey !== undefined) {
                return { auth: { apiKey: plainKey }, source: 'NousPortalFree' }
              }
              const { apiKey, inferenceBaseUrl } = await tokenManager.getInferenceCredential()
              return {
                auth: {
                  apiKey,
                  ...(inferenceBaseUrl !== undefined ? { baseUrl: inferenceBaseUrl } : {}),
                },
                source: 'NousPortalFree OAuth',
              }
            },
          },
        },
        models: buildModels(scanned),
        api: {
          stream: (model: Model<'openai-completions'>, context: PiContext, options: Parameters<ProviderStreams['stream']>[2]) =>
            sanitizeStream(openAiStream(model, normalizeReasoningContext(model, context), options)) as unknown as ReturnType<ProviderStreams['stream']>,
          streamSimple: (model: Model<'openai-completions'>, context: PiContext, options: SimpleStreamOptions) =>
            sanitizeStream(openAiStreamSimple(model, normalizeReasoningContext(model, context), options)) as unknown as ReturnType<ProviderStreams['streamSimple']>,
        } as ProviderStreams,
      }),
      configuredMaxTokens: new Map(),
    }]]),
    resolveApiKey: async (_provider, profile) => {
      const credentials = ctx.get('credentials')
      if (credentials !== undefined) {
        const hit = await credentials.resolve(profile.apiKeyEnv!)
        if (hit !== undefined && hit.value.trim().length > 0) {
          return assertUsableApiKey(hit.value, name, String(profile.apiKeyEnv))
        }
      }
      const ambientKey = await resolveSecretValue(apiKeyRefName)
      if (ambientKey !== undefined) return assertUsableApiKey(ambientKey, name, apiKeyRefName)
      // OAuth path: use the stored grant's invoke JWT as the inference key.
      const { apiKey } = await tokenManager.getInferenceCredential()
      return apiKey
    },
  })

  ctx.llm.registerAdapter([PROVIDER], adapter)

  void sync().catch((error: unknown) => {
    ctx.logger.warn('[%s] initial catalog scan failed: %s', name,
      error instanceof Error ? error.message : String(error))
  })
  refreshTimer = setInterval(() => {
    void sync().catch((error: unknown) => {
      ctx.logger.warn('[%s] catalog refresh failed: %s', name,
        error instanceof Error ? error.message : String(error))
    })
  }, REFRESH_MS)
  refreshTimer.unref?.()

  // The sign-in flow: rendered by every authorization surface (webui page,
  // CLI) exactly like the built-in pi-ai provider flows. Running it walks the
  // device-code dance and commits the grant through the credentials seam —
  // the confirmation of that commit is what reports success.
  const authorization = ctx.get('authorization')
  if (authorization !== undefined) {
    const disposeFlow = authorization.registerFlow({
      key: RECORD_KEY,
      label: DISPLAY_NAME,
      methods: [{ id: 'oauth', label: 'Sign in with Nous Portal' }],
      async run(session: AuthorizationSession) {
        const credentials = ctx.get('credentials')
        if (credentials === undefined) {
          throw new Error('nous-portal: no credentials service to store the grant in')
        }
        session.notify({ message: 'Starting Nous Portal sign-in…' })
        const grant = await deviceCodeLogin({
          portalUrl: DEFAULT_PORTAL_URL,
          signal: session.signal,
          onChallenge: (value) => {
            session.notify({
              message: 'Open this page and approve the sign-in.',
              url: value.verificationUrl,
              ...(value.userCode.length > 0 ? { code: value.userCode } : {}),
            })
          },
        })
        // Committing inside the attempt is what the seam confirms before it
        // reports `authorized`.
        await credentials.modifyRecord(RECORD_KEY, async () =>
          ({ kind: 'grant', payload: grant }) satisfies GrantRecord)
        session.notify({ message: 'Nous Portal sign-in complete.' })
      },
    })
    ctx.effect(() => disposeFlow)
  }
}
