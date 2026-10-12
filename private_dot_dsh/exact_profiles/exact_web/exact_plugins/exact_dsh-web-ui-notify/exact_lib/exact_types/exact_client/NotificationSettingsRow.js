import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** General Settings row for the desktop-notification permission. */
import { useEffect, useState } from 'react';
import css from './NotificationSettingsRow.module.css';
import { disableWebPush, enableWebPush, pushSupported, restoreWebPush, webPushEnabled } from "./push.js";
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
/**
 * Render the desktop-notification permission row: current browser state plus
 * a request button (the user-gesture entry point the browser requires before
 * `new Notification` works).
 * @param props - composed Settings slot props.
 * @returns the preference row.
 */
export function NotificationSettingsRow({ t }) {
    const [state, setState] = useState(permissionState);
    const [pushEnabled, setPushEnabled] = useState(webPushEnabled);
    const [error, setError] = useState('');
    useEffect(() => { void restoreWebPush(); }, []);
    const toggle = async () => {
        setError('');
        try {
            if (pushEnabled)
                await disableWebPush();
            else
                await enableWebPush();
            setPushEnabled(!pushEnabled);
            setState(permissionState());
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
    };
    const request = async () => {
        if (typeof Notification === 'undefined')
            return;
        const next = await Notification.requestPermission();
        setState(next);
    };
    return (_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: t('settings.title') }), _jsx("div", { className: css.desc, children: t('settings.description') }), _jsx("div", { className: css.status, children: t(statusKey(state)) }), error === '' ? null : _jsx("div", { className: css.status, role: "alert", children: error })] }), state === 'granted' || state === 'unsupported' ? null : (_jsx("button", { type: "button", className: css.button, onClick: () => { void request(); }, children: t('settings.request') })), pushSupported() ? (_jsx("button", { type: "button", className: css.button, "aria-pressed": pushEnabled, onClick: () => { void toggle(); }, children: pushEnabled ? t('settings.push.disable') : t('settings.push.enable') })) : null] }));
}
