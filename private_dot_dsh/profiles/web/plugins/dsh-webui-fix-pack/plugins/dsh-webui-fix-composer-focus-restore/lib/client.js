/**
 * WORKAROUND for deepseek-ai/deepseek-harness (ui-commands): popupSelect shells
 * (e.g. /models) never return focus to the composer — settle/Escape call
 * deps.focusComposer(), but nothing ever binds the per-session hook, so it is a
 * silent no-op. This plugin binds the hook for the current session.
 *
 * https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/packages/client/ui-commands/src/client/popup.ts
 * https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/packages/client/ui-commands/src/client/service.ts
 *
 * Remove once upstream fixes it.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-composer-focus-restore',
  factory: () => ({
    name: '@jiesou/dsh-webui-fix-composer-focus-restore',
    apply(ctx) {
      ctx.inject(['commandUi', 'sessions'], function (scope) {
        const commandUi = scope.get('commandUi')
        const list = scope.sessions.list
        const focus = function () {
          const textarea = document.querySelector('[data-composer-card] textarea')
          if (textarea !== null && document.activeElement !== textarea) textarea.focus({ preventScroll: true })
        }
        scope.effect(function () {
          let current = null
          let unbind = null
          const sync = function () {
            const next = list.getSnapshot().current
            if (next === current) return
            if (unbind !== null) unbind()
            unbind = next === void 0 ? null : commandUi.bindComposerFocus(next, focus)
            current = next
          }
          sync()
          const unsubscribe = list.subscribe(sync)
          return () => {
            unsubscribe()
            if (unbind !== null) unbind()
          }
        }, '@jiesou/dsh-webui-fix-composer-focus-restore: bind current session focus')
      })
    },
  }),
})