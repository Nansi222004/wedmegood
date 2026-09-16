const mongoose = require('mongoose');

const checklistTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  task: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: true,
    trim: true,
    default: 'General'
  },
  timeframe: {
    type: String,
    default: '1 month before',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  color: {
    type: String,
    default: '#ec4899'
  },
  completed: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null,
    index: true
  },
  targetDate: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  order: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

checklistTaskSchema.index({ userId: 1, completed: 1 });
checklistTaskSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.models.ChecklistTask || mongoose.model('ChecklistTask', checklistTaskSchema);
