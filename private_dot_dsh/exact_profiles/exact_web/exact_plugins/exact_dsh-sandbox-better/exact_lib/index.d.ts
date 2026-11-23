import { Context } from "@deepseek-ai/cordis";
/** The session subset a request needs: its working directory anchors relative paths. */
interface SessionLike {
  header: {
    cwd?: string;
  };
}
interface SessionAgent {
  readonly session: SessionLike;
}
interface ApprovalRequest {
  readonly agent: SessionAgent;
  readonly toolName: string;
  readonly callId?: string;
  readonly reason: string;
  readonly displayReason?: {
    readonly en: string;
    readonly [locale: string]: string;
  };
  readonly signal?: AbortSignal;
}
/** One assembled runtime-context contribution. */
interface ContextEntry {
  name: string;
  text: string;
}
/** The prompt registry's per-attempt context refresh, which bypasses the assemble waterfall. */
interface PromptRefresher {
  refreshContext(assembly: {
    contexts: ContextEntry[];
  }, context?: unknown): {
    contexts: ContextEntry[];
  };
}
/** The policy service's configured writable directories. */
interface WritableRootsOwner {
  additionalWritableRoots?: readonly string[];
}
/** Host services the request tool consumes; every one is looked up when it is used. */
interface Host {
  readonly sandboxPolicy: {
    registerWritableRoot(session: unknown, directory: string): () => void;
  };
  readonly approval?: {
    request(request: ApprovalRequest): Promise<string>;
  };
  readonly tools?: {
    register(tool: unknown, options?: {
      when?: (context: {
        agent: SessionAgent;
      }) => boolean;
    }): () => void;
  };
  /** The sandbox mode this agent's next call would run under. */
  readonly modeOf?: (agent: SessionAgent) => string;
  readonly effect?: (callback: () => () => void, label?: string) => unknown;
}
declare const name = "dsh-sandbox-better";
declare const inject: string[];
declare const TOOL_NAME = "request_write_access";
/** Expand `~`, anchor relative paths at the session workspace, and resolve symlinks. */
declare function resolveDirectory(session: SessionLike, input: string): string;
/** Writable directories that can actually be enforced; a missing one would reject the whole policy. */
declare function reachableDirectories(paths: readonly string[]): string[];
/** Drop configured writable directories that no longer exist, restoring the list when the effect unloads. */
declare function ignoreMissingRoots(policy: WritableRootsOwner): () => void;
/**
 * Re-apply the deployment-list strip to refreshed runtime contexts.
 *
 * `systemPrompt.refreshContext()` re-resolves every context provider before
 * each attempt, discarding what the `system-prompt/assemble` waterfall wrote,
 * so the strip has to sit on the refresh path the model input actually uses.
 */
declare function stripRefreshedContexts(prompt: PromptRefresher): () => void;
/** Register the request tool. */
declare function registerRequestTool(host: Host): void;
/**
 * Mount the request tool and the tolerant reading of the escalation arguments. Nothing here belongs to one sandbox backend: the
 * writable directory is a `sandbox-policy` registration, so it lands on every
 * provider.
 */
declare function apply(ctx: Context): void;
declare const _default: {
  name: string;
  apply: typeof apply;
  inject: string[];
};
export { Host, SessionLike, TOOL_NAME, apply, _default as default, ignoreMissingRoots, inject, name, reachableDirectories, registerRequestTool, resolveDirectory, stripRefreshedContexts };