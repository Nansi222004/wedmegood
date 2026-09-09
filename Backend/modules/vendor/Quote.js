const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        service: { type: String, required: true },
        description: String,
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 }
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Sent', 'Accepted', 'Rejected', 'Expired'],
        default: 'Pending'
    },
    validUntil: {
        type: Date
    },
    notes: String,
    terms: String
}, {
    timestamps: true
});

module.exports = mongoose.models.Quote || mongoose.model('Quote', quoteSchema);
