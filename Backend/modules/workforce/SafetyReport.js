const mongoose = require('mongoose');

const SAFETY_KINDS = ['Emergency', 'Harassment or abuse', 'Unsafe site', 'Injury', 'Threat or intimidation', 'Other'];

// A worker or poster asking the Utsavo team for help during a job
const safetyReportSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkJob', required: true, index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkAssignment', default: null },
    reportedBy: { type: String, enum: ['Worker', 'Poster'], required: true },
    reporterName: { type: String, default: '' },
    reporterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reporterVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
    reporterPhone: { type: String, default: '' },
    kind: { type: String, enum: SAFETY_KINDS, required: true },
    details: { type: String, trim: true, maxlength: 2000, default: '' },
    location: { lat: { type: Number, default: null }, lng: { type: Number, default: null } },
    status: { type: String, enum: ['Open', 'Acknowledged', 'Resolved'], default: 'Open', index: true },
    acknowledgedAt: { type: Date, default: null },
    acknowledgedBy: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
    actionTaken: { type: String, trim: true, maxlength: 2000, default: '' }
}, { timestamps: true });

safetyReportSchema.statics.KINDS = SAFETY_KINDS;

module.exports = mongoose.models.SafetyReport || mongoose.model('SafetyReport', safetyReportSchema);
