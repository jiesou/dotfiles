window.__ModuleLoader__.load({
	id: "dsh-ya-simple-shortcuts",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/index.ts
		const name = "dsh-ya-simple-shortcuts";
		const inject = [
			"shortcuts",
			"sessions",
			"modelDirectories",
			"uiWorkspace"
		];
		const COMPOSER_INPUT_SELECTOR = [
			"[data-composer-input]",
			"[data-input-scroll] textarea",
			"textarea[data-phase]",
			"[contenteditable=\"true\"]",
			"[contenteditable][data-phase]"
		].join(", ");
		const ACCESS_MODE_ARIA_PREFIXES = ["访问模式", "Access mode"];
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
		function markedIndex(items) {
			const byAria = items.findIndex((item) => item.getAttribute("aria-checked") === "true" || item.getAttribute("aria-selected") === "true");
			if (byAria >= 0) return byAria;
			const byClass = items.findIndex((item) => Array.from(item.classList).some((name) => /selected|checked|active|current/i.test(name)));
			if (byClass >= 0) return byClass;
			return items.findIndex((item) => item.querySelectorAll("svg").length > 1);
		}
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
		function isComposerTarget(target) {
			return [target instanceof Element ? target : null, document.activeElement instanceof Element ? document.activeElement : null].some((candidate) => {
				if (candidate === null) return false;
				const input = candidate.closest(COMPOSER_INPUT_SELECTOR);
				return input !== null && input.closest("[data-composer-card]") !== null;
			});
		}
		function isAltOnly(gesture) {
			return gesture.alt && !gesture.control && !gesture.shift && !gesture.meta;
		}
		function startSession(scope) {
			if (scope.uiWorkspace === void 0) return false;
			try {
				scope.uiWorkspace.startSession();
				return true;
			} catch {
				return false;
			}
		}
		function status() {
			return globalThis.__dshGapShortcuts ?? (globalThis.__dshGapShortcuts = {
				fixed: [],
				last: "",
				calls: 0
			});
		}
		function onFixedInput(scope, input) {
			if (input.type === "reset") return;
			const { gesture, context } = input;
			status().calls += 1;
			status().last = gesture.code;
			if (gesture.defaultPrevented || gesture.composing || gesture.repeat) return;
			if (context.modal !== null || context.region === "terminal") return;
			if (!isAltOnly(gesture)) return;
			if (gesture.code === "KeyA") {
				if (cyclePermission()) input.consume();
			} else if (gesture.code === "KeyX") {
				if (startSession(scope)) input.consume();
			} else if (gesture.code === "ArrowUp") {
				input.consume();
				scrollToUser(-1);
			} else if (gesture.code === "ArrowDown") {
				input.consume();
				scrollToUser(1);
			} else if (gesture.code === "ArrowLeft") {
				input.consume();
				cycleEffort(scope, -1);
			} else if (gesture.code === "ArrowRight") {
				input.consume();
				cycleEffort(scope, 1);
			}
		}
		function onKeyDown(scope, event) {
			if (event.isComposing || event.keyCode === 229 || event.repeat) return;
			if ((event.key || event.code).toLowerCase() === "tab" && isComposerTarget(event.target)) {
				if (cyclePreset(event.shiftKey ? -1 : 1)) event.preventDefault();
			}
		}
		function apply(ctx) {
			ctx.inject(inject, (scope) => {
				scope.effect(() => {
					const fixed = (id, label, keys, bindings) => {
						const dispose = scope.shortcuts.registerFixed({
							id,
							label: () => label,
							keys,
							bindings,
							group: "application"
						});
						status().fixed.push(id);
						return dispose;
					};
					const disposePermission = fixed("permission.cycle", "切换访问模式", ["Alt+A"], [{
						code: "KeyA",
						modifiers: ["alt"]
					}]);
					const disposeSession = fixed("gap.session.new", "新建会话", ["Alt+X"], [{
						code: "KeyX",
						modifiers: ["alt"]
					}]);
					const disposePaging = fixed("conversation.page", "按用户消息翻页", ["Alt+↑", "Alt+↓"], [{
						code: "ArrowUp",
						modifiers: ["alt"]
					}, {
						code: "ArrowDown",
						modifiers: ["alt"]
					}]);
					const disposeEffort = fixed("reasoning-effort.cycle", "切换推理强度", ["Alt+←", "Alt+→"], [{
						code: "ArrowLeft",
						modifiers: ["alt"]
					}, {
						code: "ArrowRight",
						modifiers: ["alt"]
					}]);
					const offFixed = scope.shortcuts.observeFixedInput((input) => {
						onFixedInput(scope, input);
					});
					const handler = (event) => onKeyDown(scope, event);
					document.addEventListener("keydown", handler, true);
					return () => {
						disposePermission();
						disposeSession();
						disposePaging();
						disposeEffort();
						offFixed();
						document.removeEventListener("keydown", handler, true);
					};
				}, "dsh-ya-simple-shortcuts: gap shortcuts");
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
