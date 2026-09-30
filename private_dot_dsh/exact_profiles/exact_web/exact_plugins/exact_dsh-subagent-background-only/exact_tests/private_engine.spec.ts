/**
 * Regression tests against the REAL engine (`@deepseek-ai/dsh-tools` +
 * `@deepseek-ai/dsh-scope`), not hand-written fakes.
 *
 * WHY THIS FILE EXISTS
 *
 * The Web surface mounts each agent preset as a STANDING SCOPE and registers
 * the delegation tools into that scope's layer; `dsh-base` keeps the same rows
 * process-wide for the TUI/headless surfaces, where they land in the GLOBAL
 * layer. So `tools.get("subagent")` — which reads the GLOBAL view — resolves
 * the tool on headless and returns `undefined` on Web. Fakes cannot tell those
 * two layers apart, and a headless end-to-end run cannot either: three
 * "verified" fixes shipped on headless evidence while Web stayed broken.
 *
 * These tests build the Web shape (preset standing scope + agent child scope)
 * out of the engine's own primitives and assert on `schemas(agent)` — the exact
 * projection the model's tool catalog is built from.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { UPSTREAM_WORDING, patchAgentTools } from '../src/patch'

/**
 * Locate the deployed dsh engine's internal packages through the `dsh`
 * executable, so the tests bind to the engine this machine actually runs.
 * @returns the engine's `node_modules` directory, or `undefined` when dsh is
 *   not installed (the suite then skips rather than failing on a bare checkout).
 */
function engineModules(): string | undefined {
  try {
    const binary = execFileSync('bash', ['-lc', 'command -v dsh'], { encoding: 'utf8' }).trim()
    const entry = realpathSync(binary)
    // <prefix>/lib/node_modules/@deepseek-ai/dsh/lib/bin.js -> .../dsh/node_modules
    const modules = join(dirname(dirname(entry)), 'node_modules')
    return existsSync(join(modules, '@deepseek-ai', 'dsh-tools', 'lib', 'index.js')) ? modules : undefined
  } catch {
    return undefined
  }
}

const MODULES = engineModules()

const SUBAGENT_SOURCE =
  MODULES === undefined
    ? undefined
    : readFileSync(join(MODULES, '@deepseek-ai', 'dsh-tool-subagent', 'lib', 'index.js'), 'utf8')

describe.skipIf(MODULES === undefined)('upstream wording this plugin keys on', () => {
  it('every sentence the patch detects or edits still exists in the installed engine', () => {
    // Mode discrimination and the description edit are prose-based (the output
    // schema is mode-independent, the config is not reachable from a plugin).
    // A reword must fail here rather than in production as a refusal or a
    // stripped parameter beside a prompt that still names it.
    for (const sentence of Object.values(UPSTREAM_WORDING)) {
      expect(SUBAGENT_SOURCE).toContain(sentence)
    }
  })
})

/**
 * The continuable wording `tool-subagent` emits under `backgroundMode:
 * continuable`, verbatim (the plugin keys on these sentences; the drift test
 * below fails if upstream rewords them).
 */
function continuableSpec(name: string) {
  return {
    name,
    description:
      'Delegate a task. This tool runs in the background by default, immediately returns a durable subagent id, and keeps the child conversation available for later turns. When that run settles, the runtime sends the parent a notice containing its outcome and any final assistant message; `send_message` steers the child\'s nearest step while it is running and starts a turn while it is idle. Set `run_in_background: false` only when your next action depends on receiving the result.',
    parameters: {
      description: { type: 'string', required: true },
      prompt: { type: 'string', required: true },
      run_in_background: {
        type: 'boolean',
        description:
          'Whether to run in the background and return a durable subagent id immediately. Defaults to true. Set false to wait for the result when your next action depends on it.',
      },
    },
    output: { schema: { type: 'string' }, render: () => 'ok' },
    execute: async () => 'ok',
  }
}

/** The one-shot wording, which must never be stripped. */
function oneShotSpec(name: string) {
  const spec = continuableSpec(name)
  spec.description =
    'Delegate a task. This call waits for the result by default. Set `run_in_background: true` to return a job id; collect with `job_output` and stop with `job_kill`.'
  spec.parameters.run_in_background.description =
    'Whether to run as a background job and return its id. Defaults to false; collect with job_output or stop with job_kill.'
  return spec
}

/**
 * Compose the Web shape: a preset standing scope owning the delegation tool and
 * an agent scope joining it by parentage.
 */
async function mountEngine(specs: Array<Record<string, unknown>>) {
  const modules = MODULES as string
  const { Context } = await import(/* @vite-ignore */ `${modules}/@deepseek-ai/cordis/lib/index.js`)
  const toolsMod = await import(/* @vite-ignore */ `${modules}/@deepseek-ai/dsh-tools/lib/index.js`)
  const systemPromptMod = await import(/* @vite-ignore */ `${modules}/@deepseek-ai/dsh-system-prompt/lib/index.js`)
  const { createScope } = await import(/* @vite-ignore */ `${modules}/@deepseek-ai/dsh-scope/lib/index.js`)

  const app = new Context()
  await app.plugin(systemPromptMod.default)
  await app.plugin(toolsMod.default)

  const preset = createScope(app, 'preset-standing')
  await new Promise<void>((resolve) => {
    preset.ctx.inject(['tools'], (scoped: any) => {
      for (const spec of specs) scoped.tools.register(toolsMod.defineTool(spec))
      resolve()
    })
  })

  const agent: any = { id: 'agent-1' }
  // `dsh-agent-loop` declares `static inject = [..., "tools", ...]` and mints the
  // agent scope from ITS context; cordis propagates that inject map down the
  // scope contexts, which is why `agent.ctx.tools` is reachable in a real
  // session. Mirror exactly that, or the plugin's lookup would be tested against
  // a context shape no session has.
  const loopHost: { ctx?: any } = {}
  await app.plugin({
    name: 'loop-host',
    inject: ['tools'],
    apply(hostCtx: any) {
      loopHost.ctx = hostCtx
    },
  } as any)
  const agentScope = createScope(loopHost.ctx, agent, { parent: 'preset-standing' })
  agent.ctx = agentScope.ctx

  return {
    app,
    agent,
    /** The model-facing catalog for this agent, straight from the registry. */
    catalog: () =>
      app
        .get('tools')
        .schemas(agent)
        .map((schema: any) => ({
          name: schema.name,
          properties: Object.keys(schema.parameters.properties),
          description: schema.description,
        })),
  }
}

describe.skipIf(MODULES === undefined)('real engine: preset standing scope', () => {
  it('the global view misses the preset layer — the lookup that silently no-oped', async () => {
    const { app, agent } = await mountEngine([continuableSpec('subagent')])
    const tools = app.get('tools')
    // No scope reads the global layer only, where a preset row never appears.
    expect(tools.get('subagent')).toBeUndefined()
    // The agent is the scope key the loop mints, so this is the definition the
    // agent actually resolves.
    expect(tools.get('subagent', agent)).toBeDefined()
  })

  it('strips run_in_background from what the agent’s catalog reports', async () => {
    const { agent, catalog } = await mountEngine([continuableSpec('subagent')])
    expect(catalog()[0].properties).toContain('run_in_background')

    const warn = vi.fn()
    expect(patchAgentTools(agent, warn)).toBe(1)
    expect(warn).not.toHaveBeenCalled()

    const after = catalog()[0]
    expect(after.properties).toEqual(['description', 'prompt'])
    expect(after.description).toContain('always runs in the background')
    expect(after.description).not.toContain('run_in_background: false')
  })

  it('leaves a one-shot preset row untouched and warns once', async () => {
    const { agent, catalog } = await mountEngine([oneShotSpec('subagent_fork')])
    const warn = vi.fn()
    expect(patchAgentTools(agent, warn)).toBe(0)
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/subagent_fork: .*not backgroundMode: continuable/))
    expect(catalog()[0].properties).toContain('run_in_background')
  })
})
