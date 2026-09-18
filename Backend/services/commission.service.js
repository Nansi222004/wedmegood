/**
 * Centralized Platform Commission Engine
 * Pure server-side authoritative financial calculations.
 *
 * Precedence:
 * 1. Explicit / Historical Rate (passed directly from persisted Booking / Payment record)
 * 2. Database PlatformSettings configured rate (Admin Platform Settings in MongoDB)
 * 3. Environment variable (PLATFORM_COMMISSION_PERCENTAGE / PLATFORM_COMMISSION_PERCENT)
 * 4. Unconfigured (returns isConfigured: false, commission: null without fabricating a fallback)
 */

/**
 * Retrieve active commission configuration following strict authoritative precedence.
 * @returns {Promise<{ isConfigured: boolean, ratePercent: number|null, rate: number|null, source: string, configId: string|null, updatedAt?: Date, error?: string, basis: string }>}
 */
async function getActiveCommissionConfig() {
    try {
        const PlatformSettings = require('../modules/admin/PlatformSettings');
        const settings = await PlatformSettings.findOne().lean();
        if (settings && typeof settings.platformCommissionPercent === 'number' && !isNaN(settings.platformCommissionPercent) && settings.platformCommissionPercent !== null) {
            const percent = Math.max(0, Math.min(100, settings.platformCommissionPercent));
            return {
                isConfigured: true,
                ratePercent: percent,
                rate: percent / 100,
                source: 'DATABASE_PLATFORM_SETTINGS',
                configId: settings._id ? settings._id.toString() : null,
                updatedAt: settings.updatedAt || null,
                basis: 'GROSS_PACKAGE_AMOUNT'
            };
        }
    } catch (err) {
        console.error('Error reading PlatformSettings for commission configuration:', err.message);
    }

    // Check environment variable
    const envVal = process.env.PLATFORM_COMMISSION_PERCENTAGE || process.env.PLATFORM_COMMISSION_PERCENT;
    if (envVal !== undefined && envVal !== null && envVal !== '' && !isNaN(Number(envVal))) {
        const percent = Math.max(0, Math.min(100, Number(envVal)));
        return {
            isConfigured: true,
            ratePercent: percent,
            rate: percent / 100,
            source: 'ENVIRONMENT_VARIABLE',
            configId: 'env',
            basis: 'GROSS_PACKAGE_AMOUNT'
        };
    }

    // Unconfigured state — Do not fabricate an assumed rate
    return {
        isConfigured: false,
        ratePercent: null,
        rate: null,
        source: 'UNCONFIGURED',
        configId: null,
        basis: 'GROSS_PACKAGE_AMOUNT',
        error: 'Platform commission rate is not configured in Admin Platform Settings or Environment.'
    };
}

/**
 * Get active commission rate percent or null if unconfigured.
 * @returns {Promise<number|null>}
 */
async function getActiveCommissionPercent() {
    const config = await getActiveCommissionConfig();
    return config.ratePercent;
}

/**
 * Synchronous commission calculation helper.
 * @param {number} grossAmount - Total booking/payment amount in INR.
 * @param {number|null} [ratePercent] - Explicit or persisted commission percentage.
 * @param {Object} [options] - Additional metadata options
 * @returns {{ grossAmount: number, isConfigured: boolean, commissionRate: number|null, commissionPercent: number|null, commissionAmount: number|null, vendorEarning: number|null, source: string, basis: string, error?: string }}
 */
function calculateCommission(grossAmount, ratePercent, options = {}) {
    const gross = Math.max(0, Number(grossAmount) || 0);

    if (ratePercent === undefined || ratePercent === null || isNaN(ratePercent)) {
        return {
            grossAmount: gross,
            isConfigured: false,
            commissionRate: null,
            commissionPercent: null,
            rate: null,
            commissionAmount: null,
            commission: null,
            vendorEarning: null,
            source: options.source || 'UNCONFIGURED',
            basis: 'GROSS_PACKAGE_AMOUNT',
            error: 'Platform commission rate is unconfigured. Cannot calculate commission.'
        };
    }

    const percent = Math.max(0, Math.min(100, Number(ratePercent)));
    const commissionRate = percent / 100;
    const commissionAmount = Math.round(gross * commissionRate * 100) / 100;
    const vendorEarning = Math.round((gross - commissionAmount) * 100) / 100;

    return {
        grossAmount: gross,
        isConfigured: true,
        commissionRate,
        commissionPercent: percent,
        rate: percent,
        commissionAmount,
        commission: commissionAmount,
        vendorEarning,
        source: options.source || 'EXPLICIT',
        configId: options.configId || null,
        basis: 'GROSS_PACKAGE_AMOUNT'
    };
}

/**
 * Asynchronous commission calculation helper that checks active PlatformSettings.
 * Preserves explicitRate if provided (for historical bookings).
 * @param {number} grossAmount
 * @param {number} [explicitRate]
 * @returns {Promise<Object>}
 */
async function calculateActiveCommission(grossAmount, explicitRate) {
    if (explicitRate !== undefined && explicitRate !== null && !isNaN(explicitRate)) {
        return calculateCommission(grossAmount, explicitRate, { source: 'HISTORICAL_APPLIED' });
    }

    const config = await getActiveCommissionConfig();
    if (!config.isConfigured) {
        return calculateCommission(grossAmount, null, { source: 'UNCONFIGURED' });
    }

    return calculateCommission(grossAmount, config.ratePercent, {
        source: config.source,
        configId: config.configId
    });
}

module.exports = {
    getActiveCommissionConfig,
    getActiveCommissionPercent,
    calculateCommission,
    calculateActiveCommission
};
