import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  outDir: 'lib',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  dts: true,
  // The host owns @deepseek-ai/*; never inline a second copy into the bundle.
  deps: { onlyBundle: false },
})
