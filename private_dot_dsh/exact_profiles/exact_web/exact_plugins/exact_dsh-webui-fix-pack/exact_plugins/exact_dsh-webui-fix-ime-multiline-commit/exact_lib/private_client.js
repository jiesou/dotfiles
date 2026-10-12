/**
 * WORKAROUND for the DSH Web UI composer dropping every line after the first
 * when an input method commits multi-line text in one go (Wayland text-input-v3
 * `commit_string`, IBus `CommitText`; e.g. fcitx5-vinput, dictation tools).
 *
 * Why it happens (verified against lexical@0.49.0 + Chromium 154):
 *   - Blink delivers the whole multi-line string as ONE `beforeinput`
 *     (`inputType: "insertText"`, `data: "A\nB\nC"`).
 *   - Lexical's plain-text `$shouldPreventDefaultAndInsertText()` only takes
 *     that insert over when the caret sits on an empty paragraph (element
 *     point). With the caret inside a line that already has text it returns
 *     false, so the browser inserts the text segment by segment.
 *   - Blink fires one `input` event per segment; Lexical's `input` read-back
 *     rebuilds its model from the first segment and re-renders, wiping the
 *     paragraphs Blink is still adding -> only the first line survives.
 *
 * Fix: take the multi-line insert over ourselves and replay it line by line --
 * one trusted `insertText` per line plus a synthetic `insertLineBreak` between
 * lines, i.e. exactly what typing the line and pressing Shift+Enter does.
 * Composing text (`insertCompositionText`), paste (`insertFromPaste`) and
 * single-line inserts are left untouched.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-ime-multiline-commit',
  factory: () => {
    function composerRoot(el) {
      if (!(el instanceof Element)) return null
      return el.closest('[data-composer-input]')
    }

    function attach() {
      let replaying = false

      const onBeforeInput = (event) => {
        if (replaying) return
        if (event.isComposing || event.keyCode === 229) return
        const root = composerRoot(event.target)
        if (root === null) return
        if (event.inputType !== 'insertText') return
        const data = event.data
        if (typeof data !== 'string') return
        if (data.indexOf('\n') === -1 || data === '\n') return

        event.preventDefault()
        event.stopImmediatePropagation()

        const lines = data.replace(/\r\n?/g, '\n').split('\n')
        replaying = true
        setTimeout(() => {
          try {
            for (let i = 0; i < lines.length; i += 1) {
              if (i > 0) {
                root.dispatchEvent(new InputEvent('beforeinput', {
                  inputType: 'insertLineBreak',
                  bubbles: true,
                  cancelable: true,
                }))
              }
              if (lines[i]) document.execCommand('insertText', false, lines[i])
            }
          } finally {
            replaying = false
          }
        }, 0)
      }

      document.addEventListener('beforeinput', onBeforeInput, true)

      return function () {
        document.removeEventListener('beforeinput', onBeforeInput, true)
      }
    }

    return {
      name: '@jiesou/dsh-webui-fix-ime-multiline-commit',
      apply(ctx) {
        ctx.effect(function () {
          return attach()
        }, '@jiesou/dsh-webui-fix-ime-multiline-commit: keep every line of a multi-line IME commit')
      },
    }
  },
})
