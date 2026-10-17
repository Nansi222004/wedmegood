const mongoose = require('mongoose');

// In-app messages between a job's poster and one worker, kept per assignment
const workMessageSchema = new mongoose.Schema({
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkAssignment', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkJob', required: true },
    from: { type: String, enum: ['Poster', 'Worker'], required: true },
    senderName: { type: String, default: '' },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    readAt: { type: Date, default: null }
}, { timestamps: true });

workMessageSchema.index({ assignmentId: 1, createdAt: 1 });

module.exports = mongoose.models.WorkMessage || mongoose.model('WorkMessage', workMessageSchema);
