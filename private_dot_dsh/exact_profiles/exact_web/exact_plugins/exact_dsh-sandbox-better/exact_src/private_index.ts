import { realpathSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join, resolve as resolvePath } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { grantDisplayReason } from './locales'
import { stripAdditionalRoots } from './policy-text'
import { normalizePermissionArgs } from './tolerate'

/** The session subset a request needs: its working directory anchors relative paths. */
export interface SessionLike {
  header: { cwd?: string }
}

interface SessionAgent {
  readonly session: SessionLike
}

interface ToolRunContextLike {
  readonly agent?: SessionAgent
  readonly callId?: string
  readonly signal?: AbortSignal
}

interface ToolArgs {
  readonly path?: string
}

interface ApprovalRequest {
  readonly agent: SessionAgent
  readonly toolName: string
  readonly callId?: string
  readonly reason: string
  readonly displayReason?: { readonly en: string; readonly [locale: string]: string }
  readonly signal?: AbortSignal
}

interface ToolExecutionLike {
  readonly name: string
  readonly arguments: unknown
  readonly agent?: { readonly session: unknown }
}

interface SandboxPolicyLike {
  resolve(request?: { session?: unknown }): { mode: string }
}

/** Host events this plugin joins; the host owns their signatures. */
interface Hooks {
  'tools/pre-execute'(exec: ToolExecutionLike, next: () => Promise<unknown>): Promise<unknown>
}

/** One assembled runtime-context contribution. */
interface ContextEntry {
  name: string
  text: string
}

/** The prompt registry's per-attempt context refresh, which bypasses the assemble waterfall. */
interface PromptRefresher {
  refreshContext(
    assembly: { contexts: ContextEntry[] },
    context?: unknown,
  ): { contexts: ContextEntry[] }
}

/** The policy service's configured writable directories. */
interface WritableRootsOwner {
  additionalWritableRoots?: readonly string[]
}

/** Host services the request tool consumes; every one is looked up when it is used. */
export interface Host {
  readonly sandboxPolicy: { registerWritableRoot(session: unknown, directory: string): () => void }
  readonly approval?: { request(request: ApprovalRequest): Promise<string> }
  readonly tools?: {
    register(tool: unknown, options?: { when?: (context: { agent: SessionAgent }) => boolean }): () => void
  }
  /** The sandbox mode this agent's next call would run under. */
  readonly modeOf?: (agent: SessionAgent) => string
  readonly effect?: (callback: () => () => void, label?: string) => unknown
}

export const name = 'dsh-sandbox-better'
export const inject = ['tools', 'sandboxPolicy']

export const TOOL_NAME = 'request_write_access'

function resolveMode(ctx: Context, session: unknown): string {
  try {
    if (session === undefined) return 'workspace-write'
    return (ctx.get('sandboxPolicy') as SandboxPolicyLike).resolve({ session }).mode
  } catch {
    return 'workspace-write'
  }
}

/** Expand `~`, anchor relative paths at the session workspace, and resolve symlinks. */
export function resolveDirectory(session: SessionLike, input: string): string {
  const raw = input.trim()
  if (raw === '') throw new Error(`${TOOL_NAME}: a directory is required`)
  const expanded = raw === '~'
    ? homedir()
    : raw.startsWith('~/') ? join(homedir(), raw.slice(2)) : raw
  const base = session.header.cwd ?? process.cwd()
  const absolute = isAbsolute(expanded) ? expanded : resolvePath(base, expanded)
  let stats
  try {
    stats = statSync(absolute)
  } catch {
    throw new Error(`${TOOL_NAME}: "${raw}" does not exist`)
  }
  if (!stats.isDirectory()) throw new Error(`${TOOL_NAME}: "${raw}" is not a directory`)
  // The enforcing host rejects symlinked roots, so the request carries the physical path.
  return realpathSync(absolute)
}

/** Writable directories that can actually be enforced; a missing one would reject the whole policy. */
export function reachableDirectories(paths: readonly string[]): string[] {
  return paths.filter((path) => {
    try {
      return statSync(path).isDirectory()
    } catch {
      return false
    }
  })
}

/** Drop configured writable directories that no longer exist, restoring the list when the effect unloads. */
export function ignoreMissingRoots(policy: WritableRootsOwner): () => void {
  const roots = policy.additionalWritableRoots
  if (roots === undefined) return () => {}
  const reachable = reachableDirectories(roots)
  if (reachable.length === roots.length) return () => {}
  const descriptor = Object.getOwnPropertyDescriptor(policy, 'additionalWritableRoots')
  Object.defineProperty(policy, 'additionalWritableRoots', { ...descriptor, value: Object.freeze(reachable) })
  for (const root of roots) {
    if (!reachable.includes(root)) {
      console.warn(`[sandbox-better] ignoring missing writable directory ${JSON.stringify(root)}`)
    }
  }
  return () => {
    if (descriptor === undefined) delete policy.additionalWritableRoots
    else Object.defineProperty(policy, 'additionalWritableRoots', descriptor)
  }
}

/**
 * Re-apply the deployment-list strip to refreshed runtime contexts.
 *
 * `systemPrompt.refreshContext()` re-resolves every context provider before
 * each attempt, discarding what the `system-prompt/assemble` waterfall wrote,
 * so the strip has to sit on the refresh path the model input actually uses.
 */
export function stripRefreshedContexts(prompt: PromptRefresher): () => void {
  const original = prompt.refreshContext
  if (typeof original !== 'function') return () => {}
  const patched = function stripped(this: PromptRefresher, assembly: { contexts: ContextEntry[] }, context?: unknown) {
    const refreshed = original.call(this, assembly, context)
    for (const entry of refreshed.contexts) {
      if (entry.name === 'sandbox:policy') entry.text = stripAdditionalRoots(entry.text)
    }
    return refreshed
  }
  prompt.refreshContext = patched
  return () => {
    if (prompt.refreshContext === patched) prompt.refreshContext = original
  }
}

function toolDefinition(host: Host): unknown {
  return {
    name: TOOL_NAME,
    description: 'Call this after "file access denied", then retry command. '
      + 'The request will asks the user for approval. '
      + 'Under workspace-write mode, everything else is read-only, so use this to precisely obtain write access. ',
    parameters: {
      path: {
        type: 'string',
        description: 'Directory, absolute or relative to the workspace.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['path'],
        properties: {
          path: { type: 'string' },
        },
      },
      render: (_args: unknown, value: { path: string }) => [{
        type: 'text',
        text: `${value.path} is writable for this session.`,
      }],
    },
    async execute(args: ToolArgs, exec: ToolRunContextLike) {
      const agent = exec.agent
      if (agent === undefined) throw new Error(`${TOOL_NAME}: this call has no session to request access for`)
      const path = args.path?.trim() ?? ''
      if (path === '') throw new Error(`${TOOL_NAME}: path is required`)
      const dir = resolveDirectory(agent.session, path)
      const approval = host.approval
      if (approval === undefined) throw new Error(`${TOOL_NAME}: this composition has no approval service`)
      let outcome: string
      try {
        outcome = await approval.request({
          agent,
          toolName: TOOL_NAME,
          ...exec.callId === undefined ? {} : { callId: exec.callId },
          reason: `Allow writes under ${dir} for this session?`,
          displayReason: grantDisplayReason(dir),
          ...exec.signal === undefined ? {} : { signal: exec.signal },
        })
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error)
        throw new Error(`${TOOL_NAME}: the approval request failed: ${reason}`)
      }
      if (outcome !== 'allowed-once') {
        throw new Error(`${TOOL_NAME}: the user did not allow writes under ${dir} (${outcome})`)
      }
      host.sandboxPolicy.registerWritableRoot(agent.session, dir)
      return { path: dir }
    },
  }
}

/** Register the request tool. */
export function registerRequestTool(host: Host): void {
  const register = (): (() => void) => {
    const tools = host.tools
    if (tools === undefined) return () => {}
    return tools.register(toolDefinition(host), {
      // Full access already allows every path; a request would only confuse.
      when: ({ agent }) => host.modeOf?.(agent) !== 'danger-full-access',
    })
  }
  if (host.effect === undefined) {
    register()
    return
  }
  host.effect(register, 'sandbox-better permission requests')
}

/**
 * Mount the request tool and the tolerant reading of the escalation arguments. Nothing here belongs to one sandbox backend: the
 * writable directory is a `sandbox-policy` registration, so it lands on every
 * provider.
 */
export function apply(ctx: Context): void {
  const on = ctx.on.bind(ctx) as unknown as <K extends keyof Hooks>(name: K, listener: Hooks[K]) => void
  registerRequestTool({
    get sandboxPolicy() {
      return ctx.get('sandboxPolicy') as Host['sandboxPolicy']
    },
    get approval() {
      return ctx.get('approval') as Host['approval']
    },
    get tools() {
      return ctx.get('tools') as Host['tools']
    },
    modeOf: (agent) => resolveMode(ctx, agent.session),
    effect: (callback, label) => ctx.effect(callback, label),
  })
  ctx.effect(
    () => ignoreMissingRoots(ctx.get('sandboxPolicy') as WritableRootsOwner),
    'sandbox-better: reachable writable directories',
  )
  ctx.inject(['systemPrompt'], (scope) => {
    scope.effect(
      () => stripRefreshedContexts(scope.get('systemPrompt') as PromptRefresher),
      'sandbox-better: trimmed policy context',
    )
  })
  on('tools/pre-execute', (exec, next) => {
    try {
      const normalized = normalizePermissionArgs(
        exec.name,
        exec.arguments,
        resolveMode(ctx, exec.agent?.session),
      )
      if (normalized !== undefined) (exec as { arguments: unknown }).arguments = normalized
    } catch {
      // A call that cannot be normalized runs exactly as the model wrote it.
    }
    return next()
  })
}

export default { name, apply, inject }
