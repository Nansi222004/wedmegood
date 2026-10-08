import { useEffect } from 'react';
import { registerPushToken } from '../services/pushNotifications';

/**
 * Registers this browser's FCM token for the logged-in account of the given role.
 * Asks for notification permission at most once per session; later mounts refresh the token silently.
 * @param {'user'|'vendor'} role
 * @param {boolean} enabled register only when an account is logged in
 * @param {string} [accountId] re-registers when the logged-in account changes
 */
export const usePushRegistration = (role, enabled, accountId) => {
  useEffect(() => {
    if (!enabled) return;

    const promptedKey = `fcm_permission_prompted_${role}`;
    let prompt = false;
    try {
      prompt = !sessionStorage.getItem(promptedKey);
      sessionStorage.setItem(promptedKey, '1');
    } catch {
      // sessionStorage unavailable
    }
    registerPushToken({ role, prompt });
  }, [role, enabled, accountId]);
};
