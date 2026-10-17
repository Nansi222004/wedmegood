const mongoose = require('mongoose');

// Material leaving the godown for an event, and coming back
const gatePassSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', required: true, index: true },
    number: { type: String, required: true },
    destination: { type: String, default: '' },
    vehicleNumber: { type: String, trim: true, uppercase: true, default: '' },
    driverName: { type: String, default: '' },
    driverMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', default: null },
    trip: { type: Number, default: 1 },
    items: [{
        inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
        name: String,
        stockType: { type: String, enum: ['Reusable', 'Consumable'], default: 'Reusable' },
        qtyOut: { type: Number, min: 0, default: 0 },
        packed: { type: Boolean, default: false },
        qtyReturned: { type: Number, min: 0, default: 0 },
        qtyDamaged: { type: Number, min: 0, default: 0 },
        qtyConsumed: { type: Number, min: 0, default: 0 },
        qtyMissing: { type: Number, min: 0, default: 0 }
    }],
    status: { type: String, enum: ['Draft', 'Dispatched', 'Received', 'Returned', 'Closed'], default: 'Draft', index: true },
    issuedBy: { type: String, default: '' },
    issuedAt: { type: Date, default: null },
    receivedBy: { type: String, default: '' },
    receivedAt: { type: Date, default: null },
    returnDueDate: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    returnCheckedBy: { type: String, default: '' },
    approvedBy: { type: String, default: '' },
    photos: [{ type: String }],
    notes: { type: String, default: '' }
}, { timestamps: true });

gatePassSchema.index({ vendorId: 1, number: 1 }, { unique: true });

module.exports = mongoose.models.GatePass || mongoose.model('GatePass', gatePassSchema);
