window.__ModuleLoader__.load({
	id: "dsh-ya-simple-shortcuts",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/index.ts
		const name = "dsh-ya-simple-shortcuts";
		/**
		* Keep this list to packages that still exist as installable client bundles.
		* `@deepseek-ai/dsh-client-runtime` was removed in alpha1 — listing it here is
		* what broke every shortcut.
		*/
		const inject = [
			"sessions",
			"modelDirectories",
			"uiWorkspace",
			"workspaces"
		];
		/**
		* Composer input hosts. alpha1 renders a Lexical contenteditable
		* (`[data-composer-input]`); pre-alpha rendered a `<textarea>` inside the input
		* scroller. Both are matched, plus the generic contenteditable form so a future
		* shell that drops the data attribute still resolves.
		*/
		const COMPOSER_INPUT_SELECTOR = [
			"[data-composer-input]",
			"[data-input-scroll] textarea",
			"textarea[data-phase]",
			"[contenteditable=\"true\"]",
			"[contenteditable][data-phase]"
		].join(", ");
		/** Access-mode (permission) trigger: the composer chip carries this aria-label. */
		const ACCESS_MODE_ARIA_PREFIXES = ["访问模式", "Access mode"];
		/** Session-search trigger aria-labels (zh + en). */
		const SESSION_SEARCH_ARIA = ["搜索会话", "Search sessions"];
		function flatModelList(groups) {
			const flat = [];
			for (const group of groups) {
				if (group.models === void 0) continue;
				for (const model of group.models) flat.push({
					provider: group.id,
					model
				});
			}
			return flat;
		}
		function cycleEffort(scope, direction) {
			const sessionId = scope.sessions.list.getSnapshot().current;
			if (sessionId === void 0 || sessionId === null) return;
			let directory;
			try {
				if (scope.modelDirectories === void 0) return;
				directory = scope.modelDirectories.directoryFor(sessionId);
			} catch {
				return;
			}
			const snapshot = directory.store.getSnapshot();
			const current = snapshot.current;
			if (current === null) return;
			const efforts = flatModelList(snapshot.groups ?? []).find((item) => item.provider === current.provider && item.model.id === current.model)?.model.reasoning?.efforts;
			if (efforts === void 0 || efforts.length === 0) return;
			const choices = [void 0, ...efforts.map((effort) => effort.id)];
			let index = choices.findIndex((effort) => effort === current.reasoningEffort);
			if (index < 0) index = 0;
			const next = choices[(index + direction + choices.length) % choices.length];
			const selection = {
				provider: current.provider,
				model: current.model
			};
			if (next !== void 0) selection.reasoningEffort = next;
			try {
				directory.select(selection).catch(() => {});
			} catch {}
		}
		/**
		* Index of the menu row DSH marks as current.
		*
		* alpha1's primitive draws a check-mark SVG for the selected row and sets no
		* `aria-checked` / `aria-selected`. Pre-alpha shells used those attributes.
		* Both spellings are probed, and a trailing check icon counts as well.
		*/
		function markedIndex(items) {
			const byAria = items.findIndex((item) => item.getAttribute("aria-checked") === "true" || item.getAttribute("aria-selected") === "true");
			if (byAria >= 0) return byAria;
			const byClass = items.findIndex((item) => Array.from(item.classList).some((name) => /selected|checked|active|current/i.test(name)));
			if (byClass >= 0) return byClass;
			return items.findIndex((item) => item.querySelectorAll("svg").length > 1);
		}
		/**
		* Click the next row of the menu attached to `anchor`.
		*
		* @param anchor - the trigger button that opens the menu.
		* @param direction - +1 for next, -1 for previous.
		* @param fallbackLabel - text of the current row, used when the menu marks
		*   nothing (keeps cycle position sane across locales).
		* @returns whether the anchor was clicked.
		*/
		function cycleMenu(anchor, direction, fallbackLabel) {
			anchor.click();
			requestAnimationFrame(() => {
				const menus = document.querySelectorAll("[role=\"menu\"], [role=\"listbox\"]");
				const menu = menus.item(menus.length - 1);
				if (menu === null) return;
				const items = Array.from(menu.querySelectorAll("[role=\"menuitem\"], [role=\"option\"]"));
				if (items.length === 0) return;
				let index = markedIndex(items);
				if (index < 0 && fallbackLabel !== "") index = items.findIndex((item) => item.textContent?.includes(fallbackLabel) === true);
				if (index < 0) index = 0;
				items[(index + direction + items.length) % items.length].click();
			});
			return true;
		}
		/**
		* Full-access is gated behind a `RiskConfirmation` dialog. It auto-focuses its
		* acknowledge checkbox on open, so after the click the user is already one
		* Space + Enter away from confirming — no extra focus juggling required.
		*/
		function accessModeButton() {
			return Array.from(document.querySelectorAll("[data-composer-card] button")).find((button) => {
				const label = button.getAttribute("aria-label") ?? "";
				return ACCESS_MODE_ARIA_PREFIXES.some((prefix) => label.startsWith(prefix));
			}) ?? null;
		}
		function cyclePermission() {
			const button = accessModeButton();
			if (button === null) return false;
			return cycleMenu(button, 1, (button.getAttribute("aria-label") ?? "").replace(/^[^：:]*[：:]\s*/, "").trim());
		}
		function openSessionSearch() {
			const button = Array.from(document.querySelectorAll("button")).find((candidate) => {
				const label = candidate.getAttribute("aria-label") ?? "";
				return SESSION_SEARCH_ARIA.some((text) => label === text);
			});
			if (button === void 0) return;
			button.click();
			requestAnimationFrame(() => {
				document.querySelector("input[placeholder=\"搜索会话…\"], input[placeholder=\"Search sessions...\"]")?.focus({ preventScroll: true });
			});
		}
		/**
		* Page the conversation between user messages.
		*
		* Two traps in alpha1's transcript DOM that the naive version fell into:
		* 1. `[data-chat-anchor-key]` rows are NOT in visual order (turn-process and
		*    subagent groups interleave), so "last matching row" must be picked by
		*    measured offset, not by DOM index.
		* 2. After a jump the target row's top lands exactly on the marker, so a plain
		*    `< marker` / `> marker` test keeps re-selecting that same row and every
		*    repeat press stalls. The comparison is anchored on the row's top with a
		*    one-pixel epsilon so the parked row is excluded.
		*
		* @param direction - -1 to page up, +1 to page down.
		*/
		function scrollToUser(direction) {
			const scrollport = document.querySelector("[data-conversation-scroll]");
			if (scrollport === null) return;
			const scrollportRect = scrollport.getBoundingClientRect();
			const offsets = Array.from(scrollport.querySelectorAll("[data-chat-anchor-key]")).filter((row) => {
				if (row.hasAttribute("hidden")) return false;
				const kind = row.dataset.chatFlowKind;
				return kind === "user" || kind === "steering";
			}).map((row) => {
				return {
					row,
					top: row.getBoundingClientRect().top - scrollportRect.top
				};
			});
			if (offsets.length === 0) return;
			let target;
			if (direction < 0) {
				let best;
				for (const entry of offsets) {
					if (entry.top >= 79) continue;
					if (best === void 0 || entry.top > best.top) best = entry;
				}
				target = best?.row;
			} else {
				let best;
				for (const entry of offsets) {
					if (entry.top <= 81) continue;
					if (best === void 0 || entry.top < best.top) best = entry;
				}
				target = best?.row;
			}
			let newTop;
			if (target === void 0) newTop = direction < 0 ? 0 : scrollport.scrollHeight;
			else newTop = scrollport.scrollTop + target.getBoundingClientRect().top - scrollportRect.top;
			if (typeof scrollport.scrollTo === "function") scrollport.scrollTo({ top: newTop });
			else scrollport.scrollTop = newTop;
		}
		function cyclePreset(direction) {
			const seat = document.querySelector("[data-slot=\"conversation.hero.agentPreset\"] button[aria-haspopup=\"menu\"]");
			if (seat === null) return false;
			return cycleMenu(seat, direction, seat.textContent?.trim() ?? "");
		}
		/**
		* Whether the key press belongs to the composer.
		*
		* Lexical keeps focus on the contenteditable root itself, so `event.target` is
		* the input — but popup shells and some mobile keyboards blur it, leaving
		* `document.activeElement` as the only witness. Both are checked.
		*/
		function isComposerTarget(target) {
			return [target instanceof Element ? target : null, document.activeElement instanceof Element ? document.activeElement : null].some((candidate) => {
				if (candidate === null) return false;
				const input = candidate.closest(COMPOSER_INPUT_SELECTOR);
				return input !== null && input.closest("[data-composer-card]") !== null;
			});
		}
		/**
		* Start a new session, preferring the alpha1 `uiWorkspace` service (which owns
		* navigation and blank-session reuse) and falling back to the pre-alpha
		* controller method so older hosts keep working unchanged.
		*/
		function startSession(scope) {
			const ui = scope.uiWorkspace?.startSession;
			if (typeof ui === "function") {
				ui.call(scope.uiWorkspace);
				return;
			}
			const legacy = scope.workspaces?.startSession;
			if (typeof legacy === "function") legacy.call(scope.workspaces);
		}
		function onKeyDown(scope, event) {
			if (event.isComposing || event.keyCode === 229 || event.repeat) return;
			const key = (event.key || event.code).toLowerCase();
			const alt = event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
			const ctrl = event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
			if (alt && key === "a") {
				if (cyclePermission()) event.preventDefault();
				return;
			}
			if (alt && key === "x") {
				event.preventDefault();
				startSession(scope);
				return;
			}
			if (ctrl && key === "k") {
				event.preventDefault();
				openSessionSearch();
				return;
			}
			if (alt && (key === "arrowup" || key === "arrowdown")) {
				event.preventDefault();
				scrollToUser(key === "arrowup" ? -1 : 1);
				return;
			}
			if (alt && key === "arrowright") {
				event.preventDefault();
				cycleEffort(scope, 1);
				return;
			}
			if (alt && key === "arrowleft") {
				event.preventDefault();
				cycleEffort(scope, -1);
				return;
			}
			if (key === "tab" && isComposerTarget(event.target)) {
				if (cyclePreset(event.shiftKey ? -1 : 1)) event.preventDefault();
			}
		}
		function apply(ctx) {
			ctx.inject(inject, (scope) => {
				scope.effect(() => {
					const handler = (event) => onKeyDown(scope, event);
					document.addEventListener("keydown", handler, true);
					return () => document.removeEventListener("keydown", handler, true);
				}, "dsh-ya-simple-shortcuts: keydown");
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
