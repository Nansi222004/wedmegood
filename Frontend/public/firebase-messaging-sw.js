// FCM web push service worker, shared by the user app and the vendor portal.
// The backend sends data-only messages for web ({ data: { title, body, link, audience, ... } }),
// so this worker decides how to display them and where a click navigates.

const ICON = '/utsavo_logo.png';
const DEFAULT_LINKS = { user: '/user/notifications', vendor: '/vendor/notifications' };

const audienceOf = (data) => (data && data.audience === 'vendor' ? 'vendor' : 'user');

// Only same-origin links inside the notification's own portal are allowed
// (prevents open redirects and a user push ever opening a vendor page, or vice versa)
const safeLink = (link, audience) =>
  typeof link === 'string' && !link.startsWith('//') && link.startsWith(`/${audience}/`)
    ? link
    : DEFAULT_LINKS[audience];

const isPortalClient = (client, audience) => {
  try {
    return new URL(client.url).pathname.startsWith(`/${audience}`);
  } catch {
    return false;
  }
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const data = payload.data || {};
  const audience = audienceOf(data);
  const title = data.title || payload.notification?.title || 'Utsavo';
  const body = data.body || payload.notification?.body || '';
  const link = safeLink(data.link, audience);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const portalClients = clients.filter((c) => isPortalClient(c, audience));

      // The matching portal is open and in view: let it show an in-app toast instead
      if (portalClients.some((c) => c.visibilityState === 'visible')) {
        portalClients.forEach((c) => c.postMessage({ type: 'FCM_PUSH_RECEIVED', title, body, link, data }));
        return undefined;
      }

      return self.registration.showNotification(title, {
        body,
        icon: ICON,
        badge: ICON,
        tag: data.notificationId || undefined,
        data: { link }
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link;
  const audience = typeof link === 'string' && link.startsWith('/vendor/') ? 'vendor' : 'user';
  const target = safeLink(link, audience);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => isPortalClient(c, audience));
      if (existing) {
        existing.postMessage({ type: 'FCM_NOTIFICATION_CLICK', link: target });
        return existing.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
