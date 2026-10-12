## Problem

Desktop-only page notifications do not work reliably on phones, and scanning every session status can announce subagent completions as if they were user-facing root sessions.

## Decision

Keep the existing desktop Notification path and add a DSH host-side Web Push channel with authenticated subscribe/unsubscribe/VAPID routes, a package-served Service Worker, persisted VAPID keys/subscriptions under `$DSH_HOME/web-ui-notify`, and an explicit settings-row opt-in. Restrict host turn/approval/question pushes to `agents.roots()`, and restrict client status/chat notifications to sessions without `parentId` and without `origin: 'subagent'`.

## Alternatives considered

- Replace desktop notifications with Web Push: rejected because desktop notifications remain useful when the user is browsing another tab.
- Notify every session: rejected because child/subagent turns are internal progress, not user-facing completion.
- Use only browser-local state: rejected because push delivery while the page is closed requires a host-held subscription and VAPID keys.

## Consequences

- Mobile background delivery requires HTTPS, a browser with Web Push support, and on iOS an installed PWA; ordinary iOS Safari tabs are not supported.
- The user must enable Push from a foreground user gesture. The host stores private VAPID material with restrictive file permissions and requires DSH connection admission on API routes.
- DSH host sources are scoped to root agents; the existing browser notification permission flow and notifications are retained.
