const mongoose = require('mongoose');

// A confirmed job card: what was agreed, then what actually happened (attendance, hours, pay)
const workAssignmentSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkJob', required: true, index: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true, index: true },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOffer', default: null },
    agreedPay: { type: Number, required: true },
    agreedHours: { type: Number, default: 0 },
    overtimeRatePerHour: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Confirmed', 'CheckedIn', 'CheckedOut', 'Approved', 'Disputed', 'Paid', 'NoShow', 'Cancelled'],
        default: 'Confirmed',
        index: true
    },
    checkInAt: { type: Date, default: null },
    checkInBy: { type: String, default: '' },
    checkOutAt: { type: Date, default: null },
    breakMinutes: { type: Number, default: 0 },
    // Overtime only counts when the poster approved it
    overtimeHours: { type: Number, default: 0 },
    overtimeApprovedBy: { type: String, default: '' },
    totalPayable: { type: Number, default: 0 },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: '' },
    dispute: {
        raisedBy: { type: String, enum: ['', 'Worker', 'Poster'], default: '' },
        reason: { type: String, default: '' },
        raisedAt: { type: Date, default: null },
        resolution: { type: String, default: '' },
        resolvedAt: { type: Date, default: null }
    },
    payment: {
        method: { type: String, default: '' },
        reference: { type: String, default: '' },
        paidAt: { type: Date, default: null },
        receiptNumber: { type: String, default: '' }
    },
    workerConfirmedPaymentAt: { type: Date, default: null },
    rating: { type: Number, min: 1, max: 5, default: null },
    expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpsExpense', default: null },
    cancelledBy: { type: String, default: '' },
    cancelReason: { type: String, default: '' }
}, { timestamps: true });

workAssignmentSchema.index({ jobId: 1, workerId: 1 }, { unique: true });

module.exports = mongoose.models.WorkAssignment || mongoose.model('WorkAssignment', workAssignmentSchema);
