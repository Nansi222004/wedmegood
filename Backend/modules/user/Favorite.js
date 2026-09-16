const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

// Canonical duplicate prevention: a user cannot favorite the same vendor more than once
favoriteSchema.index({ userId: 1, vendorId: 1 }, { unique: true });

module.exports = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);
