//#region src/index.ts
const name = "tool-deny";
const inject = ["agents", "timer"];
const MAX_RETRIES = 10;
const RETRY_BASE_MS = 500;
const RETRY_CAP_MS = 3e4;
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
	/** Per-agent state: active mask disposer + pending retry timer. */
	const states = /* @__PURE__ */ new WeakMap();
	const clearRetry = (state) => {
		if (state.retry !== void 0) {
			ctx.clearTimeout(state.retry);
			state.retry = void 0;
		}
	};
	const teardown = (state) => {
		clearRetry(state);
		if (state.lift !== void 0) {
			try {
				state.lift();
			} catch {}
			state.lift = void 0;
		}
	};
	const install = (agent, state) => {
		try {
			state.lift = agent.ctx.tools.restrict({ deny: denyTools });
			clearRetry(state);
			const retries = state.attempts ?? 0;
			log.info(`masked ${denyTools.join(", ")} from agent ${agent.id}` + (retries > 0 ? ` (after ${retries} retr${retries === 1 ? "y" : "ies"})` : ""));
		} catch (error) {
			const message = String(error?.message ?? error);
			if (!message.includes("unknown global tool")) {
				clearRetry(state);
				log.error(`failed to mask agent ${agent.id}: ${message}`);
				return;
			}
			const attempts = (state.attempts ?? 0) + 1;
			state.attempts = attempts;
			if (attempts === 1) log.warn(`tools ${denyTools.join(", ")} not registered yet for agent ${agent.id}; retrying (up to ${MAX_RETRIES} times)…`);
			if (attempts > MAX_RETRIES) {
				clearRetry(state);
				log.error(`gave up denying ${denyTools.join(", ")} from agent ${agent.id} after ${MAX_RETRIES} retries — these tools never registered. Every name in denyTools must match a live tool; a disabled MCP server's tools will never appear. Missing: ${denyTools.join(", ")}.`);
				return;
			}
			if (state.retry === void 0) {
				const delay = Math.min(RETRY_BASE_MS * 2 ** (attempts - 1), RETRY_CAP_MS);
				state.retry = ctx.setTimeout(() => {
					state.retry = void 0;
					install(agent, state);
				}, delay);
			}
		}
	};
	const adopt = (agent) => {
		if (states.has(agent)) return;
		const state = {};
		states.set(agent, state);
		install(agent, state);
	};
	ctx.effect(() => {
		for (const agent of ctx.agents.list()) adopt(agent);
		const stop = ctx.on("agent/created", ({ agent }) => adopt(agent));
		return () => {
			stop();
			for (const agent of ctx.agents.list()) {
				const state = states.get(agent);
				if (state) teardown(state);
			}
		};
	}, "tool-deny.lifecycle()");
}
//#endregion
export { apply, inject, name };
