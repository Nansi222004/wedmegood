const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Banner title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        required: [true, 'Banner image URL is required']
    },
    linkUrl: {
        type: String,
        default: ''
    },
    placement: {
        type: String,
        enum: ['Hero Main', 'Sub-Category', 'Featured List', 'Popup Modal'],
        default: 'Hero Main'
    },
    platform: {
        type: String,
        enum: ['All', 'Web', 'Mobile'],
        default: 'All'
    },
    target: {
        type: String,
        enum: ['All', 'Vendor', 'User'],
        default: 'All'
    },
    category: {
        type: String,
        default: 'All'
    },
    status: {
        type: String,
        enum: ['Active', 'Draft', 'Scheduled', 'Expired'],
        default: 'Active'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    clicks: {
        type: Number,
        default: 0
    },
    impressions: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
