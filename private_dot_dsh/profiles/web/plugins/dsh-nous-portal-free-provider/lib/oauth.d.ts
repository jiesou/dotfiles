/**
 * Nous Portal OAuth protocol: device-code login and token refresh.
 *
 * The Portal issues inference credentials through a two-step lifecycle: a
 * long-lived refresh token obtained once via the OAuth device-code flow, and
 * a short-lived "invoke JWT" access token that is itself the inference key —
 * the dedicated agent-key minting endpoint has been retired server-side.
 * This module is transport-only — no cordis imports — so both the
 * authorization flow and the adapter's credential resolution share it.
 *
 * Wire facts (mirrored from the Portal's own client, `hermes-cli`):
 * - `POST {portal}/api/oauth/device/code`  body `client_id`, `scope`
 * - `POST {portal}/api/oauth/token`        grant device_code / refresh_token
 *
 * @module nous-portal-free-provider/oauth
 */
export declare const DEFAULT_PORTAL_URL = "https://portal.nousresearch.com";
/** The Portal's own first-party client id; the free tier gates on it. */
export declare const DEFAULT_CLIENT_ID = "hermes-cli";
/** Scope whose invoke JWTs the inference API accepts as bearer keys. */
export declare const DEFAULT_SCOPE = "inference:invoke";
export declare const DEFAULT_INFERENCE_URL = "https://inference-api.nousresearch.com/v1";
/** Public, unauthenticated free-catalog listing. */
export declare const DEFAULT_MODELS_URL = "https://inference-api.nousresearch.com/v1/models";
/**
 * The grant payload this plugin stores as a credentials-service record
 * (`GrantRecord.payload`). Opaque to the seam; only this plugin reads it.
 */
export interface NousPortalGrant {
    refreshToken: string;
    portalUrl?: string;
    clientId?: string;
    scope?: string;
    /** Inference base URL the Portal named in its last token response. */
    inferenceBaseUrl?: string;
}
export interface DeviceCodeChallenge {
    verificationUrl: string;
    userCode: string;
    expiresInSeconds: number;
    intervalMs: number;
    /** Internal handle the token poll replays. */
    deviceCode: string;
}
interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
    inference_base_url?: string;
}
/** Step 1 of the device-code flow: ask the Portal for a verification URL + code. */
export declare function requestDeviceCode(options?: {
    portalUrl?: string;
    clientId?: string;
    scope?: string;
    signal?: AbortSignal;
}): Promise<DeviceCodeChallenge>;
/** Step 2: poll the token endpoint until the human approves (or the code expires). */
export declare function pollForToken(challenge: DeviceCodeChallenge, options?: {
    portalUrl?: string;
    clientId?: string;
    signal?: AbortSignal;
    onPending?: () => void;
    sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}): Promise<TokenResponse>;
/** Run one interactive login and shape its tokens into a storable grant. */
export declare function deviceCodeLogin(options?: {
    portalUrl?: string;
    clientId?: string;
    scope?: string;
    signal?: AbortSignal;
    onChallenge?: (challenge: DeviceCodeChallenge) => void;
    onPending?: () => void;
    sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}): Promise<NousPortalGrant>;
/**
 * One refresh against the Portal token endpoint. Transport-only. The caller is
 * responsible for persisting any rotated refresh token under the credential
 * seam's `modifyRecord` lock — see {@link RefreshedCredential}.
 */
export declare function refreshAccessToken(grant: NousPortalGrant, signal?: AbortSignal): Promise<TokenResponse>;
/**
 * Result of one refresh. The rotated refresh token is reported but the caller
 * is the owner of durable storage: it must write the rotated token back inside
 * the credentials seam's `modifyRecord` lock, so a second process can never
 * replay the same single-use refresh token (Portal revokes the whole session
 * on reuse).
 */
export interface RefreshedCredential {
    accessToken: string;
    accessTokenExpiresAt: number;
    inferenceBaseUrl?: string;
    /** New refresh token the Portal rotated in; the caller has already persisted it. */
    rotatedRefreshToken?: string;
}
export interface InferenceCredential {
    apiKey: string;
    inferenceBaseUrl: string;
}
/**
 * Resolves fresh inference credentials from the stored Portal grant, caching
 * the access token in memory and single-flighting concurrent resolutions
 * within one process. Portal rotates the refresh token on every refresh and
 * revokes the session on reuse, so the read→POST→write cycle is delegated to
 * the caller's `refreshGrant` (run inside the credentials seam's record lock)
 * rather than done here. Access tokens stay in memory only.
 */
export declare class NousTokenManager {
    private readonly options;
    private cached;
    private inflight;
    constructor(options: {
        /** Read the current stored grant; undefined means nothing is configured. */
        resolveGrant: () => Promise<NousPortalGrant | undefined>;
        /**
         * Refresh `grant` and persist any rotated refresh token atomically under
         * the credentials seam's record lock, returning the fresh access token and
         * the rotated refresh token actually written. Receiving the rotated token
         * means another process already advanced the stored grant — adopt it.
         */
        refreshGrant: (grant: NousPortalGrant, signal?: AbortSignal) => Promise<RefreshedCredential>;
    });
    /**
     * Return a usable inference credential — the invoke JWT access token and
     * the endpoint to present it to — refreshing it as needed. Throws with an
     * actionable message when no grant exists or the Portal refuses it.
     */
    getInferenceCredential(signal?: AbortSignal): Promise<InferenceCredential>;
    private resolve;
    private accessExpired;
}
export {};
