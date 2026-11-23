import { existsSync, mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import type { SandboxPolicy, SandboxProvider } from '@deepseek-ai/dsh-sandbox'
import { beforeAll, describe, expect, it } from 'vitest'
import { apply } from '../src/index'

const workspace = mkdtempSync(join(tmpdir(), 'dsb-spec-workspace-'))
const extra = mkdtempSync(join(tmpdir(), 'dsb-spec-extra-'))

async function sandboxFor(config?: Parameters<typeof apply>[1]): Promise<SandboxProvider> {
  const ctx = new Context()
  await apply(ctx, config)
  return ctx.sandbox
}

let sandbox!: SandboxProvider

beforeAll(async () => {
  sandbox = await sandboxFor()
})

describe('workspace-write', () => {
  const policy: SandboxPolicy = {
    mode: 'workspace-write',
    workspaceRoot: workspace,
    additionalWritableRoots: [extra, `${extra}/`],
  }
  let wrapped: Awaited<ReturnType<SandboxProvider['confine']>>

  beforeAll(async () => {
    wrapped = await sandbox.confine(['bash', '-c', 'echo hi'], policy)
  })

  it('launcher 在最前，--ro 只授予 /，原 argv 完整保留', () => {
    expect(wrapped.argv[0].endsWith('landlock-run')).toBe(true)
    expect(wrapped.argv.some((x, i) => x === '--ro' && wrapped.argv[i + 1] !== '/')).toBe(false)
    const sep = wrapped.argv.indexOf('--')
    expect(wrapped.argv.slice(sep + 1)).toEqual(['bash', '-c', 'echo hi'])
  })

  it('官方 additionalWritableRoots 进入 rw 面且去重', () => {
    expect(wrapped.argv).toContain(realpathSync(workspace))
    expect(wrapped.argv).toContain(realpathSync(extra))
    expect(wrapped.argv.filter((x) => x === realpathSync(extra))).toHaveLength(1)
    expect(wrapped.argv).toContain('/tmp')
  })

  it('分类事实对齐官方 LANDLOCK 方言：真实探针判定 + EACCES + exit 125 契约', () => {
    expect(['full', 'partial']).toContain(wrapped.enforcement)
    expect(wrapped.denialSignatures).toEqual(['permission denied'])
    expect(wrapped.runnerFailureRules[0]).toMatchObject({
      allowedExitCodes: [125],
      fatalSignatures: ['landlock-run: '],
      informationalLines: ['landlock-run: partial enforcement (older Landlock ABI)'],
    })
  })
})

describe('缺失目录', () => {
  it('不存在的授权根被剔除（launcher 对打不开的授权根 exit 125），存在的保留', async () => {
    const missing = join(tmpdir(), 'dsb-spec-definitely-missing')
    expect(existsSync(missing)).toBe(false)
    const wrapped = await sandbox.confine(['bash', '-c', 'echo hi'], {
      mode: 'workspace-write',
      workspaceRoot: workspace,
      additionalWritableRoots: ['/tmp', missing],
    })
    expect(wrapped.argv).not.toContain(missing)
    expect(wrapped.argv).toContain('/tmp')
  })
})

describe('devicePaths', () => {
  const devDir = mkdtempSync(join(tmpdir(), 'dsb-spec-devices-'))
  const present = ['ttyUSB0', 'ttyUSB1'].map((name) => {
    const path = join(devDir, name)
    writeFileSync(path, '')
    return path
  })
  const nested = join(devDir, 'ttyUSB-hub')
  mkdirSync(nested, { recursive: true })

  it('通配符在每次 confine 时展开，命中的设备进 rw 面', async () => {
    const devices = await sandboxFor({ devicePaths: [`${devDir}/ttyUSB*`, '/dev/null'] })
    const wrapped = await devices.confine(['bash', '-c', 'echo hi'], { mode: 'workspace-write', workspaceRoot: workspace })
    for (const path of present) expect(wrapped.argv).toContain(path)
    expect(wrapped.argv).not.toContain(nested)
    expect(wrapped.argv.filter((x) => x === '/dev/null')).toHaveLength(1)
  })

  it('缺席的设备不进授权面（launcher 对打不开的授权根 exit 125）', async () => {
    const devices = await sandboxFor({ devicePaths: [`${devDir}/ttyACM*`] })
    const wrapped = await devices.confine(['bash', '-c', 'echo hi'], { mode: 'workspace-write', workspaceRoot: workspace })
    expect(wrapped.argv.some((x) => x.startsWith(`${devDir}/ttyACM`))).toBe(false)
  })

  it('read-only 模式不授设备', async () => {
    const wrapped = await sandbox.confine(['bash', '-c', 'echo hi'], { mode: 'read-only', workspaceRoot: workspace })
    for (const path of present) expect(wrapped.argv).not.toContain(path)
  })
})

describe('read-only', () => {
  it('只有 /dev/null 可写，不收 /tmp、workspace、additionalWritableRoots', async () => {
    const wrapped = await sandbox.confine(['bash', '-c', 'echo hi'], {
      mode: 'read-only',
      workspaceRoot: workspace,
      additionalWritableRoots: [extra],
    })
    expect(wrapped.argv).not.toContain(workspace)
    expect(wrapped.argv).not.toContain('/tmp')
    expect(wrapped.argv).not.toContain(extra)
    const rwAt = wrapped.argv.indexOf('--rw')
    expect(rwAt).toBeGreaterThan(-1)
    expect(wrapped.argv[rwAt + 1]).toBe('/dev/null')
    expect(wrapped.argv.filter((x) => x === '--rw')).toHaveLength(1)
  })
})
