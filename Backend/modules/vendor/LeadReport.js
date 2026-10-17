const mongoose = require('mongoose');

// A vendor flags a lead as suspicious (fake details, unreachable customer...). Reviewed by the admin;
// a report never penalises the customer automatically.
const leadReportSchema = new mongoose.Schema({
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reason: {
        type: String,
        enum: ['fake_details', 'unreachable', 'duplicate', 'abusive', 'not_genuine', 'other'],
        required: true
    },
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Dismissed'],
        default: 'Pending',
        index: true
    },
    adminNotes: { type: String, trim: true, maxlength: 2000, default: '' },
    reviewedAt: { type: Date, default: null }
}, {
    timestamps: true
});

leadReportSchema.index({ leadId: 1, vendorId: 1 }, { unique: true });

leadReportSchema.statics.REASONS = {
    fake_details: 'Fake or wrong event details',
    unreachable: 'Customer cannot be reached',
    duplicate: 'Duplicate enquiry',
    abusive: 'Abusive behaviour',
    not_genuine: 'Not a genuine requirement',
    other: 'Other'
};

module.exports = mongoose.models.LeadReport || mongoose.model('LeadReport', leadReportSchema);
