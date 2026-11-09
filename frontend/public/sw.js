const CACHE_NAME = 'visitor-pwa-v4';
const ASSETS = ['/index.html', '/manifest.json', '/staff-manifest.json'];
const DEFAULT_CLICK_PATH = '/staff/dashboard';
const DEFAULT_ICON = '/icons/icon-192.png';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function cacheShell(response) {
  const copy = response.clone();
  return caches
    .open(CACHE_NAME)
    .then((cache) => cache.put('/index.html', copy))
    .catch(() => undefined);
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) event.waitUntil(cacheShell(response));
        return response;
      })
      .catch(() => caches.match('/index.html'))
  );
});

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function readPushPayload(data) {
  if (!data) return {};
  try {
    return data.json();
  } catch {
    return parseJson(data.text());
  }
}

function notificationContent(raw) {
  const source = raw.notification || raw.data || raw;
  return {
    title: source.title || raw.title || 'Visitor waiting',
    body: source.body || raw.body || 'You have a visitor waiting for you',
    icon: raw.notification?.icon || DEFAULT_ICON,
    clickPath: source.click_action || source.url || DEFAULT_CLICK_PATH,
  };
}

self.addEventListener('push', (event) => {
  const { title, body, icon, clickPath } = notificationContent(readPushPayload(event.data));

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: DEFAULT_ICON,
      vibrate: [200, 100, 200],
      tag: 'visitor-notification',
      renotify: true,
      requireInteraction: true,
      data: { clickPath },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

async function focusOrOpen(clickPath) {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const client = clientList.find((candidate) => 'focus' in candidate);
  if (!client) return self.clients.openWindow ? self.clients.openWindow(clickPath) : null;
  if ('navigate' in client) {
    try {
      await client.navigate(clickPath);
    } catch {
      // A page from another origin cannot be navigated; focusing it is still better than nothing.
    }
  }
  return client.focus();
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(focusOrOpen(event.notification?.data?.clickPath || DEFAULT_CLICK_PATH));
});
