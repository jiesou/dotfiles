import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const STATE_DIR = join(process.env.DSH_HOME ?? join(process.env.HOME ?? '', '.dsh'), 'web-ui-notify')
const VAPID_FILE = join(STATE_DIR, 'vapid.json')
const SUBSCRIPTIONS_FILE = join(STATE_DIR, 'subscriptions.json')
const SW_FILE = join(ROOT, '..', 'sw', 'sw.js')
const PUSH_TTL = 3600

interface PushSubscriptionEntry {
  endpoint: string
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback
  try { return JSON.parse(readFileSync(path, 'utf8')) as T } catch { return fallback }
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`
  const fd = openSync(temp, 'w', 0o600)
  try { writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, 'utf8') } finally { closeSync(fd) }
  renameSync(temp, path)
}

interface WebPushApi {
  generateVAPIDKeys(): { publicKey: string; privateKey: string }
  setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  sendNotification(subscription: PushSubscriptionEntry['subscription'], payload: string, options: { TTL: number }): Promise<unknown>
}

let pushModule: WebPushApi | undefined
async function webPush(): Promise<WebPushApi> {
  pushModule ??= (await import('web-push')).default as WebPushApi
  return pushModule
}

let vapidPromise: Promise<{ publicKey: string; privateKey: string }> | undefined
async function vapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  vapidPromise ??= (async () => {
    const saved = readJson<{ publicKey?: string; privateKey?: string } | null>(VAPID_FILE, null)
    if (typeof saved?.publicKey === 'string' && typeof saved.privateKey === 'string') return saved as { publicKey: string; privateKey: string }
    const keys = await (await webPush()).generateVAPIDKeys()
    writeJson(VAPID_FILE, keys)
    return keys
  })()
  return vapidPromise
}

function subscriptions(): PushSubscriptionEntry[] {
  const rows = readJson<unknown>(SUBSCRIPTIONS_FILE, [])
  return Array.isArray(rows) ? rows as PushSubscriptionEntry[] : []
}

function questionPayload(request: any) {
  const questions = Array.isArray(request?.questions) ? request.questions : []
  const first = questions[0] ?? {}
  const title = typeof first.header === 'string' && first.header ? first.header : '需要你的回答'
  const body = typeof first.question === 'string' && first.question ? first.question : 'Agent 有一个问题需要你回答'
  const extra = questions.length > 1 ? `（另有 ${questions.length - 1} 个问题）` : ''
  return { title: `DSH · ${title}${extra}`, body, url: sessionUrl(request?.agent?.id) }
}

function sessionUrl(id: unknown): string {
  return typeof id === 'string' && id !== '' ? `/?session=${encodeURIComponent(id)}` : '/'
}

function turnPayload(id: string, reason: any) {
  const kind = typeof reason?.kind === 'string' ? reason.kind : 'completed'
  // The user's own stop is not news: they pressed the button themselves, and a
  // push announcing it is the harness echoing that click back to them.
  if (kind === 'aborted' && reason?.reason?.kind === 'user') return undefined
  const labels: Record<string, string> = {
    completed: '轮次完成', 'max-tokens': '轮次被截断', blocked: '轮次被拦截',
    error: '轮次出错', aborted: '轮次已中止', interrupted: '轮次被中断',
  }
  const body = kind === 'completed' ? 'Agent 已完成工作，可以切回查看结果。' : `结束原因：${kind}`
  return { title: `DSH · ${labels[kind] ?? '轮次结束'}`, body, url: sessionUrl(id) }
}

function isSafePushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try { return new URL(value).protocol === 'https:' } catch { return false }
}

export function createPushHost(ctx: any): void {
  const send = async (payload: { title: string; body: string; url: string }): Promise<void> => {
    const entries = subscriptions()
    if (entries.length === 0) return
    try {
      const push = await webPush()
      const keys = await vapidKeys()
      push.setVapidDetails('mailto:root@localhost', keys.publicKey, keys.privateKey)
      const stale = new Set<string>()
      await Promise.allSettled(entries.map(async entry => {
        try { await push.sendNotification(entry.subscription, JSON.stringify(payload), { TTL: PUSH_TTL }) }
        catch (error) {
          const status = (error as { statusCode?: number }).statusCode
          if (status === 404 || status === 410) stale.add(entry.endpoint)
          else console.error('[web-ui-notify] Web Push send failed', status ?? error)
        }
      }))
      if (stale.size > 0) writeJson(SUBSCRIPTIONS_FILE, subscriptions().filter(entry => !stale.has(entry.endpoint)))
    } catch (error) { console.error('[web-ui-notify] Web Push unavailable', error) }
  }

  const isRoot = (id: string, session: any): boolean => {
    if (session?.header?.origin === 'subagent') return false
    const agent = ctx.agents.get(id)
    return agent !== undefined && ctx.agents.roots().includes(agent)
  }

  ctx.on('session/event', (session: any, event: any) => {
    if (event?.type !== 'turn/end' && event?.type !== 'approval/asked') return
    const id = session?.id
    if (typeof id !== 'string' || !isRoot(id, session)) return
    const payload = event.type === 'turn/end'
      ? turnPayload(id, event.data?.reason)
      : { title: 'DSH · 需要审批', body: event.data?.reason || `工具 ${event.data?.toolName ?? ''} 请求审批`, url: sessionUrl(id) }
    if (payload === undefined) return
    void send(payload)
  })

  ctx.on('user-questions/request', function (this: any, request: any, next: () => Promise<unknown>) {
    const agentId = request?.agent?.id ?? this?.id
    const agent = typeof agentId === 'string' ? ctx.agents.get(agentId) : undefined
    if (agent !== undefined && isRoot(agentId, agent.session)) {
      void send(questionPayload({ ...request, agent: { id: agentId } }))
    }
    return next()
  }, { prepend: true })

  const json = (res: any, status: number, value: unknown): void => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify(value))
  }
  const reject = (req: any, res: any): boolean => {
    const status = ctx.connection.requestRejection(req)
    if (status === undefined) return false
    res.writeHead(status)
    res.end(status === 401 ? 'unauthorized' : 'forbidden')
    return true
  }
  const readBody = (req: any): Promise<string> => new Promise((resolve, rejectBody) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 65536) { rejectBody(Object.assign(new Error('body too large'), { statusCode: 413 })); req.destroy(); return }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', rejectBody)
  })
  const postRoute = (path: string, action: (body: any) => Promise<unknown>) => ({
    kind: 'exact', path,
    handler: async (req: any, res: any) => {
      if (reject(req, res)) return
      if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return }
      try { json(res, 200, await action(JSON.parse(await readBody(req)))) }
      catch (error) { json(res, (error as { statusCode?: number }).statusCode ?? 400, { ok: false }) }
    },
  })

  const swBody = readFileSync(SW_FILE, 'utf8')
  ctx.effect(() => {
    const disposers = [
      ctx.webServer.register(postRoute('/api/push/subscribe', async body => {
        const sub = body?.subscription
        if (!isSafePushEndpoint(sub?.endpoint) || typeof sub?.keys?.p256dh !== 'string' || typeof sub?.keys?.auth !== 'string') {
          throw new Error('invalid subscription')
        }
        const list = subscriptions().filter(entry => entry.endpoint !== sub.endpoint)
        list.push({ endpoint: sub.endpoint, subscription: sub })
        writeJson(SUBSCRIPTIONS_FILE, list)
        return { ok: true }
      })),
      ctx.webServer.register(postRoute('/api/push/unsubscribe', async body => {
        if (typeof body?.endpoint !== 'string') throw new Error('invalid endpoint')
        writeJson(SUBSCRIPTIONS_FILE, subscriptions().filter(entry => entry.endpoint !== body.endpoint))
        return { ok: true }
      })),
      ctx.webServer.register({
        kind: 'exact', path: '/api/push/vapid',
        handler: async (req: any, res: any) => {
          if (reject(req, res)) return
          if (req.method !== 'GET') { res.writeHead(405, { allow: 'GET' }); res.end(); return }
          try { json(res, 200, { ok: true, publicKey: (await vapidKeys()).publicKey }) }
          catch { json(res, 500, { ok: false }) }
        },
      }),
      ctx.webServer.register({
        kind: 'exact', path: '/push/sw.js',
        handler: (req: any, res: any) => {
          res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache', 'service-worker-allowed': '/' })
          res.end(req.method === 'HEAD' ? undefined : swBody)
        },
      }),
    ]
    return () => { for (const dispose of disposers) dispose() }
  }, 'web-ui-notify: push routes')
}
