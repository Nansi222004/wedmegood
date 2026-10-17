const mongoose = require('mongoose');

// The digital control room of one confirmed booking: tasks, crew, stock, transport, expenses
// and payment commitments of the event, all connected. Created automatically for every booking.
const eventWorkspaceSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, trim: true, default: '' },
    eventType: { type: String, default: 'Event' },
    eventDate: { type: Date, required: true, index: true },
    // Last day of the event (multi-day events); stock stays reserved until then
    eventEndDate: { type: Date, default: null },
    venue: { type: String, default: '' },
    reportingTime: { type: String, default: '' },
    crewRequired: { type: Number, default: 0, min: 0 },
    // Operational and financial completion are separate on purpose
    opsStatus: {
        type: String,
        enum: ['Planning', 'Ready', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Planning'
    },
    financeStatus: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
    financeClosedAt: { type: Date, default: null },
    transport: [{
        vehicle: { type: String, trim: true, default: '' },
        driverMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', default: null },
        loadingTime: { type: String, default: '' },
        notes: { type: String, default: '' }
    }],
    // Customer milestone updates
    readiness: {
        updateSentAt: { type: Date, default: null },     // "80% ready" update
        finalConfirmedAt: { type: Date, default: null }, // all mandatory tasks verified + confirmed
        finalConfirmedBy: { type: String, default: '' }
    },
    checklistGeneratedAt: { type: Date, default: null },
    // Updates to the customer. With owner review on, automatic and team updates wait as Pending.
    customerUpdates: [{
        kind: { type: String, enum: ['readiness', 'ready', 'custom'], default: 'custom' },
        title: { type: String, trim: true, maxlength: 120 },
        message: { type: String, trim: true, maxlength: 1000 },
        status: { type: String, enum: ['Pending', 'Sent', 'Discarded'], default: 'Pending' },
        createdBy: { type: String, default: 'system' },
        createdAt: { type: Date, default: Date.now },
        decidedBy: { type: String, default: '' },
        decidedAt: { type: Date, default: null }
    }],
    notes: { type: String, default: '' },
    history: [{
        action: String,
        by: String,
        at: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

eventWorkspaceSchema.index({ vendorId: 1, eventDate: 1 });

module.exports = mongoose.models.EventWorkspace || mongoose.model('EventWorkspace', eventWorkspaceSchema);
