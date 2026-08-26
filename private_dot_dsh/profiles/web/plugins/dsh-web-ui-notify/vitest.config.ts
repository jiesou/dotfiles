/**
 * Test config for the standalone plugin repo. The specs import host packages
 * (@deepseek-ai/dsh-client-*), which are not published to npm — they resolve
 * to SOURCES inside a dsh checkout, mirroring how the checkout's own vitest
 * maps them through tsconfig paths. Mapping to src (never a built lib/) also
 * keeps cordis a single module instance across the plugin and the host code.
 *
 * Usage:  DSH_CHECKOUT=/path/to/dsh npx vitest run
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const checkout = resolve(process.env.DSH_CHECKOUT ?? '../test-bill9109')
if (!existsSync(join(checkout, 'packages', 'client', 'runtime', 'src'))) {
  throw new Error(`vitest.config.ts: ${checkout} is not a dsh checkout — set DSH_CHECKOUT=/path/to/dsh`)
}
const pkg = (...segments: string[]): string => join(checkout, 'packages', ...segments)

/** Build `@deepseek-ai/<name>` → src aliases from the checkout workspace, so
 *  the full dependency graph (cordis, cosmokit, schemastery, all client
 *  modules) resolves to source instead of a stale published package. */
function workspaceAliases(): Record<string, string> {
  const aliases: Record<string, string> = {}
  const groups = ['packages/*/*', 'vendor/*']
  const seen = new Set<string>()
  for (const pattern of groups) {
    const [base, glob, depth] = pattern.endsWith('/*/*') ? [join(checkout, 'packages'), '*', 2] : [join(checkout, 'vendor'), '*', 1]
    if (!existsSync(base)) continue
    for (const group of readdirSync(base)) {
      const dir = join(base, group)
      if (!statSync(dir).isDirectory()) continue
      const candidates = depth === 2
        ? readdirSync(dir).map(name => join(dir, name))
        : [dir]
      for (const candidate of candidates) {
        if (!statSync(candidate).isDirectory()) continue
        const manifest = join(candidate, 'package.json')
        if (!existsSync(manifest)) continue
        const name = JSON.parse(readFileSync(manifest, 'utf8')).name as string | undefined
        if (typeof name !== 'string' || name === '' || seen.has(name)) continue
        seen.add(name)
        aliases[name] = candidate
      }
    }
  }
  return aliases
}

export default defineConfig({
  resolve: {
    alias: [
      // Longest specifier first: '/client' subpaths must match before the roots.
      { find: '@deepseek-ai/dsh-client-runtime/client', replacement: pkg('client', 'runtime', 'src', 'client') },
      { find: '@deepseek-ai/dsh-client-locale/client', replacement: pkg('client', 'locale', 'src', 'client') },
      { find: '@deepseek-ai/dsh-client-ui-settings/client', replacement: pkg('client', 'ui-settings', 'src', 'client') },
      // dsh-client-test-runtime moved from packages/client/test-runtime to
      // packages/test-support/client-runtime in the 20260812 snapshots.
      { find: '@deepseek-ai/dsh-client-test-runtime', replacement: pkg('test-support', 'client-runtime', 'src') },
      ...Object.entries(workspaceAliases()).flatMap(([name, dir]) => [
        { find: `${name}/src`, replacement: join(dir, 'src') },
        { find: name, replacement: join(dir, 'src') },
      ]),
    ],
  },
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
  },
})
