const mongoose = require('mongoose');
const crypto = require('crypto');
const EInvite = require('./EInvite');
const Guest = require('./Guest');

// ==========================================
// OWNER APIS (Private - Authenticated User)
// ==========================================

// @desc    Get all invitations created by user
// @route   GET /api/user/invites
// @access  Private (User)
exports.getInvites = async (req, res) => {
  try {
    const userId = req.user._id;

    const invites = await EInvite.find({ userId }).sort({ createdAt: -1 });

    const formatted = invites.map(inv => ({
      _id: inv._id,
      id: inv._id,
      slug: inv.slug,
      name: inv.name,
      template: inv.template,
      templateId: inv.templateId,
      status: inv.status,
      views: inv.views || 0,
      rsvps: inv.rsvps ? inv.rsvps.length : 0,
      date: inv.weddingDate ? new Date(inv.weddingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date not set',
      rawWeddingDate: inv.weddingDate,
      thumbnail: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&h=400&fit=crop&q=80',
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${inv.slug}`
    }));

    res.status(200).json({
      success: true,
      data: {
        invites: formatted,
        totalInvites: formatted.length
      }
    });
  } catch (error) {
    console.error('getInvites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invitations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get invitation details for editing/viewing by owner
// @route   GET /api/user/invites/:id
// @access  Private (User)
exports.getInviteById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    let invite = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      invite = await EInvite.findOne({ _id: id, userId });
    } else {
      // Allow lookup by slug for owner if requested
      invite = await EInvite.findOne({ slug: id, userId });
    }

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or unauthorized'
      });
    }

    const attendingCount = invite.rsvps.filter(r => r.status === 'Attending').reduce((sum, r) => sum + (r.guestCount || 1), 0);
    const notAttendingCount = invite.rsvps.filter(r => r.status === 'Not Attending').reduce((sum, r) => sum + (r.guestCount || 1), 0);
    const maybeCount = invite.rsvps.filter(r => r.status === 'Maybe').reduce((sum, r) => sum + (r.guestCount || 1), 0);

    res.status(200).json({
      success: true,
      data: {
        invite,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${invite.slug}`,
        stats: {
          views: invite.views || 0,
          totalRSVPs: invite.rsvps.length,
          attendingCount,
          notAttendingCount,
          maybeCount
        }
      }
    });
  } catch (error) {
    console.error('getInviteById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invitation details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create a new digital invitation
// @route   POST /api/user/invites
// @access  Private (User)
exports.createInvite = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      template,
      templateId,
      brideName,
      groomName,
      weddingDate,
      weddingTime,
      venue,
      venueAddress,
      message,
      rsvpDeadline,
      contactPerson,
      contactPhone,
      dresscode,
      backgroundColor,
      textColor,
      accentColor,
      enableRSVP,
      status
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Invitation name is required' });
    }

    // Generate non-guessable cryptographic slug
    const slug = crypto.randomBytes(12).toString('hex');

    const newInvite = await EInvite.create({
      userId,
      slug,
      name: name.trim(),
      template: template || 'Royal Elegance',
      templateId: Number(templateId) || 1,
      status: status === 'Published' ? 'Published' : 'Draft',
      brideName: brideName ? brideName.trim() : '',
      groomName: groomName ? groomName.trim() : '',
      weddingDate: weddingDate ? new Date(weddingDate) : null,
      weddingTime: weddingTime ? weddingTime.trim() : '18:00',
      venue: venue ? venue.trim() : '',
      venueAddress: venueAddress ? venueAddress.trim() : '',
      message: message ? message.trim() : 'We joyfully invite you to celebrate our wedding ceremony.',
      rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
      contactPerson: contactPerson ? contactPerson.trim() : '',
      contactPhone: contactPhone ? contactPhone.trim() : '',
      dresscode: dresscode ? dresscode.trim() : 'Traditional Indian Attire',
      backgroundColor: backgroundColor || '#8B4513',
      textColor: textColor || '#FFFFFF',
      accentColor: accentColor || '#FFD700',
      enableRSVP: enableRSVP !== undefined ? Boolean(enableRSVP) : true
    });

    res.status(201).json({
      success: true,
      message: 'Invitation created successfully',
      data: {
        invite: newInvite,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${slug}`
      }
    });
  } catch (error) {
    console.error('createInvite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update invitation details
// @route   PUT /api/user/invites/:id
// @access  Private (User)
exports.updateInvite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid invitation ID format' });
    }

    const invite = await EInvite.findOne({ _id: id, userId });
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invitation not found or unauthorized' });
    }

    const allowedUpdates = [
      'name', 'template', 'templateId', 'status', 'brideName', 'groomName',
      'weddingDate', 'weddingTime', 'venue', 'venueAddress', 'message',
      'rsvpDeadline', 'contactPerson', 'contactPhone', 'dresscode',
      'backgroundColor', 'textColor', 'accentColor', 'musicUrl',
      'enableRSVP', 'enableMap', 'enableGallery'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'weddingDate' || field === 'rsvpDeadline') {
          invite[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          invite[field] = req.body[field];
        }
      }
    });

    await invite.save();

    res.status(200).json({
      success: true,
      message: 'Invitation updated successfully',
      data: {
        invite,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${invite.slug}`
      }
    });
  } catch (error) {
    console.error('updateInvite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete invitation
// @route   DELETE /api/user/invites/:id
// @access  Private (User)
exports.deleteInvite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid invitation ID format' });
    }

    const deleted = await EInvite.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Invitation not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Invitation deleted successfully'
    });
  } catch (error) {
    console.error('deleteInvite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==========================================
// PUBLIC APIS (Unauthenticated - Sanitized)
// ==========================================

// @desc    Get sanitized public invitation for guest viewing
// @route   GET /api/public/invites/:slug
// @access  Public
exports.getPublicInvite = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== 'string' || slug.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid invitation link' });
    }

    const invite = await EInvite.findOneAndUpdate(
      { slug, status: 'Published' },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or is currently unpublished'
      });
    }

    // SANITIZATION: Strictly exclude userId, private guest list, and phone records
    const sanitizedInvite = {
      slug: invite.slug,
      name: invite.name,
      template: invite.template,
      templateId: invite.templateId,
      brideName: invite.brideName,
      groomName: invite.groomName,
      weddingDate: invite.weddingDate,
      weddingTime: invite.weddingTime,
      venue: invite.venue,
      venueAddress: invite.venueAddress,
      message: invite.message,
      rsvpDeadline: invite.rsvpDeadline,
      contactPerson: invite.contactPerson,
      dresscode: invite.dresscode,
      backgroundColor: invite.backgroundColor,
      textColor: invite.textColor,
      accentColor: invite.accentColor,
      enableRSVP: invite.enableRSVP,
      enableMap: invite.enableMap,
      isExpired: invite.rsvpDeadline ? new Date() > new Date(invite.rsvpDeadline) : false
    };

    res.status(200).json({
      success: true,
      data: { invite: sanitizedInvite }
    });
  } catch (error) {
    console.error('getPublicInvite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Submit public guest RSVP
// @route   POST /api/public/invites/:slug/rsvp
// @access  Public (Rate Limited)
exports.submitPublicRSVP = async (req, res) => {
  try {
    const { slug } = req.params;
    const { guestName, email, phone, status, guestCount, notes } = req.body;

    if (!slug || typeof slug !== 'string' || slug.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid invitation link' });
    }

    if (!guestName || !guestName.trim()) {
      return res.status(400).json({ success: false, message: 'Guest name is required for RSVP' });
    }

    if (!['Attending', 'Not Attending', 'Maybe'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RSVP status. Allowed: Attending, Not Attending, Maybe'
      });
    }

    const invite = await EInvite.findOne({ slug });
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (invite.status !== 'Published') {
      return res.status(400).json({ success: false, message: 'This invitation is not published' });
    }

    if (!invite.enableRSVP) {
      return res.status(400).json({ success: false, message: 'RSVP is disabled for this invitation' });
    }

    if (invite.rsvpDeadline && new Date() > new Date(invite.rsvpDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'The RSVP deadline for this invitation has passed'
      });
    }

    const count = Math.min(20, Math.max(1, Number(guestCount) || 1));
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanPhone = phone ? String(phone).trim() : '';

    // Safe Guest Reconciliation: Check if matching Guest exists for the invitation OWNER
    let matchedGuestId = null;
    if (cleanEmail || cleanPhone) {
      const matchCriteria = { userId: invite.userId };
      const orClauses = [];
      if (cleanEmail) orClauses.push({ email: cleanEmail });
      if (cleanPhone) orClauses.push({ phone: cleanPhone });
      matchCriteria.$or = orClauses;

      const matchingGuest = await Guest.findOne(matchCriteria);
      if (matchingGuest) {
        matchedGuestId = matchingGuest._id;
        matchingGuest.rsvpStatus = status === 'Attending' ? 'Confirmed' : (status === 'Not Attending' ? 'Declined' : 'Pending');
        matchingGuest.guestCount = count;
        if (notes) matchingGuest.notes = (matchingGuest.notes ? matchingGuest.notes + ' | ' : '') + `RSVP: ${notes.trim()}`;
        await matchingGuest.save();
      }
    }

    const rsvpEntry = {
      guestName: guestName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      status,
      guestCount: count,
      notes: notes ? String(notes).trim() : '',
      matchedGuestId,
      submittedAt: new Date()
    };

    invite.rsvps.push(rsvpEntry);
    await invite.save();

    // Notify Invitation Owner (Non-blocking)
    try {
      const { notifyAndLogActivity } = require('../../services/notification.service');
      await notifyAndLogActivity({
        userId: invite.userId,
        notificationTitle: 'New RSVP Received',
        notificationMessage: `${guestName} responded ${status} (${count} guest${count > 1 ? 's' : ''}) for ${invite.name}.`,
        notificationType: 'planning',
        activityType: 'rsvp_received',
        activityTitle: 'RSVP Received',
        activityMessage: `${guestName} RSVP'd ${status} (${count} guest${count > 1 ? 's' : ''}).`,
        entityType: 'EInvite',
        entityId: invite._id,
        eventKey: `rsvp_${invite._id}_${guestName ? guestName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'guest'}`
      });
    } catch (notifErr) {}

    res.status(200).json({
      success: true,
      message: `Thank you, ${guestName}! Your RSVP (${status}) has been recorded.`,
      data: {
        rsvp: {
          guestName: rsvpEntry.guestName,
          status: rsvpEntry.status,
          guestCount: rsvpEntry.guestCount,
          submittedAt: rsvpEntry.submittedAt
        }
      }
    });
  } catch (error) {
    console.error('submitPublicRSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit RSVP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Non-PII share action telemetry
// @route   POST /api/public/invites/:slug/share
// @access  Public
exports.trackShare = async (req, res) => {
  try {
    const { slug } = req.params;
    const { platform } = req.body;

    const allowedPlatforms = ['whatsapp', 'email', 'sms', 'copy', 'native'];
    if (!platform || !allowedPlatforms.includes(String(platform).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Allowed platforms: whatsapp, email, sms, copy, native'
      });
    }

    const cleanPlatform = String(platform).toLowerCase();
    const updateField = `sharesBreakdown.${cleanPlatform}`;

    const invite = await EInvite.findOneAndUpdate(
      { slug, status: 'Published' },
      {
        $inc: {
          sharesCount: 1,
          [updateField]: 1
        }
      },
      { new: true }
    ).select('_id userId sharesCount sharesBreakdown');

    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Share tracked',
      data: {
        platform: cleanPlatform,
        sharesCount: invite.sharesCount,
        sharesBreakdown: invite.sharesBreakdown,
        timestamp: new Date()
      }
    });
  } catch (err) {
    console.error('trackShare error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to record share',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
