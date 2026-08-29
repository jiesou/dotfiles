import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
//#region src/notify-host.ts
/**
* Host notification machinery: Web Push fan-out to subscribed devices so the
* browser can surface system notifications on mobile even when the page is
* closed. Detection of *what* to notify lives in src/index.ts, which calls the
* handle methods below from the session/event audit stream and registers the
* HTTP routes with the webServer service.
*
* Model:
*  - The browser `Notification` API only works while a page is open and, on
*    mobile, is absent or stops firing when backgrounded. Web Push + a service
*    worker gives real system notifications on the phone.
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
const SUBSCRIPTIONS_CAP = 64;
const TITLE_MAX = 20;
const FOCUS_WINDOW_MS = 3e3;
const PUSH_DEDUP_KEY = "__dsh_web_ui_notify_push_dedup__";
/** Data dir: $DSH_HOME/.web-ui-notify/ (fallback ~/.dsh/.web-ui-notify). */
function dataDir() {
	const home = process.env.DSH_HOME ?? join(homedir(), ".dsh");
	return join(home, ".web-ui-notify");
}
/** Last-wins session title from an audit event list; empty when untitled. */
function sessionTitleFromEvents(events) {
	if (!Array.isArray(events)) return "";
	for (let i = events.length - 1; i >= 0; i -= 1) {
		const event = events[i];
		if (event?.type === "session/title" && typeof event.data?.title === "string" && event.data.title !== "") return event.data.title;
	}
	for (let i = 0; i < events.length; i += 1) {
		const event = events[i];
		if (event?.type !== "user/message") continue;
		const text = event.data?.content?.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text).join(" ").replace(/\s+/gu, " ").trim();
		if (text !== void 0 && text !== "") return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX)}…` : text;
	}
	return "";
}
/** Service Worker source: push -> system notification (skips when a
* same-origin window is focused), notification click -> focus/open + postMessage. */
function swSource() {
	return [
		"/* dsh-web-ui-notify service worker: push notification bridge */",
		"self.addEventListener('install', () => { self.skipWaiting() })",
		"self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })",
		"self.addEventListener('push', (event) => {",
		"  let data = {}",
		"  try { data = event.data ? event.data.json() : {} } catch { /* non-JSON payload ignored */ }",
		"  const title = data.title || 'dsh'",
		"  event.waitUntil((async () => {",
		"    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })",
		"    const origin = new URL(self.registration.scope).origin",
		"    const focused = clients.some(c => c.focused === true && new URL(c.url).origin === origin)",
		"    if (focused) return",
		"    await self.registration.showNotification(title, {",
		"      body: data.body || '',",
		"      tag: data.tag || 'web-ui-' + Date.now(),",
		"      data: { sessionId: data.sessionId || null },",
		"      requireInteraction: data.kind === 'approval' || data.kind === 'question',",
		"    })",
		"  })())",
		"})",
		"self.addEventListener('notificationclick', (event) => {",
		"  event.notification.close();",
		"  event.waitUntil((async () => {",
		"    const data = event.notification.data || {}",
		"    const sessionId = typeof data.sessionId === 'string' ? data.sessionId : ''",
		"    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })",
		"    const origin = new URL(self.registration.scope).origin",
		"    const client = clients.find(c => new URL(c.url).origin === origin)",
		"    if (client) {",
		"      await client.focus()",
		"      if (sessionId) client.postMessage({ type: 'web-ui-notify:jump', sessionId })",
		"      return",
		"    }",
		"    const win = await self.clients.openWindow(new URL('/', self.registration.scope).href)",
		"    if (sessionId && win) win.postMessage({ type: 'web-ui-notify:jump', sessionId })",
		"  })())",
		"})"
	].join("\n");
}
/** Build the host notification handle. */
function installNotifyHost(ctx, config) {
	let pushMod;
	let vapidPublicKey = config?.vapidPublicKey;
	let vapidPrivateKey = config?.vapidPrivateKey;
	let pushReady;
	const ensurePush = () => {
		pushReady ??= (async () => {
			try {
				const imported = await import("web-push");
				const mod = imported.default ?? imported;
				if (vapidPublicKey === void 0 || vapidPrivateKey === void 0) {
					const file = join(dataDir(), "vapid.json");
					if (existsSync(file)) {
						const saved = JSON.parse(readFileSync(file, "utf8"));
						vapidPublicKey = saved.publicKey;
						vapidPrivateKey = saved.privateKey;
					}
				}
				if (vapidPublicKey === void 0 || vapidPrivateKey === void 0) {
					const keys = mod.generateVAPIDKeys();
					vapidPublicKey = keys.publicKey;
					vapidPrivateKey = keys.privateKey;
					mkdirSync(dataDir(), { recursive: true });
					writeFileSync(join(dataDir(), "vapid.json"), JSON.stringify(keys, null, 2), "utf8");
				}
				mod.setVapidDetails("https://github.com/bill9109/dsh-web-ui-notify", vapidPublicKey, vapidPrivateKey);
				pushMod = mod;
				return true;
			} catch (error) {
				console.warn(`[web-ui-notify] web push unavailable: ${String(error).slice(0, 160)}`);
				return false;
			}
		})();
		return pushReady;
	};
	const subscriptionsFile = join(dataDir(), "subscriptions.json");
	let subscriptions = [];
	try {
		if (existsSync(subscriptionsFile)) {
			const parsed = JSON.parse(readFileSync(subscriptionsFile, "utf8"));
			if (Array.isArray(parsed)) subscriptions = parsed.slice(0, SUBSCRIPTIONS_CAP);
		}
	} catch {
		subscriptions = [];
	}
	const saveSubscriptions = () => {
		try {
			mkdirSync(dataDir(), { recursive: true });
			writeFileSync(subscriptionsFile, JSON.stringify(subscriptions.slice(0, SUBSCRIPTIONS_CAP), null, 2), "utf8");
		} catch {}
	};
	const focusedByHost = /* @__PURE__ */ new Map();
	const anyFocusedRecently = () => {
		const cutoff = Date.now() - FOCUS_WINDOW_MS;
		for (const [host, at] of focusedByHost) {
			if (at >= cutoff) return true;
			focusedByHost.delete(host);
		}
		return false;
	};
	const sendPush = async (payload) => {
		if (!await ensurePush() || subscriptions.length === 0) return;
		const body = JSON.stringify(payload);
		for (const sub of subscriptions) try {
			await pushMod.sendNotification(sub, body, { TTL: 3600 });
		} catch (error) {
			const status = error?.statusCode;
			if (status === 404 || status === 410) {
				subscriptions = subscriptions.filter((item) => item.endpoint !== sub.endpoint);
				saveSubscriptions();
			} else console.warn(`[web-ui-notify] push failed (${status ?? "unknown"}): ${String(error).slice(0, 160)}`);
		}
	};
	const global = globalThis;
	const recentPushes = global[PUSH_DEDUP_KEY] ?? /* @__PURE__ */ new Map();
	global[PUSH_DEDUP_KEY] = recentPushes;
	const pushOnce = (key, fn) => {
		const now = Date.now();
		const last = recentPushes.get(key);
		if (last !== void 0 && now - last < 3e3) return;
		recentPushes.set(key, now);
		if (recentPushes.size > 200) {
			const cutoff = now - 6e4;
			for (const [k, at] of recentPushes) if (at < cutoff) recentPushes.delete(k);
		}
		fn();
	};
	const titleCache = /* @__PURE__ */ new Map();
	const sessionTitle = (sessionId) => {
		const cached = titleCache.get(sessionId);
		if (cached !== void 0) return cached;
		let title = "";
		try {
			const session = ctx?.sessions?.get?.(sessionId);
			title = sessionTitleFromEvents(session?.events);
		} catch {}
		titleCache.set(sessionId, title);
		return title;
	};
	const deliver = (payload) => {
		if (anyFocusedRecently()) return;
		sendPush(payload);
	};
	return {
		pushApproval: (info) => {
			const payload = {
				kind: "approval",
				title: sessionTitle(info.sessionId) || "未命名会话",
				body: `「${info.toolName || "工具"}」请求执行，点击查看…`,
				tag: `web-ui-notify:a:${info.approvalId}`,
				sessionId: info.sessionId
			};
			pushOnce(`a:${info.approvalId}`, () => deliver(payload));
		},
		pushQuestion: (info) => {
			const payload = {
				kind: "question",
				title: sessionTitle(info.sessionId) || "未命名会话",
				body: "AI 正在等待你的回答，点击查看…",
				tag: `q:${info.sessionId}:${info.callId}`,
				sessionId: info.sessionId
			};
			pushOnce(`q:${info.sessionId}:${info.callId}`, () => deliver(payload));
		},
		pushFailed: (info) => {
			const payload = {
				kind: "failed",
				title: sessionTitle(info.sessionId) || "未命名会话",
				body: info.message !== void 0 && info.message !== "" ? `运行失败：${info.message}` : "AI 回合因错误中断，点击查看…",
				tag: `f:${info.sessionId}:${info.code ?? "error"}`,
				sessionId: info.sessionId
			};
			pushOnce(`f:${info.sessionId}:${info.code ?? "error"}`, () => deliver(payload));
		},
		pushCompleted: (info) => {
			const payload = {
				kind: "completed",
				title: sessionTitle(info.sessionId) || "未命名会话",
				body: `任务完成（${info.toolCalls} 次工具调用），点击查看…`,
				tag: `c:${info.sessionId}:${info.toolCalls}`,
				sessionId: info.sessionId
			};
			pushOnce(`c:${info.sessionId}:${info.toolCalls}`, () => deliver(payload));
		},
		noteFocus: (host, focused) => {
			if (typeof host !== "string" || host === "") return;
			if (focused) focusedByHost.set(host, Date.now());
			else focusedByHost.delete(host);
		},
		sw: swSource(),
		pushConfig: async () => await ensurePush() ? {
			enabled: true,
			publicKey: vapidPublicKey ?? ""
		} : { enabled: false },
		addSubscription(sub) {
			subscriptions = subscriptions.filter((item) => item.endpoint !== sub.endpoint);
			subscriptions.push(sub);
			saveSubscriptions();
		}
	};
}
//#endregion
//#region src/index.ts
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
/** Plugin name (= the config entry id). */
const name = "dsh-web-ui-notify";
/** Host services this node half uses. */
const inject = ["sessions", "webServer"];
function apply(ctx, config) {
	const notify = installNotifyHost(ctx, config ?? {});
	const threshold = config?.longTaskToolCalls ?? 7;
	/** Per-turn tool-call counters: sessionId -> { turn, calls } (turn/start resets). */
	const turnCalls = /* @__PURE__ */ new Map();
	const onEvent = (session, event) => {
		try {
			const data = event?.data;
			if (event?.type === "turn/start") {
				const turn = typeof data?.turn === "number" ? data.turn : 0;
				turnCalls.set(session?.id ?? "", {
					turn,
					calls: 0
				});
				return;
			}
			if (event?.type === "approval/asked") {
				const approvalId = data?.id;
				if (typeof approvalId !== "string" || approvalId === "") return;
				notify.pushApproval({
					sessionId: session?.id ?? "",
					approvalId,
					toolName: typeof data?.toolName === "string" ? data.toolName : ""
				});
			} else if (event?.type === "tool/call" && data?.name === "ask_user_question") {
				const callId = data?.callId;
				if (typeof callId !== "string" || callId === "") return;
				notify.pushQuestion({
					sessionId: session?.id ?? "",
					callId
				});
			} else if (event?.type === "tool/call") {
				const current = turnCalls.get(session?.id ?? "");
				if (current !== void 0 && (data?.turn === void 0 || data.turn === current.turn)) current.calls += 1;
			} else if (event?.type === "turn/end") {
				const sessionId = session?.id ?? "";
				const reason = data?.reason;
				if (reason?.kind === "error") {
					const rawMessage = typeof reason.error?.message === "string" ? reason.error.message : "";
					notify.pushFailed({
						sessionId,
						...rawMessage !== "" ? { message: rawMessage.length > 120 ? `${rawMessage.slice(0, 120)}…` : rawMessage } : {},
						...typeof reason.error?.code === "string" && reason.error.code !== "" ? { code: reason.error.code } : {}
					});
				}
				const current = turnCalls.get(sessionId);
				if (current === void 0) return;
				turnCalls.delete(sessionId);
				if (current.calls >= threshold) notify.pushCompleted({
					sessionId,
					toolCalls: current.calls
				});
			}
		} catch {}
	};
	if (typeof ctx.on === "function") ctx.on("session/event", onEvent);
	let webServer;
	try {
		webServer = ctx.webServer;
	} catch {
		webServer = void 0;
	}
	if (webServer === void 0 && typeof ctx.get === "function") try {
		webServer = ctx.get("webServer");
	} catch {
		webServer = void 0;
	}
	if (webServer !== void 0 && typeof webServer.register === "function") {
		const register = (path, handler) => {
			if (typeof ctx.effect === "function") ctx.effect(() => webServer.register({
				kind: "exact",
				path,
				handler
			}), `web-ui-notify: ${path}`);
			else webServer.register({
				kind: "exact",
				path,
				handler
			});
		};
		const readJson = (req, done) => {
			let raw = "";
			req?.on?.("data", (chunk) => {
				raw += chunk.toString("utf8");
			});
			req?.on?.("end", () => {
				try {
					done(JSON.parse(raw));
				} catch {
					done({});
				}
			});
		};
		const hostOf = (req) => req?.headers?.["host"];
		register("/plugins/web-ui-notify/sw.js", (_req, res) => {
			res.writeHead(200, {
				"content-type": "application/javascript; charset=utf-8",
				"service-worker-allowed": "/",
				"cache-control": "no-store"
			});
			res.end(notify.sw);
		});
		register("/plugins/web-ui-notify/push-config", (_req, res) => {
			notify.pushConfig().then((config) => {
				res.writeHead(200, {
					"content-type": "application/json; charset=utf-8",
					"cache-control": "no-store"
				});
				res.end(JSON.stringify(config));
			});
		});
		register("/plugins/web-ui-notify/push-subscribe", (req, res) => {
			if (req?.method !== "POST") {
				res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
				res.end("{\"error\":\"method not allowed\"}");
				return;
			}
			readJson(req, (value) => {
				const endpoint = value?.endpoint;
				if (typeof endpoint !== "string" || endpoint === "") {
					res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
					res.end("{\"error\":\"bad subscription\"}");
					return;
				}
				notify.addSubscription(value);
				res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
				res.end("{\"ok\":true}");
			});
		});
		register("/plugins/web-ui-notify/focus", (req, res) => {
			if (req?.method !== "POST") {
				res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
				res.end("{\"error\":\"method not allowed\"}");
				return;
			}
			readJson(req, (value) => {
				notify.noteFocus(hostOf(req), value?.focused === true);
				res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
				res.end("{\"ok\":true}");
			});
		});
	}
}
//#endregion
export { apply, inject, name };
