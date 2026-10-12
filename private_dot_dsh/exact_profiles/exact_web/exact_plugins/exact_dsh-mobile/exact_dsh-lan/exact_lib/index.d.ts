//#region src/index.d.ts
interface WebServerCtx {
  effect(fn: () => unknown, label: string): unknown;
  webServer: {
    tapIndex(tap: (html: string) => string): unknown;
  };
}
declare const name = "lan-secure-context";
declare const inject: string[];
declare function apply(ctx: WebServerCtx): void;
//#endregion
export { apply, inject, name };