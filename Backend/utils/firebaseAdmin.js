const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let messaging = null;
let initAttempted = false;

/**
 * Lazily initializes the Firebase Admin SDK from env credentials.
 * Returns null (push disabled) when credentials are missing or invalid.
 */
function getFirebaseMessaging() {
  if (messaging || initAttempted) return messaging;
  initAttempted = true;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('firebaseAdmin: FIREBASE_* env vars not set, push notifications disabled');
    return null;
  }

  try {
    const app = getApps()[0] || initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // .env stores the key on one line with literal \n sequences
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    messaging = getMessaging(app);
  } catch (err) {
    console.error('firebaseAdmin: initialization failed:', err.message);
    messaging = null;
  }

  return messaging;
}

module.exports = { getFirebaseMessaging };
