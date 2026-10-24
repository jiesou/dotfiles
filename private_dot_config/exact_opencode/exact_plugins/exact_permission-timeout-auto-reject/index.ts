import { Service } from "@opencode-ai/client/service"
import { OpenCode } from "@opencode-ai/client"

const TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes

const pending = new Map<string, ReturnType<typeof setTimeout>>()

function headers(endpoint: { auth?: { type: string; username: string; password: string } }) {
  if (!endpoint.auth) return undefined
  return {
    authorization:
      "Basic " + Buffer.from(`${endpoint.auth.username}:${endpoint.auth.password}`).toString("base64"),
  }
}

export default {
  id: "opencode.permission-timeout-auto-reject",
  setup: async (ctx) => {
    const endpoint = await Service.discover({ version: ctx.app.version })
    if (!endpoint) {
      console.error("[permission-timeout-auto-reject] could not discover opencode2 service")
      return
    }
    const client = OpenCode.make({
      baseUrl: endpoint.url,
      headers: headers(endpoint),
    })

    const controller = new AbortController()

    const consume = async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          if (event.type === "permission.asked") {
            const { id, sessionID } = event.data
            if (!id || pending.has(id)) continue

            const timer = setTimeout(async () => {
              pending.delete(id)
              try {
                await client.permission.reply({
                  sessionID,
                  requestID: id,
                  reply: "reject",
                })
              } catch (error) {
                // PermissionNotFoundError + already-replied errors are expected.
                console.error("[permission-timeout-auto-reject] reply failed:", error)
              }
            }, TIMEOUT_MS)

            pending.set(id, timer)
          } else if (event.type === "permission.replied") {
            const { requestID } = event.data
            const timer = pending.get(requestID)
            if (timer) {
              clearTimeout(timer)
              pending.delete(requestID)
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return
        console.error("[permission-timeout-auto-reject] event loop error:", error)
      }
    }

    consume()

    return () => {
      controller.abort()
      for (const timer of pending.values()) clearTimeout(timer)
      pending.clear()
    }
  },
}
