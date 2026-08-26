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
    controllable: boolean;
    /** Thinking cannot be turned off on this model. */
    mandatory?: boolean;
    /** Thinking is enabled by default. */
    defaultEnabled?: boolean;
    /** Effort ids the endpoint accepts, verbatim from the feed (may include ids outside the harness ladder). */
    supportedEfforts?: string[];
    /** Effort applied when a request names none. */
    defaultEffort?: string;
}
/** One discovered free model, in adapter-ready shape. */
export interface NousPortalModel {
    /** Wire model id accepted by the inference API. */
    id: string;
    /** Selector label; defaults to {@link id}. */
    name?: string;
    /** Combined request/response context capacity, when disclosed. */
    contextWindow?: number;
    /** Per-request output cap, when known. */
    maxTokens?: number;
    /** Reasoning metadata; absent for non-reasoning models. */
    reasoning?: NousPortalReasoning;
    /** Request modalities beyond text, when the architecture declares them. */
    input?: Array<'text' | 'image'>;
}
/** Parse one listing entry into an adapter model; undefined when unusable. */
export declare function parseListModel(raw: unknown): NousPortalModel | undefined;
/** Parse the listing payload into free chat models, sorted for stable diffs. */
export declare function parseFreeModels(payload: unknown): NousPortalModel[];
/** Fetch the live listing and derive the free catalog from it. */
export declare function fetchFreeModels(url?: string, fetchImpl?: typeof fetch): Promise<NousPortalModel[]>;
