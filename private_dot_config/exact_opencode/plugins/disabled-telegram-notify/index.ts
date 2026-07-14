import type { Plugin } from "@opencode-ai/plugin"

const API = "https://api.telegram.org"
const HOSTS = ["127.0.0.1", "chenpc.lan"]
const MAX_LEN = 3900

function base64(s: string) { return Buffer.from(s).toString("base64").replace(/=+$/, "") }
function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") }
function trunc(s: string, n: number) { return s.length <= n ? s : s.slice(0, n) + "\u2026" }

let _cfg: Promise<{ token: string; chatId: string } | null> | null = null
async function cfg() {
  if (!_cfg) {
    _cfg = (async () => {
      const dir = new URL(".", import.meta.url).pathname
      try {
        const raw = await Bun.file(dir + ".env").text()
        const m: Record<string, string> = {}
        for (const line of raw.split("\n")) {
          const t = line.trim()
          if (!t || t.startsWith("#")) continue
          const i = t.indexOf("=")
          if (i < 0) continue
          m[t.slice(0, i).trim()] = t.slice(i + 1).trim()
        }
        if (!m.TELEGRAM_BOT_TOKEN || !m.TELEGRAM_CHAT_ID) {
          console.warn("telegram-notify: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env")
          return null
        }
        return { token: m.TELEGRAM_BOT_TOKEN!, chatId: m.TELEGRAM_CHAT_ID! }
      } catch { return null }
    })()
  }
  return _cfg
}

async function send(text: string) {
  const c = await cfg()
  if (!c) return
  try {
    const r = await fetch(`${API}/bot${c.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: c.chatId, text: text.slice(0, MAX_LEN), parse_mode: "HTML", disable_web_page_preview: true }),
    })
    if (!r.ok) console.error("telegram-notify:", r.status, await r.text().catch(() => ""))
  } catch (e) {
    console.error("telegram-notify: network error", e)
  }
}

async function si(client: any, id: string) {
  try { return ((await (client as any).session.get({ path: { id } }))?.data ?? null) as any }
  catch { return null }
}

async function msgs(client: any, id: string) {
  try { return ((await (client as any).session.messages({ path: { id } }))?.data ?? []) as any[] }
  catch { return [] }
}

function lastText(m: any): string {
  for (const p of m?.parts ?? []) if (p.type === "text" && p.text) return p.text
  return m?.text ?? ""
}

async function notify(opts: { icon: string; label: string; sid: string; worktree: string; client: any; body?: string }) {
  try {
    const info = await si(opts.client, opts.sid)
    if (info?.parentID) return // subagent

    const title = (info?.title as string) ?? ""
    const all = await msgs(opts.client, opts.sid)
    let u = "", a = ""
    for (const m of all) {
      const t = lastText(m)
      if (m.info?.role === "user" && t) u = t
      if (m.info?.role === "assistant" && t) a = t
    }

    const urls = HOSTS.map((h) => `http://${h}:4096/${base64(opts.worktree)}/session/${opts.sid}`)
    const p: string[] = [`${opts.icon} <b>[OpenCode]</b> ${esc(opts.label)}`, ""]
    if (title) p.push(esc(title))
    if (opts.body) p.push(esc(opts.body))
    if (u) p.push(`<i>${esc(trunc(u, 120))}</i>`)
    if (a) p.push(`<blockquote>${esc(trunc(a, 240))}</blockquote>`)
    p.push("", urls.join("\n"))

    await send(p.join("\n"))
  } catch (e) {
    console.error("telegram-notify: notify error", e)
  }
}

export const TelegramNotifyPlugin: Plugin = async ({ client, worktree }) => {
  return {
    event: async ({ event }) => {
      const e = event as any
      switch (e.type) {
        case "session.status":
          if (e.properties.status?.type === "idle")
            await notify({ icon: "\u{1F4A1}", label: "\u4F1A\u8BDD\u5B8C\u6210", sid: e.properties.sessionID, worktree, client })
          break
        case "permission.asked":
          await notify({ icon: "\u{1F6AB}", label: "\u9700\u8981\u6743\u9650", sid: e.properties.sessionID, worktree, client, body: `\u7C7B\u578B: ${e.properties.permission} ${(e.properties.patterns ?? []).join(", ")}` })
          break
        case "question.asked": {
          const qs = (e.properties.questions ?? []).map((q: any, i: number) => `${i + 1}. ${q.question ?? q.text ?? ""}`).join("\n")
          await notify({ icon: "\u2753", label: "\u6709\u95EE\u9898\u9700\u8981\u56DE\u7B54", sid: e.properties.sessionID, worktree, client, body: qs })
          break
        }
      }
    },
  }
}
