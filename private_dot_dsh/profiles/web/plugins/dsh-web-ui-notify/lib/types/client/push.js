/**
 * Client push bridge: registers the plugin's service worker, subscribes this
 * device to Web Push, reports page focus to the host, and forwards
 * notification-click jumps to the session opener.
 *
 * Web Push is what makes mobile notifications work: the host sends a push to
 * the OS push service and the service worker displays it even when the dsh
 * page is closed or backgrounded — the in-page `Notification` API cannot do
 * that on mobile.
 */
const PLUGIN_PREFIX = '/plugins/web-ui-notify';
/** Convert a base64url VAPID public key to the Uint8Array PushManager needs. */
export function urlBase64ToUint8Array(base64url) {
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1)
        out[i] = raw.charCodeAt(i);
    return out;
}
/** Whether this browser can support Web Push (secure context + SW + Notification). */
export function pushSupported() {
    return typeof navigator !== 'undefined'
        && 'serviceWorker' in navigator
        && typeof navigator.serviceWorker.register === 'function'
        && typeof window !== 'undefined'
        && window.isSecureContext
        && typeof Notification !== 'undefined';
}
let activeSubscription;
let subscribeAttempts = 0;
const MAX_SUBSCRIBE_ATTEMPTS = 5;
/** Whether this device currently has an active push subscription (sync read). */
export function isPushActive() {
    return activeSubscription !== undefined;
}
/** Lazily (re)tries to register the SW and subscribe — idempotent, capped. */
export async function ensureSubscription() {
    if (!pushSupported())
        return;
    if (Notification.permission !== 'granted')
        return;
    if (subscribeAttempts >= MAX_SUBSCRIBE_ATTEMPTS)
        return;
    subscribeAttempts += 1;
    try {
        const registration = await navigator.serviceWorker.register(`${PLUGIN_PREFIX}/sw.js`, { scope: '/' });
        const existing = await registration.pushManager.getSubscription();
        const subscription = existing ?? await (async () => {
            const res = await fetch(`${PLUGIN_PREFIX}/push-config`, { cache: 'no-store' });
            if (!res.ok)
                return undefined;
            const data = await res.json();
            if (data.enabled !== true || typeof data.publicKey !== 'string')
                return undefined;
            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.publicKey),
            });
        })();
        if (subscription === undefined)
            return;
        activeSubscription = subscription;
        subscribeAttempts = MAX_SUBSCRIBE_ATTEMPTS;
        await fetch(`${PLUGIN_PREFIX}/push-subscribe`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(subscription.toJSON()),
        }).catch(() => { });
    }
    catch {
        // SW/subscription failure stays silent: retry on next visible/effect tick
        // until the attempt cap; the in-app Notification fallback covers it meanwhile.
    }
}
/** Report page focus to the host (suppresses pushes while the user is looking). */
export function reportFocus(focused) {
    if (!pushSupported())
        return;
    void fetch(`${PLUGIN_PREFIX}/focus`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ focused }),
    }).catch(() => { });
}
/** Install the long-lived bridge: retry subscription on visibility, report
 *  focus changes, and forward notification-click jumps to the session opener. */
export function installPushBridge(opts) {
    if (!pushSupported())
        return;
    void ensureSubscription();
    navigator.serviceWorker.addEventListener('message', (event) => {
        const data = event.data;
        if (data?.type === 'web-ui-notify:jump' && typeof data.sessionId === 'string') {
            opts.openSession(data.sessionId);
        }
    });
    const onVisibility = () => {
        reportFocus(document.visibilityState === 'visible');
        if (document.visibilityState === 'visible')
            void ensureSubscription();
    };
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
}
