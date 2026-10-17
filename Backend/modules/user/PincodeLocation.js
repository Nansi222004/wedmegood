const mongoose = require('mongoose');

// Cached PIN code -> place lookup (India Post data + coordinates), filled on first use.
const pincodeLocationSchema = new mongoose.Schema({
    pincode: { type: String, required: true, unique: true, match: /^\d{6}$/ },
    city: { type: String, default: '' },      // post office region / block
    district: { type: String, default: '' },
    state: { type: String, default: '' },
    places: [{ type: String }],                // post office names in this PIN code
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    found: { type: Boolean, default: true },
    fetchedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.models.PincodeLocation || mongoose.model('PincodeLocation', pincodeLocationSchema);
