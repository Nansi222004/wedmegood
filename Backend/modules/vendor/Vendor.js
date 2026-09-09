const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
    // Initial Registration
    fullName: {
        type: String,
        required: [true, 'Please provide your full name'],
        trim: true
    },
    businessName: {
        type: String,
        required: [true, 'Please provide your business name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number'],
        unique: true,
        minlength: [10, 'Phone number must be exactly 10 digits'],
        maxlength: [10, 'Phone number must be exactly 10 digits']
    },
    city: {
        type: String,
        required: [true, 'Please provide your city']
    },
    // Removed category and subCategory as per request, since selectedCategories handles this
    selectedCategories: [{
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        categoryName: String,
        subcategories: [{
            subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
            subcategoryName: String
        }]
    }],
    isServiceProfileCompleted: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },

    // Onboarding Progress
    onboardingStep: {
        type: String,
        enum: ['business', 'services', 'pricing', 'portfolio', 'documents', 'bank', 'completed'],
        default: 'business'
    },

    // Business Details
    businessDetails: {
        description: String,
        years: String,
        teamSize: String,
        languages: [String],
        serviceCities: [String]
    },

    // Portfolio
    portfolio: [{
        title: String,
        type: { type: String, default: 'Photo' },
        tag: String,
        url: String
    }],

    // Preferences & Setup
    languages: [{
        type: String
    }],
    serviceCities: [{
        type: String
    }],
    hasDocuments: {
        type: Boolean,
        default: false
    },
    profileImage: {
        type: String,
        default: null
    },

    // Services
    services: [{
        name: String,
        category: String,
        image: String,
        features: [String],
        packages: [{
            name: String,
            price: Number,
            features: [String]
        }]
    }],

    // Pricing
    pricing: {
        range: String,
        notes: String
    },

    

    // Documents
    documents: {
        idProof: { type: String, default: null },
        gst: { type: String, default: null },
        contract: { type: String, default: null }
    },

    // Bank Details
    bank: {
        accountName: String,
        accountNumber: String,
        ifsc: String,
        upiId: String
    },

    role: {
        type: String,
        default: 'vendor'
    },
    status: {
        type: String,
        enum: ['Incomplete', 'Pending', 'Approved', 'Rejected'],
        default: 'Incomplete'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    profileViews: {
        type: Number,
        default: 0
    },
    subscription: {
        planId: String,
        planName: String,
        amount: Number,
        status: { type: String, enum: ['Pending', 'Active', 'Expired'], default: 'Pending' },
        paymentId: String,
        orderId: String,
        startDate: Date,
        endDate: Date
    },
    language: {
        type: String,
        default: 'English (India)'
    },
    notifications: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: true }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isServiceProfileCompleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }


}, {
    timestamps: true
});

// Encrypt password using bcrypt
vendorSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
vendorSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
