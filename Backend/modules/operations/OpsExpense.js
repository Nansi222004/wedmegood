const mongoose = require('mongoose');

const EVENT_CATEGORIES = ['Materials', 'Labour', 'Transport', 'Food', 'Equipment rental', 'Sub-vendor', 'Damage', 'Miscellaneous'];
const OVERHEAD_CATEGORIES = ['Godown rent', 'Warehouse wages', 'Security', 'Electricity & water', 'Office & internet', 'Equipment maintenance', 'Vehicle costs', 'Other overhead'];

// Every rupee spent: on an event (scope Event) or on running the business (scope Overhead).
// Named OpsExpense so it never clashes with the platform's own financial ledger.
const opsExpenseSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    scope: { type: String, enum: ['Event', 'Overhead'], required: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', default: null, index: true },
    date: { type: Date, default: Date.now, index: true },
    category: { type: String, required: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    quantity: { type: Number, default: 1, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque', 'Credit (unpaid)'], default: 'Cash' },
    paidBy: { type: String, default: '' },
    payee: { type: String, trim: true, default: '' },          // vendor / supplier / worker
    receiptNumber: { type: String, trim: true, default: '' },
    receiptPhoto: { type: String, default: '' },
    // Labour and transport detail so costs can be checked against the event
    workers: { type: Number, default: 0, min: 0 },
    hours: { type: Number, default: 0, min: 0 },
    vehicle: { type: String, default: '' },
    trips: { type: Number, default: 0, min: 0 },
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved', index: true },
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid'], default: 'Paid' },
    // Where it came from: typed in, a crew claim, a purchase, a confirmed shift, a sub-vendor package
    source: { type: String, enum: ['manual', 'claim', 'purchase', 'crew-shift', 'workforce', 'subvendor', 'shortage'], default: 'manual' },
    sourceRef: { type: String, default: '' },
    claimedByMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', default: null },
    possibleDuplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'OpsExpense', default: null },
    deletedAt: { type: Date, default: null },
    // Locked audit history of edits, approvals and deletions
    audit: [{
        action: String,
        by: String,
        at: { type: Date, default: Date.now },
        changes: { type: mongoose.Schema.Types.Mixed, default: null }
    }]
}, { timestamps: true });

opsExpenseSchema.index({ vendorId: 1, scope: 1, date: -1 });

opsExpenseSchema.statics.EVENT_CATEGORIES = EVENT_CATEGORIES;
opsExpenseSchema.statics.OVERHEAD_CATEGORIES = OVERHEAD_CATEGORIES;

module.exports = mongoose.models.OpsExpense || mongoose.model('OpsExpense', opsExpenseSchema);
