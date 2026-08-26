window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-mobile-enter-newline',
  factory: () => {
    const cssTagId = '@jiesou/dsh-webui-fix-mobile-enter-newline/sendify.css'
    const CSS = '[data-composer-card] button.dsh-sendified>svg:not(.dsh-sendified-icon){display:none}'
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="' + cssTagId + '"]') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = '@jiesou/dsh-webui-fix-mobile-enter-newline'
      tag.dataset.pluginCss = cssTagId
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    function isTouchUi() {
      return !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches
    }

    function slashMenuHasHighlight() {
      if (typeof document === 'undefined') return false
      return document.querySelector('[role="listbox"][aria-activedescendant]') !== null
    }

    function cards() {
      return Array.prototype.slice.call(document.querySelectorAll('[data-composer-card]'))
    }

    function textareaOf(card) {
      return card.querySelector('textarea[data-phase]')
    }

    function primaryOf(card) {
      var buttons = card.querySelectorAll('button')
      return buttons.length === 0 ? null : buttons[buttons.length - 1]
    }

    function isSend(btn) {
      return btn !== null && btn.querySelector('svg path') !== null
    }

    function isStopMode(scope) {
      var sessions = scope.sessions
      var id = sessions.list.getSnapshot().current
      if (id === void 0) return false
      var binding = sessions.binding(id)
      var snap = binding && binding.session.getSnapshot()
      return !!snap && snap.running === true && snap.subagent === null
    }

    function onSendifiedClick(e) {
      var button = e.currentTarget
      var card = button.closest('[data-composer-card]')
      var textarea = card && textareaOf(card)
      if (!textarea) return
      e.preventDefault()
      e.stopImmediatePropagation()
      textarea.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }))
      if (resyncSoon !== null) resyncSoon()
    }

    var templateHtml = null
    var templateLabel = null
    var resyncSoon = null

    function sendify(button) {
      if (button.__dshSendified !== true) {
        button.__dshSendified = true
        button.classList.add('dsh-sendified')
        button.addEventListener('click', onSendifiedClick, true)
      }
      if (button.querySelector('.dsh-sendified-icon') === null && templateHtml !== null) {
        var holder = document.createElement('div')
        holder.innerHTML = templateHtml
        var icon = holder.firstElementChild
        if (icon !== null) {
          icon.classList.add('dsh-sendified-icon')
          button.appendChild(icon)
        }
      }
      if (templateLabel !== null) {
        if (button.getAttribute('aria-label') !== templateLabel) {
          button.setAttribute('aria-label', templateLabel)
        }
        var tip = button.nextElementSibling
        if (tip !== null && tip.getAttribute('role') === 'tooltip' && tip.textContent !== templateLabel) {
          tip.textContent = templateLabel
        }
      }
    }

    function clearSendified(button) {
      if (button === null || button.__dshSendified !== true) return
      button.removeEventListener('click', onSendifiedClick, true)
      button.classList.remove('dsh-sendified')
      var icon = button.querySelector('.dsh-sendified-icon')
      if (icon !== null) icon.remove()
      delete button.__dshSendified
    }

    function attachSteering(scope) {
      var scheduled = false

      function syncSoon() {
        if (scheduled) return
        scheduled = true
        requestAnimationFrame(function () {
          scheduled = false
          syncAll()
        })
      }

      function syncCard(card) {
        var button = primaryOf(card)
        if (button === null) return
        if (templateHtml === null && isSend(button)) {
          templateHtml = button.innerHTML
          templateLabel = button.getAttribute('aria-label')
        }
        var textarea = textareaOf(card)
        var hasText = textarea !== null && textarea.value.trim() !== ''
        if (isStopMode(scope) && hasText && templateHtml !== null) sendify(button)
        else clearSendified(button)
      }

      function syncAll() {
        cards().forEach(syncCard)
      }

      resyncSoon = function () {
        requestAnimationFrame(syncAll)
      }

      var onKeyDown = function (e) {
        if (!(e.target instanceof HTMLTextAreaElement)) return
        if (e.key !== 'Enter') return
        if (e.isComposing || e.keyCode === 229) return
        if (!e.isTrusted) return
        if (!isTouchUi()) return
        if (e.ctrlKey || e.shiftKey || e.metaKey) return
        if (slashMenuHasHighlight()) return
        e.stopImmediatePropagation()
      }
      document.addEventListener('keydown', onKeyDown, true)
      document.addEventListener('input', syncSoon, true)
      var observer = new MutationObserver(syncSoon)
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true })
      syncAll()

      return function () {
        resyncSoon = null
        document.removeEventListener('keydown', onKeyDown, true)
        document.removeEventListener('input', syncSoon, true)
        observer.disconnect()
        cards().forEach(function (card) { clearSendified(primaryOf(card)) })
      }
    }

    return {
      name: '@jiesou/dsh-webui-fix-mobile-enter-newline',
      apply(ctx) {
        ctx.inject(['sessions'], function (scope) {
          scope.effect(function () {
            return attachSteering(scope)
          }, '@jiesou/dsh-webui-fix-mobile-enter-newline: sendify running primary button')
        })
      },
    }
  },
})
