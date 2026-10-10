// A drop-in replacement for fetch() used by the vendor and admin API clients.
//
// The server is far from most users (each request costs a few hundred ms) and pages are
// re-mounted whenever you leave and come back, which used to refetch identical data and flash a
// spinner. Successful JSON GET responses are therefore reused for a short time, any write request
// clears everything (so you never see data older than your own changes), and responses that are
// not JSON (PDF downloads, ...) are never cached.
//
// Returns a normal Response, so existing `response.json()` / `response.ok` code keeps working.

const clearers = new Set();
let writeWatcherInstalled = false;

// Pages also call fetch() directly. So that a write made that way can never leave an API cache
// serving older data, every non-GET request in the app clears all caches once it finishes.
const installWriteWatcher = () => {
  if (writeWatcherInstalled || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  writeWatcherInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const method = String(init?.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return originalFetch(input, init);
    try {
      return await originalFetch(input, init);
    } finally {
      clearers.forEach((clear) => clear());
    }
  };
};

/** Let another cache (e.g. the user API client's) be cleared together with the fetch caches. */
export const registerCacheClearer = (clear) => {
  clearers.add(clear);
  installWriteWatcher();
};

export const createCachedFetch = ({ ttlMs = 15000, neverCache = null } = {}) => {
  const cache = new Map(); // key -> { at, text, status }

  const clear = () => cache.clear();
  registerCacheClearer(clear);
  if (typeof window !== 'undefined') window.addEventListener('auth:unauthorized', clear);

  const cachedFetch = async (url, options = {}) => {
    const method = String(options.method || 'GET').toUpperCase();

    if (method !== 'GET') {
      try {
        return await fetch(url, options);
      } finally {
        clear();
      }
    }

    if (neverCache && neverCache.test(url)) return fetch(url, options);

    const auth = options.headers?.Authorization || options.headers?.authorization || '';
    const key = `${auth}|${url}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < ttlMs) {
      return new Response(hit.text, { status: hit.status, headers: { 'Content-Type': 'application/json' } });
    }

    const response = await fetch(url, options);
    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    if (response.ok && isJson) {
      try {
        const text = await response.clone().text();
        if (cache.size > 200) cache.clear();
        cache.set(key, { at: Date.now(), text, status: response.status });
      } catch (_) { /* not cacheable, just return the live response */ }
    }
    return response;
  };

  cachedFetch.clear = clear;
  return cachedFetch;
};
