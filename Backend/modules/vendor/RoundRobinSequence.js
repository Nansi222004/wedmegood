const mongoose = require('mongoose');

const roundRobinSequenceSchema = new mongoose.Schema({
    categoryKey: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    currentIndex: {
        type: Number,
        default: 0
    },
    lastAssignedVendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        default: null
    },
    // Position of the last assigned vendor in the rotation order (see vendorAllocation.service).
    // Lets the rotation continue correctly when that vendor drops out of the eligible list.
    lastAssignedSortKey: {
        type: String,
        default: null
    },
    lastAssignedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

roundRobinSequenceSchema.statics.getNextVendorIndex = async function(categoryKey, vendorCount) {
    if (!vendorCount || vendorCount <= 0) return 0;
    const key = (categoryKey || 'general').trim().toLowerCase();
    const seq = await this.findOneAndUpdate(
        { categoryKey: key },
        { $inc: { currentIndex: 1 }, $set: { lastAssignedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return (seq.currentIndex - 1) % vendorCount;
};

module.exports = mongoose.models.RoundRobinSequence || mongoose.model('RoundRobinSequence', roundRobinSequenceSchema);
