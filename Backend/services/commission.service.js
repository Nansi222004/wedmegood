/**
 * Centralized Platform Commission Engine
 * Pure server-side financial calculations.
 */

// Fallback platform commission rate: environment variable or default 10%
const ENV_COMMISSION_PERCENT = Number(process.env.PLATFORM_COMMISSION_PERCENTAGE) ||
    Number(process.env.PLATFORM_COMMISSION_PERCENT) || 10;

const DEFAULT_COMMISSION_PERCENT = ENV_COMMISSION_PERCENT;

/**
 * Get active commission rate following strict precedence:
 * 1. Database PlatformSettings configured rate (if set)
 * 2. process.env.PLATFORM_COMMISSION_PERCENTAGE
 * 3. process.env.PLATFORM_COMMISSION_PERCENT
 * 4. Default fallback (10%)
 */
async function getActiveCommissionPercent() {
    try {
        const PlatformSettings = require('../modules/admin/PlatformSettings');
        const settings = await PlatformSettings.findOne().lean();
        if (settings && typeof settings.platformCommissionPercent === 'number' && !isNaN(settings.platformCommissionPercent)) {
            return Math.max(0, Math.min(100, settings.platformCommissionPercent));
        }
    } catch (err) {
        // Fallback gracefully to env / default
    }
    return ENV_COMMISSION_PERCENT;
}

/**
 * Synchronous commission calculation helper.
 * @param {number} grossAmount - Total booking/payment amount in INR.
 * @param {number} [customRatePercent] - Explicit or vendor-specific commission percent.
 * @returns {{ grossAmount: number, commissionRate: number, commissionPercent: number, commissionAmount: number, vendorEarning: number }}
 */
function calculateCommission(grossAmount, customRatePercent) {
    const gross = Math.max(0, Number(grossAmount) || 0);
    const percent = customRatePercent !== undefined && !isNaN(customRatePercent)
        ? Math.max(0, Math.min(100, Number(customRatePercent)))
        : DEFAULT_COMMISSION_PERCENT;

    const commissionRate = percent / 100;
    const commissionAmount = Math.round(gross * commissionRate * 100) / 100;
    const vendorEarning = Math.round((gross - commissionAmount) * 100) / 100;

    return {
        grossAmount: gross,
        commissionRate,
        commissionPercent: percent,
        rate: percent,
        commissionAmount,
        commission: commissionAmount,
        vendorEarning
    };
}

/**
 * Asynchronous commission calculation helper that checks active PlatformSettings.
 */
async function calculateActiveCommission(grossAmount, customRatePercent) {
    let rate = customRatePercent;
    if (rate === undefined || isNaN(rate)) {
        rate = await getActiveCommissionPercent();
    }
    return calculateCommission(grossAmount, rate);
}

module.exports = {
    DEFAULT_COMMISSION_PERCENT,
    getActiveCommissionPercent,
    calculateCommission,
    calculateActiveCommission
};
