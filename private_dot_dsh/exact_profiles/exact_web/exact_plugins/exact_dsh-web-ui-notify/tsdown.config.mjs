/**
 * Self-contained tsdown config for dsh-web-ui-notify: an ESM node half
 * (lib/index.js) plus a browser half (lib/client.js) wrapped for the dsh
 * client-plugin loader via window.__ModuleLoader__.load.
 *
 * Modeled on the dsh-mobile plugin's config — no framework checkout needed.
 * The browser half keeps the loader's platform module table external
 * (react, @deepseek-ai/*) and inlines everything else. CSS compiles through
 * lightningcss into <style data-plugin> tags injected at factory execution
 * (the same mechanism the official client bundles use).
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { transform } from 'lightningcss'

const PLUGIN_ID = '@bill9109/dsh-web-ui-notify'

/** Externals resolved from the loader module table (not bundled). */
const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-runtime/client',
  '@deepseek-ai/dsh-client-ui-settings/client',
  '@deepseek-ai/dsh-client-locale/client',
]

const MODULE_CSS_PREFIX = '\0dsh-module-css:'
const RAW_CSS_PREFIX = '\0dsh-raw-css:'
const VIRTUAL_SUFFIX = '.mjs'

/** Emit the style-tag injection block shared by both CSS channels. */
function styleTagBlock(tagId, css) {
  return [
    `const css = ${JSON.stringify(css)};`,
    `const tagId = ${JSON.stringify(tagId)};`,
    `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {`,
    `  const tag = document.createElement('style');`,
    `  tag.dataset.plugin = ${JSON.stringify(PLUGIN_ID)};`,
    `  tag.dataset.pluginCss = tagId;`,
    `  tag.textContent = css;`,
    `  document.head.appendChild(tag);`,
    `}`,
  ].join('\n')
}

export default [
  {
    name: PLUGIN_ID,
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    deps: {
      neverBundle: ['web-push'],
    },
  },
  {
    name: `${PLUGIN_ID}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    fixedExtension: false,
    dts: false,
    clean: false,
    deps: {
      neverBundle: [...CLIENT_EXTERNALS],
      alwaysBundle: (id) => !CLIENT_EXTERNALS.includes(id),
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
    plugins: [
      {
        // Bundle purity gate: platform seed entries stay external, every other
        // @deepseek-ai value import is a build error (cross-plugin value imports
        // would inline a duplicate instance or need an unknown table specifier).
        name: 'dsh-client-bundle-purity',
        resolveId(source) {
          if (!source.startsWith('@deepseek-ai/')) return null
          if (CLIENT_EXTERNALS.includes(source)) return null
          throw new Error(
            `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS) — `
            + 'cross-plugin value imports are forbidden; collaborate through cordis services',
          )
        },
      },
      {
        // CSS Modules → hashed class map + one injected <style data-plugin> tag.
        name: 'dsh-css-modules-inline',
        resolveId(source, importer) {
          if (!source.endsWith('.module.css')) return null
          const abs = importer !== undefined ? resolve(dirname(importer), source) : source
          return MODULE_CSS_PREFIX + abs + VIRTUAL_SUFFIX
        },
        async load(virtualId) {
          if (!virtualId.startsWith(MODULE_CSS_PREFIX)) return null
          const fileId = virtualId.slice(MODULE_CSS_PREFIX.length, -VIRTUAL_SUFFIX.length)
          this.addWatchFile(fileId)
          const source = await readFile(fileId)
          const { code, exports: cssExports } = transform({
            filename: fileId,
            code: source,
            cssModules: { pattern: '[hash]_[local]' },
            minify: true,
          })
          const classMap = {}
          for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
          return [
            styleTagBlock(`${PLUGIN_ID}/${basename(fileId)}`, code.toString()),
            `export default ${JSON.stringify(classMap)};`,
          ].join('\n')
        },
      },
      {
        // Plain global CSS → one raw injected <style data-plugin> tag, no mapping.
        name: 'dsh-css-raw-inline',
        resolveId(source, importer) {
          if (!source.endsWith('.css') || source.endsWith('.module.css')) return null
          const abs = importer !== undefined ? resolve(dirname(importer), source) : source
          return RAW_CSS_PREFIX + abs + VIRTUAL_SUFFIX
        },
        async load(virtualId) {
          if (!virtualId.startsWith(RAW_CSS_PREFIX)) return null
          const fileId = virtualId.slice(RAW_CSS_PREFIX.length, -VIRTUAL_SUFFIX.length)
          this.addWatchFile(fileId)
          const source = await readFile(fileId)
          const { code } = transform({ filename: fileId, code: source, minify: true })
          return [
            styleTagBlock(`${PLUGIN_ID}/${basename(fileId)}`, code.toString()),
            'export default {};',
          ].join('\n')
        },
      },
    ],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
      footer: `return module.exports; } });`,
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
]
