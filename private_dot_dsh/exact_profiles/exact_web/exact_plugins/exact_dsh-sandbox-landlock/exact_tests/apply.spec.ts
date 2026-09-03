import { existsSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { apply, normalizeDirs } from '../src/index'

const workspace = join(tmpdir(), 'dsl-spec-workspace')
const writeDirs = ['~/.npm', '/tmp', `${workspace}/.extra`, '/tmp/']

const provided = new Map<string, unknown>()
let confine!: (
  commandArgv: readonly string[],
  policy: { mode: string; workspaceRoot: string },
) => { argv: string[]; enforcement: string; denialSignatures: string[]; runnerFailureRules: Array<Record<string, unknown>> }

beforeAll(async () => {
  await apply(
    { provide: (id, service) => { provided.set(id, service) } },
    { writeDirs },
  )
  confine = (provided.get('sandbox') as { confine: typeof confine }).confine
})

describe('normalizeDirs', () => {
  it('展开 ~、去重、剔除空项', () => {
    expect(normalizeDirs(['~/.npm', `${homedir()}/.npm`, '', '~/.cache']))
      .toEqual([`${homedir()}/.npm`, `${homedir()}/.cache`])
  })
})

describe('workspace-write', () => {
  const policy = { mode: 'workspace-write', workspaceRoot: workspace }
  let wrapped: ReturnType<typeof confine>

  beforeAll(() => {
    wrapped = confine(['bash', '-c', 'echo hi'], policy)
  })

  it('launcher 在最前，--ro 只授予 /，原 argv 完整保留', () => {
    expect(wrapped.argv[0].endsWith('landlock-run')).toBe(true)
    expect(wrapped.argv.some((x, i) => x === '--ro' && wrapped.argv[i + 1] !== '/')).toBe(false)
    const sep = wrapped.argv.indexOf('--')
    expect(wrapped.argv.slice(sep + 1)).toEqual(['bash', '-c', 'echo hi'])
  })

  it('授权面齐全且去重（含尾斜杠变体）', () => {
    for (const dir of normalizeDirs(['/dev/null', '/tmp', workspace, ...writeDirs]).filter((d) => existsSync(d))) {
      expect(wrapped.argv).toContain(dir)
    }
    expect(wrapped.argv.filter((x) => x === '/tmp')).toHaveLength(1)
    expect(wrapped.argv.filter((x) => x === '/dev/null')).toHaveLength(1)
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
  it('不存在的 writeDirs 被剔除（launcher 对打不开的授权根 exit 125），存在的保留', async () => {
    const missing = join(tmpdir(), 'dsl-spec-definitely-missing')
    expect(existsSync(missing)).toBe(false)
    const provided2 = new Map<string, unknown>()
    await apply(
      { provide: (id, service) => { provided2.set(id, service) } },
      { writeDirs: ['/tmp', missing] },
    )
    const confine2 = (provided2.get('sandbox') as { confine: typeof confine }).confine
    const wrapped2 = confine2(['bash', '-c', 'echo hi'], { mode: 'workspace-write', workspaceRoot: workspace })
    expect(wrapped2.argv).not.toContain(missing)
    expect(wrapped2.argv).toContain('/tmp')
  })
})

describe('read-only', () => {
  it('只有 /dev/null 可写，不收 /tmp、workspace、writeDirs', () => {
    const ro = confine(['bash', '-c', 'echo hi'], { mode: 'read-only', workspaceRoot: workspace })
    expect(ro.argv).not.toContain(workspace)
    expect(ro.argv).not.toContain('/tmp')
    const rwAt = ro.argv.indexOf('--rw')
    expect(rwAt).toBeGreaterThan(-1)
    expect(ro.argv[rwAt + 1]).toBe('/dev/null')
    expect(ro.argv.filter((x) => x === '--rw')).toHaveLength(1)
  })
})
