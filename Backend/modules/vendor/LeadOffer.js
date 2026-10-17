const mongoose = require('mongoose');

// One time-limited offer of a lead to one vendor (the 30-second buzzer).
// Kept for every attempt so assignments are auditable and vendors see honest stats:
// a vendor who never responded is recorded as Expired, not as having declined.
const leadOfferSchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true,
        index: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    attempt: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: [
            'Pending',          // waiting for the vendor
            'Accepted',
            'Declined',         // vendor gave a reason
            'Expired',          // vendor did not respond in time (missed)
            'Lapsed',           // vendor accepted but did not contact the customer in time
            'Withdrawn',        // vendor gave the lead back after accepting
            'CustomerDeclined', // customer turned this vendor down after acceptance
            'Revoked'           // cancelled by the system/customer/admin while pending
        ],
        default: 'Pending',
        index: true
    },
    offeredAt: { type: Date, default: Date.now },
    // Set when the vendor's device shows the offer; the response window starts then
    deliveredAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    respondedAt: { type: Date, default: null },
    declineReason: {
        type: String,
        enum: [null, 'date_unavailable', 'budget_low', 'outside_area', 'service_not_offered', 'workload', 'insufficient_details', 'other'],
        default: null
    },
    declineNote: { type: String, default: '', maxlength: 500 },
    // Why this vendor was chosen
    match: {
        stage: { type: Number, default: 1 },
        coverage: { type: String, default: '' }, // pincode | radius | city | district | travel | expanded
        distanceKm: { type: Number, default: null },
        rotationKey: { type: String, default: '' }
    }
}, {
    timestamps: true
});

leadOfferSchema.index({ status: 1, expiresAt: 1 });
leadOfferSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
leadOfferSchema.index({ leadId: 1, vendorId: 1 });

leadOfferSchema.statics.DECLINE_REASONS = {
    date_unavailable: 'Event date unavailable',
    budget_low: 'Customer budget too low',
    outside_area: 'Location outside service area',
    service_not_offered: 'Required service not offered',
    workload: 'Already booked / workload too high',
    insufficient_details: 'Insufficient event details',
    other: 'Other reason'
};

module.exports = mongoose.models.LeadOffer || mongoose.model('LeadOffer', leadOfferSchema);
