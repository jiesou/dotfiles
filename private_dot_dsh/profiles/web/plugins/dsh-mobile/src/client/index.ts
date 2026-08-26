/**
 * Browser half of the dsh-mobile plugin: mounts the DOM-side mobile
 * controller (viewport meta, safe-area/keyboard insets, pager page mirror)
 * and returns to the chat page when the current session changes (a session
 * picked in the sidebar). The global mobile sheet (mobile.css) is injected
 * with this bundle as a <style data-plugin> tag and removed on unload — the
 * stock GUI stays byte-identical without the plugin row.
 *
 * Mobile layout follows PiUI's chat pager: the stock three-column frame
 * becomes a horizontal scroll-snap pager (sidebar | chat), the chat column
 * renders completely untouched, and the pager starts on the chat page —
 * swiping reveals the always-open sidebar.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the layout plugin's Context merge (ctx.layout) and the
// sessions service surface into this compilation unit.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import { MobileController } from './controller.ts'
// Plugin-owned global mobile sheet (injected as a <style data-plugin> tag).
import './mobile.css'

/** Services required by the mobile plugin. */
export const inject = ['layout', 'sessions']

/**
 * Install the mobile surfaces: the DOM controller (one effect). A
 * current-session change (a session picked from the sidebar page, or a new
 * session started) returns the pager to the chat page — list updates that
 * do not move `current` (running flags, titles) leave it alone.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    const controller = new MobileController({
      toggleSidebar: () => ctx.layout.toggleSidebar(),
    })
    controller.mount()
    let lastCurrent = ctx.sessions.list.getSnapshot().current
    const off = ctx.sessions.list.subscribe(() => {
      const next = ctx.sessions.list.getSnapshot().current
      if (next === lastCurrent) return
      lastCurrent = next
      controller.returnToChat()
    })
    return () => {
      off()
      controller.dispose()
    }
  }, 'dsh-mobile: DOM controller')
}
