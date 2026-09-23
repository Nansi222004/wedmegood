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

    const inviteObj = invite.toObject();
    inviteObj.title = invite.name;
    inviteObj.eventDetails = {
      brideName: invite.brideName || '',
      groomName: invite.groomName || '',
      eventDate: invite.weddingDate ? invite.weddingDate.toISOString() : null,
      weddingDate: invite.weddingDate ? invite.weddingDate.toISOString() : null,
      eventTime: invite.weddingTime || '18:00',
      weddingTime: invite.weddingTime || '18:00',
      venue: invite.venue || '',
      venueAddress: invite.venueAddress || '',
      message: invite.message || '',
      rsvpDeadline: invite.rsvpDeadline ? invite.rsvpDeadline.toISOString() : null,
      contactPerson: invite.contactPerson || '',
      contactPhone: invite.contactPhone || '',
      dresscode: invite.dresscode || ''
    };
    inviteObj.design = {
      backgroundColor: invite.backgroundColor || '#8B4513',
      textColor: invite.textColor || '#FFFFFF',
      accentColor: invite.accentColor || '#FFD700',
      musicUrl: invite.musicUrl || ''
    };
    inviteObj.settings = {
      enableRSVP: invite.enableRSVP ?? true,
      enableMap: invite.enableMap ?? true,
      enableGallery: invite.enableGallery ?? false,
      enableContact: invite.enableContact ?? false
    };

    res.status(200).json({
      success: true,
      data: {
        invite: inviteObj,
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
    const body = req.body || {};

    // Validate nested structures if provided
    if (body.eventDetails !== undefined && (typeof body.eventDetails !== 'object' || body.eventDetails === null || Array.isArray(body.eventDetails))) {
      return res.status(400).json({ success: false, message: 'Invalid eventDetails format. Must be an object.' });
    }
    if (body.design !== undefined && (typeof body.design !== 'object' || body.design === null || Array.isArray(body.design))) {
      return res.status(400).json({ success: false, message: 'Invalid design format. Must be an object.' });
    }
    if (body.settings !== undefined && (typeof body.settings !== 'object' || body.settings === null || Array.isArray(body.settings))) {
      return res.status(400).json({ success: false, message: 'Invalid settings format. Must be an object.' });
    }

    const eventDetails = body.eventDetails || {};
    const design = body.design || {};
    const settings = body.settings || {};

    const name = body.name || body.title;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Invitation name/title is required' });
    }

    const template = typeof body.template === 'string' && body.template.trim() ? body.template.trim() : 'Royal Elegance';
    const templateId = Number(body.templateId) || 1;
    const status = body.status === 'Published' ? 'Published' : 'Draft';

    const brideName = eventDetails.brideName !== undefined ? eventDetails.brideName : (body.brideName || '');
    const groomName = eventDetails.groomName !== undefined ? eventDetails.groomName : (body.groomName || '');
    const weddingDateRaw = eventDetails.eventDate || eventDetails.weddingDate || body.weddingDate;
    const weddingDate = weddingDateRaw ? new Date(weddingDateRaw) : null;
    const weddingTime = eventDetails.eventTime || eventDetails.weddingTime || body.weddingTime || '18:00';
    const venue = eventDetails.venue !== undefined ? eventDetails.venue : (body.venue || '');
    const venueAddress = eventDetails.venueAddress !== undefined ? eventDetails.venueAddress : (body.venueAddress || '');
    const message = eventDetails.message !== undefined ? eventDetails.message : (body.message || 'We joyfully invite you to celebrate our wedding ceremony.');
    const rsvpDeadlineRaw = eventDetails.rsvpDeadline || body.rsvpDeadline;
    const rsvpDeadline = rsvpDeadlineRaw ? new Date(rsvpDeadlineRaw) : null;
    const contactPerson = eventDetails.contactPerson !== undefined ? eventDetails.contactPerson : (body.contactPerson || '');
    const contactPhone = eventDetails.contactPhone !== undefined ? eventDetails.contactPhone : (body.contactPhone || '');
    const dresscode = eventDetails.dresscode !== undefined ? eventDetails.dresscode : (body.dresscode || 'Traditional Indian Attire');

    const backgroundColor = design.backgroundColor || body.backgroundColor || '#8B4513';
    const textColor = design.textColor || body.textColor || '#FFFFFF';
    const accentColor = design.accentColor || body.accentColor || '#FFD700';
    const musicUrl = design.musicUrl || body.musicUrl || '';

    const enableRSVP = settings.enableRSVP !== undefined ? Boolean(settings.enableRSVP) : (body.enableRSVP !== undefined ? Boolean(body.enableRSVP) : true);
    const enableMap = settings.enableMap !== undefined ? Boolean(settings.enableMap) : (body.enableMap !== undefined ? Boolean(body.enableMap) : true);
    const enableGallery = settings.enableGallery !== undefined ? Boolean(settings.enableGallery) : (body.enableGallery !== undefined ? Boolean(body.enableGallery) : false);
    const enableContact = settings.enableContact !== undefined ? Boolean(settings.enableContact) : (body.enableContact !== undefined ? Boolean(body.enableContact) : false);

    // Generate non-guessable cryptographic slug
    const slug = crypto.randomBytes(12).toString('hex');

    const newInvite = await EInvite.create({
      userId,
      slug,
      name: name.trim(),
      template,
      templateId,
      status,
      brideName: typeof brideName === 'string' ? brideName.trim() : '',
      groomName: typeof groomName === 'string' ? groomName.trim() : '',
      weddingDate: (weddingDate && !isNaN(weddingDate.getTime())) ? weddingDate : null,
      weddingTime: typeof weddingTime === 'string' ? weddingTime.trim() : '18:00',
      venue: typeof venue === 'string' ? venue.trim() : '',
      venueAddress: typeof venueAddress === 'string' ? venueAddress.trim() : '',
      message: typeof message === 'string' ? message.trim() : 'We joyfully invite you to celebrate our wedding ceremony.',
      rsvpDeadline: (rsvpDeadline && !isNaN(rsvpDeadline.getTime())) ? rsvpDeadline : null,
      contactPerson: typeof contactPerson === 'string' ? contactPerson.trim() : '',
      contactPhone: typeof contactPhone === 'string' ? contactPhone.trim() : '',
      dresscode: typeof dresscode === 'string' ? dresscode.trim() : 'Traditional Indian Attire',
      backgroundColor: typeof backgroundColor === 'string' ? backgroundColor.trim() : '#8B4513',
      textColor: typeof textColor === 'string' ? textColor.trim() : '#FFFFFF',
      accentColor: typeof accentColor === 'string' ? accentColor.trim() : '#FFD700',
      musicUrl: typeof musicUrl === 'string' ? musicUrl.trim() : '',
      enableRSVP,
      enableMap,
      enableGallery,
      enableContact
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

    const body = req.body || {};

    // Validate nested structures if provided
    if (body.eventDetails !== undefined && (typeof body.eventDetails !== 'object' || body.eventDetails === null || Array.isArray(body.eventDetails))) {
      return res.status(400).json({ success: false, message: 'Invalid eventDetails format. Must be an object.' });
    }
    if (body.design !== undefined && (typeof body.design !== 'object' || body.design === null || Array.isArray(body.design))) {
      return res.status(400).json({ success: false, message: 'Invalid design format. Must be an object.' });
    }
    if (body.settings !== undefined && (typeof body.settings !== 'object' || body.settings === null || Array.isArray(body.settings))) {
      return res.status(400).json({ success: false, message: 'Invalid settings format. Must be an object.' });
    }

    const eventDetails = body.eventDetails || {};
    const design = body.design || {};
    const settings = body.settings || {};

    // Helper: extracts value only if explicitly supplied (not undefined)
    const getDefinedVal = (nestedVal, flatVal) => {
      if (nestedVal !== undefined) return nestedVal;
      if (flatVal !== undefined) return flatVal;
      return undefined;
    };

    // Title / Name
    const titleVal = getDefinedVal(body.name, body.title);
    if (titleVal !== undefined && typeof titleVal === 'string' && titleVal.trim()) {
      invite.name = titleVal.trim();
    }

    // Template
    if (body.template !== undefined && typeof body.template === 'string' && body.template.trim()) {
      invite.template = body.template.trim();
    }
    if (body.templateId !== undefined) {
      const parsedId = Number(body.templateId);
      if (!isNaN(parsedId)) invite.templateId = parsedId;
    }

    // Status
    if (body.status !== undefined && ['Draft', 'Published'].includes(body.status)) {
      invite.status = body.status;
    }

    // Bride & Groom
    const bride = getDefinedVal(eventDetails.brideName, body.brideName);
    if (bride !== undefined && typeof bride === 'string') invite.brideName = bride.trim();

    const groom = getDefinedVal(eventDetails.groomName, body.groomName);
    if (groom !== undefined && typeof groom === 'string') invite.groomName = groom.trim();

    // Wedding Date
    const wDate = getDefinedVal(eventDetails.eventDate || eventDetails.weddingDate, body.weddingDate);
    if (wDate !== undefined) {
      if (wDate === null || wDate === '') {
        invite.weddingDate = null;
      } else {
        const parsed = new Date(wDate);
        if (!isNaN(parsed.getTime())) invite.weddingDate = parsed;
      }
    }

    // Wedding Time
    const wTime = getDefinedVal(eventDetails.eventTime || eventDetails.weddingTime, body.weddingTime);
    if (wTime !== undefined && typeof wTime === 'string') invite.weddingTime = wTime.trim();

    // Venue & Address
    const venue = getDefinedVal(eventDetails.venue, body.venue);
    if (venue !== undefined && typeof venue === 'string') invite.venue = venue.trim();

    const venueAddr = getDefinedVal(eventDetails.venueAddress, body.venueAddress);
    if (venueAddr !== undefined && typeof venueAddr === 'string') invite.venueAddress = venueAddr.trim();

    // Message
    const msg = getDefinedVal(eventDetails.message, body.message);
    if (msg !== undefined && typeof msg === 'string') invite.message = msg.trim();

    // RSVP Deadline
    const dl = getDefinedVal(eventDetails.rsvpDeadline, body.rsvpDeadline);
    if (dl !== undefined) {
      if (dl === null || dl === '') {
        invite.rsvpDeadline = null;
      } else {
        const parsed = new Date(dl);
        if (!isNaN(parsed.getTime())) invite.rsvpDeadline = parsed;
      }
    }

    // Contact Person & Phone
    const contactP = getDefinedVal(eventDetails.contactPerson, body.contactPerson);
    if (contactP !== undefined && typeof contactP === 'string') invite.contactPerson = contactP.trim();

    const contactPh = getDefinedVal(eventDetails.contactPhone, body.contactPhone);
    if (contactPh !== undefined && typeof contactPh === 'string') invite.contactPhone = contactPh.trim();

    // Dresscode
    const dress = getDefinedVal(eventDetails.dresscode, body.dresscode);
    if (dress !== undefined && typeof dress === 'string') invite.dresscode = dress.trim();

    // Design
    const bg = getDefinedVal(design.backgroundColor, body.backgroundColor);
    if (bg !== undefined && typeof bg === 'string' && bg.trim()) invite.backgroundColor = bg.trim();

    const txt = getDefinedVal(design.textColor, body.textColor);
    if (txt !== undefined && typeof txt === 'string' && txt.trim()) invite.textColor = txt.trim();

    const accent = getDefinedVal(design.accentColor, body.accentColor);
    if (accent !== undefined && typeof accent === 'string' && accent.trim()) invite.accentColor = accent.trim();

    const music = getDefinedVal(design.musicUrl, body.musicUrl);
    if (music !== undefined && typeof music === 'string') invite.musicUrl = music.trim();

    // Settings
    const rsvpEn = getDefinedVal(settings.enableRSVP, body.enableRSVP);
    if (rsvpEn !== undefined) invite.enableRSVP = Boolean(rsvpEn);

    const mapEn = getDefinedVal(settings.enableMap, body.enableMap);
    if (mapEn !== undefined) invite.enableMap = Boolean(mapEn);

    const galEn = getDefinedVal(settings.enableGallery, body.enableGallery);
    if (galEn !== undefined) invite.enableGallery = Boolean(galEn);

    const contactEn = getDefinedVal(settings.enableContact, body.enableContact);
    if (contactEn !== undefined) invite.enableContact = Boolean(contactEn);

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
      dresscode: invite.dresscode,
      backgroundColor: invite.backgroundColor,
      textColor: invite.textColor,
      accentColor: invite.accentColor,
      enableRSVP: invite.enableRSVP,
      enableMap: invite.enableMap,
      enableContact: Boolean(invite.enableContact),
      contactPerson: invite.enableContact ? invite.contactPerson : undefined,
      contactPhone: invite.enableContact ? invite.contactPhone : undefined,
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
    const body = req.body || {};
    const { guestName, email, phone, guestCount } = body;
    const status = body.status || body.attendance;
    const notes = body.notes !== undefined ? body.notes : body.note;

    if (!slug || typeof slug !== 'string' || slug.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid invitation link' });
    }

    if (!guestName || typeof guestName !== 'string' || !guestName.trim()) {
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
    const cleanPhone = phone ? String(phone).trim().replace(/[^\d+]/g, '') : '';

    // Safe Guest Reconciliation: Check if matching Guest exists in owner's address book
    let matchedGuestId = null;
    let matchingGuest = null;

    if (cleanEmail || cleanPhone) {
      const matchCriteria = { userId: invite.userId };
      const orClauses = [];
      if (cleanEmail) orClauses.push({ email: cleanEmail });
      if (cleanPhone) orClauses.push({ phone: cleanPhone });
      matchCriteria.$or = orClauses;
      matchingGuest = await Guest.findOne(matchCriteria);
    } else if (guestName && guestName.trim()) {
      matchingGuest = await Guest.findOne({ userId: invite.userId, name: guestName.trim() });
    }

    const targetRsvpStatus = status === 'Attending' ? 'Confirmed' : (status === 'Not Attending' ? 'Declined' : 'Pending');

    if (matchingGuest) {
      matchedGuestId = matchingGuest._id;
      matchingGuest.rsvpStatus = targetRsvpStatus;
      matchingGuest.guestCount = count;
      matchingGuest.invitationSent = true;
      if (cleanPhone && !matchingGuest.phone) matchingGuest.phone = cleanPhone;
      if (cleanEmail && !matchingGuest.email) matchingGuest.email = cleanEmail;
      if (notes) matchingGuest.notes = (matchingGuest.notes ? matchingGuest.notes + ' | ' : '') + `RSVP: ${String(notes).trim()}`;
      await matchingGuest.save();
    } else {
      // Auto-create in Guest collection so host sees this guest in /user/tools/guests!
      const validMeal = ['Veg', 'Non-Veg', 'Jain', 'Vegan'].includes(body.mealPreference)
        ? body.mealPreference
        : 'No Preference';

      const newGuest = await Guest.create({
        userId: invite.userId,
        name: guestName.trim(),
        phone: cleanPhone || '',
        email: cleanEmail || '',
        category: 'Others',
        side: 'Mutual',
        guestCount: count,
        rsvpStatus: targetRsvpStatus,
        mealPreference: validMeal,
        invitationSent: true,
        notes: notes ? `RSVP from E-Invite: ${String(notes).trim()}` : 'RSVP from E-Invite'
      });
      matchedGuestId = newGuest._id;
    }

    // Identity Collision Prevention & Deduplication in invite.rsvps:
    const phoneMatches = cleanPhone
      ? invite.rsvps.filter(r => r.phone && r.phone.replace(/[^\d+]/g, '') === cleanPhone)
      : [];
    const emailMatches = cleanEmail
      ? invite.rsvps.filter(r => r.email && r.email.toLowerCase() === cleanEmail)
      : [];

    // Collision Check: If phone and email point to different existing records, reject!
    if (phoneMatches.length > 0 && emailMatches.length > 0) {
      const phoneMatchId = phoneMatches[0]._id.toString();
      const emailMatchId = emailMatches[0]._id.toString();
      if (phoneMatchId !== emailMatchId) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and email match different existing RSVP records. Please verify your contact details.'
        });
      }
    }

    let existingRsvp = null;
    if (phoneMatches.length > 0) {
      existingRsvp = phoneMatches[0];
    } else if (emailMatches.length > 0) {
      existingRsvp = emailMatches[0];
    }

    if (existingRsvp) {
      // In-place update to prevent duplicate records
      existingRsvp.status = status;
      existingRsvp.guestCount = count;
      existingRsvp.guestName = guestName.trim();
      if (cleanEmail) existingRsvp.email = cleanEmail;
      if (cleanPhone) existingRsvp.phone = cleanPhone;
      if (notes !== undefined) existingRsvp.notes = String(notes).trim();
      if (matchedGuestId) existingRsvp.matchedGuestId = matchedGuestId;
      existingRsvp.submittedAt = new Date();
    } else {
      // New RSVP submission
      invite.rsvps.push({
        guestName: guestName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        status,
        guestCount: count,
        notes: notes ? String(notes).trim() : '',
        matchedGuestId,
        submittedAt: new Date()
      });
    }

    await invite.save();

    // Recalculate summary totals from persisted records
    const attendingCount = invite.rsvps
      .filter(r => r.status === 'Attending')
      .reduce((sum, r) => sum + (r.guestCount || 1), 0);
    const notAttendingCount = invite.rsvps
      .filter(r => r.status === 'Not Attending')
      .reduce((sum, r) => sum + (r.guestCount || 1), 0);
    const maybeCount = invite.rsvps
      .filter(r => r.status === 'Maybe')
      .reduce((sum, r) => sum + (r.guestCount || 1), 0);

    // Notify Invitation Owner (Non-blocking)
    try {
      const { notifyAndLogActivity } = require('../../services/notification.service');
      await notifyAndLogActivity({
        userId: invite.userId,
        notificationTitle: 'RSVP Received',
        notificationMessage: `${guestName.trim()} responded ${status} (${count} guest${count > 1 ? 's' : ''}) for ${invite.name}.`,
        notificationType: 'planning',
        activityType: 'rsvp_received',
        activityTitle: 'RSVP Received',
        activityMessage: `${guestName.trim()} RSVP'd ${status} (${count} guest${count > 1 ? 's' : ''}).`,
        entityType: 'EInvite',
        entityId: invite._id,
        eventKey: `rsvp_${invite._id}_${cleanPhone || cleanEmail || guestName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      });
    } catch (notifErr) {}

    res.status(200).json({
      success: true,
      message: `Thank you, ${guestName.trim()}! Your RSVP (${status}) has been recorded.`,
      data: {
        rsvp: {
          guestName: guestName.trim(),
          status,
          guestCount: count,
          submittedAt: new Date()
        },
        summary: {
          totalRSVPs: invite.rsvps.length,
          attendingCount,
          notAttendingCount,
          maybeCount
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
