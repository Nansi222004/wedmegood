const mongoose = require('mongoose');

// A vendor's own to-do list for the day ("call the florist", "pack the extension boards")
const vendorTodoSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 200 },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },   // Indian calendar day it was planned for
    done: { type: Boolean, default: false },
    doneAt: { type: Date, default: null }
}, { timestamps: true });

vendorTodoSchema.index({ vendorId: 1, day: 1, done: 1 });

module.exports = mongoose.models.VendorTodo || mongoose.model('VendorTodo', vendorTodoSchema);
