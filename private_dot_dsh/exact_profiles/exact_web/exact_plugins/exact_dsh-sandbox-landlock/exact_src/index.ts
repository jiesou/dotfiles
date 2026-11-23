import { existsSync, globSync, statSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { ConfinedArgv, SandboxPolicy } from '@deepseek-ai/dsh-sandbox'

interface Config {
  devicePaths?: string[]
  launcherPath?: string
}

type Seam = typeof import('@deepseek-ai/node-addon-system/landlock-run')

function expandHome(dir: string): string {
  if (dir === '~') return homedir()
  if (dir.startsWith('~/')) return join(homedir(), dir.slice(2))
  return dir
}

// landlock-run 对打不开的授权根 fail-closed（exit 125，整条命令不执行），
// 不存在的目录与设备必须剔除；目录稍后建出来后下次 confine 自动纳入。
function writableRoots(paths: readonly string[]): string[] {
  const seen = new Set<string>()
  const roots: string[] = []
  for (const raw of paths) {
    if (!raw) continue
    const path = expandHome(raw)
    const key = path.replace(/\/+$/, '') || '/'
    if (seen.has(key)) continue
    seen.add(key)
    if (existsSync(path)) roots.push(path)
  }
  return roots
}

// Landlock 的 path_beneath 规则绑 inode 而非路径名：串口拔插后 udev 换 inode，
// mount 时快照的授权当场失效；confine 每条命令调一次，故在此展开通配符——
// 新设备下一条命令自动生效。
function resolveDevices(patterns: readonly string[]): string[] {
  return patterns.flatMap((pattern) => {
    try {
      // 目录一律剔除：通配符误伤目录会把整棵子树写开（/dev/* 会命中 /dev/shm）。
      return globSync(expandHome(pattern)).filter((path) => !isDirectory(path))
    } catch {
      return []
    }
  })
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

// 官方 JS seam 拥有 launcher 的 CLI 契约（定位/探针/grant 方言）。它是本包的
// 运行时依赖，由 Node 沿本包的实路径解析：不猜 dsh 装在哪（bin 符号链接、npx、
// 嵌入宿主各不相同），也不会被工作区里的同名包顶替。
const SEAM_SPECIFIER = '@deepseek-ai/node-addon-system/landlock-run'

async function importSeam(): Promise<Seam> {
  try {
    return await import(SEAM_SPECIFIER)
  } catch (error) {
    throw new Error(
      `dsh-sandbox-landlock: cannot load ${SEAM_SPECIFIER}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function grantFlags(seam: Seam, policy: SandboxPolicy, devicePaths: readonly string[]): string[] {
  const readWrite = policy.mode === 'workspace-write'
    ? [
        '/dev/null',
        '/tmp',
        policy.workspaceRoot,
        ...(policy.additionalWritableRoots ?? []),
        ...resolveDevices(devicePaths),
      ]
    : ['/dev/null']
  return seam.grantArgs({ readOnly: ['/'], readWrite: writableRoots(readWrite) })
}

export const name = 'dsh-sandbox-landlock'

export async function apply(ctx: Context, config: Config = {}): Promise<void> {
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
  const devicePaths = config.devicePaths ?? []
  ctx.provide('sandbox', {
    confine(commandArgv: readonly string[], policy: SandboxPolicy): ConfinedArgv {
      return {
        argv: [launcher, ...grantFlags(seam, policy, devicePaths), '--', ...commandArgv],
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
