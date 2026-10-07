const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // A vendor registered on the app...
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
    index: true
  },
  // ...or a vendor in the market who is not on the app (reported so other users are warned)
  externalVendor: {
    name: { type: String, trim: true, maxlength: 120 },
    businessName: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 20 },
    city: { type: String, trim: true, maxlength: 80 },
    category: { type: String, trim: true, maxlength: 80 }
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  category: {
    type: String,
    required: [true, 'Complaint category is required'],
    enum: ['Quality', 'Behavior', 'No-Show', 'Overcharging', 'Cancellation', 'Safety', 'Other']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'document'],
      default: 'image'
    },
    url: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['Pending', 'In-Review', 'Resolved', 'Dismissed'],
    default: 'Pending',
    index: true
  },
  adminNotes: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

complaintSchema.pre('validate', function () {
  if (!this.vendorId && !(this.externalVendor && this.externalVendor.name && this.externalVendor.phone)) {
    this.invalidate('vendorId', 'Vendor is required');
  }
});

complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ vendorId: 1, status: 1 });

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
