const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Please provide a question'],
        trim: true
    },
    answer: {
        type: String,
        required: [true, 'Please provide an answer'],
        trim: true
    },
    category: {
        type: String,
        enum: ['General', 'Vendors', 'Users', 'Payments', 'Technical'],
        default: 'General'
    },
    order: {
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

module.exports = mongoose.models.FAQ || mongoose.model('FAQ', faqSchema);
