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
        enum: ['Confirmed', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Confirmed'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partial', 'Paid', 'Refunded'],
        default: 'Pending'
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
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

