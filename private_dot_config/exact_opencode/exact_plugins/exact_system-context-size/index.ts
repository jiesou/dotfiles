import { analyzeSystemPrompt } from "./report"

let capturedSections: string[] | null = null
let captureStamp = 0

function buildReport(): string {
  if (!capturedSections || capturedSections.length === 0) {
    return "No system prompt captured yet. Send any message first so the session context hook fires."
  }
  return analyzeSystemPrompt(capturedSections)
}

export default {
  id: "opencode.system-context-size",
  setup: async (ctx: any) => {
    ctx.tool.list().then((list: any[]) => {
      console.log("[DEBUG TOOLS]:", list.map((t: any) => t.name || t.id))
    }).catch(console.error)

    await ctx.tool.transform((tools: any) => {
      tools.add({
        name: "system-context-report",
        description:
          "Analyze the actual system prompt assembled by opencode, showing per-section size breakdown (Base / Environment / Skills / MCP / Instructions / Plugin reminders) with sub-item expansion. No args. Send any chat message first so the hook can capture the live system prompt.",
        input: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        options: { codemode: false },
        execute: async () => {
          try {
            const report =
              buildReport() +
              (captureStamp
                ? `\n[Captured: ${new Date(captureStamp).toISOString()}]`
                : "")
            return {
              output: { report },
              content: [{ type: "text", text: report }],
            }
          } catch (err) {
            const msg = `Failed to generate report: ${err instanceof Error ? err.message : String(err)}`
            return {
              output: { error: msg },
              content: [{ type: "text", text: msg }],
            }
          }
        },
      })
    })

    await ctx.session.hook("context", (event: any) => {
      capturedSections = event.system.map((part: any) => part.text)
      captureStamp = Date.now()
    }).catch((err: any) => {
      console.error("[system-context-size] context hook registration failed:", err)
    })
  },
}
