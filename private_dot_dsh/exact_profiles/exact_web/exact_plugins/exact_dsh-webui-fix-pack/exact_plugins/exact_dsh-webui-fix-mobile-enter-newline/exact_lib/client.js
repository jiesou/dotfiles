/**
 * WORKAROUND for the DSH Web UI composer on touch UIs: mobile soft keyboards
 * have no easy Shift, and often no newline key at all, so plain Enter is
 * remapped to a newline. Compatible with both <textarea data-phase> and
 * <div contenteditable data-phase> composer variants.
 *
 * Nothing else is needed here: the running primary button already switches to
 * the send arrow and submits (queue or steer, per the "busy Enter" preference)
 * as soon as the composer holds text, so the sendify shim that used to replay
 * a synthetic Enter was dropped — it was redundant, and its synthetic Enter
 * collided with dsh-mobile's own touch-Enter remap.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-mobile-enter-newline',
  factory: () => {
    function isTouchUi() {
      return !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches
    }

    function slashMenuHasHighlight() {
      if (typeof document === 'undefined') return false
      return document.querySelector('[role="listbox"][aria-activedescendant]') !== null
    }

    // Composer editable: <textarea data-phase> or <div contenteditable data-phase>.
    function isEditableTarget(el) {
      return el instanceof HTMLElement &&
        (el instanceof HTMLTextAreaElement || el.isContentEditable) &&
        el.closest('[data-composer-card]') !== null
    }

    function attach() {
      var onKeyDown = function (e) {
        if (!isEditableTarget(e.target)) return
        if (e.key !== 'Enter') return
        if (e.isComposing || e.keyCode === 229) return
        if (!e.isTrusted) return
        if (!isTouchUi()) return
        if (e.ctrlKey || e.shiftKey || e.metaKey) return
        if (slashMenuHasHighlight()) return
        e.stopImmediatePropagation()
      }
      document.addEventListener('keydown', onKeyDown, true)

      return function () {
        document.removeEventListener('keydown', onKeyDown, true)
      }
    }

    return {
      name: '@jiesou/dsh-webui-fix-mobile-enter-newline',
      apply(ctx) {
        ctx.effect(function () {
          return attach()
        }, '@jiesou/dsh-webui-fix-mobile-enter-newline: Enter inserts a newline on touch UIs')
      },
    }
  },
})
