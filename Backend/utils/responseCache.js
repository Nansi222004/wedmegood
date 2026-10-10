/**
 * In-memory cache for public, read-only JSON endpoints (vendor listings, categories, banners...).
 *
 * These responses are identical for every visitor but expensive: each needs several round trips to
 * the remote database. A cached copy is served in about a millisecond. Any successful write request
 * anywhere in the API clears the whole cache (see clearOnWrite), so a change made by an admin or
 * vendor shows up immediately; the TTL is only a safety net.
 */
const store = new Map(); // url -> { expires, status, body }
const MAX_ENTRIES = 500;

const clearResponseCache = () => store.clear();

/**
 * @param {number} ttlMs server-side lifetime
 * @param {number} [browserMaxAgeSec] how long browsers may reuse it without asking again
 */
const cacheResponse = (ttlMs = 30000, browserMaxAgeSec = 10) => (req, res, next) => {
  if (req.method !== 'GET') return next();
  const key = req.originalUrl;

  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', `public, max-age=${browserMaxAgeSec}`);
    return res.status(hit.status).json(hit.body);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body && body.success !== false) {
      if (store.size >= MAX_ENTRIES) store.clear();
      store.set(key, { expires: Date.now() + ttlMs, status: 200, body });
      res.set('Cache-Control', `public, max-age=${browserMaxAgeSec}`);
    }
    return originalJson(body);
  };
  next();
};

// Writes that must not flush the cache (they never affect public listings)
const IGNORED_WRITES = /\/(conversations|messages|fcm-token|notifications|read|attachments|upload)(\/|$)/;

/** Express middleware: drop the cache after any successful write request. */
const clearOnWrite = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'OPTIONS' && req.method !== 'HEAD' && !IGNORED_WRITES.test(req.path)) {
    res.on('finish', () => {
      if (res.statusCode < 400) clearResponseCache();
    });
  }
  next();
};

module.exports = { cacheResponse, clearResponseCache, clearOnWrite };
