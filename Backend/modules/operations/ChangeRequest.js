const mongoose = require('mongoose');

// Extra work after confirmation needs the customer's approval (and a price when it costs more)
const changeRequestSchema = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    amount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Withdrawn'], default: 'Pending' },
    respondedAt: { type: Date, default: null },
    customerNote: { type: String, default: '' },
    createdBy: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.models.ChangeRequest || mongoose.model('ChangeRequest', changeRequestSchema);
