/**
 * WORKAROUND for the subagent catalog panel on mobile/touch, until upstream
 * makes it responsive and tap-toggleable:
 *   - The session tree opens at `left: 0` and spills off-screen on narrow
 *     layouts; clamp any open instance to the viewport.
 *   - The trigger only opens via a hover timer with a hover-close race, so
 *     taps do nothing; click toggles it via ArrowDown/Escape.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-subagent-panel',
  factory: () => {
    var EDGE = 16

    function isTouchUi() {
      return !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches
    }

    // --- display: clamp the catalog tree to the viewport ---
    function isCatalogPanel(el) {
      if (!(el instanceof Element)) return false
      var parent = el.parentElement
      return parent !== null && parent.querySelector('button[aria-haspopup="tree"]') !== null
    }

    function panels() {
      var result = []
      for (var el of document.querySelectorAll('[role="tree"]')) {
        if (isCatalogPanel(el)) result.push({ root: el.parentElement, panel: el })
      }
      return result
    }

    function fitPanel(root, panel) {
      var width = panel.offsetWidth
      var rect = root.getBoundingClientRect()
      var viewportLeft = Math.min(Math.max(rect.left, EDGE), window.innerWidth - EDGE - width)
      panel.style.left = (viewportLeft - rect.left) + 'px'
      panel.style.right = 'auto'
    }

    function fitAll() {
      if (!isTouchUi()) return
      for (var item of panels()) fitPanel(item.root, item.panel)
    }

    // --- click: toggle the catalog trigger ---
    var TRIGGER = '[aria-haspopup="tree"][aria-expanded]'
    var ANCESTOR_NAV = '[class*="_ancestorSwitcherTrigger"]'
    var HOVER_GRACE_MS = 600
    var hoveredAt = new WeakMap()

    function dispatchKey(button, key) {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true }))
    }

    function markHover(event) {
      var target = event.target
      if (!(target instanceof Element)) return
      var button = target.closest(TRIGGER)
      if (button !== null) hoveredAt.set(button, Date.now())
    }

    function onClick(event) {
      var target = event.target
      if (!(target instanceof Element)) return
      var button = target.closest(TRIGGER)
      if (button === null || button.closest(ANCESTOR_NAV) !== null) return
      if (button.getAttribute('aria-expanded') !== 'true') {
        dispatchKey(button, 'ArrowDown')
        return
      }
      var hovered = hoveredAt.get(button)
      if (hovered !== void 0 && Date.now() - hovered < HOVER_GRACE_MS) return
      dispatchKey(button, 'Escape')
    }

    function attach() {
      var raf = 0
      function debounceFitAll() {
        if (!raf) raf = requestAnimationFrame(function () { raf = 0; fitAll() })
      }
      fitAll()
      var observer = new MutationObserver(debounceFitAll)
      observer.observe(document.body, { childList: true, subtree: true })
      window.addEventListener('resize', fitAll)
      document.addEventListener('pointerover', markHover, true)
      document.addEventListener('click', onClick, true)
      return function () {
        observer.disconnect()
        window.removeEventListener('resize', fitAll)
        document.removeEventListener('pointerover', markHover, true)
        document.removeEventListener('click', onClick, true)
        if (raf) { cancelAnimationFrame(raf); raf = 0 }
      }
    }

    return {
      name: '@jiesou/dsh-webui-fix-subagent-panel',
      apply(ctx) {
        ctx.effect(attach, '@jiesou/dsh-webui-fix-subagent-panel: keep the subagent catalog panel on-screen and tap-toggleable on mobile')
      },
    }
  },
})
