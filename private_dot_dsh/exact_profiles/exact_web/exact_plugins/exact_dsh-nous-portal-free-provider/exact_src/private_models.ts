/**
 * Nous Portal free-catalog discovery: the live `/v1/models` listing filtered
 * to the models priced at $0.
 *
 * The listing is public (no auth) and OpenRouter-shaped — Portal fronts
 * OpenRouter — carrying per-model `pricing` (string USD/token),
 * `context_length`, `architecture.input_modalities`, and `reasoning`
 * metadata. Membership is therefore derived, never hardcoded: the free set
 * rotates as promotions come and go, and a checked-in table rots (the MiMo
 * V2 entries this plugin originally shipped were gone within weeks).
 *
 * A model is free when both prompt and completion price are exactly zero;
 * non-text-output models (embeddings, rerankers, image/video generators)
 * are excluded.
 *
 * @module nous-portal-free-provider/models
 */

/**
 * Reasoning metadata exactly as the listing declares it. Every field is
 * preserved verbatim so mapping decisions live in one place and nothing is
 * silently dropped between the feed and the descriptor.
 */
export interface NousPortalReasoning {
  /** The endpoint accepts an explicit effort parameter (`reasoning_effort`). */
  controllable: boolean
  /** Thinking cannot be turned off on this model. */
  mandatory?: boolean
  /** Thinking is enabled by default. */
  defaultEnabled?: boolean
  /** Effort ids the endpoint accepts, verbatim from the feed (may include ids outside the harness ladder). */
  supportedEfforts?: string[]
  /** Effort applied when a request names none. */
  defaultEffort?: string
}

/** One discovered free model, in adapter-ready shape. */
export interface NousPortalModel {
  /** Wire model id accepted by the inference API. */
  id: string
  /** Selector label; defaults to {@link id}. */
  name?: string
  /** Combined request/response context capacity, when disclosed. */
  contextWindow?: number
  /** Per-request output cap, when known. */
  maxTokens?: number
  /** Reasoning metadata; absent for non-reasoning models. */
  reasoning?: NousPortalReasoning
  /** Request modalities beyond text, when the architecture declares them. */
  input?: Array<'text' | 'image'>
}

import { DEFAULT_MODELS_URL } from './oauth.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

/** The exact-zero test on the string-priced feed ("0", "0.0", "0.0000000"). */
function isZeroPrice(value: unknown): boolean {
  if (value === 0) return true
  if (typeof value !== 'string') return false
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed === 0
}

/** Parse one listing entry into an adapter model; undefined when unusable. */
export function parseListModel(raw: unknown): NousPortalModel | undefined {
  if (!isRecord(raw)) return undefined
  const id = nonEmptyString(raw.id)
  if (id === undefined) return undefined
  const pricing = isRecord(raw.pricing) ? raw.pricing : undefined
  // Free means both directions cost nothing; anything else bills credits.
  if (pricing === undefined || !isZeroPrice(pricing.prompt) || !isZeroPrice(pricing.completion)) return undefined

  const effortParams = new Set(
    Array.isArray(raw.supported_parameters) ? raw.supported_parameters.filter((value): value is string => typeof value === 'string') : [],
  )
  const reasoningMeta = isRecord(raw.reasoning) ? raw.reasoning : undefined

  const architecture = isRecord(raw.architecture) ? raw.architecture : undefined
  const outputModalities = architecture !== undefined && Array.isArray(architecture.output_modalities)
    ? architecture.output_modalities
    : []
  // Chat completions produce text; embeddings/rerankers/images do not.
  if (!outputModalities.includes('text')) return undefined

  const inputModalities = architecture !== undefined && Array.isArray(architecture.input_modalities)
    ? architecture.input_modalities
    : []

  // Reasoning metadata, preserved field by field. `controllable` requires the
  // endpoint's own effort parameter — models that think unconditionally but
  // take no effort argument stay honest as non-controllable.
  let reasoning: NousPortalReasoning | undefined
  if (reasoningMeta !== undefined) {
    const supportedEfforts = Array.isArray(reasoningMeta.supported_efforts)
      ? reasoningMeta.supported_efforts.filter((value): value is string => typeof value === 'string')
      : undefined
    const controllable = effortParams.has('reasoning_effort')
    if (controllable || reasoningMeta.mandatory === true) {
      reasoning = {
        controllable,
        ...(reasoningMeta.mandatory === true ? { mandatory: true } : {}),
        ...(reasoningMeta.default_enabled === true ? { defaultEnabled: true } : {}),
        ...(supportedEfforts !== undefined ? { supportedEfforts } : {}),
        ...(nonEmptyString(reasoningMeta.default_effort) !== undefined
          ? { defaultEffort: nonEmptyString(reasoningMeta.default_effort) }
          : {}),
      }
    }
  }

  return {
    id,
    ...(nonEmptyString(raw.name) !== undefined ? { name: nonEmptyString(raw.name) } : {}),
    ...(positiveNumber(raw.context_length) !== undefined ? { contextWindow: positiveNumber(raw.context_length) } : {}),
    ...(reasoning !== undefined ? { reasoning } : {}),
    ...(inputModalities.includes('image') ? { input: ['text', 'image'] as Array<'text' | 'image'> } : {}),
  }
}

/** Parse the listing payload into free chat models, sorted for stable diffs. */
export function parseFreeModels(payload: unknown): NousPortalModel[] {
  const entries = isRecord(payload) && Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : []
  const models: NousPortalModel[] = []
  const seen = new Set<string>()
  for (const raw of entries) {
    const model = parseListModel(raw)
    if (model === undefined || seen.has(model.id)) continue
    seen.add(model.id)
    models.push(model)
  }
  return models.sort((a, b) => a.id.localeCompare(b.id))
}

/** Fetch the live listing and derive the free catalog from it. */
export async function fetchFreeModels(
  url: string = DEFAULT_MODELS_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<NousPortalModel[]> {
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    throw new Error(`Nous models endpoint answered HTTP ${response.status}`)
  }
  return parseFreeModels(await response.json())
}
