const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please select a category']
    },
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
