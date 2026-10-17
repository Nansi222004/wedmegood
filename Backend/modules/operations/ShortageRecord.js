const mongoose = require('mongoose');

// Reusable stock that went out on a gate pass and did not come back. The stock balance is not
// reduced silently: the owner recovers it, charges it to the event or writes it off.
const shortageRecordSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', required: true },
    gatePassId: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePass', required: true },
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    itemName: { type: String, default: '' },
    kind: { type: String, enum: ['Missing', 'Damaged'], default: 'Missing' },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['Open', 'Recovered', 'WrittenOff'], default: 'Open', index: true },
    resolutionNote: { type: String, default: '' },
    resolvedBy: { type: String, default: '' },
    resolvedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.ShortageRecord || mongoose.model('ShortageRecord', shortageRecordSchema);
