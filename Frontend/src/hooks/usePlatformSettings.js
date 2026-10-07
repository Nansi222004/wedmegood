import { useSyncExternalStore } from 'react';
import userApi from '../services/userApi';

// Platform settings every screen may need. Fetched once per page load and shared.
export const DEFAULT_PLATFORM_SETTINGS = {
  ratingsEnabled: true,
  cancellationNoticeDays: 15,
  fakeVendorFreeViews: 1,
  fakeVendorAccessPrice: 99,
  fakeVendorAccessDays: 30
};

let cached = null;
let pending = null;
const listeners = new Set();

const load = () => {
  if (!pending) {
    pending = userApi.getPublicSettings()
      .then(res => {
        cached = { ...DEFAULT_PLATFORM_SETTINGS, ...(res?.data || {}) };
        listeners.forEach(notify => notify());
        return cached;
      })
      .catch(() => {
        pending = null; // try again on the next subscribe
        return DEFAULT_PLATFORM_SETTINGS;
      });
  }
  return pending;
};

const subscribe = (notify) => {
  listeners.add(notify);
  if (!cached) load();
  return () => listeners.delete(notify);
};

const getSnapshot = () => cached || DEFAULT_PLATFORM_SETTINGS;

const usePlatformSettings = () => useSyncExternalStore(subscribe, getSnapshot);

export default usePlatformSettings;
