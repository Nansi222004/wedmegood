const mongoose = require('mongoose');

// Attendance of a team member on an event day. A confirmed shift becomes an earning in the
// member's wallet and a labour cost on the event, with the same amount in both.
const crewShiftSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', required: true, index: true },
    date: { type: Date, required: true },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    breakMinutes: { type: Number, default: 0, min: 0 },
    overtimeHours: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['Open', 'Confirmed', 'Absent'], default: 'Open' },
    recordedBy: { type: String, default: '' },
    confirmedBy: { type: String, default: '' },
    confirmedAt: { type: Date, default: null },
    note: { type: String, default: '' }
}, { timestamps: true });

crewShiftSchema.index({ memberId: 1, workspaceId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.CrewShift || mongoose.model('CrewShift', crewShiftSchema);
