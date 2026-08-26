import { existsSync, readFileSync } from 'node:fs'
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

  it('纯 cordis：不声明 dsh.bundle，不声明任何依赖（profile 闭包注入）', () => {
    expect(pkg.dsh?.bundle).toBeUndefined()
    expect(pkg.dependencies).toBeUndefined()
    expect(pkg.peerDependencies).toBeUndefined()
  })
})

describe('entry contract', () => {
  const entrySrc = readFileSync(join(root, 'src/index.ts'), 'utf8')

  it('导出 name/inject/apply', () => {
    expect(entrySrc).toMatch(/export const name = 'tool-deny'/)
    expect(entrySrc).toMatch(/export const inject = \['agents', 'timer'\]/)
    expect(entrySrc).toMatch(/export function apply\(/)
  })

  it('README 引用的文件存在', () => {
    for (const target of ['src/index.ts', 'lib/index.js', 'package.json', 'decisions/implemented/2026-08-15-tool-deny-visibility-mask.md']) {
      expect(existsSync(join(root, target)), target).toBe(true)
    }
  })
})
