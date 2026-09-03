import { spawnSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve as resolvePath, sep } from 'node:path'
import { argv as processArgv } from 'node:process'
import type { Context } from '@deepseek-ai/cordis'
import { FsError } from '@deepseek-ai/dsh-fs'
import type { FsEditRequest, FsTarget, FsVersion, FsWriteIntent, FsWriteOutcome, FsEditOutcome } from '@deepseek-ai/dsh-fs'
import { LocalFileSystem } from '@deepseek-ai/dsh-fs-local'
import type {} from '@deepseek-ai/dsh-sandbox-policy'
import z from '@deepseek-ai/schemastery'

interface SandboxPolicy {
  mode: 'read-only' | 'workspace-write' | 'danger-full-access'
  workspaceRoot: string
}

interface SandboxPolicyService {
  defaultMode: SandboxPolicy['mode']
  resolve(request?: { session?: unknown; mode?: SandboxPolicy['mode'] }): SandboxPolicy
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

interface Config {
  writeDirs?: string[]
  launcherPath?: string
  cwd?: string
  diffBasisMaxBytes?: number
}

interface PluginCtx {
  provide(id: string, service: unknown): void
  plugin?: (plugin: unknown, config?: unknown) => unknown
}

const sandboxPolicyInject = ['sandboxPolicy']

function canonicalRoot(path: string): string {
  try {
    return realpathSync(path)
  } catch {
    return resolvePath(path)
  }
}

function contains(root: string, target: string): boolean {
  const child = relative(root, target)
  return child === '' || (child !== '..' && !child.startsWith(`..${sep}`) && !isAbsolute(child))
}

class LandlockFileSystem extends LocalFileSystem {
  static inject = sandboxPolicyInject
  static Config: z<Config> = z.object({
    cwd: z.string().default(process.cwd()),
    diffBasisMaxBytes: z.number().default(10 * 1024 * 1024),
    writeDirs: z.array(z.string()).default([]),
  })

  private readonly writeDirs: string[]
  private readonly sandboxPolicy: SandboxPolicyService

  constructor(ctx: Context, config: Config) {
    super(ctx, config)
    this.writeDirs = normalizeDirs(config.writeDirs).map(canonicalRoot)
    this.sandboxPolicy = ctx.sandboxPolicy
  }

  override get sandboxMode(): SandboxPolicy['mode'] {
    return this.sandboxPolicy.defaultMode
  }

  override async writeText(
    target: FsTarget,
    content: string,
    expected?: FsWriteIntent,
    signal?: AbortSignal,
    sandboxPolicy?: SandboxPolicy,
  ): Promise<FsWriteOutcome> {
    return super.writeText(await this.checkedTarget(target, sandboxPolicy), content, expected, signal)
  }

  override async editText(
    target: FsTarget,
    edit: FsEditRequest,
    expected?: { version: FsVersion },
    signal?: AbortSignal,
    sandboxPolicy?: SandboxPolicy,
  ): Promise<FsEditOutcome> {
    return super.editText(await this.checkedTarget(target, sandboxPolicy), edit, expected, signal)
  }

  private async checkedTarget(target: FsTarget, sandboxPolicy?: SandboxPolicy): Promise<FsTarget> {
    const policy = sandboxPolicy ?? this.sandboxPolicy.resolve()
    if (policy.mode === 'danger-full-access') return target
    if (policy.mode === 'read-only') {
      throw new FsError(`cannot write "${target.displayPath}": file access denied under read-only mode`, 'FS_SANDBOX_DENIED')
    }
    const fresh = await this.resolve(target.displayPath)
    const roots = [canonicalRoot(policy.workspaceRoot), '/tmp', ...this.writeDirs]
    if (roots.some(root => contains(root, fresh.targetKey))) return fresh
    throw new FsError(`cannot write "${target.displayPath}": file access denied under workspace-write mode`, 'FS_SANDBOX_DENIED')
  }
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
  // landlock-run 对打不开的授权根 fail-closed（exit 125，整条命令不执行），
  // 不存在的目录必须剔除；目录稍后建出来后下次 confine 自动纳入。
  return seam.grantArgs({ readOnly: ['/'], readWrite: normalizeDirs(readWrite).filter(existsDir) })
}

function existsDir(dir: string): boolean {
  try {
    return existsSync(dir)
  } catch {
    return false
  }
}

export const name = 'dsh-sandbox-landlock'

export async function apply(ctx: Context | PluginCtx, config: Config = {}): Promise<void> {
  const writeDirs = normalizeDirs(config.writeDirs ?? [])
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
  if (ctx.plugin) ctx.plugin(LandlockFileSystem, { cwd: config.cwd, writeDirs })
  const missing = writeDirs.filter((dir) => !existsDir(dir))
  if (missing.length > 0) {
    console.warn(`dsh-sandbox-landlock: skipping ${missing.length} missing writeDirs (created later they take effect automatically): ${missing.join(', ')}`)
  }
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
