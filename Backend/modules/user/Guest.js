const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Guest name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['Family', 'Friends', 'Colleagues', 'VIP', 'Others'],
    default: 'Family'
  },
  side: {
    type: String,
    enum: ['Bride', 'Groom', 'Mutual'],
    default: 'Mutual'
  },
  rsvpStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Declined'],
    default: 'Pending',
    index: true
  },
  guestCount: {
    type: Number,
    default: 1,
    min: [1, 'Guest count must be at least 1']
  },
  mealPreference: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Jain', 'Vegan', 'No Preference'],
    default: 'No Preference'
  },
  invitationSent: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

guestSchema.index({ userId: 1, rsvpStatus: 1 });
guestSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.models.Guest || mongoose.model('Guest', guestSchema);
