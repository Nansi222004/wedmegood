const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true,
        enum: ['privacy-policy', 'terms-conditions']
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Policy || mongoose.model('Policy', policySchema);
