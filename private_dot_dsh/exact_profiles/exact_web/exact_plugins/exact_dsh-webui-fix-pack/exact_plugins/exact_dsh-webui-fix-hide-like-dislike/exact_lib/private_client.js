/**
 * WORKAROUND for the DSH Web UI message feedback buttons: every assistant
 * message shows a Like/Dislike pair that this user considers useless, so hide
 * them. The buttons are rendered by @deepseek-ai/dsh-client-ui-message-feedback
 * inside the assistant turn's IconActions row.
 *
 * This plugin deliberately avoids CSS-module class names (hashed and change
 * across builds) and targets the stable ARIA structure emitted by
 * MessageFeedbackActions:
 *
 *   [data-turn-tail] button[aria-pressed]
 *
 * Like/Dislike are the only buttons in that actions row with aria-pressed;
 * Copy and Branch never set it.
 *
 * https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/packages/client/ui-message-feedback/src/client/MessageFeedbackActions.tsx
 *
 * Remove once upstream lets users disable message feedback.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-hide-like-dislike',
  factory: () => {
    var CSS = '[data-turn-tail] button[aria-pressed]{display:none !important}'

    function attach() {
      var style = document.createElement('style')
      style.dataset.plugin = '@jiesou/dsh-webui-fix-hide-like-dislike'
      style.dataset.pluginCss = '@jiesou/dsh-webui-fix-hide-like-dislike/feedback.css'
      style.textContent = CSS
      document.head.appendChild(style)
      return function () {
        style.remove()
      }
    }

    return {
      name: '@jiesou/dsh-webui-fix-hide-like-dislike',
      apply(ctx) {
        ctx.effect(attach, '@jiesou/dsh-webui-fix-hide-like-dislike: hide like/dislike buttons')
      },
    }
  },
})
