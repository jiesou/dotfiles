/**
 * PERF FIX for deepseek-ai/deepseek-harness (client-runtime sessions list):
 * every list mutation (streaming "activity" heartbeats, title edits, status
 * flips, wire refreshes) marks the SessionManager notifier dirty, and that
 * notifier flushes in a MICROTASK — so with 1400+ sessions the full
 * buildListSnapshot() (spread-map over all summaries + flattenLineage +
 * entry/items cache diffing) runs many times per second, each pass costing
 * 10-100ms of main-thread time. The UI runs at ~10-15fps whenever any session
 * streams or a subagent tree churns; viewport resizes and the sidebar drawer
 * slide land on that saturated main thread and stutter.
 *
 * The Notifier already ships a frame-coalesced path (markFrameDirty ->
 * schedule "frame"); mutations just use the microtask one. This plugin
 * re-routes the batched microtask schedule to the frame schedule on the
 * SessionManager notifier only: at most one snapshot rebuild + projection +
 * React commit per animation frame. Synchronous notifyNow() paths (selection,
 * controlled inputs) are untouched. Worst-case visible latency for a
 * background list change becomes one frame (~16ms) — imperceptible for
 * badges/titles.
 */
window.__ModuleLoader__.load({
  id: '@jiesou/dsh-webui-fix-session-list-frame-coalesce',
  factory: () => {
    function findListOwner(sessions) {
      // The rebuild owner is the object owning buildListSnapshot; the .list
      // facade store is NOT it (it only mirrors the projected rows).
      const candidates = [sessions && sessions.manager, sessions && sessions.list]
      return candidates.find((o) => o && typeof o.buildListSnapshot === 'function' && o.notifier) || null
    }

    function coalesce(owner) {
      const notifier = owner.notifier
      const proto = Object.getPrototypeOf(notifier)
      if (!proto || typeof proto.schedule !== 'function') return false
      // Already shadowed (by us or another fix) — leave it alone.
      if (Object.prototype.hasOwnProperty.call(notifier, 'schedule')) return true
      notifier.schedule = function (kind) {
        return proto.schedule.call(this, kind === 'microtask' ? 'frame' : kind)
      }
      return true
    }

    return {
      name: '@jiesou/dsh-webui-fix-session-list-frame-coalesce',
      apply(ctx) {
        // Local A/B escape hatch: boot an instance on :3082 to get stock
        // microtask flushes for comparison benchmarks.
        if (typeof location !== 'undefined' && location.port === '3082') return
        ctx.inject(['sessions'], function (scope) {
          scope.effect(function () {
            const owner = findListOwner(scope.sessions)
            if (!owner) return
            if (!coalesce(owner)) return
            return function () {
              delete owner.notifier.schedule
            }
          }, '@jiesou/dsh-webui-fix-session-list-frame-coalesce: coalesce session-list rebuilds to animation frames')
        })
      },
    }
  },
})
