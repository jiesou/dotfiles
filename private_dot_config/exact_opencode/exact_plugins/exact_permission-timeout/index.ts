import type { Plugin } from "@opencode-ai/plugin"

const DEFAULT_TIMEOUT = 300_000

export const PermissionTimeout: Plugin = async ({ client }) => {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  return {
    event: async ({ event }) => {
      if (event.type === ("permission.asked" as string)) {
        const p = event.properties as Record<string, unknown>
        const id = p.id as string
        if (timers.has(id)) return

        const timer = setTimeout(async () => {
          try {
            await (client as any).permission.reply({
              requestID: id,
              reply: "reject",
            })
          } catch {}
          timers.delete(id)
        }, DEFAULT_TIMEOUT)
        timers.set(id, timer)
        return
      }

      if (event.type === ("permission.replied" as string)) {
        const p = event.properties as Record<string, unknown>
        const id = p.requestID as string
        const timer = timers.get(id)
        if (timer) {
          clearTimeout(timer)
          timers.delete(id)
        }
      }
    },
  }
}
