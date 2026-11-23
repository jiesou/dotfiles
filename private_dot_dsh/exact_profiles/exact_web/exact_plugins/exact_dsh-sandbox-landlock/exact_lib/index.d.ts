import { Context } from "@deepseek-ai/cordis";
//#region src/index.d.ts
interface Config {
  devicePaths?: string[];
  launcherPath?: string;
}
declare const name = "dsh-sandbox-landlock";
declare function apply(ctx: Context, config?: Config): Promise<void>;
declare const _default: {
  name: string;
  apply: typeof apply;
};
//#endregion
export { apply, _default as default, name };