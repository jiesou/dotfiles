/**
 * WORKAROUND for the dsh-mobile pager + Android WebView IME quirk:
 * the composer editable keeps DOM focus after the user dismisses the soft
 * keyboard (Android keeps focus when the back button hides the IME). When
 * the pager then leaves the chat page, the WebView re-opens the keyboard
 * ("pops up for a moment").
 *
 * dsh-mobile (f494097) already releases chat editables on the page flip,
 * but only matches `textarea, input, [contenteditable="true"]` — so the
 * Lexical composer (<div contenteditable data-phase>) slips through and its
 * IME re-pops. We mirror dsh-mobile's trigger on the pager scroll instead of
 * the coalesced data-dshm-page attribute (a sidebar→chat flip collapses into
 * one delivery whose final value is "chat" and skips the blur). Sidebar-owned
 * editables (search, rename) are never touched.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-mobile-keyboard-blur',
  factory: () => {
    const FRAME_SELECTOR = 'div[data-sidebar-collapsed], div[data-details-collapsed]'

    function isEditable(el) {
      return el instanceof HTMLTextAreaElement ||
        el instanceof HTMLInputElement ||
        el.isContentEditable
    }

    function chatPageLeft(frame) {
      const sidebar = frame.firstElementChild
      if (sidebar instanceof HTMLElement && sidebar.offsetWidth > 0) return sidebar.offsetWidth
      return frame.clientWidth
    }

    function blurChatEditable() {
      const frame = document.querySelector(FRAME_SELECTOR)
      const active = document.activeElement
      if (frame === null || !(active instanceof HTMLElement) || !isEditable(active)) return
      const chatCard = frame.children[1]
      if (!(chatCard instanceof Element) || !chatCard.contains(active)) return
      active.blur()
    }

    function onPagerScroll() {
      const frame = document.querySelector(FRAME_SELECTOR)
      if (frame === null) return
      const left = chatPageLeft(frame)
      if (left > 0 && frame.scrollLeft < left - 2) blurChatEditable()
    }

    return {
      name: '@jiesou/dsh-webui-fix-mobile-keyboard-blur',
      apply(ctx) {
        ctx.effect(() => {
          const html = document.documentElement
          const root = document.getElementById('root')
          const attrObserver = new MutationObserver(() => {
            if (document.documentElement.getAttribute('data-dshm-page') === 'sidebar') blurChatEditable()
          })
          attrObserver.observe(html, { attributes: true, attributeFilter: ['data-dshm-page'] })

          let frame = document.querySelector(FRAME_SELECTOR)
          const bindScroll = () => {
            frame?.removeEventListener('scroll', onPagerScroll)
            frame = document.querySelector(FRAME_SELECTOR)
            frame?.addEventListener('scroll', onPagerScroll, { passive: true })
          }
          bindScroll()
          const rootObserver = root !== null ? new MutationObserver(bindScroll) : null
          rootObserver?.observe(root, { childList: true })

          blurChatEditable()
          return () => {
            attrObserver.disconnect()
            rootObserver?.disconnect()
            frame?.removeEventListener('scroll', onPagerScroll)
          }
        }, '@jiesou/dsh-webui-fix-mobile-keyboard-blur: blur chat editable when leaving the chat page')
      },
    }
  },
})
