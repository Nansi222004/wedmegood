const mongoose = require('mongoose');

// Every change to an item's stock, so the balance can always be explained
const stockMovementSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },
    type: {
        type: String,
        enum: ['Opening', 'Purchase', 'Dispatch', 'Return', 'Consumed', 'Damaged', 'Missing', 'Recovered', 'WriteOff', 'Adjustment'],
        required: true
    },
    // Change to the owned quantity (dispatch/return do not change ownership, they are recorded with 0)
    ownedChange: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', default: null },
    ref: { type: String, default: '' }, // gate pass / purchase number
    note: { type: String, default: '' },
    by: { type: String, default: '' },
    at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.StockMovement || mongoose.model('StockMovement', stockMovementSchema);
