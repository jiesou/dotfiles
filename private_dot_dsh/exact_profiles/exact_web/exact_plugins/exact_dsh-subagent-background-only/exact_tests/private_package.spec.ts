import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('package.json contract', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  it('main/exports["."] 指向构建产物 lib/index.js', () => {
    expect(pkg.main).toBe('./lib/index.js')
    expect(pkg.exports['.']).toEqual({ types: './lib/index.d.ts', default: './lib/index.js' })
  })

  it('纯 cordis：不声明 dsh.bundle；官方包只走 peer（闭包注入）', () => {
    expect(pkg.dsh?.bundle).toBeUndefined()
    expect(pkg.dependencies).toBeUndefined()
  })
})

describe('entry contract', () => {
  const entrySrc = readFileSync(join(root, 'src/index.ts'), 'utf8')

  it('导出 name/inject/apply；inject 含 agents 与 tools', () => {
    expect(entrySrc).toMatch(/export const name = 'subagent-background-only'/)
    expect(entrySrc).toMatch(/export const inject = \['agents', 'tools'\]/)
    expect(entrySrc).toMatch(/export function apply\(/)
  })

  it('不直调 startContinuable（只做改写+转发，不造轮子）', () => {
    expect(entrySrc).not.toMatch(/startContinuable/)
  })

  it('不经 defineTool 二次编译（parameters 已是编译形态，raw 原地改写）', () => {
    expect(entrySrc).not.toMatch(/defineTool\(/)
    expect(entrySrc).not.toMatch(/from '@deepseek-ai\/dsh-tools'/)
  })

  it('不注册任何工具：同层重名必然抛错，遮蔽路线不可用', () => {
    // Regression guard for the 2026-09-10 finding: `tool-subagent` registers
    // into the agent's OWN layer (installScoped), so `agent.ctx.tools.register`
    // of a same-name shadow throws "already registered in this scope" and the
    // scope's own layer is applied last in view(), unreachable by any shadow.
    // The fix mutates the resolved definition in place and registers nothing.
    expect(entrySrc).not.toMatch(/tools\.register\(/)
  })

  it('发布面只有 cordis 契约：引擎耦合的改写助手不 re-export', () => {
    expect(entrySrc).not.toMatch(/export .*patchDefinition|export .*patchAgentTools/)
  })
})

describe('patch module contract', () => {
  const patchSrc = readFileSync(join(root, 'src/patch.ts'), 'utf8')

  it('剥离前必须确认 continuable：否则 one-shot 会静默翻成前台', () => {
    expect(patchSrc).toMatch(/isContinuableDeclaration/)
    expect(patchSrc).toMatch(/paramDefaultsTrue/)
    expect(patchSrc).toMatch(/paramDefaultsFalse/)
    expect(patchSrc).toMatch(/flip its default route to foreground/)
  })

  it('改写 description 的锚点与判定同源，改不动就拒改', () => {
    expect(patchSrc).toMatch(/falseTeaching/)
    expect(patchSrc).toMatch(/leave the prompt teaching/)
  })
})
