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
// The client context type: cordis' Context merged with the plugin surfaces
// referenced below (ui-layout's ctx.layout via the type-only import; the
// sessions service merge comes from the session-controller contract). The
// old `@deepseek-ai/dsh-client-runtime/client` module was removed upstream
// (dsh 0.1.2+); plugins now type the apply parameter as the plain cordis
// Context and pull each service's Context merge with type-only imports.
import type { Context as ClientContext } from 'cordis'
// Type-only: pulls the layout plugin's Context merge (ctx.layout) into this
// compilation unit.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the ISessions Context merge (ctx.sessions) — the sessions
// service now lives in the session-controller package (moved out of the
// removed client-runtime).
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
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
