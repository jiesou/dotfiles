import { describe, expect, it } from 'vitest'
import { stripAdditionalRoots } from '../src/policy-text'

const head = 'Current DSH file policy: workspace-write. Any available operation enforced by the DSH file sandbox may modify files under the session workspace: '
const tail = ' Some platform temporary areas may also be writable.'

describe('stripAdditionalRoots', () => {
  it('删掉目录清单，保留模式、workspace 与结尾句', () => {
    const text = `${head}"/w". Additional writable directories: ["/a","/b"]. On Windows, these additional grants apply to file tools only, not sandboxed processes.${tail}`
    const stripped = stripAdditionalRoots(text)
    expect(stripped).not.toContain('Additional writable directories')
    expect(stripped).not.toContain('"/a"')
    expect(stripped).toBe(`${head}"/w".${tail}`)
  })

  it('路径里出现标记也不会误剪', () => {
    const text = `${head}"/w Additional writable directories: [x]". Additional writable directories: ["/a"].${tail}`
    expect(stripAdditionalRoots(text)).toBe(`${head}"/w Additional writable directories: [x]".${tail}`)
  })

  it('找不到结尾句时原样返回（上游改文案）', () => {
    const text = `${head}"/w". Additional writable directories: ["/a"].`
    expect(stripAdditionalRoots(text)).toBe(text)
  })

  it('不是 workspace-write 行时原样返回', () => {
    const text = `Current DSH file policy: read-only. Nothing may be modified.${tail}`
    expect(stripAdditionalRoots(text)).toBe(text)
  })

  it('超长片段不剪（防御异常输入）', () => {
    const huge = `["${'/x'.repeat(5000)}"]`
    const text = `${head}"/w". Additional writable directories: ${huge}.${tail}`
    expect(stripAdditionalRoots(text)).toBe(text)
  })
})
