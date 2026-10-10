import { getAuthToken as getUserAuthToken } from './userApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const PLATFORM = 'web';
const SW_URL = '/firebase-messaging-sw.js';
const SW_SCOPE = '/firebase-cloud-messaging-push-scope';

// The user app and vendor portal share an origin (and so one browser FCM token),
// but each role registers it against its own account and tracks it separately
const ROLES = {
  user: {
    endpoint: '/user/fcm-token',
    storageKey: 'fcm_web_token_user',
    getAuthToken: getUserAuthToken
  },
  vendor: {
    endpoint: '/vendor/fcm-token',
    storageKey: 'fcm_web_token_vendor',
    getAuthToken: () => localStorage.getItem('vendorToken')
  }
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messagingPromise = null;

const getMessagingInstance = () => {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      if (!firebaseConfig.apiKey || !VAPID_KEY) return null;
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
      // Firebase is loaded on demand: it is only needed once push is actually set up, so it
      // stays out of the first page load
      const [{ initializeApp, getApps }, { getMessaging, isSupported }] = await Promise.all([
        import('firebase/app'),
        import('firebase/messaging')
      ]);
      if (!(await isSupported())) return null;
      const app = getApps()[0] || initializeApp(firebaseConfig);
      return getMessaging(app);
    })().catch((err) => {
      console.warn('Push notifications unavailable:', err.message);
      return null;
    });
  }
  return messagingPromise;
};

const callTokenEndpoint = (role, method, authToken, token, options = {}) =>
  fetch(`${API_BASE_URL}${ROLES[role].endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ token, platform: PLATFORM }),
    ...options
  });

/**
 * Gets this browser's FCM token and saves it under the account's `web` token array.
 * @param {Object} [options]
 * @param {'user'|'vendor'} [options.role='user']
 * @param {boolean} [options.prompt=false] ask for permission if not yet decided
 *   (Safari/Firefox only allow this from a user gesture such as a click)
 * @returns {Promise<string|null>} the token, or null if unavailable/denied
 */
export const registerPushToken = async ({ role = 'user', prompt = false } = {}) => {
  try {
    const authToken = ROLES[role].getAuthToken();
    if (!authToken) return null;

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    let permission = Notification.permission;
    if (permission === 'default' && prompt) {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    if (!token) return null;

    const res = await callTokenEndpoint(role, 'POST', authToken, token);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    localStorage.setItem(ROLES[role].storageKey, token);
    return token;
  } catch (err) {
    console.warn(`Failed to register ${role} push token:`, err.message);
    return null;
  }
};

/**
 * Detaches this browser's token from the account on logout.
 * Call it before the auth token is cleared from localStorage.
 * @param {'user'|'vendor'} [role='user']
 */
export const unregisterPushToken = (role = 'user') => {
  const { storageKey, getAuthToken } = ROLES[role];
  const token = localStorage.getItem(storageKey);
  const authToken = getAuthToken();
  localStorage.removeItem(storageKey);
  if (!token || !authToken) return;

  callTokenEndpoint(role, 'DELETE', authToken, token, { keepalive: true }).catch(() => {});
};
