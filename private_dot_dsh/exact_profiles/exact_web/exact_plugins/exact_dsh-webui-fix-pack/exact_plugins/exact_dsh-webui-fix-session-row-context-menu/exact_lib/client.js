/**
 * WORKAROUND for the DSH Web UI session list: the row actions menu is only
 * reachable through the small ellipsis button, which is hard to hit. This
 * plugin makes right-clicking anywhere on a session row open that same menu.
 *
 * It works by replaying a click on the row's own ellipsis button, so the
 * menu state stays owned by the workspace React component. It deliberately
 * avoids CSS-module class names (they are hashed and change across builds)
 * and targets the stable ARIA structure emitted by
 * @deepseek-ai/dsh-client-ui-workspace:
 *
 *   [role="tree"] [role="treeitem"][aria-selected]:not(button)
 *
 * Session rows are non-button treeitems; search results are treeitem buttons
 * and project rows have no aria-selected, so this selector is specific to
 * session rows. The ellipsis is the only labelled button inside such a row.
 *
 * https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/packages/client/ui-workspace/src/client/rows/Rows.tsx
 *
 * Remove once upstream adds a native context menu to session rows.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-session-row-context-menu',
  factory: () => {
    var SESSION_ROW = '[role="tree"] [role="treeitem"][aria-selected]:not(button)'
    var MENU_BUTTON = 'button[aria-label]'

    function menuButton(row) {
      return row.querySelector(MENU_BUTTON)
    }

    function onContextMenu(e) {
      var el = e.target instanceof Element ? e.target : e.target.parentElement
      var row = el instanceof Element ? el.closest(SESSION_ROW) : null
      if (row === null) return
      var btn = menuButton(row)
      if (btn === null) return
      e.preventDefault()
      btn.click()
    }

    function attach() {
      document.addEventListener('contextmenu', onContextMenu, true)
      return function () {
        document.removeEventListener('contextmenu', onContextMenu, true)
      }
    }

    return {
      name: '@jiesou/dsh-webui-fix-session-row-context-menu',
      apply(ctx) {
        ctx.effect(attach, '@jiesou/dsh-webui-fix-session-row-context-menu: open row menu on right-click')
      },
    }
  },
})
