const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    subject: {
        type: String,
        required: [true, 'Please provide a subject']
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: ['Payments', 'Profile', 'Leads', 'Bookings', 'Technical', 'Other']
    },
    message: {
        type: String,
        required: [true, 'Please provide message details']
    },
    status: {
        type: String,
        enum: ['Open', 'In-Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    replies: [{
        senderId: mongoose.Schema.Types.ObjectId,
        senderRole: { type: String, enum: ['Vendor', 'Admin'] },
        message: String,
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
