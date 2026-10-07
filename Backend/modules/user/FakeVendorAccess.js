const mongoose = require('mongoose');

// A user's access to the Fake Vendors page: a few free views, then paid access for a number of days.
const fakeVendorAccessSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    freeViewsUsed: {
        type: Number,
        default: 0
    },
    // A free view lasts a short while, so reloading the page does not use up another one
    viewWindowUntil: {
        type: Date,
        default: null
    },
    paidUntil: {
        type: Date,
        default: null
    },
    pendingOrder: {
        orderId: String,
        amount: Number,
        days: Number,
        createdAt: Date
    },
    purchases: [{
        orderId: String,
        paymentId: String,
        amount: Number,
        days: Number,
        paidAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

fakeVendorAccessSchema.index({ 'purchases.paymentId': 1 });

module.exports = mongoose.models.FakeVendorAccess || mongoose.model('FakeVendorAccess', fakeVendorAccessSchema);
