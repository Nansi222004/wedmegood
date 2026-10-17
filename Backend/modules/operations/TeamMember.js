const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['Supervisor', 'Crew', 'Warehouse', 'Driver', 'Accountant', 'SubVendor'];

// A person who works for a vendor: employee, casual labour, supervisor, driver, warehouse staff or
// an external sub-vendor. Each has their own login; what they see depends on their role.
const teamMemberSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, unique: true, match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'] },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, required: true },
    skills: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    // Owner-only: what this person is paid
    wage: {
        basis: { type: String, enum: ['Per day', 'Per shift', 'Per hour', 'Per job'], default: 'Per day' },
        amount: { type: Number, default: 0, min: 0 }
    },
    // Sub-vendors only
    subVendor: {
        businessName: { type: String, trim: true, default: '' },
        services: [{ type: String, trim: true }],
        verified: { type: Boolean, default: false }
    },
    lastLoginAt: { type: Date, default: null }
}, { timestamps: true });

teamMemberSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
});

teamMemberSchema.methods.matchPassword = function (entered) {
    return bcrypt.compare(entered, this.password);
};

teamMemberSchema.statics.ROLES = ROLES;

module.exports = mongoose.models.TeamMember || mongoose.model('TeamMember', teamMemberSchema);
