const mongoose = require('mongoose');

const TASK_STATUSES = ['Not started', 'Assigned', 'Accepted', 'In progress', 'Blocked', 'Completed', 'Verified'];

// One preparation task of an event ("Groom's decorated coconut" is its own task, not hidden in "decoration")
const workspaceTaskSchema = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: '' },
    deadline: { type: Date, default: null },
    mandatory: { type: Boolean, default: true },
    assigneeMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', default: null, index: true },
    requiredStock: [{
        inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
        quantity: { type: Number, min: 0, default: 0 }
    }],
    purchaseNeeded: { type: Boolean, default: false },
    referenceMedia: [{ type: String }],
    status: { type: String, enum: TASK_STATUSES, default: 'Not started', index: true },
    blockedReason: { type: String, default: '' },
    completionPhotos: [{ type: String }],
    completedAt: { type: Date, default: null },
    completedBy: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: String, default: '' },
    escalatedAt: { type: Date, default: null },
    source: { type: String, enum: ['manual', 'quote', 'copied', 'change-request'], default: 'manual' },
    order: { type: Number, default: 0 },
    history: [{
        status: String,
        note: { type: String, default: '' },
        by: String,
        at: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

workspaceTaskSchema.statics.STATUSES = TASK_STATUSES;

module.exports = mongoose.models.WorkspaceTask || mongoose.model('WorkspaceTask', workspaceTaskSchema);
