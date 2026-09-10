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
    action: {
        type: String,
        required: true
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
    details: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.AdminLog || mongoose.model('AdminLog', adminLogSchema);
