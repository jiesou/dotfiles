self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()) })
self.addEventListener('push', event => {
  let payload = {}
  try { payload = event.data?.json() ?? {} } catch {}
  const title = typeof payload.title === 'string' ? payload.title : 'DSH 通知'
  const options = {
    body: typeof payload.body === 'string' ? payload.body : '有一项 DSH 任务需要你查看。',
    tag: typeof payload.tag === 'string' ? payload.tag : 'dsh-web-ui-notify',
    renotify: true,
    requireInteraction: true,
    data: { url: typeof payload.url === 'string' ? payload.url : '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = event.notification.data?.url ?? '/'
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of clients) {
      if ('focus' in client) {
        await client.focus()
        if ('navigate' in client && client.url !== new URL(target, self.location.origin).href) await client.navigate(target)
        return
      }
    }
    await self.clients.openWindow(target)
  })())
})
