const UserNotification = require('../modules/user/UserNotification');
const UserActivity = require('../modules/user/UserActivity');
const User = require('../modules/user/user.model');

// Whitelist for navigation routes to prevent open redirect issues
const ENTITY_ROUTES = {
  Booking: '/user/bookings',
  Quote: '/user/dashboard',
  Payment: '/user/account/payments',
  Lead: '/user/dashboard',
  Review: '/user/account/reviews',
  Complaint: '/user/account',
  FamilyGroup: '/user/family/groups',
  EInvite: '/user/e-invites',
  ChecklistTask: '/user/tools/checklist',
  TimelineEvent: '/user/tools/timeline',
  Budget: '/user/tools/budget',
  General: '/user/dashboard'
};

/**
 * Creates an in-app UserNotification safely and non-blockingly.
 * @param {Object} params
 * @param {string|ObjectId} params.userId
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.type='system']
 * @param {string} [params.entityType='General']
 * @param {string|ObjectId} [params.entityId=null]
 * @param {string} [params.customLink=null]
 * @returns {Promise<UserNotification|null>}
 */
async function createNotification({
  userId,
  title,
  message,
  type = 'system',
  entityType = 'General',
  entityId = null,
  customLink = null
}) {
  try {
    if (!userId || !title || !message) return null;

    // Determine target link from whitelist (strictly internal to prevent open redirect)
    let link = ENTITY_ROUTES[entityType] || '/user/dashboard';
    if (customLink && typeof customLink === 'string') {
      const trimmed = customLink.trim();
      if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes(':')) {
        link = trimmed;
      }
    }

    // Check user preferences if present
    try {
      const user = await User.findById(userId).select('preferences').lean();
      if (user && user.preferences && user.preferences.notifications) {
        const notifs = user.preferences.notifications;
        // In-app notifications are created by default unless push/in-app are explicitly disabled
        if (notifs.push === false && notifs.pushEnabled === false && notifs.inAppEnabled === false) {
          // User opted out of non-critical push/in-app alerts, only allow critical payment/booking
          if (!['booking', 'payment'].includes(type)) {
            return null;
          }
        }
      }
    } catch (prefErr) {
      // Preferences fetch error should not block notification creation
    }

    const notification = await UserNotification.create({
      userId,
      title: title.trim(),
      message: message.trim(),
      type,
      entityType,
      entityId,
      link,
      isRead: false
    });

    return notification;
  } catch (err) {
    // Non-blocking: log warning and return null; never throw to caller
    console.warn('notification.service: createNotification failed gracefully:', err.message);
    return null;
  }
}

/**
 * Logs a UserActivity with strict idempotency based on eventKey.
 * @param {Object} params
 * @param {string|ObjectId} params.userId
 * @param {string} params.type
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.entityType='General']
 * @param {string|ObjectId} [params.entityId=null]
 * @param {string} [params.eventKey=null]
 * @param {Object} [params.metadata={}]
 * @returns {Promise<UserActivity|null>}
 */
async function recordActivity({
  userId,
  type,
  title,
  message,
  entityType = 'General',
  entityId = null,
  eventKey = null,
  metadata = {}
}) {
  try {
    if (!userId || !type || !title || !message) return null;

    // If eventKey is supplied, check for duplicate (idempotency guarantee)
    if (eventKey) {
      const existing = await UserActivity.findOne({ userId, eventKey }).lean();
      if (existing) {
        return existing;
      }
    }

    const activity = await UserActivity.create({
      userId,
      type,
      title: title.trim(),
      message: message.trim(),
      entityType,
      entityId,
      eventKey: eventKey || null,
      metadata: metadata || {}
    });

    return activity;
  } catch (err) {
    // If duplicate key error on eventKey (E11000), return existing record safely
    if (err.code === 11000) {
      try {
        return await UserActivity.findOne({ userId, eventKey }).lean();
      } catch (findErr) {
        return null;
      }
    }
    // Non-blocking: log warning and return null; never throw to caller
    console.warn('notification.service: recordActivity failed gracefully:', err.message);
    return null;
  }
}

/**
 * Combined helper to dispatch both a UserNotification and a UserActivity in one call.
 */
async function notifyAndLogActivity({
  userId,
  notificationTitle,
  notificationMessage,
  notificationType = 'system',
  activityType,
  activityTitle,
  activityMessage,
  entityType = 'General',
  entityId = null,
  eventKey = null,
  metadata = {}
}) {
  try {
    const [notif, act] = await Promise.all([
      createNotification({
        userId,
        title: notificationTitle || activityTitle,
        message: notificationMessage || activityMessage,
        type: notificationType,
        entityType,
        entityId
      }),
      recordActivity({
        userId,
        type: activityType,
        title: activityTitle,
        message: activityMessage,
        entityType,
        entityId,
        eventKey,
        metadata
      })
    ]);
    return { notification: notif, activity: act };
  } catch (err) {
    console.warn('notification.service: notifyAndLogActivity failed gracefully:', err.message);
    return { notification: null, activity: null };
  }
}

module.exports = {
  ENTITY_ROUTES,
  createNotification,
  recordActivity,
  notifyAndLogActivity
};
