/** Convert a base64url VAPID public key to the Uint8Array PushManager needs. */
export declare function urlBase64ToUint8Array(base64url: string): Uint8Array;
/** Whether this browser can support Web Push (secure context + SW + Notification). */
export declare function pushSupported(): boolean;
/** Whether this device currently has an active push subscription (sync read). */
export declare function isPushActive(): boolean;
/** Lazily (re)tries to register the SW and subscribe — idempotent, capped. */
export declare function ensureSubscription(): Promise<void>;
/** Report page focus to the host (suppresses pushes while the user is looking). */
export declare function reportFocus(focused: boolean): void;
/** Install the long-lived bridge: retry subscription on visibility, report
 *  focus changes, and forward notification-click jumps to the session opener. */
export declare function installPushBridge(opts: {
    openSession: (sessionId: string) => void;
}): void;
