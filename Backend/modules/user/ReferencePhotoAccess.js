const mongoose = require('mongoose');

// Every time a vendor opens a customer's reference photo
const referencePhotoAccessSchema = new mongoose.Schema({
    photoId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferencePhoto', required: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    ip: { type: String, default: '' },
    at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ReferencePhotoAccess || mongoose.model('ReferencePhotoAccess', referencePhotoAccessSchema);
