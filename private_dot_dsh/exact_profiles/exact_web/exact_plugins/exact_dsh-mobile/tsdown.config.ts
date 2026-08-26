/**
 * tsdown preset for dsh-mobile: an ESM node half with declarations plus a
 * browser half (lib/client.js) wrapped for the harness client-plugin loader.
 * The browser half keeps the loader's platform module table external
 * (react, cordis, ui-slots, web-react, primitives, runtime, layout) and
 * inlines everything else. Two CSS channels compile through lightningcss
 * into <style data-plugin> tags injected at factory execution (removed on
 * unload): `.module.css` becomes a hashed class map plus its tag, while a
 * plain `.css` (the plugin's global mobile sheet) is inlined as a raw tag —
 * the same mechanism the official client bundles use, with no module
 * mapping for the global selectors.
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { transform } from 'lightningcss'
import type { UserConfig } from 'tsdown'

const PLUGIN_ID = '@dsh-external/dsh-mobile'

/** Module specifiers the dsh web shell shares into its frozen module table. */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-schema-form',
] as const

/** Externals resolved from the loader module table. */
const CLIENT_EXTERNALS: readonly string[] = [
  ...PLATFORM_MODULES,
  '@deepseek-ai/dsh-client-runtime/client',
  '@deepseek-ai/dsh-client-ui-layout/client',
]

const MODULE_CSS_PREFIX = '\0dsh-module-css:'
const RAW_CSS_PREFIX = '\0dsh-raw-css:'
const VIRTUAL_SUFFIX = '.mjs'

/** Emit the style-tag injection block shared by both CSS channels. */
function styleTagBlock(tagId: string, css: string): string {
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
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: true,
    clean: true,
    deps: {
      neverBundle: ['schemastery', 'cordis'],
    },
  },
  {
    // Browser bundle: lib/client.js, served by the harness at /plugins/<id>/client.js.
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    clean: false,
    deps: {
      neverBundle: [...CLIENT_EXTERNALS],
      alwaysBundle: (id: string) => !CLIENT_EXTERNALS.includes(id),
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
    plugins: [{
      // Bundle purity gate: platform seed entries stay external, every other
      // @deepseek-ai value import is a build error (cross-plugin value imports
      // would inline a duplicate instance or need an unknown table specifier).
      name: 'dsh-client-bundle-purity',
      resolveId(source: string) {
        if (!source.startsWith('@deepseek-ai/')) return null
        if (CLIENT_EXTERNALS.includes(source)) return null
        throw new Error(
          `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS) — `
          + 'cross-plugin value imports are forbidden; collaborate through cordis services',
        )
      },
    }, {
      // CSS Modules → hashed class map + one injected <style data-plugin> tag.
      name: 'dsh-css-modules-inline',
      resolveId(source: string, importer: string | undefined) {
        if (!source.endsWith('.module.css')) return null
        const abs = importer !== undefined ? resolve(dirname(importer), source) : source
        return MODULE_CSS_PREFIX + abs + VIRTUAL_SUFFIX
      },
      async load(virtualId: string) {
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
        const classMap: Record<string, string> = {}
        for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
        return [
          styleTagBlock(`${PLUGIN_ID}/${basename(fileId)}`, code.toString()),
          `export default ${JSON.stringify(classMap)};`,
        ].join('\n')
      },
    }, {
      // Plain global CSS → one raw injected <style data-plugin> tag, no mapping.
      name: 'dsh-css-raw-inline',
      resolveId(source: string, importer: string | undefined) {
        if (!source.endsWith('.css') || source.endsWith('.module.css')) return null
        const abs = importer !== undefined ? resolve(dirname(importer), source) : source
        return RAW_CSS_PREFIX + abs + VIRTUAL_SUFFIX
      },
      async load(virtualId: string) {
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
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
      footer: `return module.exports; } });`,
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
] satisfies UserConfig[]
