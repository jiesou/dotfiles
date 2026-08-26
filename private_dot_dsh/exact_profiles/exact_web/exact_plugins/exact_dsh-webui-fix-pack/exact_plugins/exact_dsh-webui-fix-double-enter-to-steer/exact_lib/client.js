/**
 * WORKAROUND for deepseek-ai/deepseek-harness (ui-conversation): while an
 * agent is running, plain Enter on a non-empty composer queues the message,
 * and the queued rows only enter the live turn when you click the per-row
 * steer button (or press Cmd/Ctrl+Enter on an empty composer). This plugin
 * makes a second plain Enter on the now-empty composer run the same steer
 * choreography, so two Enters = queue then steer.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-double-enter-to-steer',
  factory: () => {
    function attach(scope) {
      const sessions = scope.sessions
      const conversation = scope.get('conversation')

      function onKeyDown(e) {
        if (!(e.target instanceof HTMLTextAreaElement)) return
        if (e.key !== 'Enter') return
        if (e.isComposing || e.keyCode === 229) return
        if (!e.isTrusted) return
        if (e.ctrlKey || e.metaKey || e.shiftKey) return
        if (e.repeat) return
        if (e.target.closest('[data-composer-card]') === null) return

        const id = sessions.list.getSnapshot().current
        if (id === void 0) return
        const binding = sessions.binding(id)
        const session = binding && binding.session
        if (session === void 0) return
        const snap = session.getSnapshot()
        if (!snap.running || snap.subagent !== null) return
        if (!snap.queue.some((row) => row.placement === 'queued')) return

        const actx = sessions.scope(id)
        const shell = actx && conversation.input.for(actx)
        if (!shell || !shell.steerQueue) return
        const input = shell.snapshot
        if (input.phase !== 'plain') return
        if (input.draft.trim() !== '') return
        if (input.imageIds.length > 0) return

        e.preventDefault()
        e.stopImmediatePropagation()
        shell.steerQueue()
      }

      document.addEventListener('keydown', onKeyDown, true)
      return function () {
        document.removeEventListener('keydown', onKeyDown, true)
      }
    }

    return {
      name: '@jiesou/dsh-webui-fix-double-enter-to-steer',
      apply(ctx) {
        ctx.inject(['conversation', 'sessions'], function (scope) {
          scope.effect(function () {
            return attach(scope)
          }, '@jiesou/dsh-webui-fix-double-enter-to-steer: steer queued messages on empty Enter')
        })
      },
    }
  },
})
