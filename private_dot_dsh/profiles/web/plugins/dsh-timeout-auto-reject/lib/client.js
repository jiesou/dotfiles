window.__ModuleLoader__.load({
  id: '@jiesou/dsh-timeout-auto-reject',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    var DEADLINE_REASON_PREFIX = 'dsh-timeout:'

    function rejectButton(card) {
      return card.querySelector('[data-approval-scroll] + div > button:first-child')
    }

    function deadlineOf(card) {
      var text = card.textContent || ''
      var marker = text.lastIndexOf(DEADLINE_REASON_PREFIX)
      if (marker < 0) return null
      var match = text.slice(marker + DEADLINE_REASON_PREFIX.length).match(/^\d+/)
      var deadline = Number(match && match[0])
      return Number.isFinite(deadline) ? deadline : null
    }

    function decorate(card) {
      var btn = rejectButton(card)
      if (!btn || btn.querySelector('[data-dsh-reject-countdown]')) return

      var deadline = deadlineOf(card)
      if (deadline === null) return

      var walker = card.ownerDocument.createTreeWalker(card, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        var node = walker.currentNode
        var index = node.data.indexOf(DEADLINE_REASON_PREFIX)
        if (index >= 0) node.data = node.data.slice(0, index)
      }

      var span = document.createElement('span')
      span.setAttribute('data-dsh-reject-countdown', '')
      btn.appendChild(span)

      var timer
      var paint = function () {
        var remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
        span.textContent = ' (' + remaining + 's)'
        if (remaining === 0) clearInterval(timer)
      }
      timer = setInterval(paint, 250)
      paint()
    }

    function observe() {
      var sweep = function (root) {
        root.querySelectorAll('[data-approval-key]').forEach(decorate)
      }
      sweep(document)
      var obs = new MutationObserver(function () {
        sweep(document)
      })
      obs.observe(document.body, { childList: true, subtree: true })
      return function () {
        obs.disconnect()
      }
    }

    exports.apply = function (ctx) {
      ctx.effect(observe, 'dsh-timeout-auto-reject: reject-button countdown')
    }
    return module.exports
  },
})
