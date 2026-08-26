//#region src/index.d.ts
interface PluginCtx {
  provide(id: string, service: unknown): void;
}
interface Config {
  writeDirs?: string[];
  launcherPath?: string;
}
declare function normalizeDirs(dirs?: readonly string[]): string[];
declare const name = "dsh-sandbox-landlock";
declare function apply(ctx: PluginCtx, config?: Config): Promise<void>;
declare const _default: {
  name: string;
  apply: typeof apply;
};
//#endregion
export { apply, _default as default, name, normalizeDirs };