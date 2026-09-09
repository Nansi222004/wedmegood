const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    message: {
        type: String,
        required: [true, 'Please provide notification message']
    },
    type: {
        type: String,
        enum: ['Lead', 'Booking', 'Review', 'System'],
        default: 'System'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
