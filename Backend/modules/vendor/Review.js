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
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    photos: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Approved'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for query performance and review lookups
reviewSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1, userId: 1 });

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
