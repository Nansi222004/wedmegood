const mongoose = require('mongoose');

// One time-limited offer of a job to one worker
const workOfferSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkJob', required: true, index: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true, index: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Declined', 'Expired', 'Revoked', 'Full'], default: 'Pending', index: true },
    offeredAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    respondedAt: { type: Date, default: null },
    declineReason: { type: String, default: '' },
    distanceKm: { type: Number, default: null },
    round: { type: Number, default: 1 }
}, { timestamps: true });

workOfferSchema.index({ status: 1, expiresAt: 1 });
workOfferSchema.index({ jobId: 1, workerId: 1 });

module.exports = mongoose.models.WorkOffer || mongoose.model('WorkOffer', workOfferSchema);
