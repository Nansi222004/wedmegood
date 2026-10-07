const mongoose = require('mongoose');

// The vendor the platform assigned to a user for a category (the "Swiggy style" default vendor).
// One allocation per user per category, so revisiting the category does not advance the rotation.
const vendorAllocationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    categoryKey: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    rotationKey: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

vendorAllocationSchema.index({ userId: 1, categoryKey: 1 }, { unique: true });
vendorAllocationSchema.index({ userId: 1, vendorId: 1 });

module.exports = mongoose.models.VendorAllocation || mongoose.model('VendorAllocation', vendorAllocationSchema);
