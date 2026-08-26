/**
 * Fix StatsLine tooltip on mobile.
 *
 * Visibility root cause: @dsh-external/dsh-mobile hides every `[data-side]`
 * element (`[data-dsh-mobile] [data-side] { display:none !important }`), and
 * the upstream Tooltip bubble uses `role="tooltip"` + `data-side="top"`.
 * This plugin re-enables that bubble for the StatsLine slot and allows it to
 * use up to 80vw (wider than upstream's 50vw, while still leaving comfortable
 * viewport margins).
 *
 * Reachability root cause: the stats line is a plain non-focusable div, so on
 * touch its only reveal path is an emulated mouseenter behind the upstream
 * 500ms hover delay -- and any subsequent tap fires an emulated mouseleave
 * that instantly hides the bubble (a sloppy tap that turns into a micro-scroll
 * never triggers anything at all). On coarse pointers this plugin intercepts
 * taps instead: focusing the line rides upstream's immediate-show focus path,
 * and a second tap dispatches mouseout + blur to dismiss. Desktop hover stays
 * untouched.
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
        for (var el = dock.firstElementChild; el !== null; el = el.nextElementSibling) {
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