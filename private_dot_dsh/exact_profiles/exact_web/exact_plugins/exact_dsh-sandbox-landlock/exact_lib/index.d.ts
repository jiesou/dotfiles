import { Context } from "@deepseek-ai/cordis";
//#region src/index.d.ts
interface Config {
  writeDirs?: string[];
  devicePaths?: string[];
  launcherPath?: string;
  cwd?: string;
  diffBasisMaxBytes?: number;
}
interface PluginCtx {
  provide(id: string, service: unknown): void;
  plugin?: (plugin: unknown, config?: unknown) => unknown;
}
declare function normalizeDirs(dirs?: readonly string[]): string[];
declare const name = "dsh-sandbox-landlock";
declare function apply(ctx: Context | PluginCtx, config?: Config): Promise<void>;
declare const _default: {
  name: string;
  apply: typeof apply;
};
//#endregion
export { apply, _default as default, name, normalizeDirs };