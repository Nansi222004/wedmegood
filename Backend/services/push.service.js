const { getFirebaseMessaging } = require('../utils/firebaseAdmin');

const PLATFORMS = ['web', 'app'];
const MAX_TOKENS_PER_PLATFORM = 10;

// FCM error codes meaning the token is permanently dead and should be dropped
const STALE_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token'
]);

// Required lazily: the vendor Notification model hooks into this service,
// so loading models at the top would create a require cycle
const getModel = (audience) =>
  audience === 'vendor'
    ? require('../modules/vendor/Vendor')
    : require('../modules/user/user.model');

/**
 * Saves an FCM token under the given platform array for a user or vendor.
 * A token belongs to exactly one account: it is detached from every other user AND vendor
 * first (shared device / account or portal switch), so user and vendor notifications can
 * never reach the same device. Each platform array is capped to the most recent tokens.
 * @param {'user'|'vendor'} audience
 */
async function registerToken(audience, ownerId, platform, token) {
  const Model = getModel(audience);
  const field = `fcmTokens.${platform}`;

  // Remove the token everywhere (both audiences, both platforms, including this owner, which
  // also moves an existing token to the end so it counts as most recent), then attach it here
  await Promise.all(
    ['user', 'vendor'].flatMap((a) =>
      PLATFORMS.map((p) =>
        getModel(a).updateMany({ [`fcmTokens.${p}`]: token }, { $pull: { [`fcmTokens.${p}`]: token } })
      )
    )
  );
  await Model.updateOne(
    { _id: ownerId },
    { $push: { [field]: { $each: [token], $slice: -MAX_TOKENS_PER_PLATFORM } } }
  );
}

async function removeToken(audience, ownerId, platform, token) {
  await getModel(audience).updateOne({ _id: ownerId }, { $pull: { [`fcmTokens.${platform}`]: token } });
}

// FCM data payload values must all be strings
function stringifyData(data = {}) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
  );
}

function buildMessage(platform, { title, body, link, data }) {
  const payload = stringifyData({ ...data, title, body, link });

  if (platform === 'web') {
    // Data-only so the service worker controls display and click navigation
    return { data: payload };
  }

  return {
    notification: { title, body },
    data: payload,
    android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
    apns: { payload: { aps: { sound: 'default' } } }
  };
}

/**
 * Sends a push notification to every registered device (web + app) of a user or vendor.
 * Never throws; stale tokens reported by FCM are removed.
 * @param {'user'|'vendor'} audience
 */
async function sendPush(audience, ownerId, { title, body = '', link, data = {} }) {
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging || !ownerId || !title) return null;

    const Model = getModel(audience);
    const owner = await Model.findById(ownerId).select('+fcmTokens.web +fcmTokens.app').lean();
    if (!owner || !owner.fcmTokens) return null;

    const defaultLink = audience === 'vendor' ? '/vendor/notifications' : '/user/notifications';
    const message = { title, body, link: link || defaultLink, data: { ...data, audience } };

    const results = {};
    for (const platform of PLATFORMS) {
      const tokens = owner.fcmTokens[platform] || [];
      if (tokens.length === 0) continue;

      const response = await messaging.sendEachForMulticast({
        tokens,
        ...buildMessage(platform, message)
      });

      const staleTokens = response.responses
        .map((r, i) => (!r.success && STALE_TOKEN_CODES.has(r.error?.code) ? tokens[i] : null))
        .filter(Boolean);

      if (staleTokens.length > 0) {
        await Model.updateOne(
          { _id: ownerId },
          { $pull: { [`fcmTokens.${platform}`]: { $in: staleTokens } } }
        );
      }

      results[platform] = { success: response.successCount, failure: response.failureCount };
    }

    return results;
  } catch (err) {
    console.warn(`push.service: sendPush(${audience}) failed gracefully:`, err.message);
    return null;
  }
}

const sendPushToUser = (userId, payload) => sendPush('user', userId, payload);
const sendPushToVendor = (vendorId, payload) => sendPush('vendor', vendorId, payload);

module.exports = {
  PLATFORMS,
  registerToken,
  removeToken,
  sendPushToUser,
  sendPushToVendor
};
