const mongoose = require('mongoose');

const vendorServiceSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Vendor ID is required']
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category ID is required']
    },
    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: [true, 'SubCategory ID is required']
    },
    serviceData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    images: [{ type: String }],
    videos: [{ type: String }],
    documents: [{ type: String }],
    status: {
        type: String,
        enum: ['Pending Approval', 'Approved', 'Rejected'],
        default: 'Pending Approval'
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.VendorService || mongoose.model('VendorService', vendorServiceSchema);
