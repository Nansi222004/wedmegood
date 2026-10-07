const mongoose = require('mongoose');

// A vendor the admin has confirmed as fake. Published listings appear on the users' Fake Vendors page.
const fakeVendorListingSchema = new mongoose.Schema({
    // Set when the fake vendor had registered on the app
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        default: null,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Vendor name is required'],
        trim: true,
        maxlength: 120
    },
    businessName: {
        type: String,
        trim: true,
        maxlength: 120,
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        maxlength: 20,
        default: ''
    },
    city: {
        type: String,
        trim: true,
        maxlength: 80,
        default: ''
    },
    category: {
        type: String,
        trim: true,
        maxlength: 80,
        default: ''
    },
    // Shown to users: what the vendor did
    reason: {
        type: String,
        required: [true, 'Please describe why this vendor is listed'],
        trim: true,
        maxlength: 1000
    },
    complaintIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint'
    }],
    isPublished: {
        type: Boolean,
        default: true,
        index: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

fakeVendorListingSchema.index({ phone: 1 });

module.exports = mongoose.models.FakeVendorListing || mongoose.model('FakeVendorListing', fakeVendorListingSchema);
