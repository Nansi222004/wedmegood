const mongoose = require('mongoose');

const inspirationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.sourceType === 'user' || !this.vendorId;
    },
    default: null,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Inspiration title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  category: {
    type: String,
    enum: ['decor', 'bridal', 'venues', 'photography', 'outfits', 'mehndi', 'jewelry', 'other'],
    default: 'other',
    index: true
  },
  image: {
    type: String,
    required: [true, 'Image URL is required']
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  source: {
    type: String,
    default: '',
    trim: true
  },
  sourceType: {
    type: String,
    enum: ['user', 'vendor'],
    default: 'user',
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
    index: true
  },
  vendorBusinessName: {
    type: String,
    default: '',
    trim: true
  },
  style: {
    type: String,
    default: 'Traditional',
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

inspirationSchema.index({ userId: 1, category: 1 });
inspirationSchema.index({ isPublic: 1, sourceType: 1, vendorId: 1 });

module.exports = mongoose.models.Inspiration || mongoose.model('Inspiration', inspirationSchema);
