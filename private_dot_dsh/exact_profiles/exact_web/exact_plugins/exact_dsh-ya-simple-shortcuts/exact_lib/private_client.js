/**
 * dsh-ya-simple-shortcuts — browser half.
 *
 * Hardcoded, no-config shortcuts for the DSH WebUI:
 *   Alt+X            start a new session
 *   Tab / Shift+Tab  cycle the agent preset while the composer is focused
 *   Alt+Up/Down      scroll to my previous/next user message
 *   Alt+Right/Left   bump reasoning effort up/down
 *   Ctrl+K           open the built-in session search
 *
 * The preset cycle drives the official new-session hero chip (DOM + menu
 * click), so the host's staged-preset lifecycle stays intact.
 */
window.__ModuleLoader__.load({
  id: 'dsh-ya-simple-shortcuts',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    function flatModelList(groups) {
      var flat = []
      for (var g = 0; g < groups.length; g++) {
        var group = groups[g]
        if (!group || !group.models) continue
        for (var m = 0; m < group.models.length; m++) flat.push({ provider: group.id, model: group.models[m] })
      }
      return flat
    }

    function cycleEffort(scope, dir) {
      var id = scope.sessions.list.getSnapshot().current
      if (id === void 0) return
      var directory
      try { directory = scope.modelDirectories.directoryFor(id) } catch (err) { return }
      var snap = directory.store.getSnapshot()
      var current = snap && snap.current
      if (!current) return
      var entry = flatModelList(snap.groups || []).find(function (f) {
        return f.provider === current.provider && f.model.id === current.model
      })
      if (!entry || !entry.model.reasoning || !entry.model.reasoning.efforts || entry.model.reasoning.efforts.length === 0) return
      var efforts = entry.model.reasoning.efforts
      var choices = [void 0]
      for (var i = 0; i < efforts.length; i++) choices.push(efforts[i].id)
      var idx = choices.findIndex(function (id) { return id === current.reasoningEffort })
      if (idx < 0) idx = 0
      var next = choices[(idx + dir + choices.length) % choices.length]
      var selection = { provider: current.provider, model: current.model }
      if (next !== void 0) selection.reasoningEffort = next
      var p = directory.select(selection)
      if (p && p.catch) p.catch(function () {})
    }

    function openSessionSearch() {
      var button = document.querySelector('button[aria-label="搜索会话"], button[aria-label="Search sessions"]')
      if (button) button.click()
      requestAnimationFrame(function () {
        var input = document.querySelector('input[placeholder="搜索会话…"], input[placeholder="Search sessions..."]')
        if (input) input.focus({ preventScroll: true })
      })
    }

    function scrollToUser(dir) {
      var scrollport = document.querySelector('[data-conversation-scroll]')
      if (!scrollport) {
        console.log('[dsh-ya-simple-shortcuts] scroll: no scrollport', dir)
        return
      }
      var rows = Array.prototype.slice.call(scrollport.querySelectorAll('[data-chat-anchor-key]')).filter(function (row) {
        var kind = row.dataset.chatFlowKind
        return kind === 'user' || kind === 'steering'
      })
      var marker = scrollport.getBoundingClientRect().top + 80
      var target
      if (dir < 0) {
        var above = rows.filter(function (row) { return row.getBoundingClientRect().bottom < marker })
        target = above[above.length - 1]
      } else {
        target = rows.find(function (row) { return row.getBoundingClientRect().top > marker })
      }
      var newTop
      if (!target) {
        newTop = dir < 0 ? 0 : scrollport.scrollHeight
      } else {
        var delta = target.getBoundingClientRect().top - scrollport.getBoundingClientRect().top
        newTop = scrollport.scrollTop + delta
      }
      console.log('[dsh-ya-simple-shortcuts] scroll', {
        dir,
        scrollport: !!scrollport,
        scrollTop: scrollport.scrollTop,
        newTop,
        marker,
        rows: rows.map(function (row) {
          return { key: row.dataset.chatAnchorKey, kind: row.dataset.chatFlowKind, top: Math.round(row.getBoundingClientRect().top), bottom: Math.round(row.getBoundingClientRect().bottom) }
        }),
        target: target ? target.dataset.chatAnchorKey : null
      })
      if (typeof scrollport.scrollTo === 'function') scrollport.scrollTo({ top: newTop })
      else scrollport.scrollTop = newTop
    }

    function cyclePreset(dir) {
      var seat = document.querySelector('[data-slot="conversation.hero.agentPreset"] button[aria-haspopup="menu"]')
      if (!seat) return false
      seat.click()
      requestAnimationFrame(function () {
        var menus = document.querySelectorAll('[role="menu"]')
        var menu = menus.length === 0 ? null : menus[menus.length - 1]
        if (!menu) return
        var items = Array.prototype.slice.call(menu.querySelectorAll('button[role="menuitem"]'))
        if (items.length === 0) return
        var label = seat.textContent.trim()
        var idx = items.findIndex(function (item) { return item.textContent.includes(label) })
        if (idx < 0) idx = 0
        items[(idx + dir + items.length) % items.length].click()
      })
      return true
    }

    function onKeyDown(scope, e) {
      if (!e.isTrusted || e.isComposing || e.keyCode === 229 || e.repeat) return
      var key = e.key.toLowerCase()
      var alt = e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey
      var ctrl = e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey
      if (alt && key === 'x') {
        e.preventDefault()
        scope.workspaces.startSession()
        return
      }
      if (ctrl && key === 'k') {
        e.preventDefault()
        openSessionSearch()
        return
      }
      if (alt && (key === 'arrowup' || key === 'arrowdown')) {
        e.preventDefault()
        console.log('[dsh-ya-simple-shortcuts] alt arrow keydown', key, {
          activeTag: document.activeElement && document.activeElement.tagName,
          activeClass: document.activeElement && document.activeElement.className,
          scrollport: !!document.querySelector('[data-conversation-scroll]')
        })
        scrollToUser(key === 'arrowup' ? -1 : 1)
        return
      }
      if (alt && key === 'arrowright') {
        e.preventDefault()
        cycleEffort(scope, 1)
        return
      }
      if (alt && key === 'arrowleft') {
        e.preventDefault()
        cycleEffort(scope, -1)
        return
      }
      if (key === 'tab' && e.target instanceof HTMLTextAreaElement && e.target.closest('[data-composer-card]')) {
        if (cyclePreset(e.shiftKey ? -1 : 1)) e.preventDefault()
      }
    }

    exports.name = 'dsh-ya-simple-shortcuts'
    exports.apply = function (ctx) {
      ctx.inject(['workspaces', 'sessions', 'modelDirectories'], function (scope) {
        scope.effect(function () {
          var handler = function (e) { onKeyDown(scope, e) }
          document.addEventListener('keydown', handler, true)
          return function () {
            document.removeEventListener('keydown', handler, true)
          }
        }, 'dsh-ya-simple-shortcuts: keydown')
      })
    }
    return module.exports
  },
})