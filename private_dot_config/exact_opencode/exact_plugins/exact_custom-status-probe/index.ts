import { createServer } from "http"

const BUSY = new Set<string>()

export default {
  id: "opencode.custom-status-probe",
  setup: async (ctx) => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(
        JSON.stringify({
          busy: BUSY.size > 0,
          count: BUSY.size,
          updatedAt: Date.now(),
        }),
      )
    })

    server.on("error", (err) => {
      console.error("[custom-status-probe] http server error:", err)
    })
    server.listen(4098, "127.0.0.1")
    server.unref()

    const controller = new AbortController()

    const consume = async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          const data = event.data as { sessionID?: string } | undefined
          if (!data?.sessionID) continue

          switch (event.type) {
            case "session.execution.started":
              BUSY.add(data.sessionID)
              break
            case "session.execution.succeeded":
            case "session.execution.interrupted":
            case "session.execution.failed":
            case "session.idle":
              BUSY.delete(data.sessionID)
              break
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return
        console.error("[custom-status-probe] event stream error:", err)
      }
    }

    void consume()

    return async () => {
      controller.abort()
      server.close()
    }
  },
}
