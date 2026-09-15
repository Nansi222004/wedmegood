const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        default: 'System'
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adminEmail: {
        type: String,
        default: null
    },
    action: {
        type: String,
        required: true
    },
    entityType: {
        type: String,
        enum: ['Vendor', 'User', 'Category', 'SubCategory', 'Booking', 'Review', 'Complaint', 'Withdrawal', 'Refund', 'Settings', 'Banner', 'Policy', 'Support', 'ChatReport', 'System'],
        default: 'System'
    },
    entityId: {
        type: String,
        default: null
    },
    targetId: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    before: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    after: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    reason: {
        type: String,
        default: ''
    },
    target: {
        type: String,
        default: 'System'
    },
    level: {
        type: String,
        enum: ['Info', 'Warning', 'Critical', 'Success'],
        default: 'Info'
    },
    ip: {
        type: String,
        default: 'Local'
    },
    userAgent: {
        type: String,
        default: ''
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true
});

adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ entityType: 1, entityId: 1 });
adminLogSchema.index({ action: 1 });

module.exports = mongoose.models.AdminLog || mongoose.model('AdminLog', adminLogSchema);
