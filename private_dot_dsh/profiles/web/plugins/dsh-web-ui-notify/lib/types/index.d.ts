/** Plugin name (= the config entry id). */
export declare const name = "dsh-web-ui-notify";
/** Host services this node half uses. */
export declare const inject: string[];
/** Node-half configuration (cordis patch may override). */
export interface Config extends Record<string, any> {
    /** Tool-call threshold per turn before a "long task" completion push (default 7). */
    longTaskToolCalls?: number;
    /** Web Push VAPID keys (generated + persisted when absent). */
    vapidPublicKey?: string;
    vapidPrivateKey?: string;
}
export declare function apply(ctx: any, config?: Config): void;
