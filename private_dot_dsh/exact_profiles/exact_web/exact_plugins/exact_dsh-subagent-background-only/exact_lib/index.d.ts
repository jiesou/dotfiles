//#region src/patch.d.ts
/**
 * Marks a definition this plugin already judged, so repeated `tools/change`
 * top-ups neither re-wrap `execute` nor re-report a refusal. `Symbol.for`, not a
 * module-local symbol: HMR and duplicate module instances must agree.
 */
declare const JUDGED: unique symbol;
interface ToolParameters {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
}
interface ToolDefinitionLike {
  description: string;
  parameters?: ToolParameters;
  execute: (args: any, exec: any) => Promise<any>;
  [JUDGED]?: boolean;
}
interface AgentLike {
  id: string;
  ctx: {
    tools: {
      /**
       * `scope` is the agent itself: `dsh-agent-loop` mints the agent's scope
       * with the agent as the key, which is why every upstream reader passes it
       * (`tools.get("read", agent)`, `tools.schemas(agent)`). Omitting it reads
       * the GLOBAL view, and `ToolRuntime.view(undefined)` sees the global layer
       * only — never the preset layer these delegation tools are registered
       * into. That omission silently matched nothing.
       */
      get(name: string, scope?: unknown): ToolDefinitionLike | undefined;
    };
  };
}
//#endregion
//#region src/index.d.ts
declare const name = "subagent-background-only";
declare const inject: string[];
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
  };
  agents: {
    list(): AgentLike[];
  };
  on(event: string, listener: (payload: any) => void): () => void;
}
declare function apply(ctx: PluginCtx): void;
//#endregion
export { apply, inject, name };