/**
 * WORKAROUND for the dsh-mobile pager + Android WebView IME quirk:
 * the composer textarea keeps DOM focus after the user dismisses the soft
 * keyboard (Android keeps focus when the back button hides the IME). When
 * the pager then scrolls/snaps to the sidebar page, the WebView re-opens
 * the keyboard ("pops up for a moment").
 *
 * dsh-mobile already mirrors the resting page on <html data-dshm-page>.
 * This plugin watches that attribute and blurs any editable living on the
 * chat card once the sidebar page is shown. Sidebar-owned editables (search,
 * rename) are not touched.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-mobile-keyboard-blur',
  factory: () => {
    const EDITABLE_SELECTOR = 'textarea, input, [contenteditable="true"]'

    function blurChatEditable() {
      const html = document.documentElement
      if (html.getAttribute('data-dshm-page') !== 'sidebar') return
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !active.matches(EDITABLE_SELECTOR)) return
      const frame = document.querySelector('div[data-sidebar-collapsed], div[data-details-collapsed]')
      const chatCard = frame?.children[1]
      if (!(chatCard instanceof Element) || !chatCard.contains(active)) return
      active.blur()
    }

    return {
      name: '@jiesou/dsh-webui-fix-mobile-keyboard-blur',
      apply(ctx) {
        ctx.effect(() => {
          const html = document.documentElement
          const observer = new MutationObserver(blurChatEditable)
          observer.observe(html, { attributes: true, attributeFilter: ['data-dshm-page'] })
          blurChatEditable()
          return () => observer.disconnect()
        }, '@jiesou/dsh-webui-fix-mobile-keyboard-blur: blur chat editable on sidebar page')
      },
    }
  },
})
