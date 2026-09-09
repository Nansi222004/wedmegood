const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: 'Premium Partner'
    },
    price: {
        type: Number,
        required: true,
        default: 4999
    },
    durationValue: {
        type: Number,
        default: 1
    },
    durationUnit: {
        type: String,
        enum: ['month', 'year'],
        default: 'year'
    },
    features: [String],
    isActive: {
        type: Boolean,
        default: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
