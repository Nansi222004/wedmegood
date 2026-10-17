const mongoose = require('mongoose');

// Crew work wallet: earnings, advances and payments. Balance = earnings - advances - payments.
const walletEntrySchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', required: true, index: true },
    type: { type: String, enum: ['Earning', 'Advance', 'Payment'], required: true },
    amount: { type: Number, required: true, min: 0 },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', default: null },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'CrewShift', default: null },
    method: { type: String, default: '' },
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    by: { type: String, default: '' }
}, { timestamps: true });

walletEntrySchema.index({ shiftId: 1 }, { unique: true, partialFilterExpression: { shiftId: { $type: 'objectId' } } });

module.exports = mongoose.models.WalletEntry || mongoose.model('WalletEntry', walletEntrySchema);
