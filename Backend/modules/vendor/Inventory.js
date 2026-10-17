const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    // Required by the catalogue form; stock items bought through purchase requests may have none
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    // Stock master (event operations)
    itemCode: { type: String, trim: true, default: '' },
    unit: { type: String, trim: true, default: 'pcs' },
    // Reusable items (frames, pillars, lights) go out and must come back; consumables (flowers, tape) are used up
    stockType: { type: String, enum: ['Reusable', 'Consumable'], default: 'Reusable' },
    storageLocation: { type: String, trim: true, default: '' },
    condition: { type: String, enum: ['Good', 'Needs repair', 'Damaged'], default: 'Good' },
    reorderLevel: { type: Number, default: 0, min: 0 },
    unitCost: { type: Number, default: 0, min: 0 },
    itemName: {
        type: String,
        required: [true, 'Inventory item name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    totalQuantity: {
        type: Number,
        required: true,
        min: [0, 'Quantity cannot be negative'],
        default: 0
    },
    availableQuantity: {
        type: Number,
        required: true,
        min: [0, 'Available quantity cannot be negative'],
        default: 0
    },
    pricePerUnit: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
        default: 0
    },
    images: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
