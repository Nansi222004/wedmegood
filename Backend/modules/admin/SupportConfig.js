const mongoose = require('mongoose');

const supportConfigSchema = new mongoose.Schema({
    supportEmail: {
        type: String,
        required: true,
        default: 'support@utsavo.com'
    },
    supportPhone: {
        type: String,
        required: true,
        default: '+91 9999999999'
    },
    officeAddress: {
        type: String,
        default: '123, Utsavo Plaza, Mumbai, India'
    },
    workingHours: {
        type: String,
        default: '9:00 AM - 6:00 PM (Mon-Sat)'
    },
    socialLinks: {
        instagram: String,
        facebook: String,
        twitter: String,
        whatsapp: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.SupportConfig || mongoose.model('SupportConfig', supportConfigSchema);
