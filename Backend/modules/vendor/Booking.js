const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customerName: {
        type: String
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    },
    quoteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote',
        unique: true,
        sparse: true
    },
    eventDate: {
        type: Date,
        required: [true, 'Please provide event date']
    },
    location: {
        type: String,
        required: [true, 'Please provide event location']
    },
    eventType: {
        type: String,
        enum: ['Wedding', 'Reception', 'Haldi', 'Engagement', 'Corporate', 'Other'],
        default: 'Wedding'
    },
    venueType: {
        type: String,
        enum: ['Outdoor', 'Indoor', 'Both', 'Not Specified'],
        default: 'Not Specified'
    },
    services: [{
        type: String
    }],
    guestCount: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partial', 'Paid', 'Refunded'],
        default: 'Pending'
    },
    quoteSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    advancePaymentRequired: {
        type: Number,
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    outstandingBalance: {
        type: Number,
        default: 0
    },
    commission: {
        type: Number,
        default: 0
    },
    commissionRatePercent: {
        type: Number,
        default: null
    },
    commissionRate: {
        type: Number,
        default: null
    },
    commissionBasis: {
        type: String,
        default: 'GROSS_PACKAGE_AMOUNT'
    },
    commissionConfigSource: {
        type: String,
        default: null
    },
    vendorEarning: {
        type: Number,
        default: 0
    },
    settlementStatus: {
        type: String,
        enum: ['Pending', 'Eligible', 'Settled', 'Refunded'],
        default: 'Pending'
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundedAt: {
        type: Date
    },
    cancellationReason: {
        type: String
    },
    cancelledBy: {
        type: String,
        enum: ['User', 'Vendor', 'Admin']
    },
    cancelledAt: {
        type: Date
    },
    // Booking payments are made outside the app. The vendor records what was received here,
    // for reference only; totalPrice is the finalised amount.
    paymentEntries: [{
        amount: { type: Number, required: true, min: [1, 'Amount must be at least 1'] },
        mode: {
            type: String,
            enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'],
            default: 'Other'
        },
        paidOn: { type: Date, default: Date.now },
        note: { type: String, trim: true, maxlength: 300, default: '' },
        recordedBy: { type: String, enum: ['Vendor'], default: 'Vendor' },
        createdAt: { type: Date, default: Date.now }
    }],
    // When the user accepted the platform terms (including the cancellation policy)
    termsAcceptedAt: {
        type: Date
    },
    // Set when the user cancels with less notice than the cancellation policy requires;
    // the full amount stays payable to the vendor.
    lateCancellation: {
        type: Boolean,
        default: false
    },
    daysNoticeAtCancellation: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Lookups by owner (lists), by vendor + date (availability / conflicts) and by quote
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ vendorId: 1, eventDate: 1, status: 1 });
bookingSchema.index({ vendorId: 1, createdAt: -1 });

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

