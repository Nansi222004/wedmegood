const mongoose = require('mongoose');
const Complaint = require('./Complaint');
const Vendor = require('../vendor/Vendor');
const Booking = require('../vendor/Booking');
const { targetsFor, canAppeal, notifyVendor } = require('../../services/complaint.service');

/**
 * What the complainant sees: status, the decision and targets. Internal admin notes and the
 * vendor's statement stay with the Utsavo team.
 */
const customerView = (c) => {
  const { adminNotes, vendorResponse, ...rest } = c;
  return {
    ...rest,
    // Complaints decided before the outcome field existed show the admin's note as the outcome
    outcome: c.outcome || (['Resolved', 'Dismissed'].includes(c.status) ? adminNotes || '' : ''),
    vendorResponded: Boolean(vendorResponse?.respondedAt),
    canAppeal: canAppeal(c)
  };
};

// @desc    Appeal a decision (once, within 7 days)
// @route   POST /api/user/complaints/:id/appeal   body: { reason }
// @access  Private (User)
exports.appealComplaint = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid complaint' });
    const reason = String(req.body?.reason || '').trim();
    if (reason.length < 10) return res.status(400).json({ success: false, message: 'Explain why the decision should be reviewed again' });
    const complaint = await Complaint.findOne({ _id: req.params.id, userId: req.user._id });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (!canAppeal(complaint)) return res.status(400).json({ success: false, message: 'This complaint can no longer be appealed' });
    complaint.appeal = { by: 'User', reason: reason.slice(0, 2000), at: new Date(), decision: '', decisionNote: '', decidedAt: null, previousStatus: complaint.status };
    complaint.status = 'Appealed';
    await complaint.save();
    await notifyVendor(complaint.vendorId, 'The customer appealed the decision on a complaint about you. The Utsavo team will review it again.');
    res.status(200).json({ success: true, message: 'Appeal submitted. A different reviewer will look at it.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit a complaint / report against a vendor
// @route   POST /api/user/complaints
// @access  Private (User)
exports.createComplaint = async (req, res) => {
  try {
    const userId = req.user._id;
    const { vendorId, bookingId, category, description, evidence, externalVendor } = req.body;

    // Either a vendor registered on the app, or one from the market identified by name and phone
    let cleanExternalVendor = null;
    if (vendorId) {
      if (!mongoose.Types.ObjectId.isValid(vendorId)) {
        return res.status(400).json({ success: false, message: 'Valid vendorId is required' });
      }
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
    } else {
      const ext = externalVendor && typeof externalVendor === 'object' ? externalVendor : {};
      const field = (key, max) => (typeof ext[key] === 'string' ? ext[key].trim().slice(0, max) : '');
      cleanExternalVendor = {
        name: field('name', 120),
        businessName: field('businessName', 120),
        phone: field('phone', 20),
        city: field('city', 80),
        category: field('category', 80)
      };
      if (!cleanExternalVendor.name || !/^[0-9+\-\s]{8,20}$/.test(cleanExternalVendor.phone)) {
        return res.status(400).json({
          success: false,
          message: "Please provide the vendor's name and a valid phone number"
        });
      }
      if (bookingId) {
        return res.status(400).json({ success: false, message: 'A booking can only be linked to a vendor on the app' });
      }
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
      vendorId: vendorId || null,
      externalVendor: cleanExternalVendor || undefined,
      bookingId: verifiedBookingId,
      category,
      description: description.trim(),
      evidence: sanitizedEvidence,
      status: 'Pending',
      tat: await targetsFor(category)
    });

    // The vendor is told and can give their side. The complaint does not count against them unless upheld.
    if (complaint.vendorId) {
      await notifyVendor(complaint.vendorId,
        `A customer filed a ${category.toLowerCase()} complaint. Give your side in Complaints by ${new Date(complaint.tat.vendorResponseBy).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}. A complaint is not a finding against you; the Utsavo team reviews both sides.`);
      complaint.vendorNotifiedAt = new Date();
      await complaint.save();
    }

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
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        complaints: complaints.map(customerView),
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
      .populate('bookingId', 'bookingId eventDate status totalPrice')
      .lean();

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      data: { complaint: customerView(complaint) }
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
