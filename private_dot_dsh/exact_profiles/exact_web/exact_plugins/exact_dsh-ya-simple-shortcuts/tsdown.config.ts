import type { UserConfig } from 'tsdown'

export default [
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    outDir: 'lib',
    outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
    platform: 'node',
    target: 'es2023',
    clean: true,
    dts: true,
  },
  {
    entry: { client: 'src/client/index.ts' },
    format: 'cjs',
    outDir: 'lib',
    platform: 'browser',
    target: 'es2023',
    dts: false,
    clean: false,
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: "dsh-ya-simple-shortcuts", factory: (require) => {',
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
] satisfies UserConfig[]
