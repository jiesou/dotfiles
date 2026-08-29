import { spawnSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { dirname, join } from 'node:path'
import { argv as processArgv } from 'node:process'

interface SandboxPolicy {
  mode: string
  workspaceRoot: string
}

interface ConfinedArgv {
  argv: string[]
  enforcement: string
  denialSignatures: string[]
  runnerFailureRules: Array<{
    allowedExitCodes?: number[]
    fatalSignatures: string[]
    informationalLines?: string[]
  }>
}

interface Seam {
  LAUNCHER_BIN: string
  LAUNCHER_FAILURE_EXIT: number
  launcherPath(): string
  probe(launcher?: string): 'full' | 'partial' | 'unusable'
  grantArgs(grants: { readOnly?: string[]; readWrite?: string[] }): string[]
}

interface PluginCtx {
  provide(id: string, service: unknown): void
}

interface Config {
  writeDirs?: string[]
  launcherPath?: string
}

function expandHome(dir: string): string {
  if (dir === '~') return homedir()
  if (dir.startsWith('~/')) return join(homedir(), dir.slice(2))
  return dir
}

export function normalizeDirs(dirs: readonly string[] = []): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of dirs) {
    if (!raw) continue
    const expanded = expandHome(raw)
    const key = expanded.replace(/\/+$/, '') || '/'
    if (seen.has(key)) continue
    seen.add(key)
    result.push(expanded)
  }
  return result
}

// 官方 JS seam 拥有 launcher 的 CLI 契约（定位/探针/grant 方言），按绝对路径动态加载。
const SEAM_RELATIVE = join('node_modules', '@deepseek-ai', 'node-addon-landlock-run', 'lib', 'index.js')

async function importSeam(): Promise<Seam> {
  const candidates = []
  if (processArgv[1]) {
    candidates.push(join(dirname(dirname(processArgv[1])), SEAM_RELATIVE))
    // 覆盖源码检出 + pnpm 布局：从 dsh 入口的真实路径向上回溯查找 seam。
    let dir = dirname(processArgv[1])
    try {
      dir = dirname(realpathSync(processArgv[1]))
    } catch {
    }
    while (dir && dir !== dirname(dir)) {
      candidates.push(join(dir, SEAM_RELATIVE))
      candidates.push(join(dir, 'node_modules', '.pnpm', 'node_modules', '@deepseek-ai', 'node-addon-landlock-run', 'lib', 'index.js'))
      candidates.push(join(dir, 'native', 'landlock-run', 'packages', 'entry', 'lib', 'index.js'))
      dir = dirname(dir)
    }
  }
  const globalRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' }).stdout?.trim()
  if (globalRoot) candidates.push(join(globalRoot, '@deepseek-ai', 'dsh', SEAM_RELATIVE))
  const found = candidates.find((path) => existsSync(path))
  if (!found) throw new Error('dsh-sandbox-landlock: node-addon-landlock-run seam not found next to the dsh install')
  return import(found) as Promise<Seam>
}

function grantFlags(seam: Seam, policy: SandboxPolicy, writeDirs: readonly string[]): string[] {
  const readWrite = policy.mode === 'workspace-write'
    ? ['/dev/null', '/tmp', policy.workspaceRoot, ...writeDirs]
    : ['/dev/null']
  return seam.grantArgs({ readOnly: ['/'], readWrite: normalizeDirs(readWrite) })
}

export const name = 'dsh-sandbox-landlock'

export async function apply(ctx: PluginCtx, config: Config = {}): Promise<void> {
  if (platform() !== 'linux') return
  let seam: Seam
  try {
    seam = await importSeam()
  } catch (error) {
    console.warn(`dsh-sandbox-landlock: ${error instanceof Error ? error.message : String(error)}; sandbox disabled`)
    return
  }
  const launcher = config.launcherPath ? expandHome(config.launcherPath) : seam.launcherPath()
  const verdict = seam.probe(launcher)
  if (verdict === 'unusable') {
    console.warn(`dsh-sandbox-landlock: landlock-run functional probe unusable (${launcher}); sandbox disabled`)
    return
  }
  const writeDirs = normalizeDirs(config.writeDirs ?? [])
  ctx.provide('sandbox', {
    // 生产消费方在 danger-full-access 时不会调用 confine；此处只接收受限模式。
    confine(commandArgv: readonly string[], policy: SandboxPolicy): ConfinedArgv {
      return {
        argv: [launcher, ...grantFlags(seam, policy, writeDirs), '--', ...commandArgv],
        enforcement: verdict,
        denialSignatures: ['permission denied'],
        runnerFailureRules: [{
          allowedExitCodes: [seam.LAUNCHER_FAILURE_EXIT],
          fatalSignatures: [`${seam.LAUNCHER_BIN}: `],
          informationalLines: [`${seam.LAUNCHER_BIN}: partial enforcement (older Landlock ABI)`],
        }],
      }
    },
  })
}

export default { name, apply }
