self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(self.registration.showNotification(data.title || 'Nailed It!', {
    body: data.body || 'Someone loved your fresh set.',
    icon: '/images/friends-fresh-sets.png',
    badge: '/images/friends-fresh-sets.png',
    tag: data.tag || 'nailed-it-like',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100]
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin)
    return existing ? existing.focus() : clients.openWindow(event.notification.data.url || '/')
  }))
})
