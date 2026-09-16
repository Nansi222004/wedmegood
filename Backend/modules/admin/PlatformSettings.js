const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
    // Configurable platform commission percent (0 - 100).
    // If null/undefined, falls back to process.env.PLATFORM_COMMISSION_PERCENTAGE.
    platformCommissionPercent: {
        type: Number,
        default: null,
        min: [0, 'Commission percentage cannot be negative'],
        max: [100, 'Commission percentage cannot exceed 100']
    },
    // Service GST percent if configured (0 - 100).
    // Stored as nullable/unconfigured per canonical requirements.
    serviceGstPercent: {
        type: Number,
        default: null,
        min: [0, 'GST percentage cannot be negative'],
        max: [100, 'GST percentage cannot exceed 100']
    },
    // Minimum vendor payout withdrawal amount (>= 0).
    // Stored as nullable/unconfigured unless explicitly set by Admin.
    minWithdrawalAmount: {
        type: Number,
        default: null,
        min: [0, 'Minimum withdrawal amount cannot be negative']
    },
    // Platform operational state flags
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    autoPayouts: {
        type: Boolean,
        default: false
    },
    // Audit metadata
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', platformSettingsSchema);
