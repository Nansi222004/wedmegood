const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [4, 'Password must be at least 4 characters long'],
    select: false // Don't include password in queries by default
  },

  weddingDate: {
    type: Date,
    default: null,
    validate: {
      validator: function (value) {
        return !value || value > new Date();
      },
      message: 'Wedding date must be in the future'
    }
  },

  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [30, 'City name cannot exceed 30 characters']
  },

  profileImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },

  // Verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  isPhoneVerified: {
    type: Boolean,
    default: false
  },

  emailOTP: {
    type: String,
    select: false
  },

  phoneOTP: {
    type: String,
    select: false
  },

  // Password reset fields
  passwordResetToken: {
    type: String,
    select: false
  },

  passwordResetExpires: {
    type: Date,
    select: false
  },

  // Account status
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },

  // Login tracking
  lastLogin: {
    type: Date,
    default: null
  },

  loginCount: {
    type: Number,
    default: 0
  },

  // Preferences
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi', 'gu', 'mr', 'ta', 'te'],
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },

  // Wedding planning progress
  weddingProgress: {
    checklistCompleted: {
      type: Number,
      default: 0
    },
    totalChecklistItems: {
      type: Number,
      default: 71
    },
    budgetPlanned: {
      type: Number,
      default: 0
    },
    vendorsBooked: {
      type: Number,
      default: 0
    },
    guestsAdded: {
      type: Number,
      default: 0
    }
  },

  // Family connections
  familyMembers: [{
    name: String,
    email: String,
    phone: String,
    relationship: String,
    isRegistered: {
      type: Boolean,
      default: false
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Social links (optional)
  socialLinks: {
    instagram: String,
    facebook: String,
    linkedin: String
  },

  // Additional metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    userAgent: String,
    ipAddress: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
userSchema.virtual('weddingDaysLeft').get(function () {
  if (!this.weddingDate) return null;
  const today = new Date();
  const diffTime = this.weddingDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

userSchema.virtual('checklistProgress').get(function () {
  if (this.weddingProgress.totalChecklistItems === 0) return 0;
  return Math.round((this.weddingProgress.checklistCompleted / this.weddingProgress.totalChecklistItems) * 100);
});

// Indexes for better performance
userSchema.index({ city: 1 });
userSchema.index({ weddingDate: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Pre-save middleware
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return;

  // Hash password with cost of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Pre-save middleware for phone number formatting
userSchema.pre('save', async function () {
  if (this.isModified('phone')) {
    // Remove any non-digit characters and ensure it's 10 digits
    this.phone = this.phone.replace(/\D/g, '');
  }
});

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailOTP;
  delete userObject.phoneOTP;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

userSchema.methods.incrementLoginCount = function () {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

userSchema.methods.addFamilyMember = function (memberData) {
  this.familyMembers.push(memberData);
  return this.save();
};

userSchema.methods.updateWeddingProgress = function (progressData) {
  Object.assign(this.weddingProgress, progressData);
  return this.save();
};

// Static methods
userSchema.statics.findByEmailOrPhone = function (identifier) {
  return this.findOne({
    $or: [
      { email: identifier },
      { phone: identifier }
    ]
  });
};

userSchema.statics.findActiveUsers = function () {
  return this.find({
    isActive: true,
    isBlocked: false
  });
};

userSchema.statics.getUsersByCity = function (city) {
  return this.find({
    city: city.toLowerCase(),
    isActive: true,
    isBlocked: false
  });
};

userSchema.statics.getUpcomingWeddings = function (days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    weddingDate: {
      $gte: new Date(),
      $lte: futureDate
    },
    isActive: true,
    isBlocked: false
  }).sort({ weddingDate: 1 });
};

// Middleware for soft delete
userSchema.methods.softDelete = function () {
  this.isActive = false;
  return this.save();
};

userSchema.methods.restore = function () {
  this.isActive = true;
  return this.save();
};

// Validation middleware
userSchema.pre('save', async function () {
  // Check if email or phone already exists (for new users)
  if (this.isNew) {
    // This will be handled in the controller
  }

  // Validate wedding date is in future
  if (this.weddingDate && this.weddingDate <= new Date()) {
    throw new Error('Wedding date must be in the future');
  }
});

// Transform method for API responses
userSchema.methods.toAPIResponse = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    weddingDate: this.weddingDate,
    city: this.city,
    profileImage: this.profileImage,
    isEmailVerified: this.isEmailVerified,
    isPhoneVerified: this.isPhoneVerified,
    weddingDaysLeft: this.weddingDaysLeft,
    checklistProgress: this.checklistProgress,
    weddingProgress: this.weddingProgress,
    preferences: this.preferences,
    familyMembers: this.familyMembers,
    lastLogin: this.lastLogin,
    loginCount: this.loginCount,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
