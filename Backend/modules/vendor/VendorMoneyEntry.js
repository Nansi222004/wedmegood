const mongoose = require('mongoose');

const METHODS = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque', 'Other'];
const EXPENSE_CATEGORIES = ['Materials', 'Transport', 'Staff & labour', 'Food', 'Equipment', 'Rent', 'Bills & utilities', 'Marketing', 'Other'];

/**
 * The vendor's own money notebook (from the + button):
 *  - Expense: something they spend, or plan to spend (status Planned works as a to-do; ticking it marks it Spent)
 *  - Payment: a major payment they made (Paid) or money they received (Received)
 * Separate from the event Accounts ledger: quick notes, available to every vendor.
 */
const vendorMoneyEntrySchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    type: { type: String, enum: ['Expense', 'Payment'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 1 },
    // Expense only
    status: { type: String, enum: ['Planned', 'Spent'], default: 'Spent' },
    dueDate: { type: Date, default: null },
    category: { type: String, enum: [...EXPENSE_CATEGORIES, ''], default: '' },
    // Payment only
    direction: { type: String, enum: ['Paid', 'Received', null], default: null },
    party: { type: String, trim: true, maxlength: 120, default: '' },
    // Both
    date: { type: Date, default: Date.now },    // when it was spent / paid / received
    method: { type: String, enum: METHODS, default: 'Cash' },
    note: { type: String, trim: true, maxlength: 500, default: '' }
}, { timestamps: true });

vendorMoneyEntrySchema.index({ vendorId: 1, type: 1, date: -1 });
vendorMoneyEntrySchema.statics.METHODS = METHODS;
vendorMoneyEntrySchema.statics.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;

module.exports = mongoose.models.VendorMoneyEntry || mongoose.model('VendorMoneyEntry', vendorMoneyEntrySchema);
