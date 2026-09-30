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
        const SCHEME_COOKIE = 'dsh-color-scheme'
        scope.effect(() => {
          const meta = document.createElement('meta')
          meta.name = 'theme-color'
          meta.setAttribute('data-dsh-webui-fix-pwa', '')
          const ensureApple = () => {
            if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
              const m = document.createElement('meta')
              m.name = 'apple-mobile-web-app-capable'
              m.content = 'yes'
              document.head.append(m)
            }
            if (!document.querySelector('meta[name="mobile-web-app-capable"]')) {
              const m = document.createElement('meta')
              m.name = 'mobile-web-app-capable'
              m.content = 'yes'
              document.head.append(m)
            }
            let bar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
            if (!bar) {
              bar = document.createElement('meta')
              bar.name = 'apple-mobile-web-app-status-bar-style'
              document.head.append(bar)
            }
            bar.content = 'black-translucent'
            const vp = document.querySelector('meta[name="viewport"]')
            if (vp && !/viewport-fit\s*=\s*cover/.test(vp.content)) vp.content += ', viewport-fit=cover'
          }
          const sync = () => {
            const scheme = theme.getTheme().active.colorScheme
            const token = scheme === 'dark' ? DARK_TOKEN : LIGHT_TOKEN
            const color = getComputedStyle(document.body).getPropertyValue(token).trim()
              || (scheme === 'dark' ? FALLBACK_DARK : FALLBACK_LIGHT)
            meta.content = color
            document.documentElement.style.background = color
            // The manifest cannot carry per-scheme colors, so report the scheme
            // we resolved here for the host half to bake into the manifest.
            if (!document.cookie.includes(`${SCHEME_COOKIE}=${scheme}`)) {
              document.cookie = `${SCHEME_COOKIE}=${scheme}; path=/; max-age=31536000; SameSite=Lax`
            }
            ensureApple()
            document.head
              .querySelectorAll('meta[name="theme-color"]')
              .forEach((el) => { if (el !== meta) el.remove() })
            if (!meta.isConnected) document.head.append(meta)
          }
          sync()
          const dispose = ctx.on('theme/change', sync)
          const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null
          const onMq = () => sync()
          mq?.addEventListener?.('change', onMq)
          return () => {
            if (typeof dispose === 'function') dispose()
            mq?.removeEventListener?.('change', onMq)
            meta.remove()
          }
        }, '@jiesou/dsh-webui-fix-pwa: own the only non-transparent runtime theme-color meta')
      })
    },
  }),
})
