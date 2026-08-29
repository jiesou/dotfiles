#!/usr/bin/env node
/**
 * Build lib/ (node half + browser bundle) with a self-contained toolchain:
 * the plugin's own tsdown + lightningcss in node_modules. No framework
 * checkout and no DSH_CHECKOUT symlink are needed — the client half is
 * wrapped for the dsh loader by tsdown.config.mjs itself.
 *
 * Usage:  npm run build
 */
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const bin = join(ROOT, 'node_modules', '.bin')

// Start from a clean lib/ so no stale artifacts (e.g. an old style.css) linger.
rmSync(join(ROOT, 'lib'), { recursive: true, force: true })

const result = spawnSync(join(bin, 'tsdown'), ['-c', 'tsdown.config.mjs'], {
  cwd: ROOT,
  stdio: 'inherit',
})
if (result.status !== 0) process.exit(result.status ?? 1)
console.log('build: done — lib/ ready (lib/index.js + lib/client.js)')
