const mongoose = require('mongoose');

// One day's cash count: what the drawer should hold against what was actually counted
const cashDaySchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },   // Indian calendar day
    openingCash: { type: Number, default: 0, min: 0 },
    cashIn: { type: Number, default: 0 },
    cashOut: { type: Number, default: 0 },
    expectedCash: { type: Number, default: 0 },
    countedCash: { type: Number, default: 0, min: 0 },
    difference: { type: Number, default: 0 },                              // counted - expected
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    closedBy: { type: String, default: '' },
    closedAt: { type: Date, default: null },
    history: [{
        countedCash: Number,
        expectedCash: Number,
        by: String,
        at: { type: Date, default: Date.now },
        note: String
    }]
}, { timestamps: true });

cashDaySchema.index({ vendorId: 1, day: 1 }, { unique: true });

module.exports = mongoose.models.CashDay || mongoose.model('CashDay', cashDaySchema);
