/** One pushable device subscription (the web-push wire shape). */
export interface PushSubscriptionView {
    endpoint: string;
    keys?: {
        p256dh?: string;
        auth?: string;
    };
    expirationTime?: number | null;
}
/** Push payload (service-worker showNotification arguments + jump target). */
export interface PushPayload {
    kind: 'approval' | 'question' | 'completed' | 'failed';
    title: string;
    body: string;
    tag: string;
    sessionId?: string;
}
/** Host notification configuration (cordis patch may override). */
export interface NotifyHostConfig {
    /** Tool-call threshold per turn before a "long task" completion push (default 7). */
    longTaskToolCalls?: number;
    /** VAPID keys; when absent they are generated and persisted under the data dir. */
    vapidPublicKey?: string;
    vapidPrivateKey?: string;
}
export declare const PLUGIN_PREFIX = "/plugins/web-ui-notify";
/** Last-wins session title from an audit event list; empty when untitled. */
export declare function sessionTitleFromEvents(events: unknown[] | undefined): string;
/** Runtime-generated vertical-gradient PNG icon (indigo -> deep indigo). */
export declare function pngIcon(size: number): Buffer;
/** PWA manifest source (PNG icons + standalone; iOS needs PNG, not SVG). */
export declare function manifestSource(): string;
/** Service Worker source: push -> system notification (skips when a
 * same-origin window is focused), notification click -> focus/open + postMessage. */
export declare function swSource(): string;
/** Host handle: pushes + read-only/subscription access for the HTTP routes. */
export interface NotifyHostHandle {
    pushApproval(info: {
        sessionId: string;
        approvalId: string;
        toolName: string;
    }): void;
    pushQuestion(info: {
        sessionId: string;
        callId: string;
    }): void;
    pushFailed(info: {
        sessionId: string;
        message?: string;
        code?: string;
    }): void;
    pushCompleted(info: {
        sessionId: string;
        toolCalls: number;
    }): void;
    noteFocus(host: string | undefined, focused: boolean): void;
    /** Serialized manifest (for the manifest.json route). */
    manifest: string;
    /** Service-worker source (for the sw.js route). */
    sw: string;
    /** The two PNG icons (for the icon routes). */
    icons: {
        'icon-180.png': Buffer;
        'icon-512.png': Buffer;
    };
    /** Resolve push configuration (generates VAPID keys on first use). */
    pushConfig(): Promise<{
        enabled: boolean;
        publicKey?: string;
    }>;
    /** Register one device subscription (dedupes by endpoint, persisted). */
    addSubscription(sub: PushSubscriptionView): void;
    /** Number of live push subscriptions (diag). */
    subscriptionCount(): number;
}
/** Build the host notification handle. */
export declare function installNotifyHost(ctx: any, config?: NotifyHostConfig): NotifyHostHandle;
