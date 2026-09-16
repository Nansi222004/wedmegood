const mongoose = require('mongoose');
const Complaint = require('./Complaint');
const Vendor = require('../vendor/Vendor');
const Booking = require('../vendor/Booking');

// @desc    Submit a complaint / report against a vendor
// @route   POST /api/user/complaints
// @access  Private (User)
exports.createComplaint = async (req, res) => {
  try {
    const userId = req.user._id;
    const { vendorId, bookingId, category, description, evidence } = req.body;

    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ success: false, message: 'Valid vendorId is required' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Security check on bookingId:
    // 1. Must belong to the authenticated user
    // 2. Must match the vendor being reported
    let verifiedBookingId = null;
    if (bookingId) {
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ success: false, message: 'Invalid bookingId format' });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Referenced booking not found' });
      }

      if (booking.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Booking does not belong to you'
        });
      }

      if (booking.vendorId.toString() !== vendorId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Booking does not match the reported vendor'
        });
      }

      verifiedBookingId = booking._id;
    }

    if (!category || !['Quality', 'Behavior', 'No-Show', 'Overcharging', 'Cancellation', 'Safety', 'Other'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Valid complaint category is required. Allowed: Quality, Behavior, No-Show, Overcharging, Cancellation, Safety, Other'
      });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters long'
      });
    }

    const sanitizedEvidence = Array.isArray(evidence)
      ? evidence.filter(e => e && e.url).map(e => ({ type: e.type || 'image', url: String(e.url) }))
      : [];

    const complaint = await Complaint.create({
      userId,
      vendorId,
      bookingId: verifiedBookingId,
      category,
      description: description.trim(),
      evidence: sanitizedEvidence,
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully and is queued for administrative review',
      data: { complaint }
    });
  } catch (error) {
    console.error('createComplaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit complaint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all complaints filed by authenticated user
// @route   GET /api/user/complaints
// @access  Private (User)
exports.getUserComplaints = async (req, res) => {
  try {
    const userId = req.user._id;

    const complaints = await Complaint.find({ userId })
      .populate('vendorId', 'businessName name category serviceType city')
      .populate('bookingId', 'bookingId eventDate status totalPrice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        complaints,
        totalComplaints: complaints.length
      }
    });
  } catch (error) {
    console.error('getUserComplaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get complaint details
// @route   GET /api/user/complaints/:id
// @access  Private (User)
exports.getComplaintById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID format' });
    }

    const complaint = await Complaint.findOne({ _id: id, userId })
      .populate('vendorId', 'businessName name category serviceType city coverImage')
      .populate('bookingId', 'bookingId eventDate status totalPrice');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      data: { complaint }
    });
  } catch (error) {
    console.error('getComplaintById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
