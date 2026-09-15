const mongoose = require('mongoose');
const Budget = require('./Budget');
const Booking = require('../vendor/Booking');
const Payment = require('./Payment');
const User = require('./user.model');

const DEFAULT_CATEGORIES = [
  { id: 'venue', name: 'Venue', color: '#ec4899', status: 'Confirmed', totalAmount: 100000, advancePaid: 25000, balanceAmount: 75000, spent: 25000 },
  { id: 'catering', name: 'Catering', color: '#10b981', status: 'Pending with Discussion', totalAmount: 50000, advancePaid: 0, balanceAmount: 50000, spent: 0 },
  { id: 'photography', name: 'Photography', color: '#f59e0b', status: 'Pending with Budget', totalAmount: 30000, advancePaid: 0, balanceAmount: 30000, spent: 0 },
  { id: 'decoration', name: 'Decoration', color: '#8b5cf6', status: 'Confirmed', totalAmount: 50000, advancePaid: 10000, balanceAmount: 40000, spent: 10000 },
  { id: 'invitations', name: 'Invitations', color: '#06b6d4', status: 'Pending with Discussion', totalAmount: 15000, advancePaid: 0, balanceAmount: 15000, spent: 0 },
  { id: 'entertainment', name: 'Entertainment', color: '#ef4444', status: 'Pending with Budget', totalAmount: 20000, advancePaid: 0, balanceAmount: 20000, spent: 0 }
];

// @desc    Get user wedding budget (with real booking transaction reconciliation)
// @route   GET /api/user/budget
// @access  Private (User)
exports.getBudget = async (req, res) => {
  try {
    const userId = req.user._id;

    let budget = await Budget.findOne({ userId });

    // Derive authoritative transaction metrics from real Bookings and Payments
    const [realBookings, realPayments] = await Promise.all([
      Booking.find({ userId, status: { $nin: ['cancelled', 'rejected'] } }).lean(),
      Payment.find({ userId, status: 'completed' }).lean()
    ]);

    const authoritativeSpent = realPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const authoritativeBookedValue = realBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    if (!budget) {
      const user = await User.findById(userId).select('weddingDetails');
      const initialTotal = user?.weddingDetails?.budget || 265000;

      budget = await Budget.create({
        userId,
        totalBudget: initialTotal,
        categories: DEFAULT_CATEGORIES,
        notes: ''
      });
    }

    res.status(200).json({
      success: true,
      data: {
        budget,
        authoritativeTransactions: {
          totalPaidAuthoritative: authoritativeSpent,
          totalBookedValue: authoritativeBookedValue,
          activeBookingsCount: realBookings.length,
          completedPaymentsCount: realPayments.length
        }
      }
    });
  } catch (error) {
    console.error('getBudget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve budget',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user wedding budget
// @route   PUT /api/user/budget
// @access  Private (User)
exports.updateBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { totalBudget, categories, notes } = req.body;

    let budget = await Budget.findOne({ userId });

    if (!budget) {
      budget = new Budget({ userId });
    }

    if (totalBudget !== undefined) {
      const numericBudget = Number(totalBudget);
      if (isNaN(numericBudget) || numericBudget < 0) {
        return res.status(400).json({
          success: false,
          message: 'totalBudget must be a non-negative number'
        });
      }
      budget.totalBudget = numericBudget;
    }

    if (categories !== undefined) {
      if (!Array.isArray(categories)) {
        return res.status(400).json({
          success: false,
          message: 'categories must be an array'
        });
      }

      // Sanitize & validate each category
      budget.categories = categories.map((cat, idx) => ({
        id: String(cat.id || `cat-${idx}-${Date.now()}`),
        name: String(cat.name || 'Untitled Category').trim(),
        totalAmount: Math.max(0, Number(cat.totalAmount) || 0),
        advancePaid: Math.max(0, Number(cat.advancePaid) || 0),
        balanceAmount: Math.max(0, Number(cat.balanceAmount) || 0),
        spent: Math.max(0, Number(cat.spent) || 0),
        color: cat.color || '#ec4899',
        status: ['Pending with Budget', 'Pending with Discussion', 'Confirmed', 'Completed', 'Cancelled'].includes(cat.status)
          ? cat.status
          : 'Pending with Budget',
        notes: String(cat.notes || '').trim()
      }));
    }

    if (notes !== undefined) {
      budget.notes = String(notes).trim();
    }

    await budget.save();

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('updateBudget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
