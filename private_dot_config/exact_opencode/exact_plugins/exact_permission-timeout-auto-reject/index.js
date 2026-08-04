// Auto-reject OpenCode permission requests that are left unanswered for a
// period of time, and tell the agent to change direction instead of trying to
// bypass the permission.
//
// Reference: kimaki (remorses/kimaki) --permission-timeout-minutes pattern.
// Uses the generic `event` hook because the `permission.ask` plugin hook is
// declared but never triggered by the permission engine (issues #7006/#9229).

const TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes

const FEEDBACK =
  "You're going in the wrong direction. At least make a backup before doing anything. " +
  "DONT BYPASS user permission denials. " +
  "If you are really blocked, stop and explain first."

const pending = new Map() // requestID -> timeout handle

export const PermissionTimeoutAutoReject = async ({ client }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "permission.asked") {
        const permission = event.properties
        const requestID = permission.id
        if (!requestID || pending.has(requestID)) return

        const timer = setTimeout(async () => {
          pending.delete(requestID)
          try {
            await client.permission.reply({
              requestID,
              reply: "reject",
              message: FEEDBACK,
            })
          } catch (error) {
            // PermissionNotFoundError + already-replied errors are expected.
            console.error("[permission-timeout-auto-reject] reply failed:", error)
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