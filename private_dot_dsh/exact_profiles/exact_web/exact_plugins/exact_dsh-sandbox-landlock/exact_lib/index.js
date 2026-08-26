import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import { argv } from "node:process";
//#region src/index.ts
function expandHome(dir) {
	if (dir === "~") return homedir();
	if (dir.startsWith("~/")) return join(homedir(), dir.slice(2));
	return dir;
}
function normalizeDirs(dirs = []) {
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const raw of dirs) {
		if (!raw) continue;
		const expanded = expandHome(raw);
		const key = expanded.replace(/\/+$/, "") || "/";
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(expanded);
	}
	return result;
}
const SEAM_RELATIVE = join("node_modules", "@deepseek-ai", "node-addon-landlock-run", "lib", "index.js");
async function importSeam() {
	const candidates = [];
	if (argv[1]) candidates.push(join(dirname(dirname(argv[1])), SEAM_RELATIVE));
	const globalRoot = spawnSync("npm", ["root", "-g"], { encoding: "utf8" }).stdout?.trim();
	if (globalRoot) candidates.push(join(globalRoot, "@deepseek-ai", "dsh", SEAM_RELATIVE));
	const found = candidates.find((path) => existsSync(path));
	if (!found) throw new Error("dsh-sandbox-landlock: node-addon-landlock-run seam not found next to the dsh install");
	return import(found);
}
function grantFlags(seam, policy, writeDirs) {
	const readWrite = policy.mode === "workspace-write" ? [
		"/dev/null",
		"/tmp",
		policy.workspaceRoot,
		...writeDirs
	] : ["/dev/null"];
	return seam.grantArgs({
		readOnly: ["/"],
		readWrite: normalizeDirs(readWrite)
	});
}
const name = "dsh-sandbox-landlock";
async function apply(ctx, config = {}) {
	if (platform() !== "linux") return;
	const seam = await importSeam();
	const launcher = config.launcherPath ? expandHome(config.launcherPath) : seam.launcherPath();
	const verdict = seam.probe(launcher);
	if (verdict === "unusable") throw new Error(`dsh-sandbox-landlock: landlock-run functional probe unusable (${launcher})`);
	const writeDirs = normalizeDirs(config.writeDirs ?? []);
	ctx.provide("sandbox", { confine(commandArgv, policy) {
		return {
			argv: [
				launcher,
				...grantFlags(seam, policy, writeDirs),
				"--",
				...commandArgv
			],
			enforcement: verdict,
			denialSignatures: ["permission denied"],
			runnerFailureRules: [{
				allowedExitCodes: [seam.LAUNCHER_FAILURE_EXIT],
				fatalSignatures: [`${seam.LAUNCHER_BIN}: `],
				informationalLines: [`${seam.LAUNCHER_BIN}: partial enforcement (older Landlock ABI)`]
			}]
		};
	} });
}
var src_default = {
	name,
	apply
};
//#endregion
export { apply, src_default as default, name, normalizeDirs };
