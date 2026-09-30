/**
 * dsh-subagent-background-only — only expose background subagents.
 *
 * The model never sees `run_in_background`: the delegation-tool definition each
 * agent resolves is mutated in place (src/patch.ts), and one-shot delegation
 * tools are denied outright. See decisions/ for why a same-name shadow cannot
 * reach it.
 */
import { CONTINUABLE_TOOLS, ONESHOT_TOOLS, patchAgentTools, type AgentLike } from './patch'

export const name = 'subagent-background-only'

export const inject = ['agents', 'tools']

interface PluginCtx {
  logger: {
    info(message: string): void
    warn(message: string): void
    error(message: string): void
  }
  tools: {
    guard(guard: (exec: { name: string }) => string | undefined): () => void
  }
  agents: {
    list(): AgentLike[]
  }
  on(event: string, listener: (payload: any) => void): () => void
}

export function apply(ctx: PluginCtx): void {
  const warn = (message: string): void => {
    ctx.logger.warn(`${name}: ${message}`)
    console.warn(`[${name}] ${message}`)
  }

  const report = (message: string): void => {
    ctx.logger.info(`${name}: ${message}`)
    console.info(`[${name}] ${message}`)
  }

  const patchAgents = (label: string, agents: AgentLike[]): void => {
    let patched = 0
    for (const agent of agents) patched += patchAgentTools(agent, warn)
    if (patched > 0) report(`${label}: stripped run_in_background from ${patched} delegation tool(s)`)
  }

  // The guard and both listeners are owned by this plugin's fiber and removed
  // with it (verified against the real engine), so no disposer bookkeeping.
  ctx.tools.guard((exec) =>
    ONESHOT_TOOLS.includes(exec.name)
      ? `"${exec.name}" one-shot run denied by ${name}: delegate with background subagent only`
      : undefined,
  )

  patchAgents('mount', ctx.agents.list())
  ctx.on('agent/created', ({ agent }: { agent: AgentLike }) => patchAgents('agent/created', [agent]))
  ctx.on('tools/change', () => patchAgents('tools/change', ctx.agents.list()))

  report(
    `active: continuable delegation tools (${CONTINUABLE_TOOLS.join(', ')}) lose the run_in_background parameter and always run in background; one-shot declarations are left untouched with a warning; one-shot delegation tools (${ONESHOT_TOOLS.join(', ')}) are denied`,
  )
}
