window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-hide-session-log-btn',
  factory: () => {
    var CRUMB_CSS = 'nav[aria-label] button{max-width:none;min-width:0}'

    function match(el) {
      if (!(el instanceof HTMLElement)) return false
      var t = (el.textContent || '').trim().toLowerCase()
      return t.startsWith('session') && (t.includes('log') || t.includes('日志'))
    }

    function hide(btn) {
      btn.style.setProperty('display', 'none', 'important')
    }

    function observe() {
      var seen = new WeakSet()
      var sweep = function (root) {
        root.querySelectorAll('button, a, [role="button"]').forEach(function (el) {
          if (seen.has(el)) return
          if (match(el)) {
            seen.add(el)
            hide(el)
          }
        })
      }
      sweep(document)
      var style = document.createElement('style')
      style.dataset.plugin = '@jiesou/dsh-webui-fix-hide-session-log-btn'
      style.dataset.pluginCss = '@jiesou/dsh-webui-fix-hide-session-log-btn/crumbs.css'
      style.textContent = CRUMB_CSS
      document.head.appendChild(style)
      var obs = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (n) {
            if (n.nodeType === 1) sweep(n)
          })
        })
      })
      obs.observe(document.body, { childList: true, subtree: true })
      return function () {
        obs.disconnect()
        style.remove()
      }
    }

    return {
      name: '@jiesou/dsh-webui-fix-hide-session-log-btn',
      apply(ctx) {
        ctx.effect(observe, '@jiesou/dsh-webui-fix-hide-session-log-btn: hide by label + reclaim title space')
      },
    }
  },
})
