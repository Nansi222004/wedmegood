const mongoose = require('mongoose');

const vendorWalletSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Vendor ID is required'],
        unique: true,
        index: true
    },
    availableBalance: {
        type: Number,
        default: 0,
        min: [0, 'Available balance cannot be negative']
    },
    pendingBalance: {
        type: Number,
        default: 0,
        min: [0, 'Pending balance cannot be negative']
    },
    lockedBalance: {
        type: Number,
        default: 0,
        min: [0, 'Locked balance cannot be negative']
    },
    totalEarned: {
        type: Number,
        default: 0
    },
    totalCommission: {
        type: Number,
        default: 0
    },
    totalWithdrawn: {
        type: Number,
        default: 0
    },
    totalRefunded: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'INR'
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.VendorWallet || mongoose.model('VendorWallet', vendorWalletSchema);
