import { existsSync, globSync, statSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
//#region src/index.ts
function expandHome(dir) {
	if (dir === "~") return homedir();
	if (dir.startsWith("~/")) return join(homedir(), dir.slice(2));
	return dir;
}
function writableRoots(paths) {
	const seen = /* @__PURE__ */ new Set();
	const roots = [];
	for (const raw of paths) {
		if (!raw) continue;
		const path = expandHome(raw);
		const key = path.replace(/\/+$/, "") || "/";
		if (seen.has(key)) continue;
		seen.add(key);
		if (existsSync(path)) roots.push(path);
	}
	return roots;
}
function resolveDevices(patterns) {
	return patterns.flatMap((pattern) => {
		try {
			return globSync(expandHome(pattern)).filter((path) => !isDirectory(path));
		} catch {
			return [];
		}
	});
}
function isDirectory(path) {
	try {
		return statSync(path).isDirectory();
	} catch {
		return false;
	}
}
const SEAM_SPECIFIER = "@deepseek-ai/node-addon-system/landlock-run";
async function importSeam() {
	try {
		return await import(SEAM_SPECIFIER);
	} catch (error) {
		throw new Error(`dsh-sandbox-landlock: cannot load ${SEAM_SPECIFIER}: ${error instanceof Error ? error.message : String(error)}`);
	}
}
function grantFlags(seam, policy, devicePaths) {
	const readWrite = policy.mode === "workspace-write" ? [
		"/dev/null",
		"/tmp",
		policy.workspaceRoot,
		...policy.additionalWritableRoots ?? [],
		...resolveDevices(devicePaths)
	] : ["/dev/null"];
	return seam.grantArgs({
		readOnly: ["/"],
		readWrite: writableRoots(readWrite)
	});
}
const name = "dsh-sandbox-landlock";
async function apply(ctx, config = {}) {
	if (platform() !== "linux") return;
	let seam;
	try {
		seam = await importSeam();
	} catch (error) {
		console.warn(`dsh-sandbox-landlock: ${error instanceof Error ? error.message : String(error)}; sandbox disabled`);
		return;
	}
	const launcher = config.launcherPath ? expandHome(config.launcherPath) : seam.launcherPath();
	const verdict = seam.probe(launcher);
	if (verdict === "unusable") {
		console.warn(`dsh-sandbox-landlock: landlock-run functional probe unusable (${launcher}); sandbox disabled`);
		return;
	}
	const devicePaths = config.devicePaths ?? [];
	ctx.provide("sandbox", { confine(commandArgv, policy) {
		return {
			argv: [
				launcher,
				...grantFlags(seam, policy, devicePaths),
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
export { apply, src_default as default, name };
