const mongoose = require('mongoose');

const chatReportSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'reporterModel',
        index: true
    },
    reporterRole: {
        type: String,
        required: true,
        enum: ['User', 'Vendor']
    },
    reporterModel: {
        type: String,
        enum: ['User', 'Vendor'],
        default: function() {
            return this.reporterRole || 'User';
        }
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null,
        index: true
    },
    reason: {
        type: String,
        required: true,
        enum: ['Inappropriate Content', 'Harassment', 'Spam', 'Fraud', 'Other']
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'In-Review', 'Resolved', 'Dismissed'],
        default: 'Pending',
        index: true
    },
    adminNotes: {
        type: String,
        default: ''
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    }
}, {
    timestamps: true
});

chatReportSchema.index({ conversationId: 1, reporterId: 1, messageId: 1, status: 1 });

module.exports = mongoose.models.ChatReport || mongoose.model('ChatReport', chatReportSchema);
