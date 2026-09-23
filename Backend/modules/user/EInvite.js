const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteRSVPSchema = new mongoose.Schema({
  guestName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Attending', 'Not Attending', 'Maybe'],
    required: true
  },
  guestCount: {
    type: Number,
    default: 1,
    min: 1,
    max: 20
  },
  notes: {
    type: String,
    trim: true,
    default: '',
    maxlength: 300
  },
  matchedGuestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const eInviteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => crypto.randomBytes(12).toString('hex')
  },
  template: {
    type: String,
    default: 'Royal Elegance'
  },
  templateId: {
    type: Number,
    default: 1
  },
  name: {
    type: String,
    required: [true, 'Invite title/name is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft',
    index: true
  },
  brideName: {
    type: String,
    trim: true,
    default: ''
  },
  groomName: {
    type: String,
    trim: true,
    default: ''
  },
  weddingDate: {
    type: Date,
    default: null
  },
  weddingTime: {
    type: String,
    default: '18:00',
    trim: true
  },
  venue: {
    type: String,
    default: '',
    trim: true
  },
  venueAddress: {
    type: String,
    default: '',
    trim: true
  },
  message: {
    type: String,
    default: 'We joyfully invite you to celebrate our wedding ceremony.',
    trim: true
  },
  rsvpDeadline: {
    type: Date,
    default: null
  },
  contactPerson: {
    type: String,
    default: '',
    trim: true
  },
  contactPhone: {
    type: String,
    default: '',
    trim: true
  },
  dresscode: {
    type: String,
    default: 'Traditional Indian Attire',
    trim: true
  },
  backgroundColor: {
    type: String,
    default: '#8B4513'
  },
  textColor: {
    type: String,
    default: '#FFFFFF'
  },
  accentColor: {
    type: String,
    default: '#FFD700'
  },
  musicUrl: {
    type: String,
    default: ''
  },
  enableRSVP: {
    type: Boolean,
    default: true
  },
  enableMap: {
    type: Boolean,
    default: true
  },
  enableGallery: {
    type: Boolean,
    default: false
  },
  enableContact: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  sharesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  sharesBreakdown: {
    whatsapp: { type: Number, default: 0 },
    email: { type: Number, default: 0 },
    sms: { type: Number, default: 0 },
    copy: { type: Number, default: 0 },
    native: { type: Number, default: 0 }
  },
  rsvps: [inviteRSVPSchema]
}, {
  timestamps: true
});

module.exports = mongoose.models.EInvite || mongoose.model('EInvite', eInviteSchema);
