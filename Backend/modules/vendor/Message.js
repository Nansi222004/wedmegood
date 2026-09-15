const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    senderRole: {
        type: String,
        required: true,
        enum: ['User', 'Vendor', 'System', 'Admin']
    },
    senderModel: {
        type: String,
        enum: ['User', 'Vendor', 'Admin', 'System'],
        default: function() {
            return this.senderRole || 'User';
        }
    },
    type: {
        type: String,
        enum: ['text', 'image', 'document', 'quote', 'system', 'voice'],
        default: 'text',
        index: true
    },
    text: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: ''
    },
    clientMessageId: {
        type: String,
        sparse: true,
        trim: true
    },
    attachments: [{
        url: { type: String, required: true },
        type: { type: String, enum: ['Image', 'Document', 'Video', 'Audio', 'image', 'document', 'voice'], default: 'Image' },
        name: { type: String, default: '' },
        size: { type: Number, default: 0 },
        mimeType: { type: String, default: '' }
    }],
    quoteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote',
        default: null,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    },
    deliveredAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index(
    { conversationId: 1, senderId: 1, clientMessageId: 1 },
    { unique: true, partialFilterExpression: { clientMessageId: { $type: 'string' } } }
);
messageSchema.index({ conversationId: 1, isRead: 1 });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
