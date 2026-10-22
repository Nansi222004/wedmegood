const mongoose = require('mongoose');
const { CONDUCT_LEVELS } = require('../../utils/conduct');

// What vendors commonly face; a report picks one or more
const CUSTOMER_ISSUES = [
    'Not supportive during the work',
    'Disrespectful to vendor or staff',
    'Stubborn or delaying payment',
    'Frequent last-minute changes',
    'Abusive language or threats',
    'Did not turn up / cancelled without notice',
    'Other'
];

const level = { type: String, enum: CONDUCT_LEVELS, required: true };

/**
 * A vendor's report about a customer's behaviour. The customer can give their side, and only
 * reports the admin confirms are shown to other vendors (without saying which vendor reported).
 */
const customerReportSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    conduct: {
        respect: level,        // respecting the vendor and staff
        support: level,        // support during the work
        payment: level,        // payment behaviour
        communication: level,
        approach: level
    },
    issues: [{ type: String, enum: CUSTOMER_ISSUES }],
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Rejected'], default: 'Pending', index: true },
    customerResponse: {
        statement: { type: String, trim: true, maxlength: 2000, default: '' },
        respondedAt: { type: Date, default: null }
    },
    adminNote: { type: String, trim: true, maxlength: 1000, default: '' },
    decidedAt: { type: Date, default: null },
    decidedBy: { type: String, default: '' }
}, { timestamps: true });

customerReportSchema.index({ userId: 1, status: 1 });
customerReportSchema.statics.ISSUES = CUSTOMER_ISSUES;
customerReportSchema.statics.ASPECTS = ['respect', 'support', 'payment', 'communication', 'approach'];

module.exports = mongoose.models.CustomerReport || mongoose.model('CustomerReport', customerReportSchema);
