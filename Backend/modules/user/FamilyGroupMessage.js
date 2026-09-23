const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  downloadUrl: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document'],
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'attachment'
  },
  size: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    default: null
  },
  resourceType: {
    type: String,
    default: 'image'
  },
  storagePath: {
    type: String,
    default: null
  }
}, { _id: true });

const familyGroupMessageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyGroup',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.type !== 'system'; },
    index: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderAvatar: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'document', 'system'],
    default: 'text'
  },
  attachments: {
    type: [attachmentSchema],
    default: []
  },
  clientMessageId: {
    type: String,
    sparse: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for fast retrieval of messages in a group, sorted by creation time
familyGroupMessageSchema.index({ groupId: 1, createdAt: 1 });

module.exports = mongoose.models.FamilyGroupMessage || mongoose.model('FamilyGroupMessage', familyGroupMessageSchema);
