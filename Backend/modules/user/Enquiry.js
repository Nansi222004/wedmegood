const mongoose = require('mongoose');

const EVENT_TYPES = ['Wedding', 'Engagement', 'Reception', 'Birthday', 'Anniversary', 'Baby Celebration', 'Housewarming', 'Temple Event', 'Other'];

// A customer's event requirement. Each requested service becomes its own Lead, so every
// service can be accepted, quoted and booked independently while the customer sees one event.
const enquirySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: EVENT_TYPES,
        required: true
    },
    eventTypeOther: { type: String, trim: true, maxlength: 80, default: '' },
    eventDate: { type: Date, required: true },
    eventTime: { type: String, trim: true, maxlength: 20, default: '' },
    venueName: { type: String, trim: true, maxlength: 160, default: '' },
    venueAddress: { type: String, trim: true, maxlength: 400, default: '' },
    pincode: { type: String, required: true, match: [/^\d{6}$/, 'PIN code must be 6 digits'] },
    city: { type: String, trim: true, maxlength: 80, required: true },
    district: { type: String, trim: true, maxlength: 80, default: '' },
    state: { type: String, trim: true, maxlength: 80, default: '' },
    location: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },
    guestCount: { type: Number, default: 0, min: 0 },
    totalBudget: { type: Number, default: 0, min: 0 },
    contactName: { type: String, trim: true, maxlength: 120, required: true },
    contactPhone: { type: String, trim: true, required: true },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    allowExpandedSearch: { type: Boolean, default: false },
    leadIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],
    status: {
        type: String,
        enum: ['Active', 'Cancelled', 'Closed'],
        default: 'Active',
        index: true
    }
}, {
    timestamps: true
});

enquirySchema.index({ userId: 1, createdAt: -1 });

enquirySchema.statics.EVENT_TYPES = EVENT_TYPES;

module.exports = mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema);
