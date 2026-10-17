const mongoose = require('mongoose');
const { SKILLS, LEVELS } = require('./skills');

// A person who takes short event jobs. Built on their Utsavo customer account (verified mobile),
// so nobody needs a separate app.
const workerProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Female', 'Male', 'Other', 'Prefer not to say'], default: 'Prefer not to say' },
    city: { type: String, trim: true, required: true },
    pincode: { type: String, match: /^\d{6}$/, required: true },
    location: { lat: { type: Number, default: null }, lng: { type: Number, default: null } },
    travelRadiusKm: { type: Number, default: 15, min: 1, max: 200 },
    skills: [{
        category: { type: String, enum: SKILLS, required: true },
        level: { type: String, enum: LEVELS, default: 'Fresher' },
        years: { type: Number, default: 0, min: 0 }
    }],
    languages: [{ type: String }],
    about: { type: String, trim: true, maxlength: 500, default: '' },
    hasVehicle: { type: Boolean, default: false },
    vehicleType: { type: String, default: '' },
    drivingLicence: { type: Boolean, default: false },
    // Availability and buzzer preferences
    available: { type: Boolean, default: true },
    unavailableDates: [{ type: Date }],
    quietHours: { start: { type: String, default: '' }, end: { type: String, default: '' } }, // "22:00" - "07:00"
    soundOn: { type: Boolean, default: true },
    // Identity verification (DigiLocker, or an ID photo checked by the Utsavo team)
    verification: {
        status: { type: String, enum: ['Unverified', 'Pending', 'Verified', 'Rejected'], default: 'Unverified', index: true },
        method: { type: String, enum: ['', 'DigiLocker', 'Manual'], default: '' },
        verifiedName: { type: String, default: '' },
        verifiedDob: { type: Date, default: null },
        documentType: { type: String, default: '' },
        idPhotoId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferencePhoto', default: null },
        reviewedBy: { type: String, default: '' },
        reviewedAt: { type: Date, default: null },
        rejectionReason: { type: String, default: '' },
        digilockerState: { type: String, default: '', select: false },
        digilockerVerifier: { type: String, default: '', select: false }
    },
    // Fair rotation and reliability
    lastOfferedAt: { type: Date, default: null, index: true },
    stats: {
        offered: { type: Number, default: 0 },
        accepted: { type: Number, default: 0 },
        declined: { type: Number, default: 0 },
        missed: { type: Number, default: 0 },
        completed: { type: Number, default: 0 },
        noShows: { type: Number, default: 0 },
        ratingSum: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 }
    },
    // Set after repeated no-shows: no offers until the Utsavo team reviews
    underReview: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

workerProfileSchema.index({ 'skills.category': 1, isActive: 1, 'verification.status': 1 });

module.exports = mongoose.models.WorkerProfile || mongoose.model('WorkerProfile', workerProfileSchema);
