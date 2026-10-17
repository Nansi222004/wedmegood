const mongoose = require('mongoose');

// An outsourced work package of an event, offered to a verified sub-vendor
const subVendorPackageSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', required: true, index: true },
    subVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', required: true, index: true },
    fallbackSubVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', default: null },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    instructions: { type: String, trim: true, maxlength: 3000, default: '' },
    quantity: { type: String, default: '' },
    requiredAt: { type: Date, default: null },
    location: { type: String, default: '' },
    referenceMedia: [{ type: String }],
    // Owner-only
    agreedAmount: { type: Number, default: 0, min: 0 },
    advancePaid: { type: Number, default: 0, min: 0 },
    acceptBy: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Offered', 'Accepted', 'Declined', 'Expired', 'In progress', 'Completed', 'Approved', 'Cancelled'],
        default: 'Offered',
        index: true
    },
    declineReason: { type: String, default: '' },
    progress: [{ note: String, photo: String, at: { type: Date, default: Date.now }, by: String }],
    completionPhotos: [{ type: String }],
    approvedBy: { type: String, default: '' },
    approvedAt: { type: Date, default: null },
    settlementStatus: { type: String, enum: ['Unsettled', 'Settled'], default: 'Unsettled' },
    expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpsExpense', default: null },
    ownerAlertedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.SubVendorPackage || mongoose.model('SubVendorPackage', subVendorPackageSchema);
