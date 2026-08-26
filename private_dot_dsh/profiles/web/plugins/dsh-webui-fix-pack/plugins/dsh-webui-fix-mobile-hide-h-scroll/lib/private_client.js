/**
 * WORKAROUND for @dsh-external/dsh-mobile: on narrow web views the sidebar/chat
 * pager can still expose a horizontal scrollbar while swiping (dsh-mobile only
 * hides descendant scrollbars on coarse pointers, not every scrollport on the
 * mobile layout). This plugin hides scrollbars under the [data-dsh-mobile]
 * root on the same ≤768px layout.
 *
 * Remove once upstream hides all mobile scrollbars.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-mobile-hide-h-scroll',
  factory: () => {
    var CSS = '@media (max-width: 768px){html[data-dsh-mobile],html[data-dsh-mobile] *{scrollbar-width:none !important}html[data-dsh-mobile]::-webkit-scrollbar,html[data-dsh-mobile] *::-webkit-scrollbar{width:0;height:0;display:none !important}}'

    function attach() {
      var style = document.createElement('style')
      style.dataset.plugin = '@jiesou/dsh-webui-fix-mobile-hide-h-scroll'
      style.dataset.pluginCss = '@jiesou/dsh-webui-fix-mobile-hide-h-scroll/mobile.css'
      style.textContent = CSS
      document.head.appendChild(style)
      return function () {
        style.remove()
      }
    }

    return {
      name: '@jiesou/dsh-webui-fix-mobile-hide-h-scroll',
      apply(ctx) {
        ctx.effect(attach, '@jiesou/dsh-webui-fix-mobile-hide-h-scroll: hide horizontal scrollbar in dsh-mobile web views')
      },
    }
  },
})