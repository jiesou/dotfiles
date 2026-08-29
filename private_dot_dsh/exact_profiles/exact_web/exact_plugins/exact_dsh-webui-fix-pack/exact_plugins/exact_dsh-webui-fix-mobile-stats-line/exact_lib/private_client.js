/**
 * Fix StatsLine tooltip on mobile.
 *
 * dsh-mobile hides `[data-side]` elements, including the upstream Tooltip
 * bubble (`role="tooltip"` + `data-side="top"`); this plugin re-displays it
 * via CSS and widens it to 80vw.
 *
 * On touch the stats line is a non-focusable div that can only reveal via an
 * emulated mouseenter behind a 500ms hover delay, so on coarse pointers this
 * plugin toggles it by tapping to focus and tapping again to dismiss. Desktop
 * hover is untouched.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-mobile-stats-line',
  factory: () => {
    var STATS_TOOLTIP_CSS = '@media (width<=768px){[data-dsh-mobile] [data-slot="conversation.composer.dock"] [role="tooltip"]{display:block !important;max-width:80vw !important}}'
    var DOCK = '[data-slot="conversation.composer.dock"]'
    var coarsePointer = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null

    function attach() {
      var style = document.createElement('style')
      style.dataset.plugin = '@jiesou/dsh-webui-fix-mobile-stats-line'
      style.dataset.pluginCss = '@jiesou/dsh-webui-fix-mobile-stats-line/stats-line-tooltip.css'
      style.textContent = STATS_TOOLTIP_CSS
      document.head.appendChild(style)

      function statsAnchor(target) {
        var dock = target.closest(DOCK)
        if (dock === null) return null
        for (var el of dock.children) {
          if (el.getAttribute('role') === 'tooltip') continue
          if (el instanceof HTMLElement && el.scrollWidth > el.clientWidth) return el
        }
        return null
      }

      function onClick(event) {
        if (coarsePointer !== null && !coarsePointer.matches) return
        var target = event.target
        if (!(target instanceof Element)) return
        var anchor = statsAnchor(target)
        if (anchor === null || !anchor.contains(target)) return
        if (document.activeElement === anchor) {
          anchor.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
          anchor.blur()
          return
        }
        anchor.setAttribute('tabindex', '-1')
        anchor.focus({ preventScroll: true })
      }

      document.addEventListener('click', onClick, true)
      return function () {
        document.removeEventListener('click', onClick, true)
        style.remove()
      }
    }

    return {
      name: '@jiesou/dsh-webui-fix-mobile-stats-line',
      apply(ctx) {
        ctx.effect(attach, '@jiesou/dsh-webui-fix-mobile-stats-line: tap-to-toggle stats line tooltip on touch')
      },
    }
  },
})