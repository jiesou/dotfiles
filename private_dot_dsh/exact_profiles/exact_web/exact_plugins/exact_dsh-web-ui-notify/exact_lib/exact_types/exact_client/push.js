const SW_URL = '/push/sw.js';
const VAPID_URL = '/api/push/vapid';
const SUBSCRIBE_URL = '/api/push/subscribe';
const UNSUBSCRIBE_URL = '/api/push/unsubscribe';
const ENABLED_KEY = 'dsh-web-ui-notify:web-push-enabled';
export function pushSupported() {
    return typeof navigator !== 'undefined' && typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
}
function toApplicationKey(value) {
    const padded = value + '='.repeat((4 - value.length % 4) % 4);
    const raw = atob(padded.replace(/-/gu, '+').replace(/_/gu, '/'));
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1)
        bytes[i] = raw.charCodeAt(i);
    return bytes;
}
async function serviceWorker() {
    if (!pushSupported())
        throw new Error('Web Push is not supported by this browser');
    return navigator.serviceWorker.register(SW_URL, { scope: '/' });
}
export async function enableWebPush() {
    if (!pushSupported())
        throw new Error('Web Push requires a supported browser and HTTPS');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted')
        throw new Error('Notification permission was not granted');
    const registration = await serviceWorker();
    const response = await fetch(VAPID_URL);
    if (!response.ok)
        throw new Error(`Could not load push configuration (${response.status})`);
    const { publicKey } = await response.json();
    const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toApplicationKey(publicKey),
    });
    const saved = await fetch(SUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    if (!saved.ok)
        throw new Error(`Could not save push subscription (${saved.status})`);
    localStorage.setItem(ENABLED_KEY, 'on');
}
export async function disableWebPush() {
    localStorage.setItem(ENABLED_KEY, 'off');
    if (!pushSupported())
        return;
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription === null || subscription === undefined)
        return;
    await fetch(UNSUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
}
export async function restoreWebPush() {
    try {
        if (!pushSupported() || webPushEnabled() === false || Notification.permission !== 'granted')
            return;
        const registration = await serviceWorker();
        const subscription = await registration.pushManager.getSubscription();
        if (subscription === null)
            return;
        await fetch(SUBSCRIBE_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
    }
    catch (error) {
        console.warn('[web-ui-notify] Web Push resubscription failed', error);
    }
}
export function webPushEnabled() {
    try {
        return localStorage.getItem(ENABLED_KEY) === 'on';
    }
    catch {
        return false;
    }
}
