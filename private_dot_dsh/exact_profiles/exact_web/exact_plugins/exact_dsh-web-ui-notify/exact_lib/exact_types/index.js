/**
 * Node half: host-side notification driver. Listens to the session/event
 * audit stream for the blocking cases (approval, question) and expensive or
 * failed turns, and delivers each as a Web Push to every subscribed device
 * (mobile PWA included). Also serves the PWA resources (manifest / icons /
 * service worker) and the push subscription endpoints.
 *
 * The browser half (src/client) drives permission + push registration and
 * falls back to the in-page Notification API when Web Push is unavailable.
 */
import { installNotifyHost } from "./notify-host.js";
/** Plugin name (= the config entry id). */
export const name = 'dsh-web-ui-notify';
/** Host services this node half uses. */
export const inject = ['sessions', 'webServer'];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apply(ctx, config) {
    const notify = installNotifyHost(ctx, config ?? {});
    const threshold = config?.longTaskToolCalls ?? 7;
    /** Per-turn tool-call counters: sessionId -> { turn, calls } (turn/start resets). */
    const turnCalls = new Map();
    const onEvent = (session, event) => {
        try {
            const data = event?.data;
            if (event?.type === 'turn/start') {
                const turn = typeof data?.turn === 'number' ? data.turn : 0;
                turnCalls.set(session?.id ?? '', { turn, calls: 0 });
                return;
            }
            if (event?.type === 'approval/asked') {
                const approvalId = data?.id;
                if (typeof approvalId !== 'string' || approvalId === '')
                    return;
                notify.pushApproval({
                    sessionId: session?.id ?? '',
                    approvalId,
                    toolName: typeof data?.toolName === 'string' ? data.toolName : '',
                });
            }
            else if (event?.type === 'tool/call' && data?.name === 'ask_user_question') {
                const callId = data?.callId;
                if (typeof callId !== 'string' || callId === '')
                    return;
                notify.pushQuestion({ sessionId: session?.id ?? '', callId });
            }
            else if (event?.type === 'tool/call') {
                if (data?.name === 'ask_user_question') {
                    const callId = data?.callId;
                    if (typeof callId !== 'string' || callId === '')
                        return;
                    notify.pushQuestion({ sessionId: session?.id ?? '', callId });
                }
                const current = turnCalls.get(session?.id ?? '');
                if (current !== undefined && (data?.turn === undefined || data.turn === current.turn)) {
                    current.calls += 1;
                }
            }
            else if (event?.type === 'turn/end') {
                const sessionId = session?.id ?? '';
                const reason = data?.reason;
                if (reason?.kind === 'error') {
                    const rawMessage = typeof reason.error?.message === 'string' ? reason.error.message : '';
                    notify.pushFailed({
                        sessionId,
                        ...(rawMessage !== ''
                            ? { message: rawMessage.length > 120 ? `${rawMessage.slice(0, 120)}…` : rawMessage }
                            : {}),
                        ...(typeof reason.error?.code === 'string' && reason.error.code !== ''
                            ? { code: reason.error.code }
                            : {}),
                    });
                }
                const current = turnCalls.get(sessionId);
                if (current === undefined)
                    return;
                turnCalls.delete(sessionId);
                if (current.calls >= threshold) {
                    notify.pushCompleted({ sessionId, toolCalls: current.calls });
                }
            }
        }
        catch {
            // a failed projection never blocks the approval chain or other listeners.
        }
    };
    if (typeof ctx.on === 'function')
        ctx.on('session/event', onEvent);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let webServer;
    try {
        webServer = ctx.webServer;
    }
    catch {
        webServer = undefined;
    }
    if (webServer === undefined && typeof ctx.get === 'function') {
        try {
            webServer = ctx.get('webServer');
        }
        catch {
            webServer = undefined;
        }
    }
    if (webServer !== undefined && typeof webServer.register === 'function') {
        const register = (path, handler) => {
            if (typeof ctx.effect === 'function') {
                ctx.effect(() => webServer.register({ kind: 'exact', path, handler }), `web-ui-notify: ${path}`);
            }
            else {
                webServer.register({ kind: 'exact', path, handler });
            }
        };
        const readJson = (req, done) => {
            let raw = '';
            req?.on?.('data', (chunk) => {
                raw += chunk.toString('utf8');
            });
            req?.on?.('end', () => {
                try {
                    done(JSON.parse(raw));
                }
                catch {
                    done({});
                }
            });
        };
        const hostOf = (req) => req?.headers?.['host'];
        register('/plugins/web-ui-notify/manifest.json', (_req, res) => {
            res.writeHead(200, { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'no-store' });
            res.end(notify.manifest);
        });
        register('/plugins/web-ui-notify/icon-180.png', (_req, res) => {
            res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' });
            res.end(notify.icons['icon-180.png']);
        });
        register('/plugins/web-ui-notify/icon-512.png', (_req, res) => {
            res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' });
            res.end(notify.icons['icon-512.png']);
        });
        register('/plugins/web-ui-notify/sw.js', (_req, res) => {
            res.writeHead(200, {
                'content-type': 'application/javascript; charset=utf-8',
                // Open the service-worker scope to the entire origin.
                'service-worker-allowed': '/',
                'cache-control': 'no-store',
            });
            res.end(notify.sw);
        });
        register('/plugins/web-ui-notify/push-config', (_req, res) => {
            void notify.pushConfig().then((config) => {
                res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                res.end(JSON.stringify(config));
            });
        });
        register('/plugins/web-ui-notify/push-subscribe', (req, res) => {
            if (req?.method !== 'POST') {
                res.writeHead(405, { 'content-type': 'application/json; charset=utf-8' });
                res.end('{"error":"method not allowed"}');
                return;
            }
            readJson(req, (value) => {
                const endpoint = value?.endpoint;
                if (typeof endpoint !== 'string' || endpoint === '') {
                    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
                    res.end('{"error":"bad subscription"}');
                    return;
                }
                notify.addSubscription(value);
                res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
                res.end('{"ok":true}');
            });
        });
        register('/plugins/web-ui-notify/focus', (req, res) => {
            if (req?.method !== 'POST') {
                res.writeHead(405, { 'content-type': 'application/json; charset=utf-8' });
                res.end('{"error":"method not allowed"}');
                return;
            }
            readJson(req, (value) => {
                notify.noteFocus(hostOf(req), value?.focused === true);
                res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
                res.end('{"ok":true}');
            });
        });
        // Inject the PWA manifest + apple-touch-icon into the boot HTML. iOS needs
        // PNG icons and an installed PWA before it will deliver Web Push.
        if (typeof webServer.tapIndex === 'function' && typeof ctx.effect === 'function') {
            ctx.effect(() => webServer.tapIndex((html) => {
                const links = '<link rel="manifest" href="/plugins/web-ui-notify/manifest.json">'
                    + '<link rel="apple-touch-icon" href="/plugins/web-ui-notify/icon-180.png">';
                if (html.includes('/plugins/web-ui-notify/manifest.json'))
                    return html;
                return html.replace('<head>', `<head>${links}`);
            }), 'web-ui-notify: pwa manifest tap');
        }
    }
}
