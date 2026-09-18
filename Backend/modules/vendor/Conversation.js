const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
        index: true
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        default: null,
        index: true
    },
    leadHistory: [{
        leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
        linkedAt: { type: Date, default: Date.now }
    }],
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        default: null,
        index: true
    },
    status: {
        type: String,
        enum: ['Active', 'Closed', 'Blocked'],
        default: 'Active',
        index: true
    },
    userUnreadCount: {
        type: Number,
        default: 0
    },
    vendorUnreadCount: {
        type: Number,
        default: 0
    },
    // Backwards-compatible legacy fields
    participants: [{
        participantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        participantModel: {
            type: String,
            required: true,
            enum: ['User', 'Vendor']
        }
    }],
    lastMessage: {
        text: String,
        senderId: mongoose.Schema.Types.ObjectId,
        senderRole: { type: String, enum: ['User', 'Vendor', 'System', 'Admin'] },
        type: { type: String, default: 'text' },
        createdAt: Date
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
});

conversationSchema.index({ userId: 1, vendorId: 1 }, { unique: true });
conversationSchema.index({ userId: 1, updatedAt: -1 });
conversationSchema.index({ vendorId: 1, updatedAt: -1 });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
