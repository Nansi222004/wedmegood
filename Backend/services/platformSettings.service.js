const PlatformSettings = require('../modules/admin/PlatformSettings');

// Defaults for settings that the apps read directly. Older settings documents
// may not have these fields yet, and .lean() does not apply schema defaults.
const PUBLIC_DEFAULTS = {
    ratingsEnabled: true,
    cancellationNoticeDays: 15,
    fakeVendorFreeViews: 1,
    fakeVendorAccessPrice: 99,
    fakeVendorAccessDays: 30
};

const pickDefined = (value, fallback) => (value === undefined || value === null ? fallback : value);

/**
 * Settings that are safe to expose to every client (user, vendor, guest).
 * @returns {Promise<typeof PUBLIC_DEFAULTS>}
 */
async function getPublicSettings() {
    const settings = await PlatformSettings.findOne().lean();
    const result = {};
    for (const [key, fallback] of Object.entries(PUBLIC_DEFAULTS)) {
        result[key] = pickDefined(settings?.[key], fallback);
    }
    return result;
}

// Lead dispatch settings (server only)
const DISPATCH_DEFAULTS = {
    leadOfferWindowSeconds: 30,
    leadOfferDeliveryGraceSeconds: 60,
    leadContactDeadlineHours: 1,
    leadCustomerReassignLimit: 2,
    leadDetailsRequestHours: 24,
    enquiryDailyLimit: 5
};

let dispatchCache = { value: null, at: 0 };

/**
 * Lead dispatch settings with defaults. Cached for a few seconds because the offer sweeper reads them often.
 * @returns {Promise<typeof DISPATCH_DEFAULTS>}
 */
async function getDispatchSettings() {
    if (dispatchCache.value && Date.now() - dispatchCache.at < 10000) return dispatchCache.value;
    const settings = await PlatformSettings.findOne().lean();
    const result = {};
    for (const [key, fallback] of Object.entries(DISPATCH_DEFAULTS)) {
        result[key] = pickDefined(settings?.[key], fallback);
    }
    dispatchCache = { value: result, at: Date.now() };
    return result;
}

const invalidateDispatchSettings = () => { dispatchCache = { value: null, at: 0 }; };

module.exports = {
    PUBLIC_DEFAULTS,
    DISPATCH_DEFAULTS,
    getPublicSettings,
    getDispatchSettings,
    invalidateDispatchSettings
};
