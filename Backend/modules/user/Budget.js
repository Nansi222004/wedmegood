const mongoose = require('mongoose');

const budgetCategorySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  advancePaid: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  color: {
    type: String,
    default: '#ec4899'
  },
  status: {
    type: String,
    enum: ['Pending with Budget', 'Pending with Discussion', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending with Budget'
  },
  notes: {
    type: String,
    default: ''
  }
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  totalBudget: {
    type: Number,
    default: 0,
    min: 0
  },
  categories: [budgetCategorySchema],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
