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
  id: string
  ctx: { tools: { restrict(options: { deny: string[] }): () => void } }
}

interface PluginCtx {
  logger: {
    info(message: string): void
    warn(message: string): void
    error(message: string): void
  }
  tools: {
    guard(guard: (exec: { name: string }) => string | undefined): () => void
    view(scope: unknown): { restrictableNames: Set<string> }
  }
  agents: { list(): AgentScope[] }
  on(event: string, listener: (payload: any) => void): () => void
  setTimeout(fn: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
  effect(fn: () => () => void, label: string): unknown
}

interface State {
  masked: Set<string>
  lifts: (() => void)[]
}

export const name = 'tool-deny'

export const inject = ['agents', 'timer', 'tools']

// One MCP server registering N tools fires N `tools/change` events in one
// tick — coalesce them into a single registry read.
const RECONCILE_DEBOUNCE_MS = 300

/**
 * Names quoted in a `tools.restrict()` unknown-global-tool error.
 * Returns undefined when the message is a different failure.
 */
export function parseUnknownTools(message: string): string[] | undefined {
  const match = /unknown global tools? (.*?); known global tools:/s.exec(message)
  if (!match) return undefined
  return [...match[1].matchAll(/"([^"]+)"/g)].map((hit) => hit[1]).filter(Boolean)
}

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

  /** Per-agent state: masked-so-far subset + active mask layers. */
  const states = new WeakMap<AgentScope, State>()
  /** Missing sets already warned about — each distinct set logs exactly once. */
  const warnedMissing = new Set<string>()
  let reconcileTimer: unknown
  let closed = false

  const knownGlobalTools = (): Set<string> => {
    try {
      return ctx.tools.view(undefined).restrictableNames ?? new Set<string>()
    } catch {
      return new Set<string>()
    }
  }

  const adopt = (agent: AgentScope, known: Set<string>): string[] => {
    let state = states.get(agent)
    if (!state) {
      state = { masked: new Set(), lifts: [] }
      states.set(agent, state)
    }
    const pending = denyTools.filter((tool) => !state.masked.has(tool))
    if (pending.length === 0) return []
    const available = pending.filter((tool) => known.has(tool))
    if (available.length === 0) return []
    const maskNow = (names: string[]): boolean => {
      if (names.length === 0) return true
      try {
        state.lifts.push(agent.ctx.tools.restrict({ deny: names }))
        for (const tool of names) state.masked.add(tool)
        return true
      } catch {
        return false
      }
    }
    if (maskNow(available)) return available
    // Raced away between the registry read and the call (or partial subset):
    // mask whatever the error leaves as known, defer the rest to the next
    // registry event. Single inline fallback — no retry timers.
    try {
      agent.ctx.tools.restrict({ deny: available })
      return []
    } catch (error) {
      const message = String((error as Error | undefined)?.message ?? error)
      if (!message.includes('unknown global tool')) {
        log.error(`failed to mask agent ${agent.id}: ${message}`)
        return []
      }
      const unknown = new Set(parseUnknownTools(message) ?? available)
      const knownPart = available.filter((tool) => !unknown.has(tool))
      if (maskNow(knownPart)) {
        scheduleReconcile()
        return knownPart
      }
      scheduleReconcile()
      return []
    }
  }

  const reconcile = (): void => {
    if (closed) return
    const known = knownGlobalTools()
    const newlyMasked = new Set<string>()
    let maskedAgents = 0
    for (const agent of ctx.agents.list()) {
      const masked = adopt(agent, known)
      if (masked.length > 0) {
        maskedAgents += 1
        for (const tool of masked) newlyMasked.add(tool)
      }
    }
    if (newlyMasked.size > 0) {
      log.info(`masked ${[...newlyMasked].sort().join(', ')} from ${maskedAgents} agent(s)`)
    }
    const missing = denyTools.filter((tool) => !known.has(tool))
    if (missing.length > 0) {
      const key = missing.slice().sort().join('\n')
      if (!warnedMissing.has(key)) {
        warnedMissing.add(key)
        log.warn(
          `tools ${missing.join(', ')} not registered (MCP server disabled or not yet discovered?) — ` +
            `tracking registry events, will mask on arrival.`,
        )
      }
    }
  }

  const scheduleReconcile = (): void => {
    if (closed || reconcileTimer !== undefined) return
    reconcileTimer = ctx.setTimeout(() => {
      reconcileTimer = undefined
      reconcile()
    }, RECONCILE_DEBOUNCE_MS)
  }

  ctx.effect(() => {
    // Execution backstop: name-based, so it covers tools that do not exist yet.
    const denySet = new Set(denyTools)
    const unguard = ctx.tools.guard((exec) =>
      denySet.has(exec.name) ? `tool-deny: "${exec.name}" is denied by denyTools` : undefined,
    )
    // Synchronous pass for the steady state; bursts arrive via tools/change.
    reconcile()
    const stopCreated = ctx.on('agent/created', () => reconcile())
    const stopChanged = ctx.on('tools/change', () => scheduleReconcile())
    return () => {
      closed = true
      stopCreated()
      stopChanged()
      unguard()
      if (reconcileTimer !== undefined) {
        ctx.clearTimeout(reconcileTimer)
        reconcileTimer = undefined
      }
      for (const agent of ctx.agents.list()) {
        const state = states.get(agent)
        if (!state) continue
        for (const lift of state.lifts.splice(0)) {
          try {
            lift()
          } catch {
            // Agent ctx may already be disposed — the layer dies with it anyway.
          }
        }
      }
    }
  }, 'tool-deny.lifecycle()')
}
