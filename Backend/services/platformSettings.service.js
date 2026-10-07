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

module.exports = {
    PUBLIC_DEFAULTS,
    getPublicSettings
};
