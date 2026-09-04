//#region src/index.d.ts
/**
 * dsh-tool-deny — remove named tools from agent visibility.
 *
 * Two complementary layers per denyTools entry:
 *
 * 1. Visibility mask (`tools.restrict({ deny })` per agent scope): denied
 *    names never enter the model request and never dispatch (UNKNOWN_TOOL) —
 *    identical to a tool that was never registered.
 * 2. Execution guard (`tools.guard()` global): denies the call even if it is
 *    somehow still visible (e.g. a registration that raced the mask). The
 *    guard matches on plain names, so it also covers tools that do not exist
 *    yet — including MCP servers enabled at runtime, long after startup.
 *
 * `restrict()` throws when ANY named tool is not yet registered, so the full
 * list can never be applied atomically while it names tools from a disabled
 * (or not-yet-discovered) MCP server. Each agent therefore tracks its
 * `masked` subset: every reconcile masks only the currently-known remainder,
 * and one missing name no longer poisons the mask for the live tools.
 *
 * Event hygiene (why startup no longer floods the log): `tools/change` is
 * the ONLY tool event in dsh-tools and it is a void broadcast — every
 * registration, every preset recomposition, even our own successful
 * `restrict()` emits it. There is no finer subscription. So the handler
 * never acts blindly: it first reads the global registry
 * (`tools.view(undefined).restrictableNames`) and returns silently when none
 * of the still-missing names appeared. Bursts (one MCP server registering N
 * tools = N events in one tick) are debounced into a single reconcile, and
 * our own mask success schedules a reconcile that finds nothing new and
 * stops — the loop terminates by construction instead of by log throttling.
 *
 * Logging is therefore bounded by real change: one `masked … from N
 * agent(s)` line per actual mask, one `not registered yet …` line per
 * distinct missing set. No per-agent retries, no per-event warnings.
 *
 * Logging note: in the web profile `ctx.logger` messages are buffered without
 * a console exporter, so every diagnostic is ALSO emitted to `console`, which
 * reaches the journal / server log regardless of profile.
 */
interface AgentScope {
  id: string;
  ctx: {
    tools: {
      restrict(options: {
        deny: string[];
      }): () => void;
    };
  };
}
interface PluginCtx {
  logger: {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
  };
  tools: {
    guard(guard: (exec: {
      name: string;
    }) => string | undefined): () => void;
    view(scope: unknown): {
      restrictableNames: Set<string>;
    };
  };
  agents: {
    list(): AgentScope[];
  };
  on(event: string, listener: (payload: any) => void): () => void;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  effect(fn: () => () => void, label: string): unknown;
}
declare const name = "tool-deny";
declare const inject: string[];
/**
 * Names quoted in a `tools.restrict()` unknown-global-tool error.
 * Returns undefined when the message is a different failure.
 */
declare function parseUnknownTools(message: string): string[] | undefined;
declare function apply(ctx: PluginCtx, config?: {
  denyTools?: unknown;
}): void;
//#endregion
export { apply, inject, name, parseUnknownTools };