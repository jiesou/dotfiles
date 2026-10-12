// The manifest carries one colour, so it cannot follow the scheme itself. No host
// sends Accept-CH, so sec-ch-prefers-color-scheme never arrives — this cookie is
// the only channel telling the host half which scheme the browser resolved.
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-pwa',
  factory: () => ({
    name: '@jiesou/dsh-webui-fix-pwa',
    apply(ctx) {
      ctx.inject(['theme'], (scope) => {
        const theme = scope.get('theme')
        const COOKIE = 'dsh-color-scheme'
        scope.effect(() => {
          const report = () => {
            const scheme = theme.getTheme().active.colorScheme
            document.cookie = `${COOKIE}=${scheme}; path=/; max-age=31536000; SameSite=Lax`
          }
          report()
          return ctx.on('theme/change', report)
        }, '@jiesou/dsh-webui-fix-pwa: report the resolved scheme for the manifest')
      })
    },
  }),
})