const mongoose = require('mongoose');
const { SKILLS, LEVELS } = require('./skills');

// A short-duration job: posted by a vendor for an event, or by a customer for a home function
const workJobSchema = new mongoose.Schema({
    posterType: { type: String, enum: ['Vendor', 'Customer'], required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    posterName: { type: String, default: '' },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventWorkspace', default: null },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, enum: SKILLS, required: true },
    skillLevel: { type: String, enum: LEVELS, default: 'Fresher' },
    positions: { type: Number, required: true, min: 1, max: 100 },
    filled: { type: Number, default: 0, min: 0 },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },   // "16:00"
    endTime: { type: String, required: true },     // "22:00"
    breakMinutes: { type: Number, default: 0, min: 0 },
    duties: { type: String, trim: true, maxlength: 2000, required: true },
    dressCode: { type: String, trim: true, maxlength: 200, default: '' },
    equipment: { type: String, trim: true, maxlength: 300, default: '' },
    // Pay is declared before the job goes out and never changed silently afterwards
    payPerPerson: { type: Number, required: true, min: 1 },
    overtimeRatePerHour: { type: Number, default: 0, min: 0 },
    foodProvided: { type: Boolean, default: false },
    travelAllowance: { type: Number, default: 0, min: 0 },
    totalBudget: { type: Number, default: 0, min: 0 },
    paymentTerms: { type: String, enum: ['Same day', 'Within 3 days', 'Within 7 days'], default: 'Same day' },
    cancellationRules: { type: String, trim: true, maxlength: 500, default: '' },
    driver: {
        vehicleRequired: { type: Boolean, default: false },
        vehicleType: { type: String, default: '' },
        licenceRequired: { type: Boolean, default: false },
        tripDetails: { type: String, default: '' }
    },
    // Area shown to everyone offered the job; the exact address only to accepted workers
    city: { type: String, required: true },
    pincode: { type: String, match: /^\d{6}$/, required: true },
    area: { type: String, default: '' },
    exactAddress: { type: String, trim: true, maxlength: 400, default: '' },
    location: { lat: { type: Number, default: null }, lng: { type: Number, default: null } },
    searchRadiusKm: { type: Number, default: 15, min: 1, max: 200 },
    urgency: { type: String, enum: ['Normal', 'Urgent'], default: 'Normal' },
    offerWindowSeconds: { type: Number, default: 120, min: 30, max: 1800 },
    checkInCode: { type: String, required: true },
    status: { type: String, enum: ['Open', 'Filled', 'Unfilled', 'Cancelled', 'Completed'], default: 'Open', index: true },
    currentOfferId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOffer', default: null },
    // Raised when pay, timing or area change: workers who said no before can be offered again
    round: { type: Number, default: 1 },
    unfilledAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.WorkJob || mongoose.model('WorkJob', workJobSchema);
