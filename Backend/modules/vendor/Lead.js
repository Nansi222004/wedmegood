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
    category: {
        type: String
    },
    guestCount: {
        type: Number,
        default: 0
    },
    budget: {
        type: Number,
        default: 0
    },
    requirements: {
        type: String
    },
    referencePhotos: [{
        type: String
    }],
    assignedType: {
        type: String,
        enum: ['Direct', 'RoundRobin'],
        default: 'Direct'
    },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Quote Sent', 'Booked', 'Rejected'],
        default: 'New'
    },
    isImportant: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
