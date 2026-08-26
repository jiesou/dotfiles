/**
 * Host notification machinery: Web Push fan-out to subscribed devices plus the
 * PWA resources (manifest / icons / service worker) that make mobile system
 * notifications work. Detection of *what* to notify lives in src/index.ts,
 * which calls the handle methods below from the session/event audit stream and
 * registers the HTTP routes with the webServer service.
 *
 * Model (learned from dsh-meow-smooth):
 *  - The browser `Notification` API only works while a page is open and, on
 *    mobile (iOS Safari, backgrounded Android), is absent or stops firing. Web
 *    Push + an installed PWA + a service worker gives real system
 *    notifications on the phone even with its browser closed.
 *  - The host holds VAPID keys and subscriptions; pushes are encrypted and
 *    sent through Mozilla's autopush to the OS push services. `web-push` is a
 *    real runtime dependency (production section below), resolved from this
 *    plugin's own node_modules at runtime — never bundled into lib/index.js.
 *  - A page that is focused suppresses pushes: the user is already looking, so
 *    the in-app banner is the reminder. The service worker also skips its own
 *    notification when a client window on the same origin is focused.
 *
 * Persistence: everything lives under $DSH_HOME/.web-ui-notify/ (JSON files),
 * so VAPID keys survive restarts and subscriptions stay valid.
 */
import { crc32, deflateSync } from 'node:zlib'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** One pushable device subscription (the web-push wire shape). */
export interface PushSubscriptionView {
  endpoint: string
  keys?: { p256dh?: string; auth?: string }
  expirationTime?: number | null
}

/** Push payload (service-worker showNotification arguments + jump target). */
export interface PushPayload {
  kind: 'approval' | 'question' | 'completed' | 'failed'
  title: string
  body: string
  tag: string
  sessionId?: string
}

/** Host notification configuration (cordis patch may override). */
export interface NotifyHostConfig {
  /** Tool-call threshold per turn before a "long task" completion push (default 7). */
  longTaskToolCalls?: number
  /** VAPID keys; when absent they are generated and persisted under the data dir. */
  vapidPublicKey?: string
  vapidPrivateKey?: string
}

// --- constants ---
const SUBSCRIPTIONS_CAP = 64
const TITLE_MAX = 20
const FOCUS_WINDOW_MS = 3000
const PUSH_DEDUP_KEY = '__dsh_web_ui_notify_push_dedup__'
export const PLUGIN_PREFIX = '/plugins/web-ui-notify'

/** Data dir: $DSH_HOME/.web-ui-notify/ (fallback ~/.dsh/.web-ui-notify). */
function dataDir(): string {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, '.web-ui-notify')
}

/** Last-wins session title from an audit event list; empty when untitled. */
export function sessionTitleFromEvents(events: unknown[] | undefined): string {
  if (!Array.isArray(events)) return ''
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i] as { type?: string; data?: { title?: unknown } } | undefined
    if (event?.type === 'session/title' && typeof event.data?.title === 'string' && event.data.title !== '') {
      return event.data.title
    }
  }
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i] as
      | { type?: string; data?: { content?: readonly { type?: string; text?: string }[] } }
      | undefined
    if (event?.type !== 'user/message') continue
    const data = event.data as { content?: readonly { type?: string; text?: string }[] } | undefined
    const text = data?.content
      ?.filter(block => block.type === 'text' && typeof block.text === 'string')
      .map(block => block.text as string)
      .join(' ')
      .replace(/\s+/gu, ' ')
      .trim()
    if (text !== undefined && text !== '') {
      return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX)}…` : text
    }
  }
  return ''
}

/** Runtime-generated vertical-gradient PNG icon (indigo -> deep indigo). */
export function pngIcon(size: number): Buffer {
  const top = [79, 70, 229] // #4F46E5
  const bottom = [49, 46, 129] // #312E81
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y += 1) {
    const t = y / (size - 1)
    const r = Math.round(top[0] + (bottom[0] - top[0]) * t)
    const g = Math.round(top[1] + (bottom[1] - top[1]) * t)
    const b = Math.round(top[2] + (bottom[2] - top[2]) * t)
    const row = y * (size * 4 + 1)
    raw[row] = 0 // filter: none
    for (let x = 0; x < size; x += 1) {
      const off = row + 1 + x * 4
      raw[off] = r
      raw[off + 1] = g
      raw[off + 2] = b
      raw[off + 3] = 255
    }
  }
  const chunk = (type: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const typeBuf = Buffer.from(type, 'ascii')
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0)
    return Buffer.concat([len, typeBuf, data, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** PWA manifest source (PNG icons + standalone; iOS needs PNG, not SVG). */
export function manifestSource(): string {
  return JSON.stringify({
    name: 'dsh',
    short_name: 'dsh',
    display: 'standalone',
    start_url: '/',
    scope: '/',
    icons: [
      { src: `${PLUGIN_PREFIX}/icon-180.png`, sizes: '180x180', type: 'image/png' },
      { src: `${PLUGIN_PREFIX}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
  })
}

/** Service Worker source: push -> system notification (skips when a
 * same-origin window is focused), notification click -> focus/open + postMessage. */
export function swSource(): string {
  return [
    '/* dsh-web-ui-notify service worker: push notification bridge */',
    "self.addEventListener('install', () => { self.skipWaiting() })",
    "self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })",
    "self.addEventListener('push', (event) => {",
    '  let data = {}',
    "  try { data = event.data ? event.data.json() : {} } catch { /* non-JSON payload ignored */ }",
    "  const title = data.title || 'dsh'",
    '  event.waitUntil((async () => {',
    "    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })",
    '    const origin = new URL(self.registration.scope).origin',
    "    const focused = clients.some(c => c.focused === true && new URL(c.url).origin === origin)",
    '    if (focused) return',
    '    await self.registration.showNotification(title, {',
    "      body: data.body || '',",
    "      tag: data.tag || 'web-ui-' + Date.now(),",
    `      icon: '${PLUGIN_PREFIX}/icon-180.png',`,
    '      data: { sessionId: data.sessionId || null },',
    "      requireInteraction: data.kind === 'approval' || data.kind === 'question',",
    '    })',
    '  })())',
    '})',
    "self.addEventListener('notificationclick', (event) => {",
    '  event.waitUntil((async () => {',
    '    const data = event.notification.data || {}',
    "    const sessionId = typeof data.sessionId === 'string' ? data.sessionId : ''",
    "    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })",
    '    const origin = new URL(self.registration.scope).origin',
    "    const client = clients.find(c => new URL(c.url).origin === origin)",
    '    if (client) {',
    '      await client.focus()',
    "      if (sessionId) client.postMessage({ type: 'web-ui-notify:jump', sessionId })",
    '      return',
    '    }',
    "    const win = await self.clients.openWindow(new URL('/', self.registration.scope).href)",
    "    if (sessionId && win) win.postMessage({ type: 'web-ui-notify:jump', sessionId })",
    '  })())',
    '})',
  ].join('\n')
}

/** web-push runtime API (CJS module; ESM/CJS interop exposes API on default). */
interface WebPushMod {
  generateVAPIDKeys(): { publicKey: string; privateKey: string }
  setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  sendNotification(subscription: unknown, payload: string, options?: { TTL?: number }): Promise<unknown>
}

/** Host handle: pushes + read-only/subscription access for the HTTP routes. */
export interface NotifyHostHandle {
  pushApproval(info: { sessionId: string; approvalId: string; toolName: string }): void
  pushQuestion(info: { sessionId: string; callId: string }): void
  pushFailed(info: { sessionId: string; message?: string; code?: string }): void
  pushCompleted(info: { sessionId: string; toolCalls: number }): void
  noteFocus(host: string | undefined, focused: boolean): void
  /** Serialized manifest (for the manifest.json route). */
  manifest: string
  /** Service-worker source (for the sw.js route). */
  sw: string
  /** The two PNG icons (for the icon routes). */
  icons: { 'icon-180.png': Buffer; 'icon-512.png': Buffer }
  /** Resolve push configuration (generates VAPID keys on first use). */
  pushConfig(): Promise<{ enabled: boolean; publicKey?: string }>
  /** Register one device subscription (dedupes by endpoint, persisted). */
  addSubscription(sub: PushSubscriptionView): void
  /** Number of live push subscriptions (diag). */
  subscriptionCount(): number
}

/** Build the host notification handle. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function installNotifyHost(ctx: any, config?: NotifyHostConfig): NotifyHostHandle {
  let pushMod: WebPushMod | undefined
  let vapidPublicKey: string | undefined = config?.vapidPublicKey
  let vapidPrivateKey: string | undefined = config?.vapidPrivateKey
  let pushReady: Promise<boolean> | undefined
  const ensurePush = (): Promise<boolean> => {
    pushReady ??= (async () => {
      try {
        // web-push is CJS; a static import bundled into the ESM node half
        // crashes at runtime, so it is imported dynamically and resolved from
        // this plugin's own node_modules.
        const imported = await import("web-push") as { default?: WebPushMod } & WebPushMod
        const mod = imported.default ?? imported
        if (vapidPublicKey === undefined || vapidPrivateKey === undefined) {
          const file = join(dataDir(), 'vapid.json')
          if (existsSync(file)) {
            const saved = JSON.parse(readFileSync(file, 'utf8')) as { publicKey?: string; privateKey?: string }
            vapidPublicKey = saved.publicKey
            vapidPrivateKey = saved.privateKey
          }
        }
        if (vapidPublicKey === undefined || vapidPrivateKey === undefined) {
          const keys = mod.generateVAPIDKeys()
          vapidPublicKey = keys.publicKey
          vapidPrivateKey = keys.privateKey
          mkdirSync(dataDir(), { recursive: true })
          writeFileSync(join(dataDir(), 'vapid.json'), JSON.stringify(keys, null, 2), 'utf8')
        }
        // The subject cannot be localhost — Apple's APNs rejects localhost.
        mod.setVapidDetails('https://github.com/bill9109/dsh-web-ui-notify', vapidPublicKey, vapidPrivateKey)
        pushMod = mod
        return true
      } catch (error) {
        console.warn(`[web-ui-notify] web push unavailable: ${String(error).slice(0, 160)}`)
        return false
      }
    })()
    return pushReady
  }

  const subscriptionsFile = join(dataDir(), 'subscriptions.json')
  let subscriptions: PushSubscriptionView[] = []
  try {
    if (existsSync(subscriptionsFile)) {
      const parsed = JSON.parse(readFileSync(subscriptionsFile, 'utf8'))
      if (Array.isArray(parsed)) subscriptions = parsed.slice(0, SUBSCRIPTIONS_CAP)
    }
  } catch {
    subscriptions = []
  }
  const saveSubscriptions = (): void => {
    try {
      mkdirSync(dataDir(), { recursive: true })
      writeFileSync(subscriptionsFile, JSON.stringify(subscriptions.slice(0, SUBSCRIPTIONS_CAP), null, 2), 'utf8')
    } catch {
      // persistence failures only cost reuse after restart; the in-memory copy still works.
    }
  }

  // A recently-focused host window means the user is looking, so skip the push.
  const focusedByHost = new Map<string, number>()
  const anyFocusedRecently = (): boolean => {
    const cutoff = Date.now() - FOCUS_WINDOW_MS
    for (const [host, at] of focusedByHost) {
      if (at >= cutoff) return true
      focusedByHost.delete(host)
    }
    return false
  }

  const sendPush = async (payload: PushPayload): Promise<void> => {
    if (!(await ensurePush()) || subscriptions.length === 0) return
    const body = JSON.stringify(payload)
    for (const sub of subscriptions) {
      try {
        await pushMod!.sendNotification(sub as never, body, { TTL: 3600 })
      } catch (error) {
        const status = (error as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) {
          subscriptions = subscriptions.filter(item => item.endpoint !== sub.endpoint)
          saveSubscriptions()
        } else {
          console.warn(`[web-ui-notify] push failed (${status ?? 'unknown'}): ${String(error).slice(0, 160)}`)
        }
      }
    }
  }

  type DedupState = { [PUSH_DEDUP_KEY]?: Map<string, number> }
  const global = globalThis as unknown as DedupState
  const recentPushes = global[PUSH_DEDUP_KEY] ?? new Map<string, number>()
  global[PUSH_DEDUP_KEY] = recentPushes
  const pushOnce = (key: string, fn: () => void): void => {
    const now = Date.now()
    const last = recentPushes.get(key)
    if (last !== undefined && now - last < 3000) return
    recentPushes.set(key, now)
    if (recentPushes.size > 200) {
      const cutoff = now - 60_000
      for (const [k, at] of recentPushes) {
        if (at < cutoff) recentPushes.delete(k)
      }
    }
    fn()
  }

  const titleCache = new Map<string, string>()
  const sessionTitle = (sessionId: string): string => {
    const cached = titleCache.get(sessionId)
    if (cached !== undefined) return cached
    let title = ''
    try {
      const session = ctx?.sessions?.get?.(sessionId)
      title = sessionTitleFromEvents(session?.events)
    } catch {
      // title lookup failure -> untitled fallback
    }
    titleCache.set(sessionId, title)
    return title
  }

  const deliver = (payload: PushPayload): void => {
    if (anyFocusedRecently()) return
    void sendPush(payload)
  }

  return {
    pushApproval: (info) => {
      const payload: PushPayload = {
        kind: 'approval',
        title: sessionTitle(info.sessionId) || '未命名会话',
        body: `「${info.toolName || '工具'}」请求执行，点击查看…`,
        tag: `web-ui-notify:a:${info.approvalId}`,
        sessionId: info.sessionId,
      }
      pushOnce(`a:${info.approvalId}`, () => deliver(payload))
    },
    pushQuestion: (info) => {
      const payload: PushPayload = {
        kind: 'question',
        title: sessionTitle(info.sessionId) || '未命名会话',
        body: 'AI 正在等待你的回答，点击查看…',
        tag: `q:${info.sessionId}:${info.callId}`,
        sessionId: info.sessionId,
      }
      pushOnce(`q:${info.sessionId}:${info.callId}`, () => deliver(payload))
    },
    pushFailed: (info) => {
      const payload: PushPayload = {
        kind: 'failed',
        title: sessionTitle(info.sessionId) || '未命名会话',
        body: info.message !== undefined && info.message !== ''
          ? `运行失败：${info.message}`
          : 'AI 回合因错误中断，点击查看…',
        tag: `f:${info.sessionId}:${info.code ?? 'error'}`,
        sessionId: info.sessionId,
      }
      pushOnce(`f:${info.sessionId}:${info.code ?? 'error'}`, () => deliver(payload))
    },
    pushCompleted: (info) => {
      const payload: PushPayload = {
        kind: 'completed',
        title: sessionTitle(info.sessionId) || '未命名会话',
        body: `任务完成（${info.toolCalls} 次工具调用），点击查看…`,
        tag: `c:${info.sessionId}:${info.toolCalls}`,
        sessionId: info.sessionId,
      }
      pushOnce(`c:${info.sessionId}:${info.toolCalls}`, () => deliver(payload))
    },
    noteFocus: (host, focused) => {
      if (typeof host !== 'string' || host === '') return
      if (focused) focusedByHost.set(host, Date.now())
      else focusedByHost.delete(host)
    },
    manifest: manifestSource(),
    sw: swSource(),
    icons: { 'icon-180.png': pngIcon(180), 'icon-512.png': pngIcon(512) },
    pushConfig: async () => (await ensurePush()) ? { enabled: true, publicKey: vapidPublicKey ?? '' } : { enabled: false },
    addSubscription(sub) {
      subscriptions = subscriptions.filter(item => item.endpoint !== sub.endpoint)
      subscriptions.push(sub)
      saveSubscriptions()
    },
    subscriptionCount: () => subscriptions.length,
  }
}
