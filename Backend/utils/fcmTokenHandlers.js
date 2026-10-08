const { PLATFORMS, registerToken, removeToken } = require('../services/push.service');

const validateFcmPayload = (body = {}) => {
  const { token, platform } = body;
  if (typeof token !== 'string' || token.trim().length < 20 || token.length > 4096) {
    return 'A valid FCM token is required';
  }
  if (!PLATFORMS.includes(platform)) {
    return `Platform must be one of: ${PLATFORMS.join(', ')}`;
  }
  return null;
};

/**
 * Builds save/remove FCM token handlers for an authenticated audience.
 * Body for both: { token, platform: 'web' | 'app' }
 * @param {'user'|'vendor'} audience
 * @param {(req) => string} getOwnerId reads the authenticated account id from the request
 */
const createFcmTokenHandlers = (audience, getOwnerId) => {
  const handle = (action, successMessage, failureMessage) => async (req, res) => {
    try {
      const error = validateFcmPayload(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      await action(audience, getOwnerId(req), req.body.platform, req.body.token.trim());

      res.status(200).json({ success: true, message: successMessage });
    } catch (error) {
      console.error(`${audience} FCM token error:`, error);
      res.status(500).json({
        success: false,
        message: failureMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  return {
    saveFcmToken: handle(registerToken, 'FCM token saved', 'Failed to save FCM token'),
    removeFcmToken: handle(removeToken, 'FCM token removed', 'Failed to remove FCM token')
  };
};

module.exports = { createFcmTokenHandlers };
