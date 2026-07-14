import { type Plugin, tool } from "@opencode-ai/plugin";
import { analyzeSystemPrompt } from "./report";

let capturedSections: string[] | null = null;
let captureStamp = 0;
let lastReport = "";

function buildReport(): string {
  if (!capturedSections || capturedSections.length === 0) {
    return "No system prompt captured yet. Send any message first so `experimental.chat.system.transform` fires.";
  }
  return analyzeSystemPrompt(capturedSections);
}

export default (async () => {
  return {
    "experimental.chat.system.transform": async (
      _input: any,
      output: { system: string[] },
    ) => {
      capturedSections = [...output.system];
      captureStamp = Date.now();
      lastReport = buildReport();
    },

    tool: {
      "system-context-report": tool({
        description:
          "Analyze the actual system prompt assembled by opencode, showing per-section size breakdown (Base / Environment / Skills / MCP / Instructions / Plugin reminders) with sub-item expansion. No args. Send any chat message first so the hook can capture the live system prompt.",
        args: {},
        async execute() {
          return buildReport() + (captureStamp
            ? `\n\n---\nCaptured: ${new Date(captureStamp).toISOString()} (${capturedSections!.length} array sections)`
            : "");
        },
      }),
    },
  };
}) satisfies Plugin;
