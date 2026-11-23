import { realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
// src/locales.ts
/** Approval-card copy for a writable-directory request; the audit reason stays English. */
/** English approval text. */
const en = { grant: (directory) => `Allow writes under ${directory} for this session?` };
/** Chinese approval text. */
const zh = { grant: (directory) => `允许本会话写入 ${directory}？` };
/**
* Build the approval's localized presentation text for the Client's locale resolver.
* @param directory - absolute directory the session would gain write access to.
* @returns one entry per supported locale; the Client falls back to `en`.
*/
function grantDisplayReason(directory) {
	return {
		en: en.grant(directory),
		zh: zh.grant(directory)
	};
}
// src/policy-text.ts
/**
* Keep the model's runtime context free of the deployment's directory list.
*
* `dsh-sandbox-policy` writes `Additional writable directories: [...]` into the
* per-step policy line. That list is machine configuration, not a decision the
* model has to make, and it repeats every step. The policy line itself
* (mode + workspace) stays.
*
* The removal is anchored, not a bare `indexOf`:
* - the text must be the workspace-write policy line this plugin knows;
* - the marker must directly follow the JSON workspace string (`".`), so a
*   directory whose name contains the marker cannot hijack it;
* - the clause must start a JSON array, must end in the known tail sentence at
*   the very end of the line, and must stay under a size bound;
* - anything unexpected leaves the text untouched, so a rewording upstream
*   keeps the list rather than cutting the wrong bytes.
*/
const PREFIX = "Current DSH file policy: workspace-write. ";
const MARKER = " Additional writable directories: ";
const TAIL = " Some platform temporary areas may also be writable.";
const MAX_CLAUSE_BYTES = 8192;
/**
* Remove the additional-directories clause from one policy line.
* @param text - the rendered `sandbox:policy` context.
* @returns the line without the clause; unchanged when any anchor fails.
*/
function stripAdditionalRoots(text) {
	if (!text.startsWith(PREFIX) || !text.endsWith(TAIL)) return text;
	let start = text.indexOf(MARKER);
	while (start >= 0) {
		if (text.slice(0, start).endsWith("\".") && text[start + 34] === "[") break;
		start = text.indexOf(MARKER, start + 1);
	}
	if (start < 0) return text;
	const tailStart = text.lastIndexOf(TAIL);
	if (tailStart <= start || tailStart - start > MAX_CLAUSE_BYTES) return text;
	return `${text.slice(0, start)}${text.slice(tailStart)}`;
}
// src/tolerate.ts
/**
* Tolerant reading of the escalation arguments models get wrong most often.
*
* The stock tools validate `sandbox_permissions` / `justification` strictly and
* throw before anything runs: a stray justification, a missing one, a target
* that is not strictly wider. None of those errors protect anything — the call
* would simply have run under the current mode — so this plugin rewrites the
* two permission fields and lets the call proceed.
*/
/** Tools whose schema carries the escalation pair. */
const ESCALATION_TOOLS = /* @__PURE__ */ new Set([
	"bash",
	"pwsh",
	"write",
	"edit"
]);
/** The closed sandbox-mode vocabulary; anything else stays the model's error. */
const KNOWN_MODES = /* @__PURE__ */ new Set([
	"read-only",
	"workspace-write",
	"danger-full-access"
]);
/** Strictly wider targets per effective mode, mirroring the harness table. */
const WIDER_MODES = {
	"read-only": ["workspace-write", "danger-full-access"],
	"workspace-write": ["danger-full-access"]
};
/** Stand-in reason for a widening request that carried none. */
const DEFAULT_JUSTIFICATION = "Agent did not attach a justification.";
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
* Rewrite the permission fields of one tool call.
* @param name - tool name.
* @param raw - parsed arguments, untouched.
* @param mode - the call's effective sandbox mode.
* @returns replacement arguments, or undefined when nothing needs rewriting.
*/
function normalizePermissionArgs(name, raw, mode) {
	if (!ESCALATION_TOOLS.has(name) || !isRecord(raw)) return void 0;
	const hasMode = typeof raw.sandbox_permissions === "string" && raw.sandbox_permissions.length > 0;
	const hasJustification = typeof raw.justification === "string" && raw.justification.trim().length > 0;
	if (!hasMode) {
		if (raw.justification === void 0) return void 0;
		const { justification: _drop, ...rest } = raw;
		return rest;
	}
	const target = raw.sandbox_permissions;
	if (!KNOWN_MODES.has(target)) return void 0;
	if (!(WIDER_MODES[mode] ?? []).includes(target)) {
		const { sandbox_permissions: _mode, justification: _reason, ...rest } = raw;
		return rest;
	}
	if (hasJustification) return void 0;
	return {
		...raw,
		justification: DEFAULT_JUSTIFICATION
	};
}
// src/index.ts
const name = "dsh-sandbox-better";
const inject = ["tools", "sandboxPolicy"];
const TOOL_NAME = "request_write_access";
function resolveMode(ctx, session) {
	try {
		if (session === void 0) return "workspace-write";
		return ctx.get("sandboxPolicy").resolve({ session }).mode;
	} catch {
		return "workspace-write";
	}
}
/** Expand `~`, anchor relative paths at the session workspace, and resolve symlinks. */
function resolveDirectory(session, input) {
	const raw = input.trim();
	if (raw === "") throw new Error(`${TOOL_NAME}: a directory is required`);
	const expanded = raw === "~" ? homedir() : raw.startsWith("~/") ? join(homedir(), raw.slice(2)) : raw;
	const base = session.header.cwd ?? process.cwd();
	const absolute = isAbsolute(expanded) ? expanded : resolve(base, expanded);
	let stats;
	try {
		stats = statSync(absolute);
	} catch {
		throw new Error(`${TOOL_NAME}: "${raw}" does not exist`);
	}
	if (!stats.isDirectory()) throw new Error(`${TOOL_NAME}: "${raw}" is not a directory`);
	return realpathSync(absolute);
}
/** Writable directories that can actually be enforced; a missing one would reject the whole policy. */
function reachableDirectories(paths) {
	return paths.filter((path) => {
		try {
			return statSync(path).isDirectory();
		} catch {
			return false;
		}
	});
}
/** Drop configured writable directories that no longer exist, restoring the list when the effect unloads. */
function ignoreMissingRoots(policy) {
	const roots = policy.additionalWritableRoots;
	if (roots === void 0) return () => {};
	const reachable = reachableDirectories(roots);
	if (reachable.length === roots.length) return () => {};
	const descriptor = Object.getOwnPropertyDescriptor(policy, "additionalWritableRoots");
	Object.defineProperty(policy, "additionalWritableRoots", {
		...descriptor,
		value: Object.freeze(reachable)
	});
	for (const root of roots) if (!reachable.includes(root)) console.warn(`[sandbox-better] ignoring missing writable directory ${JSON.stringify(root)}`);
	return () => {
		if (descriptor === void 0) delete policy.additionalWritableRoots;
		else Object.defineProperty(policy, "additionalWritableRoots", descriptor);
	};
}
/**
* Re-apply the deployment-list strip to refreshed runtime contexts.
*
* `systemPrompt.refreshContext()` re-resolves every context provider before
* each attempt, discarding what the `system-prompt/assemble` waterfall wrote,
* so the strip has to sit on the refresh path the model input actually uses.
*/
function stripRefreshedContexts(prompt) {
	const original = prompt.refreshContext;
	if (typeof original !== "function") return () => {};
	const patched = function stripped(assembly, context) {
		const refreshed = original.call(this, assembly, context);
		for (const entry of refreshed.contexts) if (entry.name === "sandbox:policy") entry.text = stripAdditionalRoots(entry.text);
		return refreshed;
	};
	prompt.refreshContext = patched;
	return () => {
		if (prompt.refreshContext === patched) prompt.refreshContext = original;
	};
}
function toolDefinition(host) {
	return {
		name: TOOL_NAME,
		description: "Call this after \"file access denied\", then retry command. The request will asks the user for approval. Under workspace-write mode, everything else is read-only, so use this to precisely obtain write access. ",
		parameters: { path: {
			type: "string",
			description: "Directory, absolute or relative to the workspace."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				required: ["path"],
				properties: { path: { type: "string" } }
			},
			render: (_args, value) => [{
				type: "text",
				text: `${value.path} is writable for this session.`
			}]
		},
		async execute(args, exec) {
			const agent = exec.agent;
			if (agent === void 0) throw new Error(`${TOOL_NAME}: this call has no session to request access for`);
			const path = args.path?.trim() ?? "";
			if (path === "") throw new Error(`${TOOL_NAME}: path is required`);
			const dir = resolveDirectory(agent.session, path);
			const approval = host.approval;
			if (approval === void 0) throw new Error(`${TOOL_NAME}: this composition has no approval service`);
			let outcome;
			try {
				outcome = await approval.request({
					agent,
					toolName: TOOL_NAME,
					...exec.callId === void 0 ? {} : { callId: exec.callId },
					reason: `Allow writes under ${dir} for this session?`,
					displayReason: grantDisplayReason(dir),
					...exec.signal === void 0 ? {} : { signal: exec.signal }
				});
			} catch (error) {
				const reason = error instanceof Error ? error.message : String(error);
				throw new Error(`${TOOL_NAME}: the approval request failed: ${reason}`);
			}
			if (outcome !== "allowed-once") throw new Error(`${TOOL_NAME}: the user did not allow writes under ${dir} (${outcome})`);
			host.sandboxPolicy.registerWritableRoot(agent.session, dir);
			return { path: dir };
		}
	};
}
/** Register the request tool. */
function registerRequestTool(host) {
	const register = () => {
		const tools = host.tools;
		if (tools === void 0) return () => {};
		return tools.register(toolDefinition(host), { when: ({ agent }) => host.modeOf?.(agent) !== "danger-full-access" });
	};
	if (host.effect === void 0) {
		register();
		return;
	}
	host.effect(register, "sandbox-better permission requests");
}
/**
* Mount the request tool and the tolerant reading of the escalation arguments. Nothing here belongs to one sandbox backend: the
* writable directory is a `sandbox-policy` registration, so it lands on every
* provider.
*/
function apply(ctx) {
	const on = ctx.on.bind(ctx);
	registerRequestTool({
		get sandboxPolicy() {
			return ctx.get("sandboxPolicy");
		},
		get approval() {
			return ctx.get("approval");
		},
		get tools() {
			return ctx.get("tools");
		},
		modeOf: (agent) => resolveMode(ctx, agent.session),
		effect: (callback, label) => ctx.effect(callback, label)
	});
	ctx.effect(() => ignoreMissingRoots(ctx.get("sandboxPolicy")), "sandbox-better: reachable writable directories");
	ctx.inject(["systemPrompt"], (scope) => {
		scope.effect(() => stripRefreshedContexts(scope.get("systemPrompt")), "sandbox-better: trimmed policy context");
	});
	on("tools/pre-execute", (exec, next) => {
		try {
			const normalized = normalizePermissionArgs(exec.name, exec.arguments, resolveMode(ctx, exec.agent?.session));
			if (normalized !== void 0) exec.arguments = normalized;
		} catch {}
		return next();
	});
}
var src_default = {
	name,
	apply,
	inject
};
export { TOOL_NAME, apply, src_default as default, ignoreMissingRoots, inject, name, reachableDirectories, registerRequestTool, resolveDirectory, stripRefreshedContexts };
