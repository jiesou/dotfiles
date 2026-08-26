/** General Settings row for the notification permission + mobile push state. */
import { useEffect, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { NotifyKey } from './locales.ts'
import { ensureSubscription, isPushActive, pushSupported } from './push.ts'
import css from './NotificationSettingsRow.module.css'

/** Full Settings-row props. */
export type NotificationSettingsRowProps =
  PropsRuntime<'settings.general.item'>
  & PropsLocale<'web-ui-notify'>

/** One of the browser Notification permission states, 'unsupported' when the API is absent. */
export type NotificationPermissionState = NotificationPermission | 'unsupported'

/** Read the current browser permission state (safe outside browsers). */
export function permissionState(): NotificationPermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

/** Locale key for a permission state, for the settings row copy. */
function statusKey(state: NotificationPermissionState): NotifyKey {
  switch (state) {
    case 'granted': return 'settings.status.granted'
    case 'denied': return 'settings.status.denied'
    case 'default': return 'settings.status.default'
    case 'unsupported': return 'settings.status.unsupported'
  }
}

/** Whether the mobile push channel (Web Push) is available and subscribed. */
function pushStatus(): NotifyKey {
  if (!pushSupported()) return 'settings.push.unsupported'
  return isPushActive() ? 'settings.push.on' : 'settings.push.off'
}

/**
 * Render the notification settings row: desktop permission state plus the
 * mobile push state, with a request button (the user-gesture entry point the
 * browser requires before `new Notification` / push subscription works).
 * @param props - composed Settings slot props.
 */
export function NotificationSettingsRow({ t }: NotificationSettingsRowProps) {
  const [state, setState] = useState<NotificationPermissionState>(permissionState)
  const [pushKey, setPushKey] = useState<NotifyKey>(pushStatus)
  useEffect(() => {
    void ensureSubscription().then(() => setPushKey(pushStatus()))
  }, [state])
  const request = async () => {
    if (typeof Notification === 'undefined') return
    const next = await Notification.requestPermission()
    setState(next)
    if (next === 'granted') void ensureSubscription().then(() => setPushKey(pushStatus()))
  }
  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('settings.title')}</div>
        <div className={css.desc}>{t('settings.description')}</div>
        <div className={css.status}>{t(statusKey(state))}</div>
        <div className={css.status}>{t(pushKey)}</div>
      </div>
      {state === 'granted' || state === 'unsupported' ? null : (
        <button
          type="button"
          className={css.button}
          onClick={() => { void request() }}
        >
          {t('settings.request')}
        </button>
      )}
    </div>
  )
}
