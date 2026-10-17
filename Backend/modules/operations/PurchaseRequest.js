const mongoose = require('mongoose');

// Crew finds a shortage -> requests a purchase -> owner approves -> purchaser records the invoice
// -> stock is updated (reusable) or the material cost is charged to the event (consumable)
const purchaseRequestSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', default: null, index: true },
    number: { type: String, required: true },
    items: [{
        inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', default: null },
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, default: 'pcs' },
        stockType: { type: String, enum: ['Reusable', 'Consumable'], default: 'Consumable' },
        quantityReceived: { type: Number, default: 0, min: 0 }
    }],
    reason: { type: String, trim: true, maxlength: 1000, default: '' },
    neededBy: { type: Date, default: null },
    referencePhoto: { type: String, default: '' },
    requestedBy: { type: String, default: '' },
    requestedByMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', default: null },
    status: { type: String, enum: ['Requested', 'Approved', 'Rejected', 'Purchased', 'Cancelled'], default: 'Requested', index: true },
    decidedBy: { type: String, default: '' },
    decidedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    purchase: {
        supplier: { type: String, default: '' },
        invoiceNumber: { type: String, default: '' },
        invoicePhoto: { type: String, default: '' },
        amount: { type: Number, default: 0, min: 0 },
        paymentMethod: { type: String, default: '' },
        purchasedBy: { type: String, default: '' },
        purchasedAt: { type: Date, default: null },
        expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpsExpense', default: null }
    }
}, { timestamps: true });

purchaseRequestSchema.index({ vendorId: 1, number: 1 }, { unique: true });

module.exports = mongoose.models.PurchaseRequest || mongoose.model('PurchaseRequest', purchaseRequestSchema);
