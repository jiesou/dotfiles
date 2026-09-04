import { describe, expect, it, vi } from 'vitest'
import { apply, parseUnknownTools } from '../src/index'

describe('parseUnknownTools', () => {
  it('提取单复数报错中的未知工具名', () => {
    expect(
      parseUnknownTools(
        'tools.restrict() names unknown global tool "mcp__tinyfish__get_wallet"; known global tools: a, b',
      ),
    ).toEqual(['mcp__tinyfish__get_wallet'])
    expect(
      parseUnknownTools(
        'tools.restrict() names unknown global tools "a", "b"; known global tools: (none)',
      ),
    ).toEqual(['a', 'b'])
  })

  it('非 unknown 报错返回 undefined', () => {
    expect(parseUnknownTools('tools.restrict() requires a scoped context')).toBeUndefined()
  })
})

function makeHarness(known: Set<string>, agentIds = ['agent-1']) {
  const timers: Array<() => void> = []
  const listeners = new Map<string, Array<(payload: any) => void>>()
  let guardFn: ((exec: { name: string }) => string | undefined) | undefined
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const restrictCalls: Array<{ agent: string; deny: string[] }> = []
  const agents = agentIds.map((id) => ({
    id,
    ctx: {
      tools: {
        restrict: ({ deny }: { deny: string[] }) => {
          restrictCalls.push({ agent: id, deny: [...deny] })
          const unknown = deny.filter((tool) => !known.has(tool))
          if (unknown.length > 0) {
            throw new Error(
              `tools.restrict() names unknown global tool${unknown.length > 1 ? 's' : ''} ` +
                `${unknown.map((tool) => `"${tool}"`).join(', ')}; known global tools: ${[...known].sort().join(', ') || '(none)'}`,
            )
          }
          return () => {}
        },
      },
    },
  }))
  const ctx: any = {
    logger,
    tools: {
      guard: (fn: any) => ((guardFn = fn), () => {}),
      view: () => ({ restrictableNames: new Set(known) }),
    },
    agents: { list: () => agents },
    on: (event: string, listener: (payload: any) => void) => {
      const list = listeners.get(event) ?? []
      list.push(listener)
      listeners.set(event, list)
      return () => {}
    },
    setTimeout: (fn: () => void) => (timers.push(fn), timers.length - 1),
    clearTimeout: (handle: unknown) => {
      if (typeof handle === 'number') delete timers[handle as number]
    },
    effect: (fn: () => () => void) => (ctx.dispose = fn(), undefined),
  }
  const fire = (event: string, payload: any = {}) => {
    for (const listener of listeners.get(event) ?? []) listener(payload)
  }
  const flushTimers = () => {
    const due = timers.splice(0)
    for (const fn of due) fn?.()
  }
  const guardOf = () => guardFn!
  return { ctx, logger, agents, known, timers, fire, flushTimers, guardOf, restrictCalls }
}

describe('部分掩码', () => {
  it('缺失名只挂起、存活工具立即掩码，且只打一行 info', () => {
    const harness = makeHarness(new Set(['live-tool']), ['agent-1', 'agent-2'])
    apply(harness.ctx, { denyTools: ['live-tool', 'ghost-tool'] })
    expect(harness.logger.info).toHaveBeenCalledTimes(1)
    expect(harness.logger.info).toHaveBeenCalledWith('masked live-tool from 2 agent(s)')
  })

  it('运行时启用的 MCP 工具经 tools/change 到达即被掩码', () => {
    const harness = makeHarness(new Set(['live-tool']))
    apply(harness.ctx, { denyTools: ['live-tool', 'ghost-tool'] })
    harness.logger.info.mockClear()
    harness.known.add('ghost-tool')
    harness.fire('tools/change')
    harness.flushTimers()
    expect(harness.logger.info).toHaveBeenCalledWith('masked ghost-tool from 1 agent(s)')
  })
})

describe('事件卫生', () => {
  it('无关 tools/change 静默跳过：不调 restrict、不打日志', () => {
    const harness = makeHarness(new Set(['live-tool']))
    apply(harness.ctx, { denyTools: ['live-tool', 'ghost-tool'] })
    harness.restrictCalls.length = 0
    harness.logger.info.mockClear()
    harness.logger.warn.mockClear()
    // 自己成功那次 restrict 触发的 tools/change：注册表无新增
    for (let round = 0; round < 20; round++) {
      harness.fire('tools/change')
      harness.flushTimers()
    }
    expect(harness.restrictCalls).toHaveLength(0)
    expect(harness.logger.info).not.toHaveBeenCalled()
  })

  it('同一缺失集合只 warn 一次', () => {
    const harness = makeHarness(new Set())
    apply(harness.ctx, { denyTools: ['ghost-a', 'ghost-b'] })
    for (let round = 0; round < 5; round++) {
      harness.fire('tools/change')
      harness.flushTimers()
    }
    expect(harness.logger.warn).toHaveBeenCalledTimes(1)
  })

  it('突发 N 个事件去抖成一次 reconcile', () => {
    const harness = makeHarness(new Set(['live-tool']))
    apply(harness.ctx, { denyTools: ['live-tool', 'ghost-tool'] })
    harness.logger.info.mockClear()
    harness.restrictCalls.length = 0
    harness.known.add('ghost-tool')
    for (let round = 0; round < 10; round++) harness.fire('tools/change')
    harness.flushTimers()
    expect(harness.logger.info).toHaveBeenCalledTimes(1)
    expect(harness.logger.info).toHaveBeenCalledWith('masked ghost-tool from 1 agent(s)')
  })
})

describe('执行兜底 guard', () => {
  it('尚不存在的工具名也被 guard 拦截', () => {
    const harness = makeHarness(new Set(['live-tool']))
    apply(harness.ctx, { denyTools: ['live-tool', 'ghost-tool'] })
    const guard = harness.guardOf()
    expect(guard({ name: 'ghost-tool' })).toMatch(/denied/)
    expect(guard({ name: 'live-tool' })).toMatch(/denied/)
    expect(guard({ name: 'other-tool' })).toBeUndefined()
  })
})
