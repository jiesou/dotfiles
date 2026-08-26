// Cloned from @earendil-works/pi-ai (OpenAI completions transport).
// Source (version-pinned to match the cloned logic):
//   https://raw.githubusercontent.com/earendil-works/pi-ai/v0.84.2/src/api/openai-completions.ts
// This file is a near-verbatim copy of pi-agent's openai-completions module.
// The ONLY provider-specific change is `zenFetch` (below): a module-scoped
// fetch passed to the OpenAI client's `new OpenAI({ fetch })` so the opencode
// User-Agent required to unlock the free tier is forced on zen requests.
// No global fetch monkey-patch; the override is scoped to this client only.
import OpenAI from "openai";
import { appendGrammarToolInputJsonDelta, createGrammarToolInputProperties, getGrammarToolInput, resolveGrammarConstrainedSampling, resolveJsonSchemaStrictSampling } from "@earendil-works/pi-ai/api/constrained-sampling";
import { buildCopilotDynamicHeaders, hasCopilotVisionInput } from "@earendil-works/pi-ai/api/github-copilot-headers";
import { clampOpenAIPromptCacheKey } from "@earendil-works/pi-ai/api/openai-prompt-cache";
import { buildBaseOptions } from "@earendil-works/pi-ai/api/simple-options";
import { transformMessages } from "@earendil-works/pi-ai/api/transform-messages";

// ---- inlined dependencies (pi-agent root-level modules, verbatim) ----

// ===== from @earendil-works/pi-ai/utils/event-stream.js =====
// Generic event stream class for async iteration
export class EventStream {
    queue = [];
    waiting = [];
    done = false;
    finalResultPromise;
    resolveFinalResult;
    isComplete;
    extractResult;
    constructor(isComplete, extractResult) {
        this.isComplete = isComplete;
        this.extractResult = extractResult;
        this.finalResultPromise = new Promise((resolve) => {
            this.resolveFinalResult = resolve;
        });
    }
    push(event) {
        if (this.done)
            return;
        if (this.isComplete(event)) {
            this.done = true;
            this.resolveFinalResult(this.extractResult(event));
        }
        // Deliver to waiting consumer or queue it
        const waiter = this.waiting.shift();
        if (waiter) {
            waiter({ value: event, done: false });
        }
        else {
            this.queue.push(event);
        }
    }
    end(result) {
        this.done = true;
        if (result !== undefined) {
            this.resolveFinalResult(result);
        }
        // Notify all waiting consumers that we're done
        while (this.waiting.length > 0) {
            const waiter = this.waiting.shift();
            waiter({ value: undefined, done: true });
        }
    }
    async *[Symbol.asyncIterator]() {
        while (true) {
            if (this.queue.length > 0) {
                yield this.queue.shift();
            }
            else if (this.done) {
                return;
            }
            else {
                const result = await new Promise((resolve) => this.waiting.push(resolve));
                if (result.done)
                    return;
                yield result.value;
            }
        }
    }
    result() {
        return this.finalResultPromise;
    }
}
export class AssistantMessageEventStream extends EventStream {
    constructor() {
        super((event) => event.type === "done" || event.type === "error", (event) => {
            if (event.type === "done") {
                return event.message;
            }
            else if (event.type === "error") {
                return event.error;
            }
            throw new Error("Unexpected event type for final result");
        });
    }
}
/** Factory function for AssistantMessageEventStream (for use in extensions) */
export function createAssistantMessageEventStream() {
    return new AssistantMessageEventStream();
}
//# sourceMappingURL=event-stream.js.map
// ===== from @earendil-works/pi-ai/utils/hash.js =====
/** Fast deterministic hash to shorten long strings */
export function shortHash(str) {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
}
//# sourceMappingURL=hash.js.map
// ===== from @earendil-works/pi-ai/utils/headers.js =====
export function headersToRecord(headers) {
    const result = {};
    for (const [key, value] of headers.entries()) {
        result[key] = value;
    }
    return result;
}
export function providerHeadersToRecord(headers) {
    if (!headers)
        return undefined;
    const result = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value !== null)
            result[key] = value;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
//# sourceMappingURL=headers.js.map
// ===== from @earendil-works/pi-ai/utils/json-parse.js =====
import { parse as partialParse } from "partial-json";
const VALID_JSON_ESCAPES = new Set(['"', "\\", "/", "b", "f", "n", "r", "t", "u"]);
function isControlCharacter(char) {
    const codePoint = char.codePointAt(0);
    return codePoint !== undefined && codePoint >= 0x00 && codePoint <= 0x1f;
}
function escapeControlCharacter(char) {
    switch (char) {
        case "\b":
            return "\\b";
        case "\f":
            return "\\f";
        case "\n":
            return "\\n";
        case "\r":
            return "\\r";
        case "\t":
            return "\\t";
        default:
            return `\\u${char.codePointAt(0)?.toString(16).padStart(4, "0") ?? "0000"}`;
    }
}
/**
 * Repairs malformed JSON string literals by:
 * - escaping raw control characters inside strings
 * - doubling backslashes before invalid escape characters
 */
export function repairJson(json) {
    let repaired = "";
    let inString = false;
    for (let index = 0; index < json.length; index++) {
        const char = json[index];
        if (!inString) {
            repaired += char;
            if (char === '"') {
                inString = true;
            }
            continue;
        }
        if (char === '"') {
            repaired += char;
            inString = false;
            continue;
        }
        if (char === "\\") {
            const nextChar = json[index + 1];
            if (nextChar === undefined) {
                repaired += "\\\\";
                continue;
            }
            if (nextChar === "u") {
                const unicodeDigits = json.slice(index + 2, index + 6);
                if (/^[0-9a-fA-F]{4}$/.test(unicodeDigits)) {
                    repaired += `\\u${unicodeDigits}`;
                    index += 5;
                    continue;
                }
            }
            if (VALID_JSON_ESCAPES.has(nextChar)) {
                repaired += `\\${nextChar}`;
                index += 1;
                continue;
            }
            repaired += "\\\\";
            continue;
        }
        repaired += isControlCharacter(char) ? escapeControlCharacter(char) : char;
    }
    return repaired;
}
export function parseJsonWithRepair(json) {
    try {
        return JSON.parse(json);
    }
    catch (error) {
        const repairedJson = repairJson(json);
        if (repairedJson !== json) {
            return JSON.parse(repairedJson);
        }
        throw error;
    }
}
/**
 * Attempts to parse potentially incomplete JSON during streaming.
 * Always returns a valid object, even if the JSON is incomplete.
 *
 * @param partialJson The partial JSON string from streaming
 * @returns Parsed object or empty object if parsing fails
 */
export function parseStreamingJson(partialJson) {
    if (!partialJson || partialJson.trim() === "") {
        return {};
    }
    try {
        return parseJsonWithRepair(partialJson);
    }
    catch {
        try {
            const result = partialParse(partialJson);
            return (result ?? {});
        }
        catch {
            try {
                const result = partialParse(repairJson(partialJson));
                return (result ?? {});
            }
            catch {
                return {};
            }
        }
    }
}
//# sourceMappingURL=json-parse.js.map
// ===== from @earendil-works/pi-ai/utils/provider-env.js =====
let procEnvCache = null;
/**
 * Fallback for https://github.com/oven-sh/bun/issues/27802.
 * Bun compiled binaries can expose an empty process.env inside Linux sandboxes
 * even though /proc/self/environ contains the environment.
 *
 * This intentionally duplicates restoreSandboxEnv() in
 * packages/coding-agent/src/bun/restore-sandbox-env.ts. The ai package can be
 * used directly, without going through that entrypoint, so provider env lookup
 * must not depend on process.env having been patched.
 */
function getBunSandboxEnvValue(name) {
    if (typeof process === "undefined" || !process.versions?.bun || Object.keys(process.env).length > 0) {
        return undefined;
    }
    if (procEnvCache === null) {
        procEnvCache = new Map();
        try {
            const { readFileSync } = require("node:fs");
            const data = readFileSync("/proc/self/environ", "utf-8");
            for (const entry of data.split("\0")) {
                const idx = entry.indexOf("=");
                if (idx > 0) {
                    procEnvCache.set(entry.slice(0, idx), entry.slice(idx + 1));
                }
            }
        }
        catch {
            // /proc/self/environ may not exist or may not be readable.
        }
    }
    return procEnvCache.get(name);
}
/**
 * Resolve a provider env value from scoped overrides, normal process.env, then
 * the duplicated Bun sandbox fallback for direct pi-ai consumers.
 */
export function getProviderEnvValue(name, env) {
    return (env?.[name] ||
        (typeof process !== "undefined" ? process.env[name] : undefined) ||
        getBunSandboxEnvValue(name) ||
        undefined);
}
//# sourceMappingURL=provider-env.js.map
// ===== from @earendil-works/pi-ai/utils/provider-retry.js =====
const DEFAULT_MAX_RETRY_DELAY_MS = 60_000;
function isProviderError(error) {
    if (!(error instanceof Error) || !("status" in error) || !("headers" in error))
        return false;
    return ((error.status === undefined || typeof error.status === "number") &&
        (error.headers === undefined || error.headers instanceof Headers));
}
/** Mirrors the pinned OpenAI/Anthropic SDK retry policy; review when either SDK is upgraded. */
function isRetryableProviderError(error) {
    const shouldRetry = error.headers?.get("x-should-retry");
    if (shouldRetry === "true")
        return true;
    if (shouldRetry === "false")
        return false;
    if (error.status === undefined)
        return true;
    return (error.status === 408 ||
        error.status === 409 ||
        error.status === 429 ||
        (typeof error.status === "number" && error.status >= 500));
}
function validateServerRetryDelayMs(delayMs, maxRetryDelayMs, providerErrorMessage) {
    const maxDelayMs = maxRetryDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS;
    if (maxDelayMs > 0 && delayMs > maxDelayMs) {
        throw new Error(`Server requested ${Math.ceil(delayMs / 1000)}s retry delay (max: ${Math.ceil(maxDelayMs / 1000)}s). ${providerErrorMessage}`);
    }
    return delayMs;
}
function getRetryDelayMs(error, retryIndex, maxRetryDelayMs) {
    const retryAfterMs = error.headers?.get("retry-after-ms");
    if (retryAfterMs) {
        const value = Number.parseFloat(retryAfterMs);
        if (!Number.isNaN(value))
            return validateServerRetryDelayMs(value, maxRetryDelayMs, error.message);
    }
    const retryAfter = error.headers?.get("retry-after");
    if (retryAfter) {
        const seconds = Number.parseFloat(retryAfter);
        const delayMs = Number.isNaN(seconds) ? Date.parse(retryAfter) - Date.now() : seconds * 1000;
        return validateServerRetryDelayMs(delayMs, maxRetryDelayMs, error.message);
    }
    const exponentialDelay = Math.min(0.5 * 2 ** retryIndex, 8) * 1000;
    return exponentialDelay * (1 - Math.random() * 0.25);
}
function createAbortError() {
    const error = new Error("Request aborted");
    error.name = "AbortError";
    return error;
}
function abortableSleep(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(createAbortError());
            return;
        }
        const onAbort = () => {
            clearTimeout(timeout);
            reject(createAbortError());
        };
        const timeout = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, Math.max(0, ms));
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}
/**
 * Reproduce the retry behavior used by the OpenAI and Anthropic SDKs while making
 * their backoff sleep interruptible. Their built-in retry timers ignore the
 * request AbortSignal, so callers must invoke the SDK with `maxRetries: 0` and
 * wrap the request with this helper. Provider-requested delays above
 * `maxRetryDelayMs` fail immediately (60 seconds by default); set it to zero to
 * disable the limit.
 */
export async function retryProviderRequest(request, options = {}) {
    const maxRetries = options.maxRetries ?? 0;
    let retriesRemaining = maxRetries;
    for (;;) {
        try {
            // Each retry is a fresh SDK request, so X-Stainless-Retry-Count remains zero.
            return await request();
        }
        catch (error) {
            if (options.signal?.aborted)
                throw createAbortError();
            if (retriesRemaining <= 0 || !isProviderError(error) || !isRetryableProviderError(error))
                throw error;
            const retryIndex = maxRetries - retriesRemaining;
            retriesRemaining--;
            await abortableSleep(getRetryDelayMs(error, retryIndex, options.maxRetryDelayMs), options.signal);
        }
    }
}
//# sourceMappingURL=provider-retry.js.map
// ===== from @earendil-works/pi-ai/utils/sanitize-unicode.js =====
/**
 * Removes unpaired Unicode surrogate characters from a string.
 *
 * Unpaired surrogates (high surrogates 0xD800-0xDBFF without matching low surrogates 0xDC00-0xDFFF,
 * or vice versa) cause JSON serialization errors in many API providers.
 *
 * Valid emoji and other characters outside the Basic Multilingual Plane use properly paired
 * surrogates and will NOT be affected by this function.
 *
 * @param text - The text to sanitize
 * @returns The sanitized text with unpaired surrogates removed
 *
 * @example
 * // Valid emoji (properly paired surrogates) are preserved
 * sanitizeSurrogates("Hello 🙈 World") // => "Hello 🙈 World"
 *
 * // Unpaired high surrogate is removed
 * const unpaired = String.fromCharCode(0xD83D); // high surrogate without low
 * sanitizeSurrogates(`Text ${unpaired} here`) // => "Text  here"
 */
export function sanitizeSurrogates(text) {
    // Replace unpaired high surrogates (0xD800-0xDBFF not followed by low surrogate)
    // Replace unpaired low surrogates (0xDC00-0xDFFF not preceded by high surrogate)
    return text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}
//# sourceMappingURL=sanitize-unicode.js.map
// ===== from @earendil-works/pi-ai/utils/error-body.js =====
// Shared normalization for provider HTTP error objects.
//
// Endpoints behind a proxy / gateway may return a non-2xx response whose body
// the provider SDK cannot fold into `error.message`. The SDK error object still
// carries the HTTP status and the raw/parsed body, but under SDK-specific field
// names. Provider catch blocks that read only `error.message` therefore drop
// the body and surface opaque messages like `"403 status code (no body)"` or
// collapse to `"Unknown: UnknownError"`.
//
// `normalizeProviderError` probes the known SDK field shapes (Mistral,
// `openai`, `@google/genai`, AWS Bedrock) and returns a struct each provider
// composes into its display string. The `messageCarriesBody` flag captures the
// Anthropic / `@google/genai` happy path where the SDK already folded the body
// into the message, so providers can preserve it without double-printing.
export const MAX_PROVIDER_ERROR_BODY_CHARS = 4000;
export function normalizeProviderError(error) {
    if (!(error instanceof Error)) {
        return { message: safeJsonStringify(error), messageCarriesBody: false };
    }
    const sdkError = error;
    const status = extractStatus(sdkError);
    const body = extractBody(sdkError);
    const messageCarriesBody = body === undefined || error.message.includes(body);
    return {
        status,
        body,
        message: error.message,
        messageCarriesBody,
    };
}
/**
 * Probe the HTTP status, first numeric hit wins, in SDK-field order:
 * `statusCode` (Mistral) → `status` (`openai`, `@google/genai`) →
 * `$metadata.httpStatusCode` (Bedrock) → `$response.statusCode` (Bedrock).
 */
function extractStatus(error) {
    if (typeof error.statusCode === "number")
        return error.statusCode;
    if (typeof error.status === "number")
        return error.status;
    if (typeof error.$metadata?.httpStatusCode === "number")
        return error.$metadata.httpStatusCode;
    if (typeof error.$response?.statusCode === "number")
        return error.$response.statusCode;
    return undefined;
}
/**
 * Probe the raw body reason, first usable hit wins, in SDK-field order:
 * `body` string (Mistral) → `error` parsed JSON body object (`openai` SDK's
 * `this.error`) → `$response.body` (Bedrock). Empty objects and unread response
 * streams are treated as no body so they do not surface as `"{}"` or serialized
 * stream internals. The chosen body is truncated to the cap.
 */
function extractBody(error) {
    const bodyText = pickBodyText(error);
    if (bodyText === undefined)
        return undefined;
    const trimmed = bodyText.trim();
    if (trimmed.length === 0)
        return undefined;
    return truncateErrorText(trimmed, MAX_PROVIDER_ERROR_BODY_CHARS);
}
function pickBodyText(error) {
    if (typeof error.body === "string")
        return error.body;
    if (isNonEmptyObject(error.error))
        return safeJsonStringify(error.error);
    const responseBody = error.$response?.body;
    if (typeof responseBody === "string")
        return responseBody;
    if (isReadableStreamLike(responseBody))
        return undefined;
    if (isNonEmptyObject(responseBody))
        return safeJsonStringify(responseBody);
    return undefined;
}
function isReadableStreamLike(value) {
    return typeof value === "object" && value !== null && "pipe" in value && typeof value.pipe === "function";
}
function isNonEmptyObject(value) {
    return typeof value === "object" && value !== null && Object.keys(value).length > 0;
}
/**
 * Compose a display string from a normalized error. When the message already
 * carries the body (Anthropic / `@google/genai` happy path) or no body/status
 * was extracted, the message is returned unchanged. Otherwise the status and
 * body are surfaced, with an optional provider prefix.
 *
 * - no prefix: `"<status>: <body>"`
 * - prefix:    `"<prefix> (<status>): <body>"`
 */
export function formatProviderError(norm, prefix) {
    if (norm.messageCarriesBody || norm.status === undefined || norm.body === undefined) {
        return prefix !== undefined && norm.status !== undefined
            ? `${prefix} (${norm.status}): ${norm.message}`
            : norm.message;
    }
    return prefix !== undefined ? `${prefix} (${norm.status}): ${norm.body}` : `${norm.status}: ${norm.body}`;
}
export function truncateErrorText(text, maxChars) {
    if (text.length <= maxChars)
        return text;
    return `${text.slice(0, maxChars)}... [truncated ${text.length - maxChars} chars]`;
}
export function safeJsonStringify(value) {
    try {
        const serialized = JSON.stringify(value);
        return serialized === undefined ? String(value) : serialized;
    }
    catch {
        return String(value);
    }
}
//# sourceMappingURL=error-body.js.map
// ===== from @earendil-works/pi-ai/models.js (calculateCost, clampThinkingLevel) =====
export function calculateCost(model, usage) {
    const inputTokens = usage.input + usage.cacheRead + usage.cacheWrite;
    let rates = model.cost;
    let matchedThreshold = -1;
    for (const tier of model.cost.tiers ?? []) {
        if (inputTokens > tier.inputTokensAbove && tier.inputTokensAbove > matchedThreshold) {
            rates = tier;
            matchedThreshold = tier.inputTokensAbove;
        }
    }
    // Anthropic charges 2x base input for 1h cache writes.
    const longWrite = usage.cacheWrite1h ?? 0;
    const shortWrite = usage.cacheWrite - longWrite;
    usage.cost.input = (rates.input / 1000000) * usage.input;
    usage.cost.output = (rates.output / 1000000) * usage.output;
    usage.cost.cacheRead = (rates.cacheRead / 1000000) * usage.cacheRead;
    usage.cost.cacheWrite = (rates.cacheWrite * shortWrite + rates.input * 2 * longWrite) / 1000000;
    usage.cost.total = usage.cost.input + usage.cost.output + usage.cost.cacheRead + usage.cost.cacheWrite;
    return usage.cost;
}
const EXTENDED_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
export function getSupportedThinkingLevels(model) {
    if (!model.reasoning)
        return ["off"];
    return EXTENDED_THINKING_LEVELS.filter((level) => {
        const mapped = model.thinkingLevelMap?.[level];
        if (mapped === null)
            return false;
        if (level === "xhigh" || level === "max")
            return mapped !== undefined;
        return true;
    });
}
export function clampThinkingLevel(model, level) {
    const availableLevels = getSupportedThinkingLevels(model);
    if (availableLevels.includes(level))
        return level;
    const requestedIndex = EXTENDED_THINKING_LEVELS.indexOf(level);
    if (requestedIndex === -1)
        return availableLevels[0] ?? "off";
    for (let i = requestedIndex; i < EXTENDED_THINKING_LEVELS.length; i++) {
        const candidate = EXTENDED_THINKING_LEVELS[i];
        if (availableLevels.includes(candidate))
            return candidate;
    }
    for (let i = requestedIndex - 1; i >= 0; i--) {
        const candidate = EXTENDED_THINKING_LEVELS[i];
        if (availableLevels.includes(candidate))
            return candidate;
    }
    return availableLevels[0] ?? "off";
}
/**
 * Check if two models are equal by comparing both their id and provider.
 * Returns false if either model is null or undefined.
 */

// ===== @earendil-works/pi-ai/api/openai-completions.js (verbatim, zenFetch injected) =====
export { installZenUserAgent };
/**
 * Check if conversation messages contain tool calls or tool results.
 * This is needed because Anthropic (via proxy) requires the tools param
 * to be present when messages include tool_calls or tool role messages.
 */
function hasHeader(headers, name) {
    if (!headers)
        return false;
    const expected = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === expected && value !== null && value.trim().length > 0)
            return true;
    }
    return false;
}
function getClientApiKey(provider, apiKey, headers) {
    if (apiKey)
        return apiKey;
    if (hasHeader(headers, "authorization") || hasHeader(headers, "cf-aig-authorization"))
        return "unused";
    throw new Error(`No API key for provider: ${provider}`);
}
function hasToolHistory(messages) {
    for (const msg of messages) {
        if (msg.role === "toolResult") {
            return true;
        }
        if (msg.role === "assistant") {
            if (msg.content.some((block) => block.type === "toolCall")) {
                return true;
            }
        }
    }
    return false;
}
function getDeferredToolNames(messages) {
    const names = new Set();
    for (const message of messages) {
        if (message.role === "toolResult") {
            for (const name of message.addedToolNames ?? []) {
                names.add(name);
            }
        }
    }
    return names;
}
function getToolsByName(tools, names) {
    if (!tools)
        return [];
    const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));
    return Array.from(names)
        .map((name) => toolsByName.get(name))
        .filter((tool) => tool !== undefined);
}
function isTextContentBlock(block) {
    return block.type === "text";
}
function isThinkingContentBlock(block) {
    return block.type === "thinking";
}
function isToolCallBlock(block) {
    return block.type === "toolCall";
}
function isImageContentBlock(block) {
    return block.type === "image";
}
function isEncryptedReasoningDetail(detail) {
    if (typeof detail !== "object" || detail === null) {
        return false;
    }
    const candidate = detail;
    return (candidate.type === "reasoning.encrypted" &&
        typeof candidate.id === "string" &&
        candidate.id.length > 0 &&
        typeof candidate.data === "string" &&
        candidate.data.length > 0);
}
function resolveCacheRetention(cacheRetention, env) {
    if (cacheRetention) {
        return cacheRetention;
    }
    if (getProviderEnvValue("PI_CACHE_RETENTION", env) === "long") {
        return "long";
    }
    return "short";
}
export const stream = (model, context, options) => {
    const stream = new AssistantMessageEventStream();
    (async () => {
        const output = {
            role: "assistant",
            content: [],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
                input: 0,
                output: 0,
                cacheRead: 0,
                cacheWrite: 0,
                totalTokens: 0,
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
            },
            stopReason: "stop",
            timestamp: Date.now(),
        };
        try {
            const apiKey = getClientApiKey(model.provider, options?.apiKey, options?.headers);
            const compat = getCompat(model);
            const grammarToolInputProperties = createGrammarToolInputProperties(context.tools, compat.supportsOpenAIGrammarTools);
            const cacheRetention = resolveCacheRetention(options?.cacheRetention, options?.env);
            const cacheSessionId = cacheRetention === "none" ? undefined : options?.sessionId;
            const client = createClient(model, context, apiKey, options?.headers, cacheSessionId, compat);
            let params = buildParams(model, context, options, compat, cacheRetention, grammarToolInputProperties);
            const nextParams = await options?.onPayload?.(params, model);
            if (nextParams !== undefined) {
                params = nextParams;
            }
            const requestOptions = {
                ...(options?.signal ? { signal: options.signal } : {}),
                ...(options?.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
                maxRetries: 0,
            };
            const { data: openaiStream, response } = await retryProviderRequest(() => client.chat.completions.create(params, requestOptions).withResponse(), {
                maxRetries: options?.maxRetries,
                maxRetryDelayMs: options?.maxRetryDelayMs,
                signal: options?.signal,
            });
            await options?.onResponse?.({ status: response.status, headers: headersToRecord(response.headers) }, model);
            stream.push({ type: "start", partial: output });
            let textBlock = null;
            let thinkingBlock = null;
            let hasFinishReason = false;
            const toolCallBlocksByIndex = new Map();
            const toolCallBlocksById = new Map();
            const pendingReasoningDetailsByToolCallId = new Map();
            const blocks = output.content;
            const getContentIndex = (block) => blocks.indexOf(block);
            const getCustomToolCallInput = (block) => {
                const property = block.customInput?.property;
                if (property === undefined)
                    return "";
                const value = block.arguments[property];
                return typeof value === "string" ? value : "";
            };
            const appendCustomToolCallInput = (block, nextInput, close) => {
                const customInput = block.customInput;
                if (!customInput)
                    return undefined;
                const delta = appendGrammarToolInputJsonDelta(customInput.jsonBuffer, customInput.property, nextInput, close);
                block.arguments = { [customInput.property]: nextInput };
                return delta;
            };
            const finishBlock = (block) => {
                const contentIndex = getContentIndex(block);
                if (contentIndex === -1) {
                    return;
                }
                if (block.type === "text") {
                    stream.push({
                        type: "text_end",
                        contentIndex,
                        content: block.text,
                        partial: output,
                    });
                }
                else if (block.type === "thinking") {
                    stream.push({
                        type: "thinking_end",
                        contentIndex,
                        content: block.thinking,
                        partial: output,
                    });
                }
                else if (block.type === "toolCall") {
                    if (block.customInput) {
                        const delta = appendCustomToolCallInput(block, getCustomToolCallInput(block), true);
                        if (delta !== undefined) {
                            stream.push({
                                type: "toolcall_delta",
                                contentIndex,
                                delta,
                                partial: output,
                            });
                        }
                    }
                    else {
                        block.arguments = parseStreamingJson(block.partialArgs);
                    }
                    // Finalize in-place and strip the scratch buffers so replay only
                    // carries parsed arguments.
                    delete block.partialArgs;
                    delete block.customInput;
                    delete block.streamIndex;
                    stream.push({
                        type: "toolcall_end",
                        contentIndex,
                        toolCall: block,
                        partial: output,
                    });
                }
            };
            const ensureTextBlock = () => {
                if (!textBlock) {
                    textBlock = { type: "text", text: "" };
                    blocks.push(textBlock);
                    stream.push({ type: "text_start", contentIndex: getContentIndex(textBlock), partial: output });
                }
                return textBlock;
            };
            const ensureThinkingBlock = (thinkingSignature) => {
                if (!thinkingBlock) {
                    thinkingBlock = {
                        type: "thinking",
                        thinking: "",
                        thinkingSignature,
                    };
                    blocks.push(thinkingBlock);
                    stream.push({ type: "thinking_start", contentIndex: getContentIndex(thinkingBlock), partial: output });
                }
                return thinkingBlock;
            };
            const applyPendingReasoningDetail = (block) => {
                if (!block.id) {
                    return;
                }
                const pendingReasoningDetail = pendingReasoningDetailsByToolCallId.get(block.id);
                if (pendingReasoningDetail) {
                    block.thoughtSignature = pendingReasoningDetail;
                    pendingReasoningDetailsByToolCallId.delete(block.id);
                }
            };
            const ensureToolCallBlock = (toolCall) => {
                const streamIndex = typeof toolCall.index === "number" ? toolCall.index : undefined;
                const name = toolCall.function?.name ?? toolCall.custom?.name ?? "";
                let block = streamIndex !== undefined ? toolCallBlocksByIndex.get(streamIndex) : undefined;
                if (!block && toolCall.id) {
                    block = toolCallBlocksById.get(toolCall.id);
                }
                if (!block) {
                    // Note: the "input" fallback here should/must not be taken.  in case the LLM makes up
                    // a tool we don't knwo about, we at least have a place to stash our stuff.
                    const customInputProperty = toolCall.custom
                        ? (grammarToolInputProperties.get(name) ?? "input")
                        : undefined;
                    const hasCustomInput = customInputProperty !== undefined;
                    block = {
                        type: "toolCall",
                        id: toolCall.id || "",
                        name,
                        arguments: hasCustomInput ? { [customInputProperty]: "" } : {},
                        partialArgs: hasCustomInput ? undefined : "",
                        customInput: hasCustomInput
                            ? { property: customInputProperty, jsonBuffer: { input: "", started: false, closed: false } }
                            : undefined,
                        streamIndex,
                    };
                    if (streamIndex !== undefined) {
                        toolCallBlocksByIndex.set(streamIndex, block);
                    }
                    if (toolCall.id) {
                        toolCallBlocksById.set(toolCall.id, block);
                    }
                    blocks.push(block);
                    stream.push({
                        type: "toolcall_start",
                        contentIndex: getContentIndex(block),
                        partial: output,
                    });
                }
                if (streamIndex !== undefined && block.streamIndex === undefined) {
                    block.streamIndex = streamIndex;
                    toolCallBlocksByIndex.set(streamIndex, block);
                }
                if (toolCall.id) {
                    toolCallBlocksById.set(toolCall.id, block);
                }
                if (!block.name && name) {
                    block.name = name;
                }
                if (toolCall.custom && !block.customInput) {
                    const customInputProperty = grammarToolInputProperties.get(block.name) ?? "input";
                    block.arguments = { [customInputProperty]: "" };
                    block.customInput = {
                        property: customInputProperty,
                        jsonBuffer: { input: "", started: false, closed: false },
                    };
                    delete block.partialArgs;
                }
                applyPendingReasoningDetail(block);
                return block;
            };
            for await (const chunk of openaiStream) {
                if (!chunk || typeof chunk !== "object")
                    continue;
                // OpenAI documents ChatCompletionChunk.id as the unique chat completion identifier,
                // and each chunk in a streamed completion carries the same id.
                output.responseId ||= chunk.id;
                if (typeof chunk.model === "string" && chunk.model.length > 0 && chunk.model !== model.id) {
                    output.responseModel ||= chunk.model;
                }
                if (chunk.usage) {
                    output.usage = parseChunkUsage(chunk.usage, model);
                }
                const choice = Array.isArray(chunk.choices) ? chunk.choices[0] : undefined;
                if (!choice)
                    continue;
                // Fallback: some providers (e.g., Moonshot) return usage
                // in choice.usage instead of the standard chunk.usage
                if (!chunk.usage && choice.usage) {
                    output.usage = parseChunkUsage(choice.usage, model);
                }
                if (choice.finish_reason) {
                    const finishReasonResult = mapStopReason(choice.finish_reason);
                    output.stopReason = finishReasonResult.stopReason;
                    if (finishReasonResult.errorMessage) {
                        output.errorMessage = finishReasonResult.errorMessage;
                    }
                    hasFinishReason = true;
                }
                if (choice.delta) {
                    if (choice.delta.content !== null &&
                        choice.delta.content !== undefined &&
                        choice.delta.content.length > 0) {
                        const block = ensureTextBlock();
                        block.text += choice.delta.content;
                        stream.push({
                            type: "text_delta",
                            contentIndex: getContentIndex(block),
                            delta: choice.delta.content,
                            partial: output,
                        });
                    }
                    // Some endpoints return reasoning in reasoning_content (llama.cpp),
                    // or reasoning (other openai compatible endpoints)
                    // Use the first non-empty reasoning field to avoid duplication
                    // (e.g., chutes.ai returns both reasoning_content and reasoning with same content)
                    const reasoningFields = ["reasoning_content", "reasoning", "reasoning_text"];
                    const deltaFields = choice.delta;
                    let foundReasoningField = null;
                    for (const field of reasoningFields) {
                        const value = deltaFields[field];
                        if (typeof value === "string" && value.length > 0) {
                            foundReasoningField = field;
                            break;
                        }
                    }
                    if (foundReasoningField) {
                        const delta = deltaFields[foundReasoningField];
                        if (typeof delta === "string" && delta.length > 0) {
                            const thinkingSignature = model.provider === "opencode-go" && foundReasoningField === "reasoning"
                                ? "reasoning_content"
                                : foundReasoningField;
                            const block = ensureThinkingBlock(thinkingSignature);
                            block.thinking += delta;
                            stream.push({
                                type: "thinking_delta",
                                contentIndex: getContentIndex(block),
                                delta,
                                partial: output,
                            });
                        }
                    }
                    if (choice?.delta?.tool_calls) {
                        for (const toolCall of choice.delta.tool_calls) {
                            const block = ensureToolCallBlock(toolCall);
                            if (!block.id && toolCall.id) {
                                block.id = toolCall.id;
                                toolCallBlocksById.set(toolCall.id, block);
                            }
                            const name = toolCall.function?.name ?? toolCall.custom?.name;
                            if (!block.name && name) {
                                block.name = name;
                            }
                            let delta = "";
                            if (toolCall.function?.arguments) {
                                delta = toolCall.function.arguments;
                                block.partialArgs = (block.partialArgs ?? "") + toolCall.function.arguments;
                                block.arguments = parseStreamingJson(block.partialArgs);
                            }
                            else if (toolCall.custom?.input) {
                                const nextInput = getCustomToolCallInput(block) + toolCall.custom.input;
                                delta = appendCustomToolCallInput(block, nextInput, false) ?? "";
                            }
                            stream.push({
                                type: "toolcall_delta",
                                contentIndex: getContentIndex(block),
                                delta,
                                partial: output,
                            });
                        }
                    }
                    const reasoningDetails = choice.delta.reasoning_details;
                    if (Array.isArray(reasoningDetails)) {
                        for (const detail of reasoningDetails) {
                            if (isEncryptedReasoningDetail(detail)) {
                                const serializedDetail = JSON.stringify(detail);
                                const matchingToolCall = toolCallBlocksById.get(detail.id);
                                if (matchingToolCall) {
                                    matchingToolCall.thoughtSignature = serializedDetail;
                                }
                                else {
                                    pendingReasoningDetailsByToolCallId.set(detail.id, serializedDetail);
                                }
                            }
                        }
                    }
                }
            }
            for (const block of blocks) {
                finishBlock(block);
            }
            if (options?.signal?.aborted) {
                throw new Error("Request was aborted");
            }
            if (output.stopReason === "aborted") {
                throw new Error("Request was aborted");
            }
            if (output.stopReason === "error") {
                throw new Error(output.errorMessage || "Provider returned an error stop reason");
            }
            if (!hasFinishReason) {
                throw new Error("Stream ended without finish_reason");
            }
            stream.push({ type: "done", reason: output.stopReason, message: output });
            stream.end();
        }
        catch (error) {
            for (const block of output.content) {
                delete block.index;
                // Streaming scratch buffers are only used during parsing; never persist them.
                delete block.partialArgs;
                delete block.customInput;
                delete block.streamIndex;
            }
            output.stopReason = options?.signal?.aborted ? "aborted" : "error";
            output.errorMessage = formatProviderError(normalizeProviderError(error));
            // Some providers via OpenRouter give additional information in this field.
            // normalizeProviderError already stringifies the parsed body (error.error)
            // into errorMessage, so only append the raw metadata when it is not already
            // present to avoid double-printing it.
            const rawMetadata = error?.error?.metadata?.raw;
            if (rawMetadata && !output.errorMessage.includes(String(rawMetadata))) {
                output.errorMessage += `\n${rawMetadata}`;
            }
            stream.push({ type: "error", reason: output.stopReason, error: output });
            stream.end();
        }
    })();
    return stream;
};
export const streamSimple = (model, context, options) => {
    getClientApiKey(model.provider, options?.apiKey, options?.headers);
    const base = buildBaseOptions(model, context, options, options?.apiKey);
    const clampedReasoning = options?.reasoning ? clampThinkingLevel(model, options.reasoning) : undefined;
    const reasoningEffort = clampedReasoning === "off" ? undefined : clampedReasoning;
    const toolChoice = options?.toolChoice;
    return stream(model, context, {
        ...base,
        reasoningEffort,
        toolChoice,
    });
};
/**
 * Module-scoped fetch used only by the OpenAI client constructed in this file.
 * It captures a *reference* to the ambient fetch (never mutates globalThis.fetch)
 * and, solely for requests targeting opencode's zen endpoint, forces the
 * `user-agent` to the opencode identity required to unlock the free tier. Every
 * other request is passed through untouched. This keeps the UA override scoped
 * to this provider's transport and out of the global fetch path.
 */
const zenNativeFetch = globalThis.fetch;
// Opencode identity required to unlock the free tier; set via installZenUserAgent.
let zenUserAgent = undefined;
function installZenUserAgent(ua) {
    zenUserAgent = ua;
}
const zenFetch = (input, init) => {
    let url;
    if (typeof input === 'string')
        url = input;
    else if (input instanceof URL)
        url = input.href;
    else if (input instanceof Request)
        url = input.url;
    else
        url = String(input);
    if (url.includes('opencode.ai/zen') && zenUserAgent) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        headers.set('user-agent', zenUserAgent);
        return zenNativeFetch(input, { ...init, headers });
    }
    return zenNativeFetch(input, init);
};
function createClient(model, context, apiKey, optionsHeaders, sessionId, compat = getCompat(model)) {
    const headers = { ...model.headers };
    if (model.provider === "github-copilot") {
        const hasImages = hasCopilotVisionInput(context.messages);
        const copilotHeaders = buildCopilotDynamicHeaders({
            messages: context.messages,
            hasImages,
        });
        Object.assign(headers, copilotHeaders);
    }
    if (sessionId && compat.sendSessionAffinityHeaders) {
        if (compat.sessionAffinityFormat === "openrouter") {
            headers["x-session-id"] = sessionId;
        }
        else {
            if (compat.sessionAffinityFormat === "openai") {
                headers.session_id = sessionId;
            }
            headers["x-client-request-id"] = sessionId;
            headers["x-session-affinity"] = sessionId;
        }
    }
    // Merge options headers last so they can override defaults
    if (optionsHeaders) {
        Object.assign(headers, optionsHeaders);
    }
    return new OpenAI({
        apiKey,
        baseURL: model.baseUrl,
        dangerouslyAllowBrowser: true,
        defaultHeaders: headers,
        fetch: zenFetch,
    });
}
function buildParams(model, context, options, compat = getCompat(model), cacheRetention = resolveCacheRetention(options?.cacheRetention, options?.env), grammarToolInputProperties = createGrammarToolInputProperties(context.tools, compat.supportsOpenAIGrammarTools)) {
    const messages = convertMessages(model, context, compat, { grammarToolInputProperties });
    const cacheControl = getCompatCacheControl(compat, cacheRetention);
    const params = {
        model: model.id,
        messages,
        stream: true,
        prompt_cache_key: (model.baseUrl.includes("api.openai.com") && cacheRetention !== "none") ||
            (cacheRetention === "long" && compat.supportsLongCacheRetention)
            ? clampOpenAIPromptCacheKey(options?.sessionId)
            : undefined,
        prompt_cache_retention: cacheRetention === "long" && compat.supportsLongCacheRetention ? "24h" : undefined,
    };
    if (compat.supportsUsageInStreaming !== false) {
        params.stream_options = { include_usage: true };
    }
    if (compat.supportsStore) {
        params.store = false;
    }
    if (options?.maxTokens) {
        if (compat.maxTokensField === "max_tokens") {
            params.max_tokens = options.maxTokens;
        }
        else {
            params.max_completion_tokens = options.maxTokens;
        }
    }
    if (options?.temperature !== undefined) {
        params.temperature = options.temperature;
    }
    const deferredToolNames = compat.deferredToolsMode === "kimi" ? getDeferredToolNames(context.messages) : new Set();
    const activeTools = context.tools?.filter((tool) => !deferredToolNames.has(tool.name));
    if (activeTools && activeTools.length > 0) {
        params.tools = convertTools(activeTools, compat);
        if (compat.zaiToolStream) {
            params.tool_stream = true;
        }
    }
    else if (hasToolHistory(context.messages)) {
        // Anthropic (via LiteLLM/proxy) requires tools param when conversation has tool_calls/tool_results
        params.tools = [];
    }
    if (cacheControl) {
        applyAnthropicCacheControl(messages, params.tools, cacheControl);
    }
    if (options?.toolChoice) {
        params.tool_choice = options.toolChoice;
    }
    if (compat.thinkingFormat === "zai" && model.reasoning) {
        const zaiParams = params;
        zaiParams.thinking = options?.reasoningEffort ? { type: "enabled", clear_thinking: false } : { type: "disabled" };
        if (options?.reasoningEffort && compat.supportsReasoningEffort) {
            const mappedEffort = model.thinkingLevelMap?.[options.reasoningEffort];
            const effort = mappedEffort === undefined ? options.reasoningEffort : mappedEffort;
            if (typeof effort === "string") {
                zaiParams.reasoning_effort = effort;
            }
        }
    }
    else if (compat.thinkingFormat === "qwen" && model.reasoning) {
        params.enable_thinking = !!options?.reasoningEffort;
    }
    else if (compat.thinkingFormat === "qwen-chat-template" && model.reasoning) {
        params.chat_template_kwargs = {
            enable_thinking: !!options?.reasoningEffort,
            preserve_thinking: true,
        };
    }
    else if (compat.thinkingFormat === "chat-template" && model.reasoning) {
        const chatTemplateKwargs = buildChatTemplateKwargs(model, options, compat);
        if (chatTemplateKwargs) {
            params.chat_template_kwargs = chatTemplateKwargs;
        }
    }
    else if (compat.thinkingFormat === "deepseek" && model.reasoning) {
        if (options?.reasoningEffort) {
            params.thinking = { type: "enabled" };
        }
        else if (model.thinkingLevelMap?.off !== null) {
            params.thinking = { type: "disabled" };
        }
        if (options?.reasoningEffort && compat.supportsReasoningEffort) {
            params.reasoning_effort =
                model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort;
        }
    }
    else if (compat.thinkingFormat === "openrouter" && model.reasoning) {
        // OpenRouter normalizes reasoning across providers via a nested reasoning object.
        const openRouterParams = params;
        if (options?.reasoningEffort) {
            openRouterParams.reasoning = {
                effort: model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort,
            };
        }
        else if (model.thinkingLevelMap?.off !== null) {
            openRouterParams.reasoning = { effort: model.thinkingLevelMap?.off ?? "none" };
        }
    }
    else if (compat.thinkingFormat === "ant-ling" && model.reasoning && options?.reasoningEffort) {
        const effort = model.thinkingLevelMap?.[options.reasoningEffort];
        if (typeof effort === "string") {
            params.reasoning = { effort };
        }
    }
    else if (compat.thinkingFormat === "together" && model.reasoning) {
        const togetherParams = params;
        togetherParams.reasoning = { enabled: !!options?.reasoningEffort };
        if (options?.reasoningEffort && compat.supportsReasoningEffort) {
            togetherParams.reasoning_effort = model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort;
        }
    }
    else if (compat.thinkingFormat === "string-thinking" && model.reasoning) {
        const stringThinkingParams = params;
        if (options?.reasoningEffort) {
            stringThinkingParams.thinking = model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort;
        }
        else if (model.thinkingLevelMap?.off !== null) {
            stringThinkingParams.thinking = model.thinkingLevelMap?.off ?? "none";
        }
    }
    else if (options?.reasoningEffort && model.reasoning && compat.supportsReasoningEffort) {
        // OpenAI-style reasoning_effort
        params.reasoning_effort = model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort;
    }
    else if (!options?.reasoningEffort && model.reasoning && compat.supportsReasoningEffort) {
        const offValue = model.thinkingLevelMap?.off;
        if (typeof offValue === "string") {
            params.reasoning_effort = offValue;
        }
    }
    // OpenRouter provider routing preferences
    if (model.compat?.openRouterRouting) {
        params.provider = model.compat.openRouterRouting;
    }
    // Vercel AI Gateway provider routing preferences
    if (model.compat?.vercelGatewayRouting) {
        const routing = model.compat.vercelGatewayRouting;
        if (routing.only || routing.order) {
            const gatewayOptions = {};
            if (routing.only)
                gatewayOptions.only = routing.only;
            if (routing.order)
                gatewayOptions.order = routing.order;
            params.providerOptions = { gateway: gatewayOptions };
        }
    }
    return params;
}
function buildChatTemplateKwargs(model, options, compat) {
    const kwargs = {};
    for (const [key, value] of Object.entries(compat.chatTemplateKwargs)) {
        const resolved = resolveChatTemplateKwargValue(model, options, value);
        if (resolved !== undefined) {
            kwargs[key] = resolved;
        }
    }
    return Object.keys(kwargs).length > 0 ? kwargs : undefined;
}
function resolveChatTemplateKwargValue(model, options, value) {
    if (typeof value !== "object" || value === null) {
        return value;
    }
    const reasoningEffort = options?.reasoningEffort;
    if (!reasoningEffort && value.omitWhenOff) {
        return undefined;
    }
    if (value.$var === "thinking.enabled") {
        return !!reasoningEffort;
    }
    const mappedValue = reasoningEffort ? model.thinkingLevelMap?.[reasoningEffort] : model.thinkingLevelMap?.off;
    return mappedValue === undefined ? reasoningEffort : typeof mappedValue === "string" ? mappedValue : undefined;
}
function getCompatCacheControl(compat, cacheRetention) {
    if (compat.cacheControlFormat !== "anthropic" || cacheRetention === "none") {
        return undefined;
    }
    const ttl = cacheRetention === "long" && compat.supportsLongCacheRetention ? "1h" : undefined;
    return { type: "ephemeral", ...(ttl ? { ttl } : {}) };
}
function applyAnthropicCacheControl(messages, tools, cacheControl) {
    addCacheControlToSystemPrompt(messages, cacheControl);
    addCacheControlToLastTool(tools, cacheControl);
    addCacheControlToLastConversationMessage(messages, cacheControl);
}
function addCacheControlToSystemPrompt(messages, cacheControl) {
    for (const message of messages) {
        if (message.role === "system" || message.role === "developer") {
            addCacheControlToInstructionMessage(message, cacheControl);
            return;
        }
    }
}
function addCacheControlToLastConversationMessage(messages, cacheControl) {
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.role === "user" || message.role === "assistant" || message.role === "tool") {
            if (addCacheControlToMessage(message, cacheControl)) {
                return;
            }
        }
    }
}
function addCacheControlToLastTool(tools, cacheControl) {
    if (!tools || tools.length === 0) {
        return;
    }
    const lastTool = tools[tools.length - 1];
    lastTool.cache_control = cacheControl;
}
function addCacheControlToInstructionMessage(message, cacheControl) {
    return addCacheControlToTextContent(message, cacheControl);
}
function addCacheControlToMessage(message, cacheControl) {
    if (message.role === "user" || message.role === "assistant" || message.role === "tool") {
        return addCacheControlToTextContent(message, cacheControl);
    }
    return false;
}
function addCacheControlToTextContent(message, cacheControl) {
    const content = message.content;
    if (typeof content === "string") {
        if (content.length === 0) {
            return false;
        }
        message.content = [
            {
                type: "text",
                text: content,
                cache_control: cacheControl,
            },
        ];
        return true;
    }
    if (!Array.isArray(content)) {
        return false;
    }
    for (let i = content.length - 1; i >= 0; i--) {
        const part = content[i];
        if (part?.type === "text") {
            const textPart = part;
            textPart.cache_control = cacheControl;
            return true;
        }
    }
    return false;
}
export function convertMessages(model, context, compat, options) {
    const params = [];
    const normalizeToolCallId = (id) => {
        // Handle pipe-separated IDs from OpenAI Responses API
        // Format: {call_id}|{id} where {id} can be 400+ chars with special chars (+, /, =)
        // These come from providers like github-copilot, openai-codex, opencode
        // Extract just the call_id part and normalize it
        // Multiple tool calls in the same turn can share call_id but differ by item_id.
        // Preserve item-level uniqueness when replaying into Chat Completions, which
        // requires distinct tool call ids.
        if (id.includes("|")) {
            // Sanitize to allowed chars and truncate to 40 chars (OpenAI limit)
            const separatorIndex = id.indexOf("|");
            const callId = id.slice(0, separatorIndex).replace(/[^a-zA-Z0-9_-]/g, "_");
            const itemId = id.slice(separatorIndex + 1).replace(/[^a-zA-Z0-9_-]/g, "_");
            const combinedId = itemId.length > 0 ? `${callId}_${itemId}` : callId;
            if (combinedId.length <= 40) {
                return combinedId;
            }
            const hash = shortHash(id).slice(0, 8);
            const prefix = callId.slice(0, Math.max(1, 40 - hash.length - 1));
            return `${prefix}_${hash}`;
        }
        if (model.provider === "openai")
            return id.length > 40 ? id.slice(0, 40) : id;
        return id;
    };
    const transformedMessages = transformMessages(context.messages, model, (id) => normalizeToolCallId(id));
    if (context.systemPrompt) {
        const useDeveloperRole = model.reasoning && compat.supportsDeveloperRole;
        const role = useDeveloperRole ? "developer" : "system";
        params.push({ role: role, content: sanitizeSurrogates(context.systemPrompt) });
    }
    let lastRole = null;
    for (let i = 0; i < transformedMessages.length; i++) {
        const msg = transformedMessages[i];
        // Some providers don't allow user messages directly after tool results
        // Insert a synthetic assistant message to bridge the gap
        if (compat.requiresAssistantAfterToolResult && lastRole === "toolResult" && msg.role === "user") {
            params.push({
                role: "assistant",
                content: "I have processed the tool results.",
            });
        }
        if (msg.role === "user") {
            if (typeof msg.content === "string") {
                params.push({
                    role: "user",
                    content: sanitizeSurrogates(msg.content),
                });
            }
            else {
                const content = msg.content.map((item) => {
                    if (item.type === "text") {
                        return {
                            type: "text",
                            text: sanitizeSurrogates(item.text),
                        };
                    }
                    else {
                        return {
                            type: "image_url",
                            image_url: {
                                url: `data:${item.mimeType};base64,${item.data}`,
                            },
                        };
                    }
                });
                if (content.length === 0)
                    continue;
                params.push({
                    role: "user",
                    content,
                });
            }
        }
        else if (msg.role === "assistant") {
            // Some providers don't accept null content, use empty string instead
            const assistantMsg = {
                role: "assistant",
                content: compat.requiresAssistantAfterToolResult ? "" : null,
            };
            const assistantTextParts = msg.content
                .filter(isTextContentBlock)
                .filter((block) => block.text.trim().length > 0)
                .map((block) => ({
                type: "text",
                text: sanitizeSurrogates(block.text),
            }));
            const assistantText = assistantTextParts.map((part) => part.text).join("");
            const nonEmptyThinkingBlocks = msg.content
                .filter(isThinkingContentBlock)
                .filter((block) => block.thinking.trim().length > 0);
            if (nonEmptyThinkingBlocks.length > 0) {
                if (compat.requiresThinkingAsText) {
                    // Convert thinking blocks to plain text (no tags to avoid model mimicking them)
                    const thinkingText = nonEmptyThinkingBlocks
                        .map((block) => sanitizeSurrogates(block.thinking))
                        .join("\n\n");
                    assistantMsg.content = [{ type: "text", text: thinkingText }, ...assistantTextParts];
                }
                else {
                    // Always send assistant content as a plain string (OpenAI Chat Completions
                    // API standard format). Sending as an array of {type:"text", text:"..."}
                    // objects is non-standard and causes some models (e.g. DeepSeek V3.2 via
                    // NVIDIA NIM) to mirror the content-block structure literally in their
                    // output, producing recursive nesting like [{'type':'text','text':'[{...}]'}].
                    if (assistantText.length > 0) {
                        assistantMsg.content = assistantText;
                    }
                    // Use the signature from the first thinking block if available (for llama.cpp server + gpt-oss)
                    let signature = nonEmptyThinkingBlocks[0].thinkingSignature;
                    if (model.provider === "opencode-go" && signature === "reasoning") {
                        signature = "reasoning_content";
                    }
                    if (signature && signature.length > 0) {
                        assistantMsg[signature] = nonEmptyThinkingBlocks.map((block) => block.thinking).join("\n");
                    }
                }
            }
            else if (assistantText.length > 0) {
                // Always send assistant content as a plain string (OpenAI Chat Completions
                // API standard format). Sending as an array of {type:"text", text:"..."}
                // objects is non-standard and causes some models (e.g. DeepSeek V3.2 via
                // NVIDIA NIM) to mirror the content-block structure literally in their
                // output, producing recursive nesting like [{'type':'text','text':'[{...}]'}].
                assistantMsg.content = assistantText;
            }
            const toolCalls = msg.content.filter(isToolCallBlock);
            if (toolCalls.length > 0) {
                assistantMsg.tool_calls = toolCalls.map((tc) => {
                    const customInputProperty = options?.grammarToolInputProperties?.get(tc.name);
                    if (customInputProperty !== undefined) {
                        return {
                            id: tc.id,
                            type: "custom",
                            custom: {
                                name: tc.name,
                                input: sanitizeSurrogates(getGrammarToolInput(tc.name, tc.arguments, customInputProperty)),
                            },
                        };
                    }
                    return {
                        id: tc.id,
                        type: "function",
                        function: {
                            name: tc.name,
                            arguments: JSON.stringify(tc.arguments),
                        },
                    };
                });
                const reasoningDetails = toolCalls
                    .filter((tc) => tc.thoughtSignature)
                    .map((tc) => {
                    try {
                        return JSON.parse(tc.thoughtSignature);
                    }
                    catch {
                        return null;
                    }
                })
                    .filter(Boolean);
                if (reasoningDetails.length > 0) {
                    assistantMsg.reasoning_details = reasoningDetails;
                }
            }
            if (compat.requiresReasoningContentOnAssistantMessages &&
                model.reasoning &&
                assistantMsg.reasoning_content === undefined) {
                assistantMsg.reasoning_content = "";
            }
            // Skip assistant messages that have no content and no tool calls.
            // Some providers require "either content or tool_calls, but not none".
            // Other providers also don't accept empty assistant messages.
            // This handles aborted assistant responses that got no content.
            const content = assistantMsg.content;
            const hasContent = content !== null &&
                content !== undefined &&
                (typeof content === "string" ? content.length > 0 : content.length > 0);
            if (!hasContent && !assistantMsg.tool_calls) {
                continue;
            }
            params.push(assistantMsg);
        }
        else if (msg.role === "toolResult") {
            const imageBlocks = [];
            const deferredToolNames = new Set();
            let j = i;
            for (; j < transformedMessages.length && transformedMessages[j].role === "toolResult"; j++) {
                const toolMsg = transformedMessages[j];
                // Extract text and image content
                const textResult = toolMsg.content
                    .filter(isTextContentBlock)
                    .map((block) => block.text)
                    .join("\n");
                const hasImages = toolMsg.content.some((c) => c.type === "image");
                // Always send tool result with text (or placeholder if only images)
                const hasText = textResult.length > 0;
                const toolResultText = hasText ? textResult : hasImages ? "(see attached image)" : "(no tool output)";
                // Some providers require the 'name' field in tool results
                const toolResultMsg = {
                    role: "tool",
                    content: sanitizeSurrogates(toolResultText),
                    tool_call_id: toolMsg.toolCallId,
                };
                if (compat.requiresToolResultName && toolMsg.toolName) {
                    toolResultMsg.name = toolMsg.toolName;
                }
                params.push(toolResultMsg);
                if (compat.deferredToolsMode === "kimi") {
                    for (const name of toolMsg.addedToolNames ?? []) {
                        deferredToolNames.add(name);
                    }
                }
                if (hasImages && model.input.includes("image")) {
                    for (const block of toolMsg.content) {
                        if (isImageContentBlock(block)) {
                            imageBlocks.push({
                                type: "image_url",
                                image_url: {
                                    url: `data:${block.mimeType};base64,${block.data}`,
                                },
                            });
                        }
                    }
                }
            }
            i = j - 1;
            if (imageBlocks.length > 0) {
                if (compat.requiresAssistantAfterToolResult) {
                    params.push({
                        role: "assistant",
                        content: "I have processed the tool results.",
                    });
                }
                params.push({
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Attached image(s) from tool result:",
                        },
                        ...imageBlocks,
                    ],
                });
                lastRole = "user";
            }
            else {
                lastRole = "toolResult";
            }
            if (deferredToolNames.size > 0) {
                const deferredTools = getToolsByName(context.tools, deferredToolNames);
                if (deferredTools.length > 0) {
                    const kimiToolMessage = {
                        role: "system",
                        tools: convertTools(deferredTools, compat),
                    };
                    // Kimi accepts a system message with tools but omits the standard content field.
                    params.push(kimiToolMessage);
                }
            }
            continue;
        }
        lastRole = msg.role;
    }
    return params;
}
function convertTools(tools, compat) {
    return tools.map((tool) => {
        const grammar = resolveGrammarConstrainedSampling(tool, compat.supportsOpenAIGrammarTools);
        if (grammar) {
            return {
                type: "custom",
                custom: {
                    name: tool.name,
                    description: tool.description,
                    format: {
                        type: "grammar",
                        grammar: {
                            syntax: grammar.format,
                            definition: grammar.definition,
                        },
                    },
                },
            };
        }
        const strict = resolveJsonSchemaStrictSampling(tool, compat.supportsStrictMode !== false);
        return {
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters, // TypeBox already generates JSON Schema
                // Only include strict if provider supports it. Some reject unknown fields.
                ...(compat.supportsStrictMode !== false && { strict: strict ?? false }),
            },
        };
    });
}
function parseChunkUsage(rawUsage, model) {
    const promptTokens = rawUsage.prompt_tokens || 0;
    const cacheReadTokens = rawUsage.prompt_tokens_details?.cached_tokens ?? rawUsage.prompt_cache_hit_tokens ?? 0;
    const cacheWriteTokens = rawUsage.prompt_tokens_details?.cache_write_tokens || 0;
    // Follow documented OpenAI/OpenRouter semantics: cached_tokens is cache-read
    // tokens (hits). OpenAI does not document or emit cache_write_tokens, but
    // OpenRouter-compatible providers can include it as a separate write count.
    // OpenRouter's own provider/tests affirm the separate mapping:
    // https://github.com/OpenRouterTeam/ai-sdk-provider/pull/409
    // Do not subtract writes from cached_tokens, otherwise spec-compliant
    // providers are under-reported. DS4 mirrors this contract too:
    // https://github.com/antirez/ds4/pull/29
    const input = Math.max(0, promptTokens - cacheReadTokens - cacheWriteTokens);
    // OpenAI completion_tokens already includes reasoning_tokens.
    const outputTokens = rawUsage.completion_tokens || 0;
    const usage = {
        input,
        output: outputTokens,
        cacheRead: cacheReadTokens,
        cacheWrite: cacheWriteTokens,
        reasoning: rawUsage.completion_tokens_details?.reasoning_tokens || 0,
        totalTokens: input + outputTokens + cacheReadTokens + cacheWriteTokens,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    };
    calculateCost(model, usage);
    return usage;
}
function mapStopReason(reason) {
    if (reason === null)
        return { stopReason: "stop" };
    switch (reason) {
        case "stop":
        case "end":
            return { stopReason: "stop" };
        case "length":
            return { stopReason: "length" };
        case "function_call":
        case "tool_calls":
            return { stopReason: "toolUse" };
        case "content_filter":
            return { stopReason: "error", errorMessage: "Provider finish_reason: content_filter" };
        case "network_error":
            return { stopReason: "error", errorMessage: "Provider finish_reason: network_error" };
        default:
            return {
                stopReason: "error",
                errorMessage: `Provider finish_reason: ${reason}`,
            };
    }
}
/**
 * Auto-detect compatibility settings from provider name and baseUrl.
 * Used as the base when model.compat is not set; explicit model.compat
 * entries override these detected values.
 */
function detectCompat(model) {
    const provider = model.provider;
    const baseUrl = model.baseUrl;
    const isZai = provider === "zai" ||
        provider === "zai-coding-cn" ||
        baseUrl.includes("api.z.ai") ||
        baseUrl.includes("open.bigmodel.cn");
    const isTogether = provider === "together" || baseUrl.includes("api.together.ai") || baseUrl.includes("api.together.xyz");
    const isMoonshot = provider === "moonshotai" || provider === "moonshotai-cn" || baseUrl.includes("api.moonshot.");
    const isOpenRouter = provider === "openrouter" || baseUrl.includes("openrouter.ai");
    const isCloudflareWorkersAI = provider === "cloudflare-workers-ai" || baseUrl.includes("api.cloudflare.com");
    const isCloudflareAiGateway = provider === "cloudflare-ai-gateway" || baseUrl.includes("gateway.ai.cloudflare.com");
    const isNvidia = provider === "nvidia" || baseUrl.includes("integrate.api.nvidia.com");
    const isAntLing = provider === "ant-ling" || baseUrl.includes("api.ant-ling.com");
    const isNonStandard = isNvidia ||
        provider === "cerebras" ||
        baseUrl.includes("cerebras.ai") ||
        provider === "xai" ||
        baseUrl.includes("api.x.ai") ||
        isTogether ||
        baseUrl.includes("chutes.ai") ||
        baseUrl.includes("deepseek.com") ||
        isZai ||
        isMoonshot ||
        provider === "opencode" ||
        baseUrl.includes("opencode.ai") ||
        isCloudflareWorkersAI ||
        isCloudflareAiGateway ||
        isAntLing;
    const useMaxTokens = baseUrl.includes("chutes.ai") || isMoonshot || isCloudflareAiGateway || isTogether || isNvidia || isAntLing;
    const isGrok = provider === "xai" || baseUrl.includes("api.x.ai");
    const isDeepSeek = provider === "deepseek" || baseUrl.includes("deepseek.com");
    const isOpenRouterDeveloperRoleModel = isOpenRouter && (model.id.startsWith("anthropic/") || model.id.startsWith("openai/"));
    const cacheControlFormat = provider === "openrouter" && model.id.startsWith("anthropic/") ? "anthropic" : undefined;
    return {
        supportsStore: !isNonStandard,
        supportsDeveloperRole: isOpenRouterDeveloperRoleModel || (!isNonStandard && !isOpenRouter),
        supportsReasoningEffort: !isGrok && !isZai && !isMoonshot && !isTogether && !isCloudflareAiGateway && !isNvidia && !isAntLing,
        supportsUsageInStreaming: true,
        maxTokensField: useMaxTokens ? "max_tokens" : "max_completion_tokens",
        requiresToolResultName: false,
        requiresAssistantAfterToolResult: false,
        requiresThinkingAsText: false,
        requiresReasoningContentOnAssistantMessages: isDeepSeek,
        thinkingFormat: isDeepSeek
            ? "deepseek"
            : isZai
                ? "zai"
                : isTogether
                    ? "together"
                    : isAntLing
                        ? "ant-ling"
                        : isOpenRouter
                            ? "openrouter"
                            : "openai",
        openRouterRouting: {},
        vercelGatewayRouting: {},
        chatTemplateKwargs: {},
        zaiToolStream: false,
        supportsStrictMode: !isMoonshot && !isTogether && !isCloudflareAiGateway && !isNvidia,
        supportsOpenAIGrammarTools: false,
        cacheControlFormat,
        sendSessionAffinityHeaders: false,
        deferredToolsMode: undefined,
        sessionAffinityFormat: isOpenRouter ? "openrouter" : "openai",
        supportsLongCacheRetention: !(isTogether ||
            isCloudflareWorkersAI ||
            isCloudflareAiGateway ||
            isNvidia ||
            isAntLing),
    };
}
/**
 * Get resolved compatibility settings for a model.
 * Auto-detects from provider/URL then overrides with explicit model.compat.
 */
function getCompat(model) {
    const detected = detectCompat(model);
    if (!model.compat)
        return detected;
    return {
        supportsStore: model.compat.supportsStore ?? detected.supportsStore,
        supportsDeveloperRole: model.compat.supportsDeveloperRole ?? detected.supportsDeveloperRole,
        supportsReasoningEffort: model.compat.supportsReasoningEffort ?? detected.supportsReasoningEffort,
        supportsUsageInStreaming: model.compat.supportsUsageInStreaming ?? detected.supportsUsageInStreaming,
        maxTokensField: model.compat.maxTokensField ?? detected.maxTokensField,
        requiresToolResultName: model.compat.requiresToolResultName ?? detected.requiresToolResultName,
        requiresAssistantAfterToolResult: model.compat.requiresAssistantAfterToolResult ?? detected.requiresAssistantAfterToolResult,
        requiresThinkingAsText: model.compat.requiresThinkingAsText ?? detected.requiresThinkingAsText,
        requiresReasoningContentOnAssistantMessages: model.compat.requiresReasoningContentOnAssistantMessages ??
            detected.requiresReasoningContentOnAssistantMessages,
        thinkingFormat: model.compat.thinkingFormat ?? detected.thinkingFormat,
        openRouterRouting: model.compat.openRouterRouting ?? {},
        vercelGatewayRouting: model.compat.vercelGatewayRouting ?? detected.vercelGatewayRouting,
        chatTemplateKwargs: model.compat.chatTemplateKwargs ?? detected.chatTemplateKwargs,
        zaiToolStream: model.compat.zaiToolStream ?? detected.zaiToolStream,
        supportsStrictMode: model.compat.supportsStrictMode ?? detected.supportsStrictMode,
        supportsOpenAIGrammarTools: model.compat.supportsOpenAIGrammarTools ?? detected.supportsOpenAIGrammarTools,
        cacheControlFormat: model.compat.cacheControlFormat ?? detected.cacheControlFormat,
        sendSessionAffinityHeaders: model.compat.sendSessionAffinityHeaders ?? detected.sendSessionAffinityHeaders,
        deferredToolsMode: model.compat.deferredToolsMode ?? detected.deferredToolsMode,
        sessionAffinityFormat: model.compat.sessionAffinityFormat ?? detected.sessionAffinityFormat,
        supportsLongCacheRetention: model.compat.supportsLongCacheRetention ?? detected.supportsLongCacheRetention,
    };
}
//# sourceMappingURL=openai-completions.js.map