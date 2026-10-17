const mongoose = require('mongoose');

// A customer's private reference photo for a requirement. Stored as an authenticated Cloudinary
// asset (or in the private uploads folder) and only ever streamed through the API: the customer
// and the vendor currently assigned to the lead can view it, nobody gets a public link.
const referencePhotoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    publicId: { type: String, default: null },     // Cloudinary (type: authenticated)
    storagePath: { type: String, default: null },  // local private fallback
    format: { type: String, default: '' },
    mimeType: { type: String, default: 'image/jpeg' },
    bytes: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.models.ReferencePhoto || mongoose.model('ReferencePhoto', referencePhotoSchema);
