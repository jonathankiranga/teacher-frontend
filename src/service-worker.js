import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

const SW = self;

// Listen for native Service Worker Background Sync events ('sync-offline-data' or 'sync-attendance')
SW.addEventListener('sync', event => {
  if (event.tag === 'sync-offline-data' || event.tag === 'sync-attendance') {
    event.waitUntil(
      SW.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_OFFLINE_DATA' }));
      })
    );
  }
});

SW.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'Education APP';
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/icons/icon-192.svg',
    badge: data.badge || '/icons/icon-192.svg',
    data: { url: data.url || '/' }
  };
  event.waitUntil(SW.registration.showNotification(title, options));
});

SW.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
