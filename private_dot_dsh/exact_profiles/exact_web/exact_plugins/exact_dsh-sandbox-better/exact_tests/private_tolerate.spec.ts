import { describe, expect, it } from 'vitest'
import { DEFAULT_JUSTIFICATION, normalizePermissionArgs } from '../src/tolerate'

describe('normalizePermissionArgs', () => {
  it('删掉孤立的 justification', () => {
    expect(normalizePermissionArgs('bash', { command: 'ls', justification: 'why not' }, 'workspace-write'))
      .toEqual({ command: 'ls' })
  })

  it('缺理由时补默认理由', () => {
    expect(normalizePermissionArgs('bash', { command: 'ls', sandbox_permissions: 'danger-full-access' }, 'workspace-write'))
      .toEqual({ command: 'ls', sandbox_permissions: 'danger-full-access', justification: DEFAULT_JUSTIFICATION })
  })

  it('空白理由视为缺失', () => {
    expect(normalizePermissionArgs('write', { file_path: '/x', content: '', sandbox_permissions: 'danger-full-access', justification: '  ' }, 'workspace-write'))
      .toMatchObject({ justification: DEFAULT_JUSTIFICATION })
  })

  it('同级或更窄的目标：两个字段都删掉，按当前模式跑', () => {
    expect(normalizePermissionArgs('bash', { command: 'ls', sandbox_permissions: 'workspace-write', justification: 'x' }, 'workspace-write'))
      .toEqual({ command: 'ls' })
    expect(normalizePermissionArgs('bash', { command: 'ls', sandbox_permissions: 'read-only' }, 'workspace-write'))
      .toEqual({ command: 'ls' })
  })

  it('合法升权保持不变', () => {
    expect(normalizePermissionArgs('edit', { file_path: '/x', sandbox_permissions: 'danger-full-access', justification: 'need it' }, 'workspace-write'))
      .toBeUndefined()
  })

  it('不在模式词表里的值保持原样，交给宿主报错', () => {
    expect(normalizePermissionArgs('bash', { command: 'ls', sandbox_permissions: 'full' }, 'workspace-write')).toBeUndefined()
    expect(normalizePermissionArgs('bash', { command: 'ls', sandbox_permissions: 'workspace_write', justification: 'x' }, 'workspace-write')).toBeUndefined()
  })

  it('非升权工具或非对象参数不碰', () => {
    expect(normalizePermissionArgs('read', { path: '/x', justification: 'x' }, 'workspace-write')).toBeUndefined()
    expect(normalizePermissionArgs('bash', 'ls', 'workspace-write')).toBeUndefined()
    expect(normalizePermissionArgs('bash', { command: 'ls' }, 'workspace-write')).toBeUndefined()
  })
})
