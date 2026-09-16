const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    default: '10:00 AM',
    trim: true
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    default: 'Ceremony',
    trim: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'in-progress'],
    default: 'upcoming'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

timelineEventSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.models.TimelineEvent || mongoose.model('TimelineEvent', timelineEventSchema);
