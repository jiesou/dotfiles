window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-pwa',
  factory: () => ({
    name: '@jiesou/dsh-webui-fix-pwa',
    apply(ctx) {
      ctx.inject(['theme'], (scope) => {
        const theme = scope.get('theme')
        const LIGHT_TOKEN = '--dsw-static-neutral-bluish-00'
        const DARK_TOKEN = '--dsw-static-neutral-bluish-950'
        const FALLBACK_LIGHT = 'rgb(255, 255, 255)'
        const FALLBACK_DARK = 'rgb(21, 21, 23)'
        scope.effect(() => {
          const meta = document.createElement('meta')
          meta.name = 'theme-color'
          meta.setAttribute('data-dsh-webui-fix-pwa', '')
          const sync = () => {
            const scheme = theme.getTheme().active.colorScheme
            const token = scheme === 'dark' ? DARK_TOKEN : LIGHT_TOKEN
            const color = getComputedStyle(document.body).getPropertyValue(token).trim()
            meta.content = color || (scheme === 'dark' ? FALLBACK_DARK : FALLBACK_LIGHT)
            document.head
              .querySelectorAll('meta[name="theme-color"]')
              .forEach((el) => { if (el !== meta) el.remove() })
            if (!meta.isConnected) document.head.append(meta)
          }
          sync()
          const dispose = ctx.on('theme/change', sync)
          return () => {
            if (typeof dispose === 'function') dispose()
            meta.remove()
          }
        }, '@jiesou/dsh-webui-fix-pwa: own the only non-transparent runtime theme-color meta')
      })
    },
  }),
})
