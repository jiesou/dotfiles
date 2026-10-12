import { describe, expect, it, vi } from 'vitest'
import { apply } from '../src/index'
import { patchAgentTools, patchDefinition } from '../src/patch'

/** Loose shape for fixtures: `parameters` is edited freely, `execute` is a spy. */
interface Fixture {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
  execute: (args: any, exec: any) => Promise<any>
}

/** A definition shaped like the one `tool-subagent` registers under continuable mode. */
function makeContinuableDefinition(name: string): Fixture {
  return {
    name,
    description:
      'Delegate a task. It runs in the background by default and returns a subagent id you can continue with `send_message`; you are notified when the run settles.',
    parameters: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Short label.' },
        prompt: { type: 'string', description: 'The task.' },
        run_in_background: {
          type: 'boolean',
          description: 'Defaults to true. Set false only when your next action depends on the result.',
        },
      },
      required: ['description', 'prompt'],
    },
    execute: vi.fn(async (args: any) => args),
  }
}

/** The one-shot wording: no continuable promise, so stripping must be refused. */
function makeOneShotDefinition(name: string): Fixture {
  const definition = makeContinuableDefinition(name)
  definition.description = 'Delegate a task. This call waits for the result by default.'
  definition.parameters.properties['run_in_background'] = {
    type: 'boolean',
    description:
      'Run as a background job and return its id (collect with job_output, stop with job_kill). Defaults to false.',
  }
  return definition
}

function makeAgent(id: string, tools: Map<string, any>) {
  /** The `scope` argument each `get` received, in call order. */
  const scopes: unknown[] = []
  const agent = {
    id,
    scopes,
    ctx: {
      tools: {
        get: (name: string, scope?: unknown) => {
          scopes.push(scope)
          return tools.get(name)
        },
      },
    },
  }
  return agent
}

function makeCtx(agents: Array<ReturnType<typeof makeAgent>>) {
  let guardFn: ((exec: { name: string }) => string | undefined) | undefined
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const listeners = new Map<string, Array<(payload: any) => void>>()
  const ctx: any = {
    logger,
    tools: { guard: (fn: any) => ((guardFn = fn), () => {}) },
    agents: { list: () => agents },
    on: (event: string, listener: (payload: any) => void) => {
      const list = listeners.get(event) ?? []
      list.push(listener)
      listeners.set(event, list)
      return () => {}
    },
    effect: (fn: () => () => void) => (ctx.dispose = fn(), undefined),
  }
  const fire = (event: string, payload: any = {}) => {
    for (const listener of listeners.get(event) ?? []) listener(payload)
  }
  return { ctx, logger, guardOf: () => guardFn!, fire }
}

function makeTools() {
  return new Map([
    ['subagent', makeContinuableDefinition('subagent')],
    ['subagent_fork', makeContinuableDefinition('subagent_fork')],
  ])
}

describe('patchDefinition (in-place mutation)', () => {
  it('strips the parameter, stops teaching false, and still forwards background=true', async () => {
    const definition = makeContinuableDefinition('subagent')
    const originalExecute = definition.execute

    expect(patchDefinition(definition)).toEqual({ patched: true })
    expect(definition.parameters.properties).not.toHaveProperty('run_in_background')
    expect(definition.parameters.required ?? []).not.toContain('run_in_background')
    expect(definition.parameters.properties).toHaveProperty('description')
    expect(definition.parameters.properties).toHaveProperty('prompt')
    expect(definition.description).not.toMatch(/run_in_background/)
    expect(definition.description).toMatch(/always runs in the background/)

    await definition.execute({ description: 'd', prompt: 'p' }, {})
    expect(originalExecute).toHaveBeenCalledWith(
      { description: 'd', prompt: 'p', run_in_background: true },
      {},
    )
  })

  it('overwrites a hallucinated run_in_background: false', async () => {
    const definition = makeContinuableDefinition('subagent')
    const originalExecute = definition.execute
    patchDefinition(definition)
    await definition.execute({ prompt: 'p', run_in_background: false }, {})
    expect(originalExecute).toHaveBeenCalledWith({ prompt: 'p', run_in_background: true }, {})
  })

  it('is idempotent: a second patch is a no-op and does not re-wrap execute', async () => {
    const definition = makeContinuableDefinition('subagent')
    const originalExecute = definition.execute
    expect(patchDefinition(definition).patched).toBe(true)
    const afterFirst = definition.execute
    expect(patchDefinition(definition)).toEqual({ patched: false })
    expect(definition.execute).toBe(afterFirst)

    // One call through the wrapper must reach the original exactly once —
    // a double wrap would call it twice.
    await definition.execute({ prompt: 'p' }, {})
    expect(originalExecute).toHaveBeenCalledTimes(1)
  })

  it('REFUSES a definition that does not advertise continuable semantics', () => {
    const definition = makeOneShotDefinition('subagent_codex')
    const outcome = patchDefinition(definition)
    expect(outcome.patched).toBe(false)
    expect(outcome.reason).toMatch(/flip its default route to foreground/)
    // Untouched: stripping here would silently make it foreground-only.
    expect(definition.parameters.properties).toHaveProperty('run_in_background')
  })

  it('REFUSES when the rewritten description would still name the parameter', () => {
    // Upstream moving the `false`-teaching back into the TOOL description must
    // not yield a stripped schema beside a prompt that still names the
    // parameter: detection and edit have to agree.
    const definition = makeContinuableDefinition('subagent')
    definition.description += ' Set `run_in_background: false` to wait for the result.'
    const outcome = patchDefinition(definition)
    expect(outcome.patched).toBe(false)
    expect(outcome.reason).toMatch(/would still name `run_in_background`/)
    expect(definition.parameters.properties).toHaveProperty('run_in_background')
    expect(definition.description).not.toMatch(/always runs in the background/)
  })

  it('marks an already-stripped definition so execute is never re-wrapped', () => {
    const definition = makeContinuableDefinition('subagent')
    delete definition.parameters.properties['run_in_background']
    const originalExecute = definition.execute
    expect(patchDefinition(definition)).toEqual({ patched: false })
    expect(definition.execute).toBe(originalExecute)
  })
})

describe('patchAgentTools', () => {
  it('passes the agent as the lookup scope (regression: the global view misses the preset layer)', () => {
    const tools = makeTools()
    const agent = makeAgent('a1', tools)
    patchAgentTools(agent as any, vi.fn())
    // Every lookup must name the agent: `tools.get(name)` alone reads the
    // global view, where a preset-layer definition is absent — the silent
    // no-op this plugin shipped with.
    expect(agent.scopes).toEqual([agent, agent])
  })

  it('patches both continuable tools the agent resolves', () => {
    const tools = makeTools()
    const agent = makeAgent('a1', tools)
    const warn = vi.fn()
    expect(patchAgentTools(agent as any, warn)).toBe(2)
    expect(warn).not.toHaveBeenCalled()
    for (const name of ['subagent', 'subagent_fork']) {
      expect(tools.get(name)!.parameters.properties).not.toHaveProperty('run_in_background')
    }
  })

  it('reports and skips a non-continuable declaration instead of stripping it', () => {
    const tools = new Map([['subagent', makeOneShotDefinition('subagent')]])
    const agent = makeAgent('a1', tools)
    const warn = vi.fn()
    expect(patchAgentTools(agent as any, warn)).toBe(0)
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/subagent: .*not backgroundMode: continuable/))
    expect(tools.get('subagent')!.parameters.properties).toHaveProperty('run_in_background')
  })

  it('warns once per refused definition across repeated tools/change top-ups', () => {
    const tools = new Map([['subagent', makeOneShotDefinition('subagent')]])
    const agent = makeAgent('a1', tools)
    const warn = vi.fn()
    patchAgentTools(agent as any, warn)
    patchAgentTools(agent as any, warn)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('reports a get() that throws instead of swallowing it', () => {
    const agent = {
      id: 'a1',
      ctx: {
        tools: {
          get: () => {
            throw new Error('boom')
          },
        },
      },
    }
    const warn = vi.fn()
    expect(patchAgentTools(agent as any, warn)).toBe(0)
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/subagent: tools\.get failed for agent a1: .*boom/))
  })
})

describe('apply', () => {
  it('patches alive agents at mount and late agents on agent/created', () => {
    const tools = makeTools()
    const alive = makeAgent('a1', tools)
    const { ctx, fire } = makeCtx([alive])
    apply(ctx)
    expect(tools.get('subagent')!.parameters.properties).not.toHaveProperty('run_in_background')

    const lateTools = makeTools()
    const late = makeAgent('a2', lateTools)
    fire('agent/created', { agent: late })
    expect(lateTools.get('subagent')!.parameters.properties).not.toHaveProperty('run_in_background')
  })

  it('patches agents that appear only on tools/change', () => {
    const agents: Array<ReturnType<typeof makeAgent>> = []
    const tools = makeTools()
    const { ctx, fire } = makeCtx(agents)
    apply(ctx)
    const late = makeAgent('a1', tools)
    agents.push(late)
    fire('tools/change')
    expect(tools.get('subagent')!.parameters.properties).not.toHaveProperty('run_in_background')
  })

  it('one-shot tools are denied; subagent and unrelated tools are allowed', () => {
    const { ctx, guardOf } = makeCtx([])
    apply(ctx)
    const guard = guardOf()
    expect(guard({ name: 'subagent_codex' })).toMatch(/one-shot/)
    expect(guard({ name: 'subagent_claude_code' })).toMatch(/one-shot/)
    expect(guard({ name: 'subagent' })).toBeUndefined()
    expect(guard({ name: 'bash' })).toBeUndefined()
  })
})

describe('mode discrimination (regression: real headless subagent_fork is one-shot)', () => {
  it('a one-shot-declared subagent_fork is refused, matching the headless preset', () => {
    // dsh-headless configures toolName: subagent_fork with
    // backgroundMode: one-shot. Stripping its parameter would silently make
    // every delegation foreground-only, so the guard must refuse it.
    const definition = makeOneShotDefinition('subagent_fork')
    const outcome = patchDefinition(definition)
    expect(outcome.patched).toBe(false)
    expect(outcome.reason).toMatch(/not backgroundMode: continuable/)
    expect(definition.parameters.properties).toHaveProperty('run_in_background')
    // Judged once, so repeated top-ups stay silent — the verdict is read off this
    // very object, so re-judging it cannot change.
    expect(patchDefinition(definition)).toEqual({ patched: false })
  })

  it('requires BOTH signals: continuable wording alone is not enough', () => {
    const definition = makeContinuableDefinition('subagent')
    // Keep the continuable tool description but make the parameter say false.
    definition.parameters.properties['run_in_background'] = {
      type: 'boolean',
      description:
        'Run as a background job and return its id (collect with job_output, stop with job_kill). Defaults to false.',
    }
    expect(patchDefinition(definition).patched).toBe(false)
    expect(definition.parameters.properties).toHaveProperty('run_in_background')
  })

  it('requires BOTH signals: a true-defaulting parameter alone is not enough', () => {
    const definition = makeContinuableDefinition('subagent')
    definition.description = 'Delegate a task.'
    expect(patchDefinition(definition).patched).toBe(false)
    expect(definition.parameters.properties).toHaveProperty('run_in_background')
  })
})
