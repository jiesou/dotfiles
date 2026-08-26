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
import type { Context } from '@deepseek-ai/cordis';
export { DEFAULT_CLIENT_ID, DEFAULT_INFERENCE_URL, DEFAULT_PORTAL_URL, DEFAULT_SCOPE } from './oauth.js';
export { deviceCodeLogin, NousTokenManager, pollForToken, requestDeviceCode } from './oauth.js';
export type { DeviceCodeChallenge, InferenceCredential, NousPortalGrant } from './oauth.js';
export { fetchFreeModels, parseFreeModels } from './models.js';
export type { NousPortalModel } from './models.js';
export declare const name = "nous-portal-free-provider";
export declare const inject: string[];
export declare function apply(ctx: Context): Promise<void>;
