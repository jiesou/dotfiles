//#region src/index.d.ts
/**
 * dsh-tool-deny — remove named tools from agent visibility.
 *
 * Applies the native `tools.restrict({ deny })` mask to every agent scope
 * (`agent/created` + adoption of already-live agents). Denied names never
 * enter the model request and never dispatch (UNKNOWN_TOOL) — identical to a
 * tool that was never registered — while every other global tool stays
 * untouched ("deny masks admit later unnamed globals").
 *
 * Ordering safety: `restrict()` throws on names that are not yet registered
 * (e.g. an MCP server still completing discovery at host startup). The mask
 * is a name-snapshot, so we retry with bounded backoff until one application
 * succeeds; later re-registrations keep the same public name and stay denied.
 *
 * A name that NEVER registers (e.g. a disabled MCP server's tools) must not
 * retry forever: after a bounded attempt window the plugin gives up and logs
 * a loud error naming the missing tools, so a stale deny list is never silent.
 *
 * Logging note: in the web profile `ctx.logger` messages are buffered without
 * a console exporter, so plugin warnings/errors would be invisible. Every
 * diagnostic is therefore ALSO emitted to `console`, which reaches the
 * journal / server log regardless of profile.
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
  agents: {
    list(): AgentScope[];
  };
  on(event: 'agent/created', listener: (payload: {
    agent: AgentScope;
  }) => void): () => void;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  effect(fn: () => () => void, label: string): unknown;
}
declare const name = "tool-deny";
declare const inject: string[];
declare function apply(ctx: PluginCtx, config?: {
  denyTools?: unknown;
}): void;
//#endregion
export { apply, inject, name };