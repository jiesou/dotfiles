/**
 * WORKAROUND (soft-keyboard / touch devices only): the composer must not grab
 * focus on its own.
 *
 * 1. Session entry: dsh-webui auto-focuses the composer whenever a session is
 *    entered — InputBar's `[locked, sessionId, editor]` unlock effect calls
 *    `editor.getRootElement()?.focus()`, and Lexical's selection commit
 *    refocuses the root the same way — popping the IME. All of those paths
 *    are programmatic `HTMLElement.prototype.focus` calls on the composer, so
 *    this plugin drops them at the source: focus never lands, the keyboard
 *    never pops, and there is nothing to retract afterwards. The gate is
 *    pointer engagement: a programmatic focus on the composer card goes
 *    through only if the most recent pointerdown landed inside the card.
 *    Session entry always follows a pointerdown elsewhere (session row, pager
 *    swipe, app boot), so its auto-focus is dropped; every legitimate
 *    programmatic refocus (popup restore, toolbar keep-focus, send) is
 *    preceded by a pointerdown inside the card and passes. Trusted taps reach
 *    the element without calling the patched method and always focus.
 *
 * 2. Sidebar flip: dsh-mobile already blurs the chat editable when the pager
 *    rests on the sidebar page; this mirrors that behaviour so the pack also
 *    works without dsh-mobile (and across its matcher changes).
 *
 * Hard-keyboard devices are untouched (the whole plugin is coarse-pointer
 * gated; auto-focus is harmless there).
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-mobile-keyboard-blur',
  factory: () => {
    const CARD = '[data-composer-card]'

    const isEditable = (el) =>
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLInputElement ||
      el.isContentEditable

    const blurChatEditable = () => {
      const html = document.documentElement
      if (html.getAttribute('data-dshm-page') !== 'sidebar') return
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !isEditable(active)) return
      const frame = document.querySelector('div[data-sidebar-collapsed], div[data-details-collapsed]')
      const chatCard = frame?.children[1]
      if (!(chatCard instanceof Element) || !chatCard.contains(active)) return
      active.blur()
    }

    return {
      name: '@jiesou/dsh-webui-fix-mobile-keyboard-blur',
      apply(ctx) {
        if (!window.matchMedia('(pointer: coarse)').matches) return
        ctx.effect(() => {
          const observer = new MutationObserver(blurChatEditable)
          observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-dshm-page'] })
          blurChatEditable()
          return () => observer.disconnect()
        }, '@jiesou/dsh-webui-fix-mobile-keyboard-blur: retract keyboard on the sidebar page')
        ctx.effect(() => {
          const focus = HTMLElement.prototype.focus
          let engaged = false
          const onPointerDown = (e) => {
            engaged = e.target instanceof Element && e.target.closest(CARD) !== null
          }
          document.addEventListener('pointerdown', onPointerDown, true)
          HTMLElement.prototype.focus = function (options) {
            if (!engaged && this instanceof Element && this.closest(CARD) !== null) return
            return focus.call(this, options)
          }
          return () => {
            HTMLElement.prototype.focus = focus
            document.removeEventListener('pointerdown', onPointerDown, true)
          }
        }, '@jiesou/dsh-webui-fix-mobile-keyboard-blur: drop programmatic composer focus while the pointer is not engaged with the card')
      },
    }
  },
})
