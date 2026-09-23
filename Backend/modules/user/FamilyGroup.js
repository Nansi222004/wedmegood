const mongoose = require('mongoose');

const familyGroupMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
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
  relation: {
    type: String,
    trim: true,
    default: 'Family'
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'pending_approval', 'accepted', 'declined', 'revoked'],
    default: 'pending'
  },
  permissions: {
    type: [String],
    default: ['view_planning']
  },
  avatar: {
    type: String,
    default: ''
  },
  inviteTokenHash: {
    type: String,
    default: null
  },
  inviteTokenExpiresAt: {
    type: Date,
    default: null
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date,
    default: null
  },
  joinRequestedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { _id: true });

const familyGroupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop'
  },
  sharedResources: {
    checklist: { type: Boolean, default: true },
    budget: { type: Boolean, default: false },
    timeline: { type: Boolean, default: true },
    guestList: { type: Boolean, default: false },
    inspiration: { type: Boolean, default: true }
  },
  groupInviteTokenHash: {
    type: String,
    default: null
  },
  groupInviteExpiresAt: {
    type: Date,
    default: null
  },
  groupInviteEnabled: {
    type: Boolean,
    default: true
  },
  groupInviteRole: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member'
  },
  members: [familyGroupMemberSchema]
}, {
  timestamps: true
});

familyGroupSchema.index({ userId: 1, createdAt: -1 });
familyGroupSchema.index({ 'members.email': 1 });
familyGroupSchema.index({ 'members.phone': 1 });
familyGroupSchema.index({ 'members.userId': 1 });
familyGroupSchema.index({ 'members.inviteTokenHash': 1 });
familyGroupSchema.index({ groupInviteTokenHash: 1 });

module.exports = mongoose.models.FamilyGroup || mongoose.model('FamilyGroup', familyGroupSchema);
