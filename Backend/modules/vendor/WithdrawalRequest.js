const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Vendor ID is required'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Withdrawal amount is required'],
        min: [1, 'Minimum withdrawal amount is ₹1']
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: [
            'Requested',
            'Pending',
            'Approved',
            'Processing',
            'Paid',
            'Rejected',
            'Failed',
            'Cancelled'
        ],
        default: 'Requested',
        index: true
    },
    payoutMethod: {
        type: String,
        enum: ['BankTransfer', 'UPI'],
        default: 'BankTransfer'
    },
    bankDetails: {
        accountName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        ifsc: { type: String, trim: true },
        upiId: { type: String, trim: true }
    },
    adminNotes: {
        type: String,
        trim: true
    },
    payoutReference: {
        type: String,
        trim: true,
        index: true
    },
    processedAt: {
        type: Date
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionReason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

withdrawalRequestSchema.index({ vendorId: 1, createdAt: -1 });

module.exports = mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
