/**
 * Node half: host-side notification driver. Listens to the session/event
 * audit stream for the blocking cases (approval, question) and expensive or
 * failed turns, and delivers each as a Web Push to every subscribed device
 * (mobile PWA included). Also serves the service worker and the push
 * subscription endpoints. PWA manifest and icons are handled by the upstream
 * DSH framework / dsh-webui-fix-pwa.
 *
 * The browser half (src/client) drives permission + push registration and
 * falls back to the in-page Notification API when Web Push is unavailable.
 */
import { installNotifyHost, type NotifyHostHandle } from './notify-host.ts'

/** Plugin name (= the config entry id). */
export const name = 'dsh-web-ui-notify'

/** Host services this node half uses. */
export const inject = ['sessions', 'webServer']

/** Node-half configuration (cordis patch may override). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Config extends Record<string, any> {
  /** Tool-call threshold per turn before a "long task" completion push (default 7). */
  longTaskToolCalls?: number
  /** Web Push VAPID keys (generated + persisted when absent). */
  vapidPublicKey?: string
  vapidPrivateKey?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apply(ctx: any, config?: Config): void {
  const notify: NotifyHostHandle = installNotifyHost(ctx, config ?? {})
  const threshold = config?.longTaskToolCalls ?? 7
  /** Per-turn tool-call counters: sessionId -> { turn, calls } (turn/start resets). */
  const turnCalls = new Map<string, { turn: number; calls: number }>()

  const onEvent = (session: any, event: any): void => {
    try {
      const data = event?.data
      if (event?.type === 'turn/start') {
        const turn = typeof data?.turn === 'number' ? data.turn : 0
        turnCalls.set(session?.id ?? '', { turn, calls: 0 })
        return
      }
      if (event?.type === 'approval/asked') {
        const approvalId: unknown = data?.id
        if (typeof approvalId !== 'string' || approvalId === '') return
        notify.pushApproval({
          sessionId: session?.id ?? '',
          approvalId,
          toolName: typeof data?.toolName === 'string' ? data.toolName : '',
        })
      } else if (event?.type === 'tool/call' && data?.name === 'ask_user_question') {
        const callId: unknown = data?.callId
        if (typeof callId !== 'string' || callId === '') return
        notify.pushQuestion({ sessionId: session?.id ?? '', callId })
      } else if (event?.type === 'tool/call') {
        const current = turnCalls.get(session?.id ?? '')
        if (current !== undefined && (data?.turn === undefined || data.turn === current.turn)) {
          current.calls += 1
        }
      } else if (event?.type === 'turn/end') {
        const sessionId: string = session?.id ?? ''
        const reason = data?.reason as
          | { kind?: unknown; error?: { message?: unknown; code?: unknown } }
          | undefined
        if (reason?.kind === 'error') {
          const rawMessage = typeof reason.error?.message === 'string' ? reason.error.message : ''
          notify.pushFailed({
            sessionId,
            ...(rawMessage !== ''
              ? { message: rawMessage.length > 120 ? `${rawMessage.slice(0, 120)}…` : rawMessage }
              : {}),
            ...(typeof reason.error?.code === 'string' && reason.error.code !== ''
              ? { code: reason.error.code }
              : {}),
          })
        }
        const current = turnCalls.get(sessionId)
        if (current === undefined) return
        turnCalls.delete(sessionId)
        if (current.calls >= threshold) {
          notify.pushCompleted({ sessionId, toolCalls: current.calls })
        }
      }
    } catch {
      // a failed projection never blocks the approval chain or other listeners.
    }
  }
  if (typeof ctx.on === 'function') ctx.on('session/event', onEvent)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let webServer: any
  try { webServer = ctx.webServer } catch { webServer = undefined }
  if (webServer === undefined && typeof ctx.get === 'function') {
    try { webServer = ctx.get('webServer') } catch { webServer = undefined }
  }
  if (webServer !== undefined && typeof webServer.register === 'function') {
    const register = <T>(path: string, handler: (req: unknown, res: T) => void): void => {
      if (typeof ctx.effect === 'function') {
        ctx.effect(() => webServer.register({ kind: 'exact', path, handler }), `web-ui-notify: ${path}`)
      } else {
        webServer.register({ kind: 'exact', path, handler })
      }
    }

    interface Res {
      writeHead(code: number, headers?: Record<string, string>): void
      end(body?: string | Buffer): void
    }
    const readJson = (req: unknown, done: (value: Record<string, unknown>) => void): void => {
      let raw = ''
      ;(req as { on?: (event: string, cb: (chunk: Buffer) => void) => void })?.on?.('data', (chunk: Buffer) => {
        raw += chunk.toString('utf8')
      })
      ;(req as { on?: (event: string, cb: () => void) => void })?.on?.('end', () => {
        try { done(JSON.parse(raw) as Record<string, unknown>) }
        catch { done({}) }
      })
    }
    const hostOf = (req: unknown): string | undefined =>
      (req as { headers?: Record<string, string | undefined> })?.headers?.['host']

    register<Res>('/plugins/web-ui-notify/sw.js', (_req, res) => {
      res.writeHead(200, {
        'content-type': 'application/javascript; charset=utf-8',
        // Open the service-worker scope to the entire origin.
        'service-worker-allowed': '/',
        'cache-control': 'no-store',
      })
      res.end(notify.sw)
    })
    register<Res>('/plugins/web-ui-notify/push-config', (_req, res) => {
      void notify.pushConfig().then((config) => {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify(config))
      })
    })
    register<Res>('/plugins/web-ui-notify/push-subscribe', (req, res) => {
      if ((req as { method?: string })?.method !== 'POST') {
        res.writeHead(405, { 'content-type': 'application/json; charset=utf-8' })
        res.end('{"error":"method not allowed"}')
        return
      }
      readJson(req, (value) => {
        const endpoint = (value as { endpoint?: unknown })?.endpoint
        if (typeof endpoint !== 'string' || endpoint === '') {
          res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
          res.end('{"error":"bad subscription"}')
          return
        }
        notify.addSubscription(value as { endpoint: string })
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        res.end('{"ok":true}')
      })
    })
    register<Res>('/plugins/web-ui-notify/focus', (req, res) => {
      if ((req as { method?: string })?.method !== 'POST') {
        res.writeHead(405, { 'content-type': 'application/json; charset=utf-8' })
        res.end('{"error":"method not allowed"}')
        return
      }
      readJson(req, (value) => {
        notify.noteFocus(hostOf(req), (value as { focused?: unknown })?.focused === true)
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        res.end('{"ok":true}')
      })
    })

  }
}
