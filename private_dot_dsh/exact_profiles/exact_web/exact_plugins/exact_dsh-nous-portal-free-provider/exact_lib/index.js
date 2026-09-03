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
 * @module nous-portal-free-provider
 */
import { assertUsableApiKey, errorChain, resolveRetryPolicy, RetryPolicySchema } from '@deepseek-ai/dsh-llm';
import { PiAiAdapter } from '@deepseek-ai/dsh-llm-pi-ai';
import { credentialKey, credentialRef } from '@deepseek-ai/dsh-credentials';
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment';
import { createProvider, } from '@earendil-works/pi-ai';
import { stream as openAiStream, streamSimple as openAiStreamSimple } from '@earendil-works/pi-ai/api/openai-completions';
import z from '@deepseek-ai/schemastery';
import { deepEqualJson, installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings';
import { DEFAULT_INFERENCE_URL, DEFAULT_MODELS_URL, DEFAULT_PORTAL_URL, deviceCodeLogin, NousTokenManager, refreshAccessToken } from './oauth.js';
import { fetchFreeModels } from './models.js';
export { DEFAULT_CLIENT_ID, DEFAULT_INFERENCE_URL, DEFAULT_PORTAL_URL, DEFAULT_SCOPE } from './oauth.js';
export { deviceCodeLogin, NousTokenManager, pollForToken, requestDeviceCode } from './oauth.js';
export { fetchFreeModels, parseFreeModels } from './models.js';
export const name = 'nous-portal-free-provider';
export const inject = ['llm', 'settings'];
const PROVIDER = 'nous-portal';
const DISPLAY_NAME = 'Nous Portal Free';
/** The one credential record this plugin owns: `<scope>/portal`. */
const RECORD_KEY = credentialKey(name, 'portal');
const DEFAULT_API_KEY_ENV = 'NOUS_PORTAL_API_KEY';
/** Settings section this plugin owns; its only key is the retry policy. */
const NS = settingsNamespace(name);
export const Config = z.object({
    retryPolicy: RetryPolicySchema.default({ mode: 'always' }),
});
/** pi-ai's standard ladder keys (off = explicit close; the rest are depths). */
const PI_LEVEL_KEYS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
// Free-tier refusals ("OpenRouter free models are not supported", ended
// promotions) arrive as HTTP 401/403, which the harness classifies as AUTH and
// masks as "API key is invalid". Rewriting the envelope to
// `[nous-portal <type>] <message>` gets the real reason past that
// classification; genuine auth envelopes and unparseable text pass through.
const AUTH_ERROR_TYPES = new Set(['AuthError', 'authentication_error', 'invalid_api_key', 'unauthorized']);
const rewriteRefusalMessage = (errorMessage) => {
    const start = errorMessage.indexOf('{');
    const end = errorMessage.lastIndexOf('}');
    if (start < 0 || end <= start)
        return errorMessage;
    let parsed;
    try {
        parsed = JSON.parse(errorMessage.slice(start, end + 1));
    }
    catch {
        return errorMessage;
    }
    if (!isRecord(parsed))
        return errorMessage;
    // Accept both the raw envelope (`{"type":"error","error":{…}}`) and the
    // SDK-unwrapped inner object (`{"type":"ModelError","message":"…"}`).
    const detail = parsed.type === 'error' && isRecord(parsed.error) ? parsed.error : parsed;
    const message = [detail.message, isRecord(detail.error) ? detail.error.message : undefined, detail.detail]
        .find((value) => typeof value === 'string');
    if (message === undefined)
        return errorMessage;
    const type = typeof detail.type === 'string' ? detail.type : 'Error';
    const code = typeof detail.code === 'string' ? detail.code : '';
    if (AUTH_ERROR_TYPES.has(type) || AUTH_ERROR_TYPES.has(code))
        return errorMessage;
    // Dropping the status prefix is what defeats the AUTH classifier.
    return `[nous-portal ${type}] ${message}`;
};
// Required by the adapter, unused by this route: the credential comes from
// `resolveApiKey`, so pi-ai never stores one nor asks an ambient question.
const PI_AUTH = {
    credentials: {
        read: async () => undefined,
        list: async () => [],
        modify: async (_providerId, mutate) => mutate(undefined),
        delete: async () => { },
    },
    authContext: { env: async () => undefined, fileExists: async () => false },
};
const sanitizeStream = (stream) => {
    const originalPush = stream.push.bind(stream);
    stream.push = (event) => {
        if (isRecord(event) && event.type === 'error' && isRecord(event.error) && typeof event.error.errorMessage === 'string') {
            event.error.errorMessage = rewriteRefusalMessage(event.error.errorMessage);
        }
        originalPush(event);
    };
    return stream;
};
// Replayed thinking blocks carry no wire signature; marking them
// `reasoning_content` keeps the transport from mangling history. Never gated on
// `model.reasoning`: a model with no effort control still streams thinking.
const normalizeReasoningContext = (context) => ({
    ...context,
    messages: context.messages.map(message => message.role !== 'assistant' ? message : {
        ...message,
        content: message.content.map(block => block.type === 'thinking' && block.thinking.trim().length > 0 && block.thinkingSignature === undefined
            ? { ...block, thinkingSignature: 'reasoning_content' }
            : block),
    }),
});
// Only the endpoint's own effort parameter makes a ladder real: a model that
// thinks unconditionally, or names no ladder effort, declares no level here —
// an honest "no effort control" rather than a fabricated ladder.
function reasoningLevelsFor(reasoning) {
    if (reasoning === undefined || !reasoning.controllable)
        return [];
    return reasoning.supportedEfforts ?? [];
}
// `Default` (the harness's "no selection" path) is the *absent key* — leaving
// `reasoning_effort` off the wire and letting the upstream choose. Each ladder
// level the endpoint accepts lands at its own key with its own wire value; the
// `off` key carries the upstream's literal close value when the feed names one
// (e.g. `none`), so the selector's "Off" entry is a real switch rather than a
// no-op. Mandatory models omit the `off` key entirely — the harness then has
// no way to disable thinking.
function reasoningMapFor(levels, mandatory) {
    const map = {};
    for (const key of PI_LEVEL_KEYS) {
        if (levels.includes(key))
            map[key] = key;
    }
    if (!mandatory) {
        const closeValue = levels.includes('none') ? 'none' : 'off';
        map.off = closeValue;
    }
    return map;
}
/** Turn the live-scanned free listing into pi-ai model descriptors. */
function buildModels(scanned) {
    return scanned.map(entry => {
        const levels = reasoningLevelsFor(entry.reasoning);
        const mandatory = entry.reasoning?.mandatory;
        const controllable = levels.length > 0;
        return {
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
            reasoning: controllable || mandatory === true,
            ...(controllable ? { thinkingLevelMap: reasoningMapFor(levels, mandatory) } : {}),
            input: entry.input ?? ['text'],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: entry.contextWindow ?? 262_144,
            maxTokens: entry.maxTokens ?? 32_768,
        };
    });
}
/** Narrow a stored record to this plugin's grant payload. */
function grantOf(record) {
    if (!isRecord(record) || record.kind !== 'grant')
        return undefined;
    const payload = record.payload;
    if (!isRecord(payload) || typeof payload.refreshToken !== 'string' || payload.refreshToken.length === 0)
        return undefined;
    return payload;
}
export async function apply(ctx, config) {
    const apiKeyRefName = DEFAULT_API_KEY_ENV;
    /** Resolve one named secret through the credentials service, then ambient env. */
    const resolveSecretValue = async (envName) => {
        const credentials = ctx.get('credentials');
        if (credentials !== undefined) {
            const hit = await credentials.resolve(credentialRef(envName));
            if (hit !== undefined && hit.value.trim().length > 0)
                return hit.value.trim();
        }
        const ambient = launchEnvironmentOf(ctx).get(envName);
        if (ambient !== undefined && ambient.value.trim().length > 0)
            return ambient.value.trim();
        return undefined;
    };
    const tokenManager = new NousTokenManager({
        resolveGrant: async () => {
            const credentials = ctx.get('credentials');
            if (credentials === undefined)
                return undefined;
            return grantOf(await credentials.readRecord(RECORD_KEY));
        },
        // Run the whole read→POST→write cycle inside modifyRecord so no second
        // process can replay the same single-use refresh token (Portal revokes the
        // session on reuse). Always refresh against whatever refresh token is
        // currently on disk — if another process already rotated it, we advance
        // from the newest one instead of re-presenting a consumed token.
        refreshGrant: async (grant, signal) => {
            const credentials = ctx.get('credentials');
            if (credentials === undefined) {
                throw new Error('nous-portal: no credentials service to refresh the grant with');
            }
            let tokens;
            const record = await credentials.modifyRecord(RECORD_KEY, async (currentRecord) => {
                const current = grantOf(currentRecord);
                if (current === undefined)
                    return currentRecord;
                const used = current.refreshToken;
                tokens = await refreshAccessToken(current, signal);
                const rotated = typeof tokens.refresh_token === 'string' && tokens.refresh_token.length > 0
                    && tokens.refresh_token !== used
                    ? tokens.refresh_token
                    : undefined;
                const inferenceBaseUrl = typeof tokens.inference_base_url === 'string' && tokens.inference_base_url.length > 0
                    ? tokens.inference_base_url.replace(/\/+$/, '')
                    : current.inferenceBaseUrl;
                return {
                    kind: 'grant',
                    payload: { ...current, ...(rotated !== undefined ? { refreshToken: rotated } : {}), ...(inferenceBaseUrl !== undefined ? { inferenceBaseUrl } : {}) },
                };
            });
            const refreshed = tokens;
            if (refreshed === undefined) {
                // modifyRecord left the record untouched (no stored grant): not signed in,
                // or another process advanced it while we waited — adopt its token.
                const stored = grantOf(record);
                if (stored === undefined) {
                    throw new Error('nous-portal: not signed in. Open the dsh authorization page and run the'
                        + ' "Nous Portal Free" sign-in flow (or store NOUS_PORTAL_API_KEY for a funded account)');
                }
                const rotated = stored.refreshToken !== grant.refreshToken ? stored.refreshToken : undefined;
                return {
                    accessToken: '',
                    accessTokenExpiresAt: 0,
                    ...(stored.inferenceBaseUrl !== undefined ? { inferenceBaseUrl: stored.inferenceBaseUrl } : {}),
                    ...(rotated !== undefined ? { rotatedRefreshToken: rotated } : {}),
                };
            }
            return {
                accessToken: refreshed.access_token,
                accessTokenExpiresAt: Date.now() + (refreshed.expires_in ?? 900) * 1_000,
                ...(typeof refreshed.inference_base_url === 'string' && refreshed.inference_base_url.length > 0
                    ? { inferenceBaseUrl: refreshed.inference_base_url.replace(/\/+$/, '') }
                    : {}),
            };
        },
    });
    // PiAiAuthInjection: what every collection this adapter builds resolves
    // ambient auth through. Our route authenticates via apiKey resolution alone,
    // so a minimal no-store implementation suffices; env/file answers mirror the
    // official llm-pi-ai plugin's wiring over the harness credential plane.
    // The listing is public and rotates, so the scanned catalog lives outside the
    // settings-backed config; profiles() reads the merged view. Mount succeeds with
    // an empty catalog and the first refresh fills it, so an unreachable upstream
    // never throws and kills the plugin.
    let scanned = [];
    let current = () => config;
    // PiAiAdapter.current() memoizes its snapshot by the identity of the Map this
    // returns, rebuilding the whole pi-ai collection on every change — so hand
    // back the same instance until the config or the scanned catalog actually
    // changes .
    const buildProfiles = () => {
        const opts = current();
        const piProvider = createProvider({
            id: PROVIDER,
            name: DISPLAY_NAME,
            baseUrl: DEFAULT_INFERENCE_URL,
            auth: {
                apiKey: {
                    name: 'NousPortalFree',
                    resolve: async ({ credential }) => {
                        // A stored plain sk- key wins (funded / pay-as-you-go accounts).
                        if (credential?.key !== undefined && credential.key.length > 0) {
                            return { auth: { apiKey: credential.key }, source: 'NousPortalFree' };
                        }
                        const plainKey = await resolveSecretValue(apiKeyRefName);
                        if (plainKey !== undefined) {
                            return { auth: { apiKey: plainKey }, source: 'NousPortalFree' };
                        }
                        const { apiKey, inferenceBaseUrl } = await tokenManager.getInferenceCredential();
                        return {
                            auth: {
                                apiKey,
                                ...(inferenceBaseUrl !== undefined ? { baseUrl: inferenceBaseUrl } : {}),
                            },
                            source: 'NousPortalFree OAuth',
                        };
                    },
                },
            },
            models: buildModels(scanned),
            api: {
                stream: (model, context, options) => sanitizeStream(openAiStream(model, normalizeReasoningContext(context), options)),
                streamSimple: (model, context, options) => sanitizeStream(openAiStreamSimple(model, normalizeReasoningContext(context), options)),
            },
        });
        const profiles = new Map([[PROVIDER, {
                    provider: PROVIDER,
                    displayName: DISPLAY_NAME,
                    apiKeyEnv: credentialRef(apiKeyRefName),
                    streamIdleTimeoutMs: 300_000,
                    maxRequestImageBytes: 20 * 1_048_576,
                    requestImagePixelBudget: 4_194_304,
                    requestImageMaxBytes: 1_048_576,
                    retryPolicy: resolveRetryPolicy(opts.retryPolicy, `${name}: retryPolicy`),
                    piProvider,
                    configuredMaxTokens: new Map(),
                }]]);
        return profiles;
    };
    // PiAiAdapter memoizes its snapshot on the identity of the Map this hands
    // back, so a fresh Map per request would rebuild the whole pi-ai collection:
    // hold one and rebuild it only when the config or the scanned catalog changes.
    let profiles = buildProfiles();
    const adapter = new PiAiAdapter({
        resolveAttachments: () => ctx.get('attachments'),
        auth: PI_AUTH,
        profiles: () => profiles,
        resolveApiKey: async (_provider, profile) => {
            const credentials = ctx.get('credentials');
            if (credentials !== undefined) {
                const hit = await credentials.resolve(profile.apiKeyEnv);
                if (hit !== undefined && hit.value.trim().length > 0) {
                    return assertUsableApiKey(hit.value, name, String(profile.apiKeyEnv));
                }
            }
            const ambientKey = await resolveSecretValue(apiKeyRefName);
            if (ambientKey !== undefined)
                return assertUsableApiKey(ambientKey, name, apiKeyRefName);
            // OAuth path: use the stored grant's invoke JWT as the inference key.
            const { apiKey } = await tokenManager.getInferenceCredential();
            return apiKey;
        },
    });
    ctx.llm.registerConfigurableProviders([{ provider: PROVIDER, displayName: DISPLAY_NAME, settingsNs: NS, settingsPath: [] }]);
    ctx.llm.registerAdapter([PROVIDER], adapter);
    installSettingsSection(ctx, NS, Config, config, {
        setSource: (source) => {
            current = source;
        },
        onChange: () => {
            profiles = buildProfiles();
        },
    });
    async function sync() {
        const entries = await fetchFreeModels(DEFAULT_MODELS_URL);
        if (entries.length === 0) {
            throw new Error('no $0 models found in the live listing; keeping the previous catalog');
        }
        if (deepEqualJson(entries, scanned))
            return;
        scanned = entries;
        profiles = buildProfiles();
        ctx.logger.info('[%s] synced %d free model(s): %s', name, entries.length, entries.map(entry => entry.id).join(', '));
    }
    void sync().catch((error) => {
        ctx.logger.warn('[%s] initial catalog scan failed: %s', name, errorChain(error));
    });
    // The sign-in flow: rendered by every authorization surface (webui page,
    // CLI) exactly like the built-in pi-ai provider flows. Running it walks the
    // device-code dance and commits the grant through the credentials seam —
    // the confirmation of that commit is what reports success.
    const authorization = ctx.get('authorization');
    if (authorization !== undefined) {
        const disposeFlow = authorization.registerFlow({
            key: RECORD_KEY,
            label: DISPLAY_NAME,
            methods: [{ id: 'oauth', label: 'Sign in with Nous Portal' }],
            async run(session) {
                const credentials = ctx.get('credentials');
                if (credentials === undefined) {
                    throw new Error('nous-portal: no credentials service to store the grant in');
                }
                session.notify({ message: 'Starting Nous Portal sign-in…' });
                const grant = await deviceCodeLogin({
                    portalUrl: DEFAULT_PORTAL_URL,
                    signal: session.signal,
                    onChallenge: (value) => {
                        session.notify({
                            message: 'Open this page and approve the sign-in.',
                            url: value.verificationUrl,
                            ...(value.userCode.length > 0 ? { code: value.userCode } : {}),
                        });
                    },
                });
                // Committing inside the attempt is what the seam confirms before it
                // reports `authorized`.
                await credentials.modifyRecord(RECORD_KEY, async () => ({ kind: 'grant', payload: grant }));
                session.notify({ message: 'Nous Portal sign-in complete.' });
            },
        });
        ctx.effect(() => disposeFlow);
    }
}
