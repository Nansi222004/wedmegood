const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Please provide a rating between 1 and 5'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Please provide a comment']
    },
    reply: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
