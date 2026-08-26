window.__ModuleLoader__.load({
	id: "@bill9109/dsh-web-ui-notify",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/push.ts
		/**
		* Client push bridge: registers the plugin's service worker, subscribes this
		* device to Web Push, reports page focus to the host, and forwards
		* notification-click jumps to the session opener.
		*
		* Web Push is what makes mobile notifications work: the host sends a push to
		* the OS push service and the service worker displays it even when the dsh
		* page is closed or backgrounded — the in-page `Notification` API cannot do
		* that on mobile.
		*/
		const PLUGIN_PREFIX = "/plugins/web-ui-notify";
		/** Convert a base64url VAPID public key to the Uint8Array PushManager needs. */
		function urlBase64ToUint8Array(base64url) {
			const base64 = (base64url + "=".repeat((4 - base64url.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/");
			const raw = atob(base64);
			const out = new Uint8Array(raw.length);
			for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
			return out;
		}
		/** Whether this browser can support Web Push (secure context + SW + Notification). */
		function pushSupported() {
			return typeof navigator !== "undefined" && "serviceWorker" in navigator && typeof navigator.serviceWorker.register === "function" && typeof window !== "undefined" && window.isSecureContext && typeof Notification !== "undefined";
		}
		let activeSubscription;
		let subscribeAttempts = 0;
		const MAX_SUBSCRIBE_ATTEMPTS = 5;
		/** Whether this device currently has an active push subscription (sync read). */
		function isPushActive() {
			return activeSubscription !== void 0;
		}
		/** Lazily (re)tries to register the SW and subscribe — idempotent, capped. */
		async function ensureSubscription() {
			if (!pushSupported()) return;
			if (Notification.permission !== "granted") return;
			if (subscribeAttempts >= MAX_SUBSCRIBE_ATTEMPTS) return;
			subscribeAttempts += 1;
			try {
				const registration = await navigator.serviceWorker.register(`${PLUGIN_PREFIX}/sw.js`, { scope: "/" });
				const subscription = await registration.pushManager.getSubscription() ?? await (async () => {
					const res = await fetch(`${PLUGIN_PREFIX}/push-config`, { cache: "no-store" });
					if (!res.ok) return void 0;
					const data = await res.json();
					if (data.enabled !== true || typeof data.publicKey !== "string") return void 0;
					return registration.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: urlBase64ToUint8Array(data.publicKey)
					});
				})();
				if (subscription === void 0) return;
				activeSubscription = subscription;
				subscribeAttempts = MAX_SUBSCRIBE_ATTEMPTS;
				await fetch(`${PLUGIN_PREFIX}/push-subscribe`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(subscription.toJSON())
				}).catch(() => {});
			} catch {}
		}
		/** Report page focus to the host (suppresses pushes while the user is looking). */
		function reportFocus(focused) {
			if (!pushSupported()) return;
			fetch(`${PLUGIN_PREFIX}/focus`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ focused })
			}).catch(() => {});
		}
		/** Install the long-lived bridge: retry subscription on visibility, report
		*  focus changes, and forward notification-click jumps to the session opener. */
		function installPushBridge(opts) {
			if (!pushSupported()) return;
			ensureSubscription();
			navigator.serviceWorker.addEventListener("message", (event) => {
				const data = event.data;
				if (data?.type === "web-ui-notify:jump" && typeof data.sessionId === "string") opts.openSession(data.sessionId);
			});
			const onVisibility = () => {
				reportFocus(document.visibilityState === "visible");
				if (document.visibilityState === "visible") ensureSubscription();
			};
			document.addEventListener("visibilitychange", onVisibility);
			onVisibility();
		}
		//#endregion
		//#region \0dsh-css:/var/home/chen/.dsh/profiles/web/plugins/dsh-web-ui-notify/src/client/NotificationSettingsRow.module.css.mjs
		const css = ".xCI0lG_row{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}.xCI0lG_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}.xCI0lG_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.xCI0lG_desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}.xCI0lG_status{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400;line-height:18px}.xCI0lG_button{background:var(--dsw-alias-bg-module-platform);height:36px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:18px;align-items:center;gap:12px;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.xCI0lG_button:hover{background:var(--dsw-alias-interactive-bg-hover)}";
		const tagId = "@bill9109/dsh-web-ui-notify/NotificationSettingsRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@bill9109/dsh-web-ui-notify";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var NotificationSettingsRow_module_css_default = {
			"button": "xCI0lG_button",
			"desc": "xCI0lG_desc",
			"row": "xCI0lG_row",
			"rowText": "xCI0lG_rowText",
			"status": "xCI0lG_status",
			"title": "xCI0lG_title"
		};
		//#endregion
		//#region src/client/NotificationSettingsRow.tsx
		/** General Settings row for the notification permission + mobile push state. */
		/** Read the current browser permission state (safe outside browsers). */
		function permissionState() {
			if (typeof Notification === "undefined") return "unsupported";
			return Notification.permission;
		}
		/** Locale key for a permission state, for the settings row copy. */
		function statusKey(state) {
			switch (state) {
				case "granted": return "settings.status.granted";
				case "denied": return "settings.status.denied";
				case "default": return "settings.status.default";
				case "unsupported": return "settings.status.unsupported";
			}
		}
		/** Whether the mobile push channel (Web Push) is available and subscribed. */
		function pushStatus() {
			if (!pushSupported()) return "settings.push.unsupported";
			return isPushActive() ? "settings.push.on" : "settings.push.off";
		}
		/**
		* Render the notification settings row: desktop permission state plus the
		* mobile push state, with a request button (the user-gesture entry point the
		* browser requires before `new Notification` / push subscription works).
		* @param props - composed Settings slot props.
		*/
		function NotificationSettingsRow({ t }) {
			const [state, setState] = (0, react.useState)(permissionState);
			const [pushKey, setPushKey] = (0, react.useState)(pushStatus);
			(0, react.useEffect)(() => {
				ensureSubscription().then(() => setPushKey(pushStatus()));
			}, [state]);
			const request = async () => {
				if (typeof Notification === "undefined") return;
				const next = await Notification.requestPermission();
				setState(next);
				if (next === "granted") ensureSubscription().then(() => setPushKey(pushStatus()));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: NotificationSettingsRow_module_css_default.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: NotificationSettingsRow_module_css_default.rowText,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: NotificationSettingsRow_module_css_default.title,
							children: t("settings.title")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: NotificationSettingsRow_module_css_default.desc,
							children: t("settings.description")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: NotificationSettingsRow_module_css_default.status,
							children: t(statusKey(state))
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: NotificationSettingsRow_module_css_default.status,
							children: t(pushKey)
						})
					]
				}), state === "granted" || state === "unsupported" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: NotificationSettingsRow_module_css_default.button,
					onClick: () => {
						request();
					},
					children: t("settings.request")
				})]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `web-ui-notify` namespace dictionaries. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"settings.title": "桌面通知",
			"settings.description": "当工具需要审批、向你提问、或轮次完成，而你正在浏览其他标签页时，弹出系统通知提醒你。",
			"settings.status.granted": "已开启",
			"settings.status.denied": "已被浏览器阻止",
			"settings.status.default": "未授权",
			"settings.status.unsupported": "浏览器不支持",
			"settings.request": "开启桌面通知",
			"settings.push.on": "手机推送已开启",
			"settings.push.off": "手机推送未开启（需在锁定屏幕/后台也能收到时）",
			"settings.push.unsupported": "当前环境不支持推送（需 HTTPS 或已安装的 PWA）",
			"notify.approval.title": "需要审批",
			"notify.approval.body": "工具 {toolName} 请求越权执行",
			"notify.question.title": "需要你的回答",
			"notify.question.bodyGeneric": "Agent 有一个问题需要你回答",
			"notify.turn.title": "轮次完成",
			"notify.turn.body": "第 {turn} 轮已完成",
			"notify.sessionDone.title": "会话完成",
			"notify.other.done.body": "该会话已完成，可以切回查看"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"settings.title": "Desktop notifications",
			"settings.description": "Show a system notification when a tool needs approval, asks you a question, or a turn finishes while you are on another tab.",
			"settings.status.granted": "On",
			"settings.status.denied": "Blocked by the browser",
			"settings.status.default": "Not granted",
			"settings.status.unsupported": "Not supported",
			"settings.request": "Enable desktop notifications",
			"settings.push.on": "Phone push on",
			"settings.push.off": "Phone push off",
			"settings.push.unsupported": "Push not supported here (needs HTTPS or an installed PWA)",
			"notify.approval.title": "Approval required",
			"notify.approval.body": "Tool {toolName} requests privileged execution",
			"notify.question.title": "Your answer is needed",
			"notify.question.bodyGeneric": "The agent has a question for you",
			"notify.turn.title": "Turn finished",
			"notify.turn.body": "Turn {turn} completed",
			"notify.sessionDone.title": "Session finished",
			"notify.other.done.body": "This session finished — switch over to see the result"
		};
		/** Dictionary namespace owned by this plugin. */
		const NS = "web-ui-notify";
		//#endregion
		//#region src/client/notify.ts
		/**
		* Whether the page is currently hidden (the user is on another tab).
		* @returns true when the document visibility state is 'hidden'.
		*/
		function hiddenNow() {
			return typeof document !== "undefined" && document.visibilityState === "hidden";
		}
		/**
		* Whether the browser supports the Notification API and has granted permission.
		* @returns true when `new Notification` may be constructed.
		*/
		function notificationUsable() {
			return typeof Notification !== "undefined" && Notification.permission === "granted";
		}
		/**
		* Attach the click-to-jump behavior shared by every notification this plugin
		* builds: raise the window, jump to the source conversation, and dismiss.
		*/
		function withClickFocus(notification, onOpen) {
			notification.onclick = () => {
				window.focus();
				onOpen();
				notification.close();
			};
			return notification;
		}
		/** Compose a notification title: the session label first, then the kind title. */
		function titled(kindTitle, label) {
			return label === "" ? kindTitle : `${label} · ${kindTitle}`;
		}
		/** The one rendering path every notification kind funnels through. */
		function show(title, body, tag, target) {
			return withClickFocus(new Notification(title, {
				body,
				tag,
				requireInteraction: true
			}), target.onOpen);
		}
		/**
		* Build and show the desktop notification for one pending wait. The caller
		* gates on {@link hiddenNow} / {@link notificationUsable} and dedupes by
		* wait key; this function only renders.
		* @param wait - the pending approval or question interaction.
		* @param t - bound locale translate for the plugin namespace.
		* @param target - session label + click-to-jump handler.
		* @returns the constructed Notification (tests assert on it).
		*/
		function fireNotification(wait, t, target) {
			return show(titled(wait.kind === "approval" ? t("notify.approval.title") : t("notify.question.title"), target.label), wait.kind === "approval" ? wait.payload.reason ?? t("notify.approval.body", { toolName: wait.payload.toolName }) : (() => {
				const first = wait.payload.questions[0];
				return first?.question !== void 0 && first.question !== "" ? first.question : t("notify.question.bodyGeneric");
			})(), wait.key, target);
		}
		/**
		* Build and show the desktop notification for a completed turn. The caller
		* gates on {@link hiddenNow} / {@link notificationUsable} and dedupes by
		* turn; this function only renders.
		* @param turn - the completed turn number.
		* @param summary - optional excerpt of the turn's final assistant text; when
		*   absent (a tool-only turn) the notification falls back to the turn number.
		* @param t - bound locale translate for the plugin namespace.
		* @param target - session label + click-to-jump handler.
		* @returns the constructed Notification (tests assert on it).
		*/
		function fireTurnNotification(turn, summary, t, target) {
			const body = summary !== void 0 && summary !== "" ? summary : t("notify.turn.body", { turn: String(turn) });
			return show(titled(t("notify.turn.title"), target.label), body, `turn:${turn}`, target);
		}
		/**
		* Build and show the desktop notification for a whole background session
		* finishing ("done" reminder). The caller gates on {@link hiddenNow} /
		* {@link notificationUsable} and dedupes per session; this function only
		* renders.
		* @param t - bound locale translate for the plugin namespace.
		* @param target - session label + click-to-jump handler + a unique tag so the
		*   browser never replaces one session's notification with another's.
		* @returns the constructed Notification (tests assert on it).
		*/
		function fireSessionDoneNotification(t, target) {
			return show(titled(t("notify.sessionDone.title"), target.label), t("notify.other.done.body"), target.tag, target);
		}
		//#endregion
		//#region src/client/index.ts
		/** Notification-body excerpt cap: keep the system notification compact. */
		const SUMMARY_MAX = 80;
		/** Session-label cap in notification titles: keep the title bar compact. */
		const SESSION_LABEL_MAX = 40;
		/**
		* Extract a compact excerpt of one turn's final assistant text for the
		* notification body: the LAST assistant node of that turn, text blocks joined
		* and truncated. A tool-only turn (no final text) yields undefined, so the
		* caller falls back to the turn-number copy.
		* @param nodes - the conversation nodes in event order.
		* @param turn - the finished turn number.
		* @returns the excerpt, or undefined when the turn produced no final text.
		*/
		function turnSummaryOf(nodes, turn) {
			let text = "";
			for (const node of nodes) {
				if (node.kind !== "assistant" || node.turn !== turn) continue;
				let joined = "";
				for (const block of node.blocks) if (block.kind === "text") joined += block.text;
				if (joined !== "") text = joined;
			}
			if (text === "") return void 0;
			const trimmed = text.replace(/\s+/gu, " ").trim();
			return trimmed.length > SUMMARY_MAX ? `${trimmed.slice(0, SUMMARY_MAX)}…` : trimmed;
		}
		/** Required services: the settings slots registry, session domain, and locale. */
		const inject = [
			"slots",
			"sessions",
			"locale"
		];
		/**
		* Client plugin body: register the `web-ui-notify` dictionaries, subscribe
		* to the session list (background waits + completions) and the current
		* session's snapshot (turn completions), and register the settings row.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-notify: dictionaries");
			const t = ctx.locale.bind(NS);
			const sessions = ctx.sessions;
			installPushBridge({ openSession: (sid) => {
				const id = sid;
				if (sessions.list.getSnapshot().byId[id] !== void 0) sessions.open(id);
			} });
			/**
			* PendingWait keys already notified, scoped by session (`${sid}:${wait.key}`,
			* stable across replay, so reconnect and mux-open replay stay silent).
			*/
			const notified = /* @__PURE__ */ new Set();
			/** Whole-session completions already notified via the list layer. */
			const completedNotified = /* @__PURE__ */ new Set();
			/** Completed turn numbers already seen per session (baseline absorbed on first scan). */
			const seenTurns = /* @__PURE__ */ new Map();
			let unsubSession;
			let watched;
			/** Session display label for notification titles (fallback: the raw id). */
			const labelOf = (sid) => {
				const label = sessions.list.getSnapshot().byId[sid]?.displayTitle ?? sid;
				return label.length > SESSION_LABEL_MAX ? `${label.slice(0, SESSION_LABEL_MAX)}…` : label;
			};
			/** Click-to-jump handler for one notification: focus, then open its session. */
			const openOf = (sid) => () => {
				if (sessions.list.getSnapshot().byId[sid] !== void 0) sessions.open(sid);
			};
			/** Scan the current session's snapshot; notify newly finished turns. */
			const scan = () => {
				const current = sessions.list.getSnapshot().current;
				if (current === void 0) return;
				const session = sessions.binding(current)?.session;
				if (session === void 0) return;
				const snapshot = session.getSnapshot();
				if (snapshot.openState !== "open") return;
				let turns = seenTurns.get(current);
				if (turns === void 0) {
					turns = new Set(snapshot.turnEnds.keys());
					seenTurns.set(current, turns);
					return;
				}
				for (const turn of snapshot.turnEnds.keys()) {
					if (turns.has(turn)) continue;
					turns.add(turn);
					if (hiddenNow() && notificationUsable() && !isPushActive()) fireTurnNotification(turn, turnSummaryOf(snapshot.nodes, turn), t, {
						label: labelOf(current),
						onOpen: openOf(current)
					});
				}
			};
			/**
			* Scan the session list: notify pending waits (current AND background, from
			* the session's snapshot payload, deduped by stable wait key) and whole-
			* session completion (background only, once per finish).
			*/
			const scanList = () => {
				const list = sessions.list.getSnapshot();
				const current = list.current;
				for (const sid of list.ids) {
					const summary = list.byId[sid];
					if (summary === void 0) continue;
					if (summary.pendingInteraction !== void 0) {
						const session = sessions.binding(sid)?.session;
						if (session !== void 0) for (const wait of session.getSnapshot().pending) {
							const key = `${sid}:${wait.key}`;
							if (notified.has(key)) continue;
							notified.add(key);
							if (hiddenNow() && notificationUsable() && !isPushActive()) fireNotification(wait, t, {
								label: labelOf(sid),
								onOpen: openOf(sid)
							});
						}
					}
					if (sid !== current && summary.completed === true) {
						if (!completedNotified.has(sid)) {
							completedNotified.add(sid);
							if (hiddenNow() && notificationUsable() && !isPushActive()) fireSessionDoneNotification(t, {
								label: labelOf(sid),
								onOpen: openOf(sid),
								tag: `${sid}:done`
							});
						}
					} else if (summary.completed !== true) completedNotified.delete(sid);
				}
				for (const sid of completedNotified) if (list.byId[sid] === void 0) completedNotified.delete(sid);
			};
			/** Re-subscribe to the current session's snapshot when `current` moves. */
			const watchCurrent = () => {
				const current = sessions.list.getSnapshot().current;
				if (current === watched) return;
				unsubSession?.();
				unsubSession = void 0;
				watched = current;
				if (current === void 0) return;
				const session = sessions.binding(current)?.session;
				if (session === void 0) return;
				unsubSession = session.subscribe(scan);
				scan();
			};
			const unsubList = sessions.list.subscribe(() => {
				watchCurrent();
				scanList();
			});
			watchCurrent();
			scanList();
			ctx.effect(() => () => {
				unsubList();
				unsubSession?.();
			}, "ui-notify: session subscription");
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "web-ui-notify",
				order: 30,
				locale: NS
			}, NotificationSettingsRow));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.turnSummaryOf = turnSummaryOf;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map