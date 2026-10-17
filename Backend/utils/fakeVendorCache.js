const FakeVendorListing = require('../modules/admin/FakeVendorListing');

// Registered vendors the admin confirmed as fake, cached briefly: the chat checks this on every message.
const TTL_MS = 60 * 1000;
let cache = { ids: null, at: 0 };

async function getFakeVendorIds() {
    if (cache.ids && Date.now() - cache.at < TTL_MS) return cache.ids;
    const ids = await FakeVendorListing.distinct('vendorId', { isPublished: true, vendorId: { $ne: null } });
    cache = { ids: new Set(ids.map(String)), at: Date.now() };
    return cache.ids;
}

/** True when the vendor is publicly listed as fake: contacting them is blocked. */
async function isReportedFake(vendorId) {
    if (!vendorId) return false;
    return (await getFakeVendorIds()).has(String(vendorId));
}

const invalidateFakeVendorCache = () => { cache = { ids: null, at: 0 }; };

const FAKE_VENDOR_BLOCKED_MESSAGE = 'This vendor has been reported as fake after an investigation. Contacting them is blocked for your safety.';

module.exports = { getFakeVendorIds, isReportedFake, invalidateFakeVendorCache, FAKE_VENDOR_BLOCKED_MESSAGE };
