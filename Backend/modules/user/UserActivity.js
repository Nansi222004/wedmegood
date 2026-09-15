const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: [
      'booking_created', 'booking_confirmed', 'booking_cancelled',
      'payment_success', 'payment_failed', 'payment_refunded',
      'quote_received', 'quote_accepted', 'quote_rejected',
      'lead_created', 'review_submitted', 'review_moderated',
      'complaint_created', 'complaint_updated',
      'family_invite', 'family_member_joined',
      'rsvp_received', 'checklist_milestone', 'budget_milestone',
      'invite_published', 'planning_update'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  message: {
    type: String,
    required: [true, 'Activity message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
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
  eventKey: {
    type: String,
    default: null,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ userId: 1, eventKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema);
