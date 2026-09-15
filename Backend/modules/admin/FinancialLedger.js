const mongoose = require('mongoose');

const financialLedgerSchema = new mongoose.Schema({
    entryType: {
        type: String,
        enum: [
            'CUSTOMER_PAYMENT',
            'PLATFORM_COMMISSION',
            'VENDOR_EARNING',
            'REFUND',
            'VENDOR_WITHDRAWAL',
            'VENDOR_SETTLEMENT',
            'PAYOUT_REVERSAL',
            'ADJUSTMENT'
        ],
        required: [true, 'Ledger entry type is required'],
        index: true
    },
    direction: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
        required: [true, 'Ledger direction (CREDIT/DEBIT) is required']
    },
    amount: {
        type: Number,
        required: [true, 'Transaction amount is required'],
        min: [0, 'Ledger amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'INR'
    },
    referenceId: {
        type: String,
        trim: true,
        index: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        index: true
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        index: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    withdrawalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WithdrawalRequest',
        index: true
    },
    status: {
        type: String,
        enum: ['POSTED', 'PENDING', 'CANCELLED'],
        default: 'POSTED',
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Composite indices for auditing and reporting
financialLedgerSchema.index({ vendorId: 1, createdAt: -1 });
financialLedgerSchema.index({ entryType: 1, createdAt: -1 });
financialLedgerSchema.index({ createdAt: -1 });

module.exports = mongoose.models.FinancialLedger || mongoose.model('FinancialLedger', financialLedgerSchema);
