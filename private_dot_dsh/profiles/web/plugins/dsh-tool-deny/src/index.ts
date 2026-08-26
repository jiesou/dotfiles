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
  id: string
  ctx: { tools: { restrict(options: { deny: string[] }): () => void } }
}

interface PluginCtx {
  logger: {
    info(message: string): void
    warn(message: string): void
    error(message: string): void
  }
  agents: { list(): AgentScope[] }
  on(event: 'agent/created', listener: (payload: { agent: AgentScope }) => void): () => void
  setTimeout(fn: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
  effect(fn: () => () => void, label: string): unknown
}

interface State {
  lift?: (() => void) | undefined
  retry?: unknown
  attempts?: number
}

export const name = 'tool-deny'

export const inject = ['agents', 'timer']

// Bounded retry: tools may register late (MCP discovery at host startup), but
// a tool that never appears must fail loudly instead of retrying forever.
const MAX_RETRIES = 10
const RETRY_BASE_MS = 500
const RETRY_CAP_MS = 30000

export function apply(ctx: PluginCtx, config: { denyTools?: unknown } = {}): void {
  // Diagnostics go to both the (possibly invisible) cordis logger and console.
  const log = {
    info: (msg: string) => {
      ctx.logger.info(msg)
      console.info(`[tool-deny] ${msg}`)
    },
    warn: (msg: string) => {
      ctx.logger.warn(msg)
      console.warn(`[tool-deny] ${msg}`)
    },
    error: (msg: string) => {
      ctx.logger.error(msg)
      console.error(`[tool-deny] ${msg}`)
    },
  }

  const denyTools = (Array.isArray(config.denyTools) ? config.denyTools : [])
    .map((tool) => String(tool).trim())
    .filter(Boolean)
  if (denyTools.length === 0) {
    log.warn('`denyTools` is empty — nothing to deny (add tool names via the profile patch row)')
    return
  }

  /** Per-agent state: active mask disposer + pending retry timer. */
  const states = new WeakMap<AgentScope, State>()

  const clearRetry = (state: State): void => {
    if (state.retry !== undefined) {
      ctx.clearTimeout(state.retry)
      state.retry = undefined
    }
  }

  const teardown = (state: State): void => {
    clearRetry(state)
    if (state.lift !== undefined) {
      try {
        state.lift()
      } catch {
        // Agent ctx may already be disposed — the layer dies with it anyway.
      }
      state.lift = undefined
    }
  }

  const install = (agent: AgentScope, state: State): void => {
    try {
      const lift = agent.ctx.tools.restrict({ deny: denyTools })
      state.lift = lift
      clearRetry(state)
      const retries = state.attempts ?? 0
      log.info(
        `masked ${denyTools.join(', ')} from agent ${agent.id}` +
          (retries > 0 ? ` (after ${retries} retr${retries === 1 ? 'y' : 'ies'})` : ''),
      )
    } catch (error) {
      const message = String((error as Error | undefined)?.message ?? error)
      if (!message.includes('unknown global tool')) {
        // Not the "not registered yet" case — surface it and stop.
        clearRetry(state)
        log.error(`failed to mask agent ${agent.id}: ${message}`)
        return
      }
      // Named tool(s) not registered yet — retry, but bounded.
      const attempts = (state.attempts ?? 0) + 1
      state.attempts = attempts
      if (attempts === 1) {
        log.warn(
          `tools ${denyTools.join(', ')} not registered yet for agent ${agent.id}; ` +
            `retrying (up to ${MAX_RETRIES} times)…`,
        )
      }
      if (attempts > MAX_RETRIES) {
        clearRetry(state)
        log.error(
          `gave up denying ${denyTools.join(', ')} from agent ${agent.id} after ` +
            `${MAX_RETRIES} retries — these tools never registered. Every name in denyTools must ` +
            `match a live tool; a disabled MCP server's tools will never appear. ` +
            `Missing: ${denyTools.join(', ')}.`,
        )
        return
      }
      if (state.retry === undefined) {
        const delay = Math.min(RETRY_BASE_MS * 2 ** (attempts - 1), RETRY_CAP_MS)
        state.retry = ctx.setTimeout(() => {
          state.retry = undefined
          install(agent, state)
        }, delay)
      }
    }
  }

  const adopt = (agent: AgentScope): void => {
    if (states.has(agent)) return
    const state: State = {}
    states.set(agent, state)
    install(agent, state)
  }

  ctx.effect(() => {
    for (const agent of ctx.agents.list()) adopt(agent)
    const stop = ctx.on('agent/created', ({ agent }) => adopt(agent))
    return () => {
      stop()
      for (const agent of ctx.agents.list()) {
        const state = states.get(agent)
        if (state) teardown(state)
      }
    }
  }, 'tool-deny.lifecycle()')
}
