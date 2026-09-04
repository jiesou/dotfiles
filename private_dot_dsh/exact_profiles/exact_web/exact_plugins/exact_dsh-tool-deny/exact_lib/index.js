//#region src/index.ts
const name = "tool-deny";
const inject = [
	"agents",
	"timer",
	"tools"
];
const RECONCILE_DEBOUNCE_MS = 300;
/**
* Names quoted in a `tools.restrict()` unknown-global-tool error.
* Returns undefined when the message is a different failure.
*/
function parseUnknownTools(message) {
	const match = /unknown global tools? (.*?); known global tools:/s.exec(message);
	if (!match) return void 0;
	return [...match[1].matchAll(/"([^"]+)"/g)].map((hit) => hit[1]).filter(Boolean);
}
function apply(ctx, config = {}) {
	const log = {
		info: (msg) => {
			ctx.logger.info(msg);
			console.info(`[tool-deny] ${msg}`);
		},
		warn: (msg) => {
			ctx.logger.warn(msg);
			console.warn(`[tool-deny] ${msg}`);
		},
		error: (msg) => {
			ctx.logger.error(msg);
			console.error(`[tool-deny] ${msg}`);
		}
	};
	const denyTools = (Array.isArray(config.denyTools) ? config.denyTools : []).map((tool) => String(tool).trim()).filter(Boolean);
	if (denyTools.length === 0) {
		log.warn("`denyTools` is empty — nothing to deny (add tool names via the profile patch row)");
		return;
	}
	/** Per-agent state: masked-so-far subset + active mask layers. */
	const states = /* @__PURE__ */ new WeakMap();
	/** Missing sets already warned about — each distinct set logs exactly once. */
	const warnedMissing = /* @__PURE__ */ new Set();
	let reconcileTimer;
	let closed = false;
	const knownGlobalTools = () => {
		try {
			return ctx.tools.view(void 0).restrictableNames ?? /* @__PURE__ */ new Set();
		} catch {
			return /* @__PURE__ */ new Set();
		}
	};
	const adopt = (agent, known) => {
		let state = states.get(agent);
		if (!state) {
			state = {
				masked: /* @__PURE__ */ new Set(),
				lifts: []
			};
			states.set(agent, state);
		}
		const pending = denyTools.filter((tool) => !state.masked.has(tool));
		if (pending.length === 0) return [];
		const available = pending.filter((tool) => known.has(tool));
		if (available.length === 0) return [];
		const maskNow = (names) => {
			if (names.length === 0) return true;
			try {
				state.lifts.push(agent.ctx.tools.restrict({ deny: names }));
				for (const tool of names) state.masked.add(tool);
				return true;
			} catch {
				return false;
			}
		};
		if (maskNow(available)) return available;
		try {
			agent.ctx.tools.restrict({ deny: available });
			return [];
		} catch (error) {
			const message = String(error?.message ?? error);
			if (!message.includes("unknown global tool")) {
				log.error(`failed to mask agent ${agent.id}: ${message}`);
				return [];
			}
			const unknown = new Set(parseUnknownTools(message) ?? available);
			const knownPart = available.filter((tool) => !unknown.has(tool));
			if (maskNow(knownPart)) {
				scheduleReconcile();
				return knownPart;
			}
			scheduleReconcile();
			return [];
		}
	};
	const reconcile = () => {
		if (closed) return;
		const known = knownGlobalTools();
		const newlyMasked = /* @__PURE__ */ new Set();
		let maskedAgents = 0;
		for (const agent of ctx.agents.list()) {
			const masked = adopt(agent, known);
			if (masked.length > 0) {
				maskedAgents += 1;
				for (const tool of masked) newlyMasked.add(tool);
			}
		}
		if (newlyMasked.size > 0) log.info(`masked ${[...newlyMasked].sort().join(", ")} from ${maskedAgents} agent(s)`);
		const missing = denyTools.filter((tool) => !known.has(tool));
		if (missing.length > 0) {
			const key = missing.slice().sort().join("\n");
			if (!warnedMissing.has(key)) {
				warnedMissing.add(key);
				log.warn(`tools ${missing.join(", ")} not registered (MCP server disabled or not yet discovered?) — tracking registry events, will mask on arrival.`);
			}
		}
	};
	const scheduleReconcile = () => {
		if (closed || reconcileTimer !== void 0) return;
		reconcileTimer = ctx.setTimeout(() => {
			reconcileTimer = void 0;
			reconcile();
		}, RECONCILE_DEBOUNCE_MS);
	};
	ctx.effect(() => {
		const denySet = new Set(denyTools);
		const unguard = ctx.tools.guard((exec) => denySet.has(exec.name) ? `tool-deny: "${exec.name}" is denied by denyTools` : void 0);
		reconcile();
		const stopCreated = ctx.on("agent/created", () => reconcile());
		const stopChanged = ctx.on("tools/change", () => scheduleReconcile());
		return () => {
			closed = true;
			stopCreated();
			stopChanged();
			unguard();
			if (reconcileTimer !== void 0) {
				ctx.clearTimeout(reconcileTimer);
				reconcileTimer = void 0;
			}
			for (const agent of ctx.agents.list()) {
				const state = states.get(agent);
				if (!state) continue;
				for (const lift of state.lifts.splice(0)) try {
					lift();
				} catch {}
			}
		};
	}, "tool-deny.lifecycle()");
}
//#endregion
export { apply, inject, name, parseUnknownTools };
