const mongoose = require('mongoose');

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
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'document', 'system'],
    default: 'text'
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
