const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // User might not be logged in or lead might be from a guest inquiry
    },
    customerName: {
        type: String,
        required: [true, 'Please provide customer name']
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number']
    },
    eventDate: {
        type: Date,
        required: [true, 'Please provide event date']
    },
    eventLocation: {
        type: String,
        required: [true, 'Please provide event location']
    },
    message: {
        type: String,
        required: [true, 'Please provide inquiry message']
    },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Quote Sent', 'Booked', 'Rejected'],
        default: 'New'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
