const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
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

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
