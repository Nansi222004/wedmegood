const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    quotationNumber: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    version: {
        type: Number,
        default: 1
    },
    supersededBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote',
        default: null
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
        index: true
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [{
        service: { type: String, required: true },
        description: { type: String, default: '' },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: '' },
        // Included services vs transport / labour / equipment / material lines vs optional extras
        // (optional extras are priced but not part of the total)
        kind: { type: String, enum: ['Included', 'Transport', 'Labour', 'Equipment', 'Material', 'Optional extra'], default: 'Included' },
        amount: { type: Number, default: 0 }
    }],
    optionalExtrasTotal: { type: Number, default: 0 },
    // What the price covers, what it does not, and what the customer must arrange
    scopeIncluded: { type: String, default: '' },
    exclusions: { type: String, default: '' },
    customerResponsibilities: { type: String, default: '' },
    setupTime: { type: String, default: '' },
    dismantleTime: { type: String, default: '' },
    overtimeCharges: { type: String, default: '' },
    referencePhotos: [{ type: String }],
    // Off on peak days when the vendor offers no cancellation; shown to the customer before accepting
    cancellationAllowed: { type: Boolean, default: true },
    revisionRequest: {
        note: { type: String, default: '' },
        requestedAt: { type: Date, default: null }
    },
    subtotal: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    discountPercent: {
        type: Number,
        default: 0
    },
    taxRatePercent: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0,
        required: true
    },
    advancePaymentAmount: {
        type: Number,
        default: 0
    },
    advancePaymentPercent: {
        type: Number,
        default: 0
    },
    milestonePaymentTerms: [{
        milestone: { type: String, default: '' },
        percentage: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
        dueDescription: { type: String, default: '' }
    }],
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Sent', 'Revision Requested', 'Accepted', 'Rejected', 'Expired', 'Superseded', 'Cancelled'],
        default: 'Sent',
        index: true
    },
    validUntil: {
        type: Date
    },
    notes: {
        type: String,
        default: ''
    },
    terms: {
        type: String,
        default: ''
    },
    cancellationTerms: {
        type: String,
        default: ''
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        default: null
    },
    acceptedSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date,
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Auto-generate unique quotation number before save if not present
quoteSchema.pre('save', function (next) {
    if (!this.quotationNumber) {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        const suffix = this._id ? this._id.toString().slice(-4).toUpperCase() : randomHex;
        this.quotationNumber = `UTS-QT-${yearMonth}-${suffix}`;
    }
    if (typeof next === 'function') {
        next();
    }
});

module.exports = mongoose.models.Quote || mongoose.model('Quote', quoteSchema);
