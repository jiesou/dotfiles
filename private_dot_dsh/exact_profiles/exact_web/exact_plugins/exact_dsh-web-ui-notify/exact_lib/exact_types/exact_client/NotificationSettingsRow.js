import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** General Settings row for the notification permission + mobile push state. */
import { useEffect, useState } from 'react';
import { ensureSubscription, isPushActive, pushSupported } from "./push.js";
import css from './NotificationSettingsRow.module.css';
/** Read the current browser permission state (safe outside browsers). */
export function permissionState() {
    if (typeof Notification === 'undefined')
        return 'unsupported';
    return Notification.permission;
}
/** Locale key for a permission state, for the settings row copy. */
function statusKey(state) {
    switch (state) {
        case 'granted': return 'settings.status.granted';
        case 'denied': return 'settings.status.denied';
        case 'default': return 'settings.status.default';
        case 'unsupported': return 'settings.status.unsupported';
    }
}
/** Whether the mobile push channel (Web Push) is available and subscribed. */
function pushStatus() {
    if (!pushSupported())
        return 'settings.push.unsupported';
    return isPushActive() ? 'settings.push.on' : 'settings.push.off';
}
/**
 * Render the notification settings row: desktop permission state plus the
 * mobile push state, with a request button (the user-gesture entry point the
 * browser requires before `new Notification` / push subscription works).
 * @param props - composed Settings slot props.
 */
export function NotificationSettingsRow({ t }) {
    const [state, setState] = useState(permissionState);
    const [pushKey, setPushKey] = useState(pushStatus);
    useEffect(() => {
        void ensureSubscription().then(() => setPushKey(pushStatus()));
    }, [state]);
    const request = async () => {
        if (typeof Notification === 'undefined')
            return;
        const next = await Notification.requestPermission();
        setState(next);
        if (next === 'granted')
            void ensureSubscription().then(() => setPushKey(pushStatus()));
    };
    return (_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: t('settings.title') }), _jsx("div", { className: css.desc, children: t('settings.description') }), _jsx("div", { className: css.status, children: t(statusKey(state)) }), _jsx("div", { className: css.status, children: t(pushKey) })] }), state === 'granted' || state === 'unsupported' ? null : (_jsx("button", { type: "button", className: css.button, onClick: () => { void request(); }, children: t('settings.request') }))] }));
}
