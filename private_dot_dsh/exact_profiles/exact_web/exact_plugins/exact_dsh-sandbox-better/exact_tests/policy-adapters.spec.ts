import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ignoreMissingRoots, reachableDirectories, stripRefreshedContexts } from '../src'

const policyText = 'Current DSH file policy: workspace-write. Any available operation enforced by the DSH file sandbox may modify files under the session workspace: "/w". Additional writable directories: ["/a","/b"]. Some platform temporary areas may also be writable.'

function scratch(): string {
  return mkdtempSync(join(tmpdir(), 'dsb-roots-'))
}

describe('reachableDirectories', () => {
  it('保留存在的目录，丢掉不存在的路径与文件', () => {
    const root = scratch()
    mkdirSync(join(root, 'kept'))
    writeFileSync(join(root, 'file'), '')
    expect(reachableDirectories([join(root, 'kept'), join(root, 'gone'), join(root, 'file')]))
      .toEqual([join(root, 'kept')])
  })
})

describe('ignoreMissingRoots', () => {
  it('只留下可达目录，卸载时恢复原列表', () => {
    const root = scratch()
    mkdirSync(join(root, 'kept'))
    const policy = { additionalWritableRoots: [join(root, 'kept'), join(root, 'gone')] }

    const restore = ignoreMissingRoots(policy)
    expect(policy.additionalWritableRoots).toEqual([join(root, 'kept')])

    restore()
    expect(policy.additionalWritableRoots).toEqual([join(root, 'kept'), join(root, 'gone')])
  })

  it('全部可达时保持原列表不动', () => {
    const root = scratch()
    const roots = [root]
    const policy = { additionalWritableRoots: roots }
    ignoreMissingRoots(policy)
    expect(policy.additionalWritableRoots).toBe(roots)
  })
})

describe('stripRefreshedContexts', () => {
  it('在刷新路径上剥掉目录清单，卸载时还原方法', () => {
    const prompt = {
      refreshContext: () => ({ contexts: [{ name: 'sandbox:policy', text: policyText }] }),
    }
    const original = prompt.refreshContext

    const restore = stripRefreshedContexts(prompt)
    const refreshed = prompt.refreshContext()
    expect(refreshed.contexts[0].text).not.toContain('Additional writable directories')
    expect(refreshed.contexts[0].text).toContain('workspace: "/w"')

    restore()
    expect(prompt.refreshContext).toBe(original)
  })

  it('其它 context 原样保留', () => {
    const prompt = {
      refreshContext: () => ({
        contexts: [{ name: 'working-directory:current', text: policyText }],
      }),
    }
    stripRefreshedContexts(prompt)
    expect(prompt.refreshContext().contexts[0].text).toBe(policyText)
  })
})
