// Auto-reject OpenCode permission requests left unanswered for a period of
// time, and tell the agent to change direction instead of bypassing the
// permission.
//
// Uses the generic `event` hook because the `permission.ask` plugin hook is
// declared but never triggered by the permission engine (issues #7006/#9229).

const TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes

const AUTO_REJECT_PROMPT =
  "SYSTEM: This specific tool call was auto-rejected, " +
  "because the user is off-screen now. " +
  "Follow SAFETY & BOUNDARIES guidelines; break your large commands down into multiple auditable actions; or try a different approach."

const pending = new Map() // requestID -> timeout handle

export const TimeoutAutoReject = async ({ client }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "permission.asked") {
        const permission = event.properties
        const requestID = permission.id
        if (!requestID || pending.has(requestID)) return

        const timer = setTimeout(async () => {
          pending.delete(requestID)
          try {
            await client._client.post({
              url: "/permission/{requestID}/reply",
              path: { requestID },
              body: { reply: "reject", message: AUTO_REJECT_PROMPT },
              headers: { "Content-Type": "application/json" },
            })
          } catch (error) {
            // PermissionNotFoundError + already-replied errors are expected.
            console.error("[timeout-auto-reject] reply failed:", error)
          }
        }, TIMEOUT_MS)

        // Keep the process alive while a timer is pending.
        timer.unref?.()
        pending.set(requestID, timer)
      } else if (event.type === "permission.replied") {
        const { requestID } = event.properties
        const timer = pending.get(requestID)
        if (timer) {
          clearTimeout(timer)
          pending.delete(requestID)
        }
      }
    },
  }
}
