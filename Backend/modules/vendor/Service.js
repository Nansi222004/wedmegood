const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Service name is required'],
        trim: true
    },
    shortDescription: {
        type: String,
        required: [true, 'Short description is required'],
        maxLength: [150, 'Short description cannot exceed 150 characters']
    },
    detailedDescription: {
        type: String,
        required: [true, 'Detailed description is required']
    },
    features: [{
        type: String,
        trim: true
    }],
    coverImage: {
        type: String,
        required: [true, 'Cover image is required']
    },
    gallery: [{
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], default: 'image' }
    }],
    price: {
        original: {
            type: Number,
            required: [true, 'Original price is required']
        },
        discounted: {
            type: Number
        },
        currency: {
            type: String,
            default: 'INR'
        }
    },
    rating: {
        score: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    // Guests the service can handle, used by "for 300 guests" searches. Empty means not stated.
    capacity: {
        minGuests: { type: Number, default: null, min: 0 },
        maxGuests: { type: Number, default: null, min: 0 }
    },
    // On-site needs and options (see utils/serviceSetup SETUP_TAGS)
    setupTags: [{ type: String, enum: require('../../utils/serviceSetup').SETUP_TAGS }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
