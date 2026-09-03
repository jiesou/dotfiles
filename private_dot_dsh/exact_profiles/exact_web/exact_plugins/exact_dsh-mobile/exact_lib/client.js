window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-mobile",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/controller.ts
		/**
		* DOM-side mobile controller: the non-React half of the plugin. Owns the
		* pieces the frame itself cannot express — the viewport meta upgrade, the
		* safe-area/keyboard CSS variables, and the pager's live state (page mirror,
		* 3D flip vars, click-to-return). Everything it installs is removed by
		* dispose(), and every rule it depends on is scoped under the
		* [data-dsh-mobile] attribute it sets on <html>.
		*
		* Mobile layout follows PiUI's chat pager: the STOCK AppFrame becomes a
		* horizontal scroll-snap pager whose columns are two pages — an always-open
		* sidebar page and a full-width chat page. The frame's own state is only
		* touched to expand the auto-collapsed sidebar ONCE below the breakpoint
		* (AppFrame collapses it to the rail on narrow viewports); from then on the
		* pager position is fully user-driven: the app starts on the chat page,
		* a click on the exposed chat card flips back to it, and picking a session
		* in the sidebar returns to it. The sidebar column keeps its full content
		* rendered at all times (a swipe is never state-synced, so it never
		* re-renders).
		*/
		/** The narrow breakpoint the pager keys off (PiUI's 768px). */
		const MOBILE_BREAKPOINT = "(max-width: 768px)";
		/** The <html> attribute that mirrors the pager page the frame is resting on. */
		const PAGE_ATTR = "data-dshm-page";
		/** Wait after the last scroll event before the pager settles. */
		const SCROLL_SETTLE_MS = 200;
		/** Poll interval for the return-to-chat smoother. The smooth scroll is only
		*  re-issued when it is actually STALLED (scrollLeft stopped advancing),
		*  never pre-empted while it is in flight — so a retry reads as a natural
		*  continuation, and the pager is never snapped to the chat page. */
		const SMOOTH_RETRY_MS = 160;
		/** Window (ms) after a session pick during which automatic focus into the
		*  composer is bounced back out: picking a session in the sidebar lands
		*  focus on the input, which pops the OS keyboard over the pager's smooth
		*  return-to-chat. On phones the keyboard must not open until the user
		*  actually taps the input — the focus is suppressed (blurred) during this
		*  window, so the return scroll runs undisturbed. */
		const FOCUS_SUPPRESS_MS = 600;
		/** A focusin is judged "the user's own tap" only when a pointerdown landed
		*  on the same element within this recent window (a real tap intent).
		*  Older pointerdowns (e.g. the session row the user just tapped) must not
		*  count. */
		const POINTER_ALLOW_MS = 500;
		/** The sidebar shell's collapse toggle labels (zh / en) — clicking it while
		*  the sidebar is expanded must NOT collapse it to the rail (which would
		*  unload its content); it flips back to the chat page instead. */
		const SIDEBAR_COLLAPSE_LABELS = /* @__PURE__ */ new Set(["收起侧边栏", "Collapse sidebar"]);
		/**
		* Viewport meta content: maximum-scale blocks the iOS focus zoom that would
		* otherwise fight the fixed-height mobile layout; viewport-fit=cover exposes
		* the safe-area insets to env().
		*/
		const VIEWPORT_CONTENT = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
		/**
		* The AppFrame keeps at least one of its two data attributes in every state
		* (a closed sidebar renders the rail, a closed details column renders zero
		* width), so the union always selects the frame and never a descendant. The
		* attributes identify the frame wherever it sits in the tree — rc.5 wraps
		* the frame in an extra shell div, so no `#root >` child prefix is assumed.
		*/
		const FRAME_SELECTOR = "div[data-sidebar-collapsed], div[data-details-collapsed]";
		/** The AppFrame element, or null before the layout entry mounts it. */
		function findFrame() {
			return document.querySelector(FRAME_SELECTOR);
		}
		/**
		* The composer's model-name label (the first span of the model TRIGGER
		* button — pinned via aria-haspopup='menu' so the open picker's option
		* rows, whose first span is a flex-column optionCopy, are never mistaken
		* for it). Its overflow drives the marquee: the controller measures
		* scrollWidth - clientWidth, wraps a double copy of the text (each in its
		* own item span) and tags the label with data-dshm-marquee + duration —
		* mobile.css's dshm-marquee keyframes slide the runner by -50% (one text
		* width + one gap) on the compositor, so the tail exits, a gap passes,
		* then the head re-enters: a classic spaced ticker, clipped inside the
		* label so it can never overlap the effort badge or the context ring.
		*/
		const MODEL_LABEL_SELECTOR = "[data-composer-card] [data-slot='conversation.input.model'] button[aria-haspopup='menu'] > span:first-child";
		/**
		* The gap between marquee repetitions (px): one copy slides out, this
		* blank space passes, then the head re-enters. Must match the item span's
		* padding-right in mobile.css.
		*/
		const MARQUEE_GAP_PX = 32;
		const COMPOSER_DOCK_SELECTOR = "[data-slot='conversation.composer.dock']";
		/**
		* The pager's chat-page snap position: the rendered width of the sidebar
		* page column (the always-open card). Falls back to the frame's own width
		* while the layout has not settled (offsetWidth is 0 before first layout).
		*/
		function chatPageLeft(frame) {
			const sidebar = frame.firstElementChild;
			if (sidebar instanceof HTMLElement && sidebar.offsetWidth > 0) return sidebar.offsetWidth;
			return frame.clientWidth;
		}
		/** The DOM-side controller (see module doc). */
		var MobileController = class {
			#options;
			#html = null;
			#mql = null;
			#frameObserver = null;
			#rootObserver = null;
			#composerObserver = null;
			#marqueeLabel = null;
			#marqueeRO = null;
			#marqueeFrame = null;
			#viewportMeta = null;
			#viewportOriginal = null;
			#keyboardFrame = null;
			#mountFrame = null;
			#resizeTimer = null;
			#settleTimer = null;
			#returnTimer = null;
			/** Last seen window.innerWidth — the resize handler only re-anchors the
			*  pager when the WIDTH changed (rotation / split-screen reflows the page
			*  tracks). A height-only resize (OS keyboard pop, URL bar collapse) must
			*  never touch scrollLeft: re-anchoring there can cancel the smooth
			*  return-to-chat that a session pick just started. */
			#lastInnerWidth = -1;
			/** Timestamp until which automatic focus into the composer is kicked back
			*  out (see FOCUS_SUPPRESS_MS). */
			#focusSuppressUntil = -1;
			/** The most recent pointerdown target + time, used to tell the user's own
			*  tap on the composer from the app's automatic focus. */
			#lastPointerTarget = null;
			#lastPointerAt = -1;
			#expandPending = false;
			#mounted = false;
			#disposed = false;
			/** @param options - apply-world callbacks. */
			constructor(options) {
				this.#options = options;
			}
			/** True while the frame shows the sidebar expanded (not the rail). */
			isSidebarOpen() {
				const frame = findFrame();
				return frame !== null && !frame.hasAttribute("data-sidebar-collapsed");
			}
			/** Return to the chat page (a session picked in the sidebar). Pure scroll —
			*  the sidebar state is untouched, so its content stays rendered. */
			returnToChat() {
				if (this.#mql?.matches ?? false) this.#focusSuppressUntil = Date.now() + FOCUS_SUPPRESS_MS;
				this.#redirectToChat();
			}
			/** Smoothly scroll the pager back to the chat page. The smooth scroll is
			*  re-issued ONLY when it is genuinely stalled (scrollLeft stops
			*  advancing across a poll) — the rare browser/OS cancellation case —
			*  and every re-issue is also smooth, so the retry never reads as an
			*  instant jump: the user always sees a natural slide back to the
			*  session. While the animation is in flight (or has landed) the poll is
			*  a no-op. */
			#redirectToChat = () => {
				const frame = findFrame();
				const mobile = this.#mql?.matches ?? false;
				if (frame === null || !mobile) return;
				if (chatPageLeft(frame) <= 0) return;
				this.#placeOnChat("smooth");
				if (this.#returnTimer !== null) window.clearTimeout(this.#returnTimer);
				let last = frame.scrollLeft;
				const poll = () => {
					this.#returnTimer = null;
					const f = findFrame();
					const mm = this.#mql?.matches ?? false;
					if (f === null || !mm) return;
					const cl = chatPageLeft(f);
					if (cl <= 0) return;
					if (f.scrollLeft >= cl - 4) return;
					if (f.scrollLeft <= last) this.#placeOnChat("smooth");
					last = f.scrollLeft;
					this.#returnTimer = window.setTimeout(poll, SMOOTH_RETRY_MS);
				};
				this.#returnTimer = window.setTimeout(poll, SMOOTH_RETRY_MS);
			};
			/** Install the controller. Safe to call once; a second call is a no-op.
			*  The frame may not exist yet (the layout entry mounts after this
			*  plugin's apply), so the observer chain re-finds it when #root gains
			*  its child. */
			mount() {
				if (this.#mounted) return;
				this.#mounted = true;
				const html = document.documentElement;
				this.#html = html;
				html.dataset.dshMobile = "";
				this.#installViewportMeta();
				this.#mql = window.matchMedia(MOBILE_BREAKPOINT);
				this.#mql.addEventListener("change", this.#onBreakpointChange);
				const vv = window.visualViewport;
				vv?.addEventListener("resize", this.#requestKeyboard);
				vv?.addEventListener("scroll", this.#requestKeyboard);
				this.#lastInnerWidth = window.innerWidth;
				window.addEventListener("resize", this.#onWindowResize);
				document.addEventListener("click", this.#onDocClickCapture, true);
				document.addEventListener("pointerdown", this.#onPointerDownCapture, true);
				document.addEventListener("focusin", this.#onFocusInCapture, true);
				document.addEventListener("click", this.#onStatsTap, true);
				const root = document.getElementById("root");
				if (root !== null) {
					this.#rootObserver = new MutationObserver(() => {
						this.#ensureFrameObserver();
					});
					this.#rootObserver.observe(root, { childList: true });
					this.#composerObserver = new MutationObserver(() => {
						this.#requestMarqueeSync();
					});
					this.#composerObserver.observe(root, {
						childList: true,
						subtree: true,
						characterData: true
					});
				}
				if (typeof ResizeObserver !== "undefined") this.#marqueeRO = new ResizeObserver(() => {
					this.#requestMarqueeSync();
				});
				this.#ensureFrameObserver();
				this.#requestMarqueeSync();
				this.#ensureSidebarOpen();
				this.#placeOnChat("auto");
				this.#mountFrame = requestAnimationFrame(() => {
					this.#mountFrame = null;
					this.#ensureSidebarOpen();
					this.#placeOnChat("auto");
				});
			}
			/** Remove every DOM effect; safe to call twice. */
			dispose() {
				if (!this.#mounted || this.#disposed) return;
				this.#disposed = true;
				this.#mounted = false;
				this.#frameObserver?.disconnect();
				this.#frameObserver = null;
				this.#rootObserver?.disconnect();
				this.#rootObserver = null;
				this.#composerObserver?.disconnect();
				this.#composerObserver = null;
				this.#marqueeRO?.disconnect();
				this.#marqueeRO = null;
				if (this.#marqueeLabel !== null) {
					const label = this.#marqueeLabel;
					label.removeAttribute("data-dshm-marquee");
					label.style.removeProperty("--dshm-marquee-duration");
					const runner = label.firstElementChild;
					if (runner !== null && runner.hasAttribute("data-dshm-marquee-runner")) {
						const original = runner.firstElementChild?.firstChild ?? null;
						runner.remove();
						if (original !== null) label.append(original);
					}
				}
				this.#marqueeLabel = null;
				this.#mql?.removeEventListener("change", this.#onBreakpointChange);
				this.#mql = null;
				window.removeEventListener("resize", this.#onWindowResize);
				window.visualViewport?.removeEventListener("resize", this.#requestKeyboard);
				window.visualViewport?.removeEventListener("scroll", this.#requestKeyboard);
				document.removeEventListener("click", this.#onDocClickCapture, true);
				document.removeEventListener("pointerdown", this.#onPointerDownCapture, true);
				document.removeEventListener("focusin", this.#onFocusInCapture, true);
				document.removeEventListener("click", this.#onStatsTap, true);
				for (const timer of [
					this.#keyboardFrame,
					this.#mountFrame,
					this.#resizeTimer,
					this.#settleTimer,
					this.#marqueeFrame,
					this.#returnTimer
				]) if (timer !== null) (timer === this.#keyboardFrame || timer === this.#mountFrame || timer === this.#marqueeFrame ? cancelAnimationFrame : window.clearTimeout)(timer);
				this.#keyboardFrame = null;
				this.#mountFrame = null;
				this.#resizeTimer = null;
				this.#settleTimer = null;
				this.#marqueeFrame = null;
				this.#returnTimer = null;
				const frame = findFrame();
				if (frame !== null) frame.removeEventListener("scroll", this.#onPagerScroll);
				if (this.#viewportMeta !== null) {
					if (this.#viewportOriginal !== null) this.#viewportMeta.content = this.#viewportOriginal;
					else this.#viewportMeta.remove();
					this.#viewportMeta = null;
					this.#viewportOriginal = null;
				}
				const html = this.#html;
				if (html !== null) {
					html.removeAttribute("data-dsh-mobile");
					html.removeAttribute(PAGE_ATTR);
					html.style.removeProperty("--dshm-keyboard-inset");
				}
				this.#html = null;
			}
			#installViewportMeta() {
				const existing = document.querySelector("meta[name=\"viewport\"]");
				if (existing !== null) {
					this.#viewportMeta = existing;
					this.#viewportOriginal = existing.content;
					existing.content = VIEWPORT_CONTENT;
					return;
				}
				const meta = document.createElement("meta");
				meta.name = "viewport";
				meta.content = VIEWPORT_CONTENT;
				document.head.append(meta);
				this.#viewportMeta = meta;
			}
			/** The always-open phone layout expands the docked sidebar once when the
			*  viewport crosses into the mobile breakpoint (AppFrame auto-collapses
			*  it to the rail there). The request is idempotent: repeated calls while
			*  one expand is still in flight (mount sync pass, rAF pass, late frame)
			*  do not re-toggle. Seeing the frame actually expanded clears the pending
			*  request. A later manual collapse is left alone. */
			#ensureSidebarOpen = () => {
				if (!(this.#mql?.matches ?? false)) return;
				const frame = findFrame();
				if (frame === null) return;
				if (!frame.hasAttribute("data-sidebar-collapsed")) {
					this.#expandPending = false;
					return;
				}
				if (this.#expandPending) return;
				this.#expandPending = true;
				this.#options.toggleSidebar();
			};
			/** Scroll the pager to the chat page and mirror the resting page. */
			#placeOnChat = (behavior) => {
				const frame = findFrame();
				const mobile = this.#mql?.matches ?? false;
				if (frame === null || !mobile) return;
				const chatLeft = chatPageLeft(frame);
				if (chatLeft <= 0) return;
				if (Math.abs(frame.scrollLeft - chatLeft) > 2) frame.scrollTo({
					left: chatLeft,
					behavior
				});
				this.#mirrorPage(frame, "chat");
				this.#updateFlipVars(frame);
			};
			/** Mirror the page the pager is resting on (scroll position decides). */
			#mirrorPage = (frame, hint) => {
				const html = this.#html;
				if (html === null) return;
				const chatLeft = chatPageLeft(frame);
				const page = chatLeft <= 0 ? hint ?? "chat" : frame.scrollLeft < chatLeft / 2 ? "sidebar" : "chat";
				html.setAttribute(PAGE_ATTR, page);
			};
			/** State flips no longer drive the pager (the page is user-driven); an
			*  expand that landed just clears the pending always-open request. */
			#onFrameCollapseChange = () => {
				if (!findFrame()?.hasAttribute("data-sidebar-collapsed")) this.#expandPending = false;
			};
			#ensureFrameObserver = () => {
				if (this.#frameObserver !== null) return;
				const frame = findFrame();
				if (frame === null) return;
				this.#frameObserver = new MutationObserver(this.#onFrameCollapseChange);
				this.#frameObserver.observe(frame, {
					attributes: true,
					attributeFilter: ["data-sidebar-collapsed"]
				});
				frame.addEventListener("scroll", this.#onPagerScroll, { passive: true });
				this.#ensureSidebarOpen();
				this.#placeOnChat("auto");
			};
			/** Crossing the breakpoint: entering mobile re-expands the sidebar and
			*  places the pager on the chat page; leaving clears the 3D flip vars so
			*  the desktop layout renders flat. */
			#onBreakpointChange = () => {
				const mobile = this.#mql?.matches ?? false;
				const frame = findFrame();
				if (!mobile) {
					for (const prop of [
						"--dshm-rotate",
						"--dshm-scale",
						"--dshm-offset-x",
						"--dshm-origin-x"
					]) frame?.style.removeProperty(prop);
					this.#html?.removeAttribute(PAGE_ATTR);
					return;
				}
				this.#ensureSidebarOpen();
				this.#placeOnChat("auto");
			};
			/** Width reflow within one breakpoint side: keep the active page put and
			*  re-measure the model-name overflow (the row width drives it). Only a
			*  WIDTH change re-anchors — a height-only resize (OS keyboard pop, URL
			*  bar) must never scroll the pager, or it would cancel the smooth
			*  return-to-chat a session pick just started (the composer's focus
			*  landing pops the keyboard exactly then). */
			#onWindowResize = () => {
				if (this.#resizeTimer !== null) return;
				this.#resizeTimer = window.setTimeout(() => {
					this.#resizeTimer = null;
					const frame = findFrame();
					const mobile = this.#mql?.matches ?? false;
					if (frame === null || !mobile) return;
					const widthChanged = window.innerWidth !== this.#lastInnerWidth;
					this.#lastInnerWidth = window.innerWidth;
					this.#requestMarqueeSync();
					if (!widthChanged) return;
					const chatLeft = chatPageLeft(frame);
					if (chatLeft <= 0) return;
					const onChat = frame.scrollLeft >= chatLeft / 2;
					frame.scrollTo({
						left: onChat ? chatLeft : 0,
						behavior: "auto"
					});
					this.#mirrorPage(frame);
					this.#updateFlipVars(frame);
				}, 120);
			};
			/** Live pager driver: PiUI's 3D flip vars follow the scroll, and once the
			*  scroll settles the pager re-snaps to the nearest whole page (a
			*  short-of-page stop is nudged). The state is deliberately NOT synced —
			*  the sidebar stays expanded (always rendered), so a swipe merely parks
			*  the pager; the sidebar column never re-renders. */
			#onPagerScroll = () => {
				const frame = findFrame();
				const mobile = this.#mql?.matches ?? false;
				if (frame === null || !mobile) return;
				this.#updateFlipVars(frame);
				this.#mirrorPage(frame);
				if (this.#settleTimer !== null) window.clearTimeout(this.#settleTimer);
				this.#settleTimer = window.setTimeout(() => {
					this.#settleTimer = null;
					this.#settlePager();
				}, SCROLL_SETTLE_MS);
			};
			/** PiUI's flip: progress -1 (sidebar page) … 0 (chat page); the chat card
			*  rotates about the edge toward the swipe side and shrinks, so on the
			*  sidebar page it sinks away leaving only a sliver visible. */
			#updateFlipVars = (frame) => {
				const chatLeft = chatPageLeft(frame);
				if (chatLeft <= 0) return;
				const progress = Math.max(-1, Math.min(1, (frame.scrollLeft - chatLeft) / chatLeft));
				const abs = Math.abs(progress);
				const right = Math.max(0, progress);
				frame.style.setProperty("--dshm-rotate", `${progress * 10}deg`);
				frame.style.setProperty("--dshm-scale", `${1 - abs * .06}`);
				frame.style.setProperty("--dshm-offset-x", `${right * right * -48}px`);
				frame.style.setProperty("--dshm-origin-x", `${50 - progress * 50}%`);
			};
			#settlePager = () => {
				const frame = findFrame();
				const mobile = this.#mql?.matches ?? false;
				if (frame === null || !mobile) return;
				const chatLeft = chatPageLeft(frame);
				if (chatLeft <= 0) return;
				const left = frame.scrollLeft;
				const target = (left < chatLeft / 2 ? "sidebar" : "chat") === "sidebar" ? 0 : chatLeft;
				if (Math.abs(left - target) > 4) frame.scrollTo({
					left: target,
					behavior: "smooth"
				});
				this.#mirrorPage(frame);
			};
			/** Record every pointerdown (capture, passive) so the focus-in suppressor
			*  can distinguish the user's own tap on the composer from the app's
			*  automatic focus. */
			#onPointerDownCapture = (event) => {
				const target = event.target;
				this.#lastPointerTarget = target instanceof Element ? target : null;
				this.#lastPointerAt = Date.now();
			};
			/** During the post-pick window, bounce automatic focus out of the
			*  composer (the OS keyboard must not cover the return-to-chat). The
			*  user's OWN tap still focuses: a recent pointerdown on the same element
			*  (or inside it) means a real intent to type. */
			#onFocusInCapture = (event) => {
				if (Date.now() > this.#focusSuppressUntil) return;
				const target = event.target;
				if (!(target instanceof HTMLElement)) return;
				if (target.closest("[data-composer-card]") === null) return;
				const pointer = this.#lastPointerTarget;
				if (pointer !== null && Date.now() - this.#lastPointerAt < POINTER_ALLOW_MS && (pointer === target || target.contains(pointer))) return;
				target.blur();
			};
			/** A tap on the exposed chat card returns to the chat page (PiUI's
			*  overlay behavior: the exposed chat is not interactive while the
			*  sidebar page is showing). The sidebar's own collapse toggle is
			*  intercepted the same way: collapsing to the rail would unload the
			*  sidebar content, so it flips back to the chat page instead — the
			*  state (expanded) is never touched. */
			#onDocClickCapture = (event) => {
				const target = event.target;
				if (!(target instanceof Element)) return;
				const frame = findFrame();
				const mobile = this.#mql?.matches ?? false;
				if (frame === null || !mobile) return;
				const chatLeft = chatPageLeft(frame);
				if (chatLeft <= 0) return;
				const sidebarCol = frame.firstElementChild;
				if (sidebarCol instanceof Element && sidebarCol.contains(target)) {
					const btn = target.closest("button");
					if (btn !== null && SIDEBAR_COLLAPSE_LABELS.has(btn.getAttribute("aria-label") ?? "")) {
						event.preventDefault();
						event.stopPropagation();
						this.returnToChat();
						return;
					}
				}
				if (frame.scrollLeft >= chatLeft / 2) return;
				const chatCard = frame.children[1];
				if (chatCard instanceof Element && chatCard.contains(target)) this.returnToChat();
			};
			#onStatsTap = (event) => {
				if (!this.#mql?.matches) return;
				const target = event.target;
				if (!(target instanceof Element)) return;
				const dock = target.closest(COMPOSER_DOCK_SELECTOR);
				if (dock === null) return;
				const anchor = Array.from(dock.children).find((child) => child instanceof HTMLElement && child.getAttribute("role") !== "tooltip" && child.scrollWidth > child.clientWidth);
				if (!(anchor instanceof HTMLElement) || !anchor.contains(target)) return;
				if (dock.querySelector("[role=\"tooltip\"]") !== null) anchor.blur();
				else {
					anchor.tabIndex = -1;
					anchor.focus({ preventScroll: true });
				}
			};
			#requestKeyboard = () => {
				if (this.#keyboardFrame !== null) return;
				this.#keyboardFrame = requestAnimationFrame(() => {
					this.#keyboardFrame = null;
					this.#updateKeyboardInset();
				});
			};
			#updateKeyboardInset = () => {
				const html = this.#html;
				if (html === null) return;
				const vv = window.visualViewport;
				const inset = vv !== null && vv.height < window.innerHeight ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
				html.style.setProperty("--dshm-keyboard-inset", `${inset}px`);
			};
			/** Model-name marquee: re-measure on the next frame (mutation streams
			*  can fire every frame while tokens stream). */
			#requestMarqueeSync = () => {
				if (this.#marqueeFrame !== null) return;
				this.#marqueeFrame = requestAnimationFrame(() => {
					this.#marqueeFrame = null;
					this.#syncMarquee();
				});
			};
			/** Measure the model-name label: when the name overflows its capped
			*  width, wrap a DOUBLE copy of the text in a transform layer
			*  (data-dshm-marquee-runner) and tag the label with data-dshm-marquee
			*  + --dshm-marquee-duration — the CSS slides the runner by -50% (one
			*  text width + one MARQUEE_GAP) on the compositor and loops in ONE
			*  direction: the tail exits, a gap passes, then the head re-enters
			*  (classic spaced ticker; no alternate bounce). When the name fits —
			*  or motion is reduced — the runner is unwrapped (original nodes
			*  restored, clone dropped) and the stock ellipsis render returns. The
			*  label is re-resolved every time (the composer remounts with the
			*  session skeleton), and the ResizeObserver is re-hooked when it
			*  changes so pure layout squeezes (row width, font loads) re-trigger
			*  the measure. */
			#syncMarquee = () => {
				const label = document.querySelector(MODEL_LABEL_SELECTOR);
				if (label !== this.#marqueeLabel) {
					this.#marqueeRO?.disconnect();
					this.#marqueeLabel = label;
					if (label !== null) this.#marqueeRO?.observe(label);
				}
				if (label === null) return;
				const runner = label.firstElementChild !== null && label.firstElementChild.hasAttribute("data-dshm-marquee-runner") ? label.firstElementChild : null;
				const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
				if (label.scrollWidth - label.clientWidth > 0 && !reduceMotion) {
					if (runner === null) {
						const nodes = Array.from(label.childNodes);
						const layer = document.createElement("span");
						layer.setAttribute("data-dshm-marquee-runner", "");
						for (const node of nodes) {
							const item = document.createElement("span");
							item.setAttribute("data-dshm-marquee-item", "");
							item.append(node);
							layer.append(item);
						}
						for (const node of nodes) {
							const item = document.createElement("span");
							item.setAttribute("data-dshm-marquee-item", "");
							item.append(node.cloneNode(true));
							layer.append(item);
						}
						label.append(layer);
					}
					label.dataset.dshmMarquee = "";
					const textWidth = (label.scrollWidth - 64) / 2;
					label.style.setProperty("--dshm-marquee-duration", `${Math.max(5, Math.round((textWidth + MARQUEE_GAP_PX) / 50))}s`);
				} else {
					delete label.dataset.dshmMarquee;
					label.style.removeProperty("--dshm-marquee-duration");
					if (runner !== null) {
						const original = runner.firstElementChild?.firstChild ?? null;
						runner.remove();
						if (original !== null) label.append(original);
					}
				}
			};
		};
		//#endregion
		//#region \0dsh-raw-css:/var/home/chen/.dsh/profiles/web/plugins/dsh-mobile/src/client/mobile.css.mjs
		const css = "[data-dsh-mobile]{--dshm-safe-top:env(safe-area-inset-top,0px);--dshm-safe-right:env(safe-area-inset-right,0px);--dshm-safe-bottom:env(safe-area-inset-bottom,0px);--dshm-safe-left:env(safe-area-inset-left,0px);--dshm-keyboard-inset:0px;--dshm-sidebar-width:clamp(280px, 70vw, 360px);--dshm-rotate:0deg;--dshm-scale:1;--dshm-offset-x:0px;--dshm-origin-x:50% 50%;-webkit-tap-highlight-color:transparent}@media (width>=560px) and (width<=768px){[data-dsh-mobile]{--dshm-sidebar-width:clamp(360px, 50vw, 420px)}}[data-dsh-mobile] body{overscroll-behavior-y:none;-webkit-text-size-adjust:100%;text-size-adjust:100%}@supports (height:100dvh){[data-dsh-mobile] body{height:100dvh}}[data-dsh-mobile] body{height:100vh}[data-dsh-mobile] #root{height:100%}@media (width<=768px){[data-dsh-mobile] div[data-sidebar-collapsed],[data-dsh-mobile] div[data-details-collapsed]{overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none;overflow:auto hidden;grid-template-columns:var(--dshm-sidebar-width) 100% 0!important}[data-dsh-mobile] div[data-sidebar-collapsed]::-webkit-scrollbar,[data-dsh-mobile] div[data-details-collapsed]::-webkit-scrollbar{width:0;height:0;display:none}[data-dsh-mobile] div[data-sidebar-collapsed]>:nth-child(-n+2),[data-dsh-mobile] div[data-details-collapsed]>:nth-child(-n+2){scroll-snap-align:start;scroll-snap-stop:always}[data-dsh-mobile] div[data-sidebar-collapsed]>:first-child,[data-dsh-mobile] div[data-details-collapsed]>:first-child{background:var(--dsw-alias-bg-base);padding-top:var(--dshm-safe-top);border-right:none}[data-dsh-mobile] div[data-sidebar-collapsed]>:first-child>:first-child,[data-dsh-mobile] div[data-details-collapsed]>:first-child>:first-child,[data-dsh-mobile] div[data-sidebar-collapsed]>:first-child>:first-child>:first-child,[data-dsh-mobile] div[data-details-collapsed]>:first-child>:first-child>:first-child{background:0 0}[data-dsh-mobile] div[data-sidebar-collapsed]>:first-child div[style*=width],[data-dsh-mobile] div[data-details-collapsed]>:first-child div[style*=width]{min-width:100%}[data-dsh-mobile] div[data-sidebar-collapsed]>:nth-child(2),[data-dsh-mobile] div[data-details-collapsed]>:nth-child(2){background:var(--dsw-alias-bg-base);box-shadow:0 6px 28px color-mix(in srgb, var(--dsw-static-neutral-1000) 16%, transparent);transform:translate3d(var(--dshm-offset-x,0px), 0, 0) rotateY(var(--dshm-rotate,0deg)) scale(var(--dshm-scale,1));transform-origin:var(--dshm-origin-x,50% 50%);transform-style:preserve-3d;backface-visibility:hidden;will-change:transform;border:none;border-radius:16px;overflow:hidden}[data-dsh-mobile][data-dshm-page=chat] div[data-sidebar-collapsed]>:nth-child(2),[data-dsh-mobile][data-dshm-page=chat] div[data-details-collapsed]>:nth-child(2){box-shadow:none;border-radius:0}[data-dsh-mobile] div[data-sidebar-collapsed]>:first-child div:has(>[role=tree])>span,[data-dsh-mobile] div[data-details-collapsed]>:first-child div:has(>[role=tree])>span{display:none}[data-dsh-mobile] [data-side]{display:none!important}[data-dsh-mobile] [data-phase=active]>header{padding:calc(6px + var(--dshm-safe-top)) 8px 0 8px}[data-dsh-mobile] [data-phase]{--dsh-composer-side-clearance:12px}[data-dsh-mobile] [data-composer-seat]{padding-bottom:calc(var(--dshm-safe-bottom) + var(--dshm-keyboard-inset))}[data-dsh-mobile] [data-conversation-scroll]{scrollbar-gutter:auto}[data-dsh-mobile] [data-phase=active]>header button,[data-dsh-mobile] [data-composer-card] button,[data-dsh-mobile] [role=treeitem] button{min-height:36px}[data-dsh-mobile] [data-composer-card] div:has(>button[aria-haspopup=listbox]){gap:8px}[data-dsh-mobile] [data-composer-card]>div:last-child{flex-wrap:nowrap;gap:8px;position:relative}[data-dsh-mobile] [data-composer-card] [data-slot=\"conversation.input.model\"]>div{position:static}[data-dsh-mobile] [data-composer-card] button[aria-haspopup=listbox]{flex:none;width:36px;min-width:36px;height:36px}[data-dsh-mobile] [data-composer-card] button[aria-label*=访问模式],[data-dsh-mobile] [data-composer-card] button[aria-label*=Access\\ mode]{flex:none;justify-content:center;width:36px;min-width:36px;height:36px;padding:0}[data-dsh-mobile] [data-composer-card] button[aria-label*=访问模式]>span:not(:first-child),[data-dsh-mobile] [data-composer-card] button[aria-label*=Access\\ mode]>span:not(:first-child){display:none}[data-dsh-mobile] [data-composer-card] div:has(>[data-slot=\"conversation.input.model\"]){flex:0 auto;gap:8px;min-width:0}[data-dsh-mobile] [data-composer-card] [data-slot=\"conversation.input.model\"] button[aria-haspopup=menu]{flex:0 auto;min-width:0}[data-dsh-mobile] [data-composer-card] [data-slot=\"conversation.input.model\"] button[aria-haspopup=menu]>span:not(:first-child){text-overflow:ellipsis;white-space:nowrap;flex:0 auto;min-width:0;overflow:hidden}@media (width<=390px){[data-dsh-mobile] [data-composer-card] [data-slot=\"conversation.input.model\"] button[aria-haspopup=menu]>span:not(:first-child){display:none}}[data-dsh-mobile] [data-composer-card] div:has(>[data-slot=\"conversation.input.model\"])>:not([data-slot]){flex:none}[data-dsh-mobile] [data-composer-card] button[aria-haspopup=dialog]{width:36px;height:36px}[data-dsh-mobile] [data-composer-card] [aria-haspopup=dialog] svg{width:16px;height:16px}[data-dsh-mobile] [data-composer-card] div:has(>[data-slot=\"conversation.input.model\"])>button{width:36px;height:36px}[data-dsh-mobile] [data-composer-card] [role=dialog]{box-sizing:border-box;width:min(264px,100vw - 32px);max-width:calc(100vw - 32px)}[data-dsh-mobile] [data-composer-card] [data-slot=\"conversation.input.model\"] button[aria-haspopup=menu]>span:first-child{white-space:nowrap;text-overflow:ellipsis;min-width:0;overflow:hidden;transform:translateZ(0)}@container (width<=360px){[data-dsh-mobile] [data-composer-card] [data-slot=\"conversation.input.model\"] button[aria-haspopup=menu]>span:first-child{min-width:48px;max-width:96px}}[data-dsh-mobile] [data-composer-card] [data-slot=\"conversation.input.model\"] button[aria-haspopup=menu]>span:first-child>[data-dshm-marquee-runner]{white-space:nowrap;display:inline-block}[data-dsh-mobile] [data-composer-card] [data-slot=\"conversation.input.model\"] [data-dshm-marquee-runner]>[data-dshm-marquee-item]{white-space:nowrap;padding-right:32px;display:inline-block}[data-dsh-mobile] [data-composer-card] [data-slot=\"conversation.input.model\"] button[aria-haspopup=menu]>span:first-child[data-dshm-marquee]>[data-dshm-marquee-runner]{animation:dshm-marquee var(--dshm-marquee-duration,8s) linear infinite}[data-dsh-mobile] [data-composer-card] [data-slot=\"conversation.input.model\"] button[aria-haspopup=menu]>span:first-child[data-dshm-marquee]:hover>[data-dshm-marquee-runner]{animation-play-state:paused}@keyframes dshm-marquee{0%{transform:translate(0)}to{transform:translate(-50%)}}[data-dsh-mobile] section:has(>[data-question-scroll])>header h2,[data-dsh-mobile] [data-question-scroll]>div:not([role]){overscroll-behavior:contain;max-height:min(24vh,160px);overflow-y:auto}[data-dsh-mobile] [data-question-scroll]>[role=radiogroup],[data-dsh-mobile] [data-question-scroll]>[role=group]{flex:auto}[data-dsh-mobile] [data-turn-tail]>div:last-child>span:last-child{scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;flex:auto;min-width:0;max-width:100%;overflow:auto hidden}[data-dsh-mobile] [data-turn-tail]>div:last-child>span:last-child::-webkit-scrollbar{display:none}[data-dsh-mobile] [data-slot=\"conversation.composer.dock\"]>div:first-child{text-overflow:clip;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;overflow:auto hidden}[data-dsh-mobile] [data-slot=\"conversation.composer.dock\"]>div:first-child::-webkit-scrollbar{display:none}[data-dsh-mobile] [data-phase=active]>header ul[aria-label*=后台任务],[data-dsh-mobile] [data-phase=active]>header ul[aria-label*=Background\\ jobs]{left:auto;right:0}[data-dsh-mobile] [role=dialog]:has(>nav){border-radius:20px;flex-direction:column;width:min(560px,100vw - 32px);max-width:calc(100vw - 32px);height:min(720px,100vh - 32px);max-height:calc(100vh - 32px)}[data-dsh-mobile] [role=dialog]>nav{flex-direction:column;flex:none;gap:8px;width:100%;padding:14px 14px 0;overflow:hidden}[data-dsh-mobile] [role=dialog]>nav>div:first-child{padding:0 4px;font-size:15px;font-weight:500;line-height:22px}[data-dsh-mobile] [role=dialog]>nav>div:nth-child(2){scrollbar-width:none;-webkit-overflow-scrolling:touch;flex-direction:row;gap:6px;padding-bottom:4px;overflow:auto hidden}[data-dsh-mobile] [role=dialog]>nav>div:nth-child(2)::-webkit-scrollbar{display:none}[data-dsh-mobile] [role=dialog]>nav button{border-radius:999px;flex:none;gap:6px;width:auto;height:34px;padding:0 14px}[data-dsh-mobile] [role=dialog]:has(>nav)>div:last-child>div:first-child{z-index:2;background:0 0;border:none;align-items:center;gap:4px;height:32px;padding:0;display:flex;position:absolute;top:10px;right:14px}[data-dsh-mobile] [role=dialog]:has(>nav)>div:last-child>div:first-child+*{margin-top:0}[data-dsh-mobile] [role=dialog]:has(>nav)>div:last-child{flex:1;width:100%;min-height:0}[data-dsh-mobile] [role=dialog]:has(>nav)>div:last-child>div:last-child{padding:4px 16px 16px;overflow-y:auto}[data-dsh-mobile] [role=dialog]>:last-child:has(>button){box-sizing:border-box;width:100%;min-width:0;padding-left:24px;padding-right:24px}}@media (pointer:coarse){html[data-dsh-mobile],[data-dsh-mobile] *{scrollbar-width:none}html[data-dsh-mobile]::-webkit-scrollbar,[data-dsh-mobile] ::-webkit-scrollbar{width:0;height:0;display:none}}@media (prefers-reduced-motion:reduce){[data-dsh-mobile]{scroll-behavior:auto!important}[data-dsh-mobile] [data-slot=\"conversation.input.model\"] button[aria-haspopup=menu]>span:first-child>[data-dshm-marquee-runner]{animation:none!important}}";
		const tagId = "@dsh-external/dsh-mobile/mobile.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-mobile";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/index.ts
		/** Services required by the mobile plugin. */
		const inject = ["layout", "sessions"];
		/**
		* Install the mobile surfaces: the DOM controller (one effect). A
		* current-session change (a session picked from the sidebar page, or a new
		* session started) returns the pager to the chat page — list updates that
		* do not move `current` (running flags, titles) leave it alone.
		* @param ctx - Client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => {
				const controller = new MobileController({ toggleSidebar: () => ctx.layout.toggleSidebar() });
				controller.mount();
				let lastCurrent = ctx.sessions.list.getSnapshot().current;
				const off = ctx.sessions.list.subscribe(() => {
					const next = ctx.sessions.list.getSnapshot().current;
					if (next === lastCurrent) return;
					lastCurrent = next;
					controller.returnToChat();
				});
				return () => {
					off();
					controller.dispose();
				};
			}, "dsh-mobile: DOM controller");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
