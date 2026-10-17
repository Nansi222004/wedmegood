const mongoose = require('mongoose');

// Stock promised to an event for a date range. Availability on any date is
// owned quantity minus everything reserved for overlapping events.
const stockReservationSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    status: { type: String, enum: ['Reserved', 'Released'], default: 'Reserved' },
    createdBy: { type: String, default: '' }
}, { timestamps: true });

stockReservationSchema.index({ inventoryId: 1, status: 1, fromDate: 1, toDate: 1 });

module.exports = mongoose.models.StockReservation || mongoose.model('StockReservation', stockReservationSchema);
