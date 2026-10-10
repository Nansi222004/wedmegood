const mongoose = require('mongoose');

/**
 * Short-lived cache of User / Vendor documents for the auth middleware.
 *
 * Every authenticated request used to fetch its account from MongoDB, and each round trip to the
 * (remote) database costs tens of milliseconds. The raw document is cached for a minute and turned
 * back into a normal mongoose document with Model.hydrate(), so handlers still get a real document
 * (virtuals, .save(), ...) without a database call.
 *
 * Correctness: the cache is dropped whenever a model that opted in with attachInvalidation()
 * is written through mongoose (save, update*, delete*), so blocking a user, changing a vendor's
 * status or subscription etc. takes effect on the very next request. The TTL only bounds staleness
 * for writes made outside this process (scripts, other servers).
 */
// ENTITY_CACHE_TTL_MS=0 turns the cache off
const TTL_MS = Number.isFinite(Number(process.env.ENTITY_CACHE_TTL_MS)) && process.env.ENTITY_CACHE_TTL_MS !== undefined && process.env.ENTITY_CACHE_TTL_MS !== ''
  ? Number(process.env.ENTITY_CACHE_TTL_MS)
  : 60 * 1000;
const MAX_ENTRIES = 5000;

const store = new Map();
let version = 0;

const invalidateAll = () => {
  version++;
  store.clear();
};

const QUERY_WRITE_OPS = [
  'findOneAndUpdate', 'findOneAndDelete', 'findOneAndReplace',
  'updateOne', 'updateMany', 'replaceOne', 'deleteOne', 'deleteMany'
];

/** Register on a schema (before the model is compiled) so writes invalidate the cache. */
const attachInvalidation = (schema) => {
  schema.post('save', invalidateAll);
  schema.post('deleteOne', { document: true, query: false }, invalidateAll);
  for (const op of QUERY_WRITE_OPS) {
    schema.post(op, { document: false, query: true }, invalidateAll);
  }
};

/**
 * Same result as Model.findById(id) (a fresh hydrated document), served from memory when possible.
 * Returns null when no such document exists. Not-found results are never cached.
 */
const findCachedById = async (Model, id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  const key = `${Model.modelName}:${id}`;
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return Model.hydrate(hit.raw);

  const startedAtVersion = version;
  const raw = await Model.findById(id).lean();
  if (!raw) return null;

  // Do not store if a write happened while we were reading (we might hold the old copy)
  if (TTL_MS > 0 && startedAtVersion === version) {
    if (store.size >= MAX_ENTRIES) store.clear();
    store.set(key, { raw, expires: Date.now() + TTL_MS });
  }
  return Model.hydrate(raw);
};

module.exports = { findCachedById, attachInvalidation, invalidateAll };
