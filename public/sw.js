self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('message', (event) => {
  if (event.data?.type === 'WATER_REMINDER') {
    self.registration.showNotification('💧 Hora de beber água!', {
      body: 'Mantenha-se hidratado para um melhor desempenho.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'water-reminder',
      renotify: true,
    })
  }
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = {}
  }
  const title = data.title ?? '💧 Hora de beber água!'
  const body = data.body ?? 'Mantenha-se hidratado para um melhor desempenho.'
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'water-reminder',
      renotify: true,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin))
        if (existing) return existing.focus()
        return self.clients.openWindow('/')
      }),
  )
})
