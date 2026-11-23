import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { TOOL_NAME, registerRequestTool, resolveDirectory } from '../src'

interface FakeSession {
  header: { cwd: string }
}

function sandboxDir(): string {
  return mkdtempSync(join(tmpdir(), 'dsb-request-'))
}

function fakeHost(mode = 'workspace-write') {
  const registered = new Map<string, Record<string, unknown>>()
  const options = new Map<string, { when?: (context: { agent: { session: FakeSession } }) => boolean }>()
  const calls: Array<Record<string, unknown>> = []
  let outcome = 'allowed-once'
  const host = {
    sandboxPolicy: { registerWritableRoot: vi.fn(() => () => {}) },
    approval: {
      request: async (request: unknown) => {
        calls.push(request as Record<string, unknown>)
        return outcome
      },
    },
    modeOf: () => mode,
    tools: {
      register: (tool: Record<string, unknown>, registration?: { when?: (context: { agent: { session: FakeSession } }) => boolean }) => {
        registered.set(tool.name as string, tool)
        options.set(tool.name as string, registration ?? {})
        return () => {}
      },
    },
  }
  registerRequestTool(host)
  return { host, registered, options, calls, setOutcome: (next: string) => { outcome = next } }
}

describe('resolveDirectory', () => {
  it('锚定会话工作目录、解析 ~ 与符号链接', () => {
    const root = sandboxDir()
    mkdirSync(join(root, 'sub'))
    const session: FakeSession = { header: { cwd: root } }
    expect(resolveDirectory(session, 'sub')).toBe(join(root, 'sub'))
  })

  it('拒绝不存在的路径与文件', () => {
    const root = sandboxDir()
    const session: FakeSession = { header: { cwd: root } }
    expect(() => resolveDirectory(session, 'missing')).toThrow(/does not exist/u)
    expect(() => resolveDirectory(session, '')).toThrow(/directory is required/u)
  })
})

describe('tool visibility', () => {
  it('全权限时工具不参与该步骤，受限时参与', () => {
    const full = fakeHost('danger-full-access')
    const when = full.options.get(TOOL_NAME)?.when
    expect(when).toBeTypeOf('function')
    const agent = { session: { header: { cwd: sandboxDir() } } }
    expect(when!({ agent })).toBe(false)

    const confined = fakeHost('workspace-write')
    expect(confined.options.get(TOOL_NAME)!.when!({ agent })).toBe(true)
  })
})

describe('request_write_access tool', () => {
  const tool = () => {
    const { host, registered, calls, setOutcome } = fakeHost()
    return {
      host,
      calls,
      setOutcome,
      definition: registered.get(TOOL_NAME) as {
        execute: (
          args: Record<string, unknown>,
          exec: { agent: { session: FakeSession }; callId: string; signal: AbortSignal },
        ) => Promise<{ path: string }>
      },
    }
  }

  it('授权前先问用户，获批后登记', async () => {
    const { host, calls, definition } = tool()
    const root = sandboxDir()
    mkdirSync(join(root, 'a'))

    const result = await definition.execute(
      { path: 'a' },
      { agent: { session: { header: { cwd: root } } }, callId: 'call-1', signal: new AbortController().signal },
    )

    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      toolName: TOOL_NAME,
      callId: 'call-1',
      reason: `Allow writes under ${join(root, 'a')} for this session?`,
      displayReason: {
        en: `Allow writes under ${join(root, 'a')} for this session?`,
        zh: `允许本会话写入 ${join(root, 'a')}？`,
      },
    })
    expect(host.sandboxPolicy.registerWritableRoot).toHaveBeenCalledWith(
      { header: { cwd: root } },
      join(root, 'a'),
    )
    expect(result).toEqual({ path: join(root, 'a') })
  })

  it('用户拒绝时不登记', async () => {
    const { host, setOutcome, definition } = tool()
    setOutcome('rejected')
    const root = sandboxDir()
    mkdirSync(join(root, 'a'))

    await expect(definition.execute(
      { path: 'a' },
      { agent: { session: { header: { cwd: root } } }, callId: 'call-2', signal: new AbortController().signal },
    )).rejects.toThrow(/did not allow/u)
    expect(host.sandboxPolicy.registerWritableRoot).not.toHaveBeenCalled()
  })

  it('缺少 path 或没有审批服务时报错', async () => {
    const { host, definition } = tool()
    const root = sandboxDir()
    mkdirSync(join(root, 'a'))
    const exec = {
      agent: { session: { header: { cwd: root } } },
      callId: 'call-3',
      signal: new AbortController().signal,
    }
    await expect(definition.execute({}, exec)).rejects.toThrow(/path is required/u)

    const withoutApproval = { ...host, approval: undefined }
    const registered = new Map<string, Record<string, unknown>>()
    registerRequestTool({
      ...withoutApproval,
      tools: {
        register: (tool: Record<string, unknown>) => {
          registered.set(tool.name as string, tool)
          return () => {}
        },
      },
    })
    const bare = registered.get(TOOL_NAME) as { execute: typeof definition.execute }
    await expect(bare.execute({ path: 'a' }, exec)).rejects.toThrow(/no approval service/u)
  })
})
