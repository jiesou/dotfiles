//#region src/patch.ts
/**
* In-place patching of the delegation-tool definitions an agent actually
* resolves. Engine-coupled internals: the entry (`src/index.ts`) only wires
* them to plugin lifecycle, so nothing here is part of the published API.
*
* `subagent` / `subagent_fork` are registered by `@deepseek-ai/dsh-tool-subagent`
* through `defineTool`, so `parameters` is always the compiled
* `{ type: 'object', properties, required? }` shape. `tools.schemas()` reads
* `description` / `parameters` at projection time from the retained definition
* object, so mutating it in place reaches the model catalog and dispatch alike.
* A same-name shadow cannot: those rows land in the agent's own layer
* (`installScoped`) or in a preset standing layer, and `view()` applies the
* agent's own layer last and unconditionally. See decisions/.
*
* The lookup MUST pass the agent as `scope` — `tools.get(name)` reads the global
* view, which never sees a preset-layer tool; that omission was a silent no-op.
*/
const CONTINUABLE_TOOLS = ["subagent", "subagent_fork"];
const ONESHOT_TOOLS = ["subagent_codex", "subagent_claude_code"];
/**
* Every upstream sentence this plugin keys on, because `tool-subagent` bakes the
* mode into its own wording. `tests/engine.spec.ts` asserts each one still
* exists in the installed engine, so a reword fails loudly instead of silently.
*/
const UPSTREAM_WORDING = {
	/** Continuable tool description promises a subagent id the parent can continue. */
	continuableId: "It runs in the background by default and returns a subagent id you can continue with `send_message`",
	/** Continuable parameter defaults to true. */
	paramDefaultsTrue: "Defaults to true.",
	/** One-shot parameter defaults to false; one-shot mode has no background form. */
	paramDefaultsFalse: "Defaults to false",
	/** The description clause rewritten once the parameter is gone. */
	byDefault: "runs in the background by default"
};
/** What the description says once the parameter is gone. */
const BACKGROUND_ONLY = "always runs in the background";
const REFUSAL_MODE = "declaration is not backgroundMode: continuable (the description lacks the continuable sentence, or the parameter does not default to true); refusing to strip `run_in_background`, which would flip its default route to foreground";
const REFUSAL_WORDING = "the rewritten description would still name `run_in_background`, which the schema no longer declares; refusing to strip";
/**
* Marks a definition this plugin already judged, so repeated `tools/change`
* top-ups neither re-wrap `execute` nor re-report a refusal. `Symbol.for`, not a
* module-local symbol: HMR and duplicate module instances must agree.
*/
const JUDGED = Symbol.for("dsh-subagent-background-only/judged");
function propertiesOf(parameters) {
	const properties = parameters?.properties;
	return typeof properties === "object" && properties !== null ? properties : void 0;
}
/**
* Whether this declaration is `backgroundMode: continuable`, judged from the
* wording `tool-subagent` itself emits. Both signals must agree: the tool
* description advertises a continuable id, and the parameter says it defaults
* true.
*/
function isContinuableDeclaration(definition) {
	const description = typeof definition.description === "string" ? definition.description : "";
	const param = propertiesOf(definition.parameters)?.["run_in_background"];
	const paramDescription = typeof param?.description === "string" ? param.description : "";
	if (paramDescription.includes(UPSTREAM_WORDING.paramDefaultsFalse)) return false;
	return description.includes(UPSTREAM_WORDING.continuableId) && paramDescription.includes(UPSTREAM_WORDING.paramDefaultsTrue);
}
/**
* The description with the "by default" clause rewritten, or `undefined` when
* the result would still name `run_in_background` — the schema is about to drop
* it, and the `false`-teaching now lives in the parameter's own description,
* which disappears with the parameter. Detection and edit must not diverge: a
* description that names the parameter anyway must refuse the strip.
*/
function backgroundDescription(description) {
	const rewritten = description.replaceAll(UPSTREAM_WORDING.byDefault, BACKGROUND_ONLY);
	return rewritten.includes("run_in_background") ? void 0 : rewritten;
}
/**
* Patch one resolved definition in place: schema loses `run_in_background`,
* the description stops teaching `false`, and `execute` forces it to `true`.
*
* Idempotent via {@link JUDGED}. Refuses a definition that is not continuable,
* or whose rewritten description would still name the parameter.
*/
function patchDefinition(definition) {
	if (definition[JUDGED] === true) return { patched: false };
	const outcome = adjudicate(definition);
	definition[JUDGED] = true;
	return outcome;
}
/** The verdict, reported once per object by {@link patchDefinition}. */
function adjudicate(definition) {
	const parameters = definition.parameters;
	const properties = propertiesOf(parameters);
	if (properties === void 0 || !("run_in_background" in properties)) return { patched: false };
	if (!isContinuableDeclaration(definition)) return {
		patched: false,
		reason: REFUSAL_MODE
	};
	const description = backgroundDescription(definition.description);
	if (description === void 0) return {
		patched: false,
		reason: REFUSAL_WORDING
	};
	delete properties["run_in_background"];
	if (parameters !== void 0 && Array.isArray(parameters.required)) parameters.required = parameters.required.filter((key) => key !== "run_in_background");
	definition.description = description;
	const original = definition.execute;
	definition.execute = (args, exec) => original({
		...args,
		run_in_background: true
	}, exec);
	return { patched: true };
}
/** Patch every continuable delegation tool this agent resolves. */
function patchAgentTools(agent, warn) {
	let patched = 0;
	for (const toolName of CONTINUABLE_TOOLS) {
		let definition;
		try {
			definition = agent.ctx.tools.get(toolName, agent);
		} catch (error) {
			warn(`${toolName}: tools.get failed for agent ${agent.id}: ${String(error)}`);
			continue;
		}
		if (definition === void 0) continue;
		try {
			const outcome = patchDefinition(definition);
			if (outcome.patched) patched += 1;
			else if (outcome.reason !== void 0) warn(`${toolName}: ${outcome.reason}`);
		} catch (error) {
			warn(`${toolName}: patch failed: ${String(error)}`);
		}
	}
	return patched;
}
//#endregion
//#region src/index.ts
/**
* dsh-subagent-background-only — only expose background subagents.
*
* The model never sees `run_in_background`: the delegation-tool definition each
* agent resolves is mutated in place (src/patch.ts), and one-shot delegation
* tools are denied outright. See decisions/ for why a same-name shadow cannot
* reach it.
*/
const name = "subagent-background-only";
const inject = ["agents", "tools"];
function apply(ctx) {
	const warn = (message) => {
		ctx.logger.warn(`${name}: ${message}`);
		console.warn(`[${name}] ${message}`);
	};
	const report = (message) => {
		ctx.logger.info(`${name}: ${message}`);
		console.info(`[${name}] ${message}`);
	};
	const patchAgents = (label, agents) => {
		let patched = 0;
		for (const agent of agents) patched += patchAgentTools(agent, warn);
		if (patched > 0) report(`${label}: stripped run_in_background from ${patched} delegation tool(s)`);
	};
	ctx.tools.guard((exec) => ONESHOT_TOOLS.includes(exec.name) ? `"${exec.name}" one-shot run denied by ${name}: delegate with background subagent only` : void 0);
	patchAgents("mount", ctx.agents.list());
	ctx.on("agent/created", ({ agent }) => patchAgents("agent/created", [agent]));
	ctx.on("tools/change", () => patchAgents("tools/change", ctx.agents.list()));
	report(`active: continuable delegation tools (${CONTINUABLE_TOOLS.join(", ")}) lose the run_in_background parameter and always run in background; one-shot declarations are left untouched with a warning; one-shot delegation tools (${ONESHOT_TOOLS.join(", ")}) are denied`);
}
//#endregion
export { apply, inject, name };
