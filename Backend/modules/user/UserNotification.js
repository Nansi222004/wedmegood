const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['booking', 'quote', 'payment', 'planning', 'family', 'review', 'complaint', 'reminder', 'system'],
    default: 'system',
    index: true
  },
  entityType: {
    type: String,
    enum: ['Booking', 'Quote', 'Payment', 'Lead', 'Review', 'Complaint', 'FamilyGroup', 'EInvite', 'ChecklistTask', 'TimelineEvent', 'Budget', 'General'],
    default: 'General'
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  link: {
    type: String,
    default: '',
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

userNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.UserNotification || mongoose.model('UserNotification', userNotificationSchema);
