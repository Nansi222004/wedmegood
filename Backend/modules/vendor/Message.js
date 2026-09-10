const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['User', 'Vendor']
    },
    text: {
        type: String,
        required: true
    },
    attachments: [{
        url: String,
        type: { type: String, enum: ['Image', 'Document', 'Video'] },
        name: String
    }],
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
