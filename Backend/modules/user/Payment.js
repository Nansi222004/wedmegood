const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Booking ID is required'],
        index: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Vendor ID is required'],
        index: true
    },
    quoteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote'
    },
    razorpayOrderId: {
        type: String,
        required: [true, 'Razorpay order ID is required'],
        index: true
    },
    razorpayPaymentId: {
        type: String,
        index: true
    },
    razorpaySignature: {
        type: String
    },
    amount: {
        type: Number,
        required: [true, 'Payment amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'INR'
    },
    commissionRate: {
        type: Number,
        default: null
    },
    commissionRatePercent: {
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
    commissionAmount: {
        type: Number,
        default: 0
    },
    vendorEarning: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: [
            'Created',
            'Pending',
            'Paid',
            'Completed',
            'Failed',
            'PartiallyRefunded',
            'Refunded'
        ],
        default: 'Pending',
        index: true
    },
    paymentMethod: {
        type: String,
        default: 'Razorpay'
    },
    failureInfo: {
        reason: String,
        code: String,
        failedAt: Date
    },
    notes: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ vendorId: 1, createdAt: -1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
