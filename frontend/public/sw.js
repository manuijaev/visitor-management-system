const CACHE_NAME = 'visitor-pwa-v4';
const ASSETS = ['/index.html', '/manifest.json', '/staff-manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pages are network-first: a cached index.html points at bundles that the next deploy deletes.
  // Everything else goes straight to the network and relies on normal HTTP caching.
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
        }
        return response;
      })
      .catch(() => caches.match('/index.html'))
  );
});

self.addEventListener('push', (event) => {
  let raw = {};
  try {
    raw = event.data ? event.data.json() : {};
  } catch (_err) {
    try {
      const fallbackText = event.data ? event.data.text() : '';
      raw = fallbackText ? JSON.parse(fallbackText) : {};
    } catch (_fallbackErr) {
      raw = {};
    }
  }

  // Extract notification data from various possible formats
  let title = 'Visitor waiting';
  let body = 'You have a visitor waiting for you';
  let icon = '/icons/icon-192.png';
  let clickPath = '/staff/dashboard';
  
  // Handle different payload formats
  if (raw.notification) {
    title = raw.notification.title || title;
    body = raw.notification.body || body;
    icon = raw.notification.icon || icon;
    if (raw.notification.click_action) clickPath = raw.notification.click_action;
  } else if (raw.data) {
    title = raw.data.title || raw.title || title;
    body = raw.data.body || raw.body || body;
    if (raw.data.url) clickPath = raw.data.url;
    if (raw.data.click_action) clickPath = raw.data.click_action;
  } else {
    title = raw.title || title;
    body = raw.body || body;
    if (raw.url) clickPath = raw.url;
    if (raw.click_action) clickPath = raw.click_action;
  }

  const options = {
    body: body,
    icon: icon,
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'visitor-notification',
    renotify: true,
    requireInteraction: true,
    data: { clickPath },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickPath = event.notification?.data?.clickPath || '/staff/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(clickPath);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickPath);
      }
      return null;
    })
  );
});
