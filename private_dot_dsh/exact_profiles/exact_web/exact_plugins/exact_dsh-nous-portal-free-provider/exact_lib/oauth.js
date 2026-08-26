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
export const DEFAULT_PORTAL_URL = 'https://portal.nousresearch.com';
/** The Portal's own first-party client id; the free tier gates on it. */
export const DEFAULT_CLIENT_ID = 'hermes-cli';
/** Scope whose invoke JWTs the inference API accepts as bearer keys. */
export const DEFAULT_SCOPE = 'inference:invoke';
export const DEFAULT_INFERENCE_URL = 'https://inference-api.nousresearch.com/v1';
/** Public, unauthenticated free-catalog listing. */
export const DEFAULT_MODELS_URL = 'https://inference-api.nousresearch.com/v1/models';
const DEVICE_PATH = '/api/oauth/device/code';
const TOKEN_PATH = '/api/oauth/token';
const POLL_INTERVAL_CAP_MS = 5_000;
/** Refresh the access token this long before its stated expiry. */
const ACCESS_REFRESH_SKEW_MS = 120_000;
const formHeaders = { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' };
function form(body) {
    return new URLSearchParams(body).toString();
}
async function readError(response) {
    const text = await response.text().catch(() => '');
    try {
        const parsed = JSON.parse(text);
        if (typeof parsed.error_description === 'string')
            return parsed.error_description;
        if (typeof parsed.message === 'string')
            return parsed.message;
        if (typeof parsed.error === 'string')
            return parsed.error;
    }
    catch {
        // fall through to the raw body
    }
    return text.length > 0 ? text : `HTTP ${response.status}`;
}
/** Step 1 of the device-code flow: ask the Portal for a verification URL + code. */
export async function requestDeviceCode(options = {}) {
    const portalUrl = (options.portalUrl ?? DEFAULT_PORTAL_URL).replace(/\/+$/, '');
    const response = await fetch(`${portalUrl}${DEVICE_PATH}`, {
        method: 'POST',
        headers: formHeaders,
        body: form({
            client_id: options.clientId ?? DEFAULT_CLIENT_ID,
            scope: options.scope ?? DEFAULT_SCOPE,
        }),
        signal: options.signal,
    });
    if (!response.ok) {
        throw new Error(`Nous Portal device-code request failed: ${await readError(response)}`);
    }
    const data = await response.json();
    const verificationUrl = data.verification_uri_complete ?? data.verification_uri;
    const deviceCode = data.device_code;
    if (typeof verificationUrl !== 'string' || typeof deviceCode !== 'string') {
        throw new Error('Nous Portal device-code response missing verification URL or device code');
    }
    const intervalSeconds = typeof data.interval === 'number' && data.interval > 0 ? data.interval : 5;
    return {
        verificationUrl,
        userCode: typeof data.user_code === 'string' ? data.user_code : '',
        expiresInSeconds: typeof data.expires_in === 'number' ? data.expires_in : 600,
        intervalMs: Math.min(intervalSeconds * 1_000, POLL_INTERVAL_CAP_MS),
        deviceCode,
    };
}
/** Step 2: poll the token endpoint until the human approves (or the code expires). */
export async function pollForToken(challenge, options = {}) {
    const portalUrl = (options.portalUrl ?? DEFAULT_PORTAL_URL).replace(/\/+$/, '');
    const clientId = options.clientId ?? DEFAULT_CLIENT_ID;
    const sleep = options.sleep ?? ((ms, signal) => new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(signal.reason instanceof Error ? signal.reason : new Error('aborted'));
        }, { once: true });
    }));
    const deadline = Date.now() + challenge.expiresInSeconds * 1_000;
    let waitMs = challenge.intervalMs;
    while (Date.now() < deadline) {
        if (options.signal?.aborted) {
            throw options.signal.reason instanceof Error ? options.signal.reason : new Error('aborted');
        }
        const response = await fetch(`${portalUrl}${TOKEN_PATH}`, {
            method: 'POST',
            headers: formHeaders,
            body: form({
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                client_id: clientId,
                device_code: challenge.deviceCode,
            }),
            signal: options.signal,
        });
        if (response.ok)
            return await response.json();
        const detail = await readError(response);
        // The Portal answers with the RFC code (`authorization_pending`) in `error`
        // but prose ("Authorization is still pending") in `error_description`, and
        // readError prefers the latter; match either spelling.
        const kind = detail.trim().toLowerCase();
        if (kind === 'authorization_pending' || kind.endsWith('pending')) {
            options.onPending?.();
        }
        else if (kind === 'slow_down' || kind.startsWith('slow')) {
            waitMs = Math.min(waitMs + 5_000, 30_000);
        }
        else {
            throw new Error(`Nous Portal device approval failed: ${detail}`);
        }
        await sleep(waitMs, options.signal);
    }
    throw new Error('Nous Portal device code expired before approval');
}
/** Run one interactive login and shape its tokens into a storable grant. */
export async function deviceCodeLogin(options = {}) {
    const challenge = await requestDeviceCode(options);
    options.onChallenge?.(challenge);
    const tokens = await pollForToken(challenge, options);
    if (typeof tokens.refresh_token !== 'string' || tokens.refresh_token.length === 0) {
        throw new Error('Nous Portal token response carried no refresh_token');
    }
    return {
        refreshToken: tokens.refresh_token,
        portalUrl: (options.portalUrl ?? DEFAULT_PORTAL_URL).replace(/\/+$/, ''),
        clientId: options.clientId ?? DEFAULT_CLIENT_ID,
        scope: options.scope ?? DEFAULT_SCOPE,
        ...(typeof tokens.inference_base_url === 'string' && tokens.inference_base_url.length > 0
            ? { inferenceBaseUrl: tokens.inference_base_url.replace(/\/+$/, '') }
            : {}),
    };
}
/**
 * One refresh against the Portal token endpoint. Transport-only. The caller is
 * responsible for persisting any rotated refresh token under the credential
 * seam's `modifyRecord` lock — see {@link RefreshedCredential}.
 */
export async function refreshAccessToken(grant, signal) {
    const portalUrl = (grant.portalUrl ?? DEFAULT_PORTAL_URL).replace(/\/+$/, '');
    const response = await fetch(`${portalUrl}${TOKEN_PATH}`, {
        method: 'POST',
        headers: formHeaders,
        body: form({
            grant_type: 'refresh_token',
            client_id: grant.clientId ?? DEFAULT_CLIENT_ID,
            refresh_token: grant.refreshToken,
        }),
        signal,
    });
    if (!response.ok) {
        throw new Error(`Nous Portal token refresh failed (${await readError(response)}); sign in again`);
    }
    return await response.json();
}
/**
 * Resolves fresh inference credentials from the stored Portal grant, caching
 * the access token in memory and single-flighting concurrent resolutions
 * within one process. Portal rotates the refresh token on every refresh and
 * revokes the session on reuse, so the read→POST→write cycle is delegated to
 * the caller's `refreshGrant` (run inside the credentials seam's record lock)
 * rather than done here. Access tokens stay in memory only.
 */
export class NousTokenManager {
    options;
    cached;
    inflight;
    constructor(options) {
        this.options = options;
    }
    /**
     * Return a usable inference credential — the invoke JWT access token and
     * the endpoint to present it to — refreshing it as needed. Throws with an
     * actionable message when no grant exists or the Portal refuses it.
     */
    async getInferenceCredential(signal) {
        this.inflight ??= this.resolve(signal).finally(() => {
            this.inflight = undefined;
        });
        return this.inflight;
    }
    async resolve(signal) {
        const grant = await this.options.resolveGrant();
        if (grant === undefined || grant.refreshToken.length === 0) {
            throw new Error('nous-portal: not signed in. Open the dsh authorization page and run the'
                + ' "Nous Portal Free" sign-in flow (or store NOUS_PORTAL_API_KEY for a funded account)');
        }
        let entry = this.cached?.seedToken === grant.refreshToken ? this.cached : undefined;
        if (entry === undefined)
            entry = { seedToken: grant.refreshToken, grant };
        if (this.accessExpired(entry)) {
            const refreshed = await this.options.refreshGrant(grant, signal);
            entry.accessToken = refreshed.accessToken;
            entry.accessTokenExpiresAt = refreshed.accessTokenExpiresAt;
            entry.grant = {
                ...entry.grant,
                ...(refreshed.inferenceBaseUrl !== undefined ? { inferenceBaseUrl: refreshed.inferenceBaseUrl } : {}),
                ...(refreshed.rotatedRefreshToken !== undefined ? { refreshToken: refreshed.rotatedRefreshToken } : {}),
            };
            // Adopt whatever refresh token the caller wrote — it may be a newer one
            // another process already rotated in, in which case we follow it.
            entry.seedToken = entry.grant.refreshToken;
            this.cached = entry;
        }
        // The access token IS the inference key (invoke JWT); no separate mint.
        return { apiKey: entry.accessToken, inferenceBaseUrl: entry.grant.inferenceBaseUrl ?? DEFAULT_INFERENCE_URL };
    }
    accessExpired(entry) {
        return entry.accessToken === undefined
            || entry.accessTokenExpiresAt === undefined
            || entry.accessTokenExpiresAt <= Date.now() + ACCESS_REFRESH_SKEW_MS;
    }
}
