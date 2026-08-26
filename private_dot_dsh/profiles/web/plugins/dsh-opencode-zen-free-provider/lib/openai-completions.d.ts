/** Factory function for AssistantMessageEventStream (for use in extensions) */
export function createAssistantMessageEventStream(): AssistantMessageEventStream;
/** Fast deterministic hash to shorten long strings */
export function shortHash(str: any): string;
export function headersToRecord(headers: any): {};
export function providerHeadersToRecord(headers: any): {} | undefined;
/**
 * Repairs malformed JSON string literals by:
 * - escaping raw control characters inside strings
 * - doubling backslashes before invalid escape characters
 */
export function repairJson(json: any): string;
export function parseJsonWithRepair(json: any): any;
/**
 * Attempts to parse potentially incomplete JSON during streaming.
 * Always returns a valid object, even if the JSON is incomplete.
 *
 * @param partialJson The partial JSON string from streaming
 * @returns Parsed object or empty object if parsing fails
 */
export function parseStreamingJson(partialJson: any): any;
/**
 * Resolve a provider env value from scoped overrides, normal process.env, then
 * the duplicated Bun sandbox fallback for direct pi-ai consumers.
 */
export function getProviderEnvValue(name: any, env: any): any;
/**
 * Reproduce the retry behavior used by the OpenAI and Anthropic SDKs while making
 * their backoff sleep interruptible. Their built-in retry timers ignore the
 * request AbortSignal, so callers must invoke the SDK with `maxRetries: 0` and
 * wrap the request with this helper. Provider-requested delays above
 * `maxRetryDelayMs` fail immediately (60 seconds by default); set it to zero to
 * disable the limit.
 */
export function retryProviderRequest(request: any, options?: {}): Promise<any>;
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
export function sanitizeSurrogates(text: any): any;
export function normalizeProviderError(error: any): {
    message: string;
    messageCarriesBody: boolean;
    status?: undefined;
    body?: undefined;
} | {
    status: any;
    body: any;
    message: string;
    messageCarriesBody: boolean;
};
/**
 * Compose a display string from a normalized error. When the message already
 * carries the body (Anthropic / `@google/genai` happy path) or no body/status
 * was extracted, the message is returned unchanged. Otherwise the status and
 * body are surfaced, with an optional provider prefix.
 *
 * - no prefix: `"<status>: <body>"`
 * - prefix:    `"<prefix> (<status>): <body>"`
 */
export function formatProviderError(norm: any, prefix: any): any;
export function truncateErrorText(text: any, maxChars: any): any;
export function safeJsonStringify(value: any): string;
export function calculateCost(model: any, usage: any): any;
export function getSupportedThinkingLevels(model: any): string[];
export function clampThinkingLevel(model: any, level: any): any;
export function convertMessages(model: any, context: any, compat: any, options: any): ({
    role: string;
    content: any;
    tool_call_id: any;
} | {
    role: string;
    tools: any;
} | {
    role: string;
    content: any;
})[];
export class EventStream {
    constructor(isComplete: any, extractResult: any);
    queue: any[];
    waiting: any[];
    done: boolean;
    finalResultPromise: Promise<any>;
    resolveFinalResult: any;
    isComplete: any;
    extractResult: any;
    push(event: any): void;
    end(result: any): void;
    result(): Promise<any>;
    [Symbol.asyncIterator](): AsyncGenerator<any, void, unknown>;
}
export class AssistantMessageEventStream extends EventStream {
    constructor();
}
export const MAX_PROVIDER_ERROR_BODY_CHARS: 4000;
export function stream(model: any, context: any, options: any): AssistantMessageEventStream;
export function streamSimple(model: any, context: any, options: any): AssistantMessageEventStream;
export function installZenUserAgent(ua: any): void;
