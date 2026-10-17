import { useState } from 'react';
import { toast } from '../../components/ui/Toast';

/**
 * Runs an API call with a busy flag and toasts, then calls onDone (usually a reload).
 * Returns { busy, run }. run(key, fn, successMessage) resolves to the response or null on error.
 */
export function useAction(onDone) {
  const [busy, setBusy] = useState(null);
  const run = async (key, fn, successMessage) => {
    setBusy(key);
    try {
      const res = await fn();
      const msg = successMessage ?? res?.message;
      if (msg) toast.success(msg);
      if (onDone) await onDone();
      return res || {};
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
      return null;
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

/** Uploads a picked image through the API and returns its URL (null on failure). */
export async function uploadPicked(api, fileList) {
  const file = fileList?.[0];
  if (!file) return null;
  try {
    return await api.upload(file);
  } catch (err) {
    toast.error(err.message || 'Upload failed');
    return null;
  }
}
