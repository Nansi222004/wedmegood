const mongoose = require('mongoose');
const Guest = require('./Guest');

// @desc    Get user's guest list and statistics
// @route   GET /api/user/guests
// @access  Private (User)
exports.getGuests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, rsvpStatus, side, search } = req.query;

    const filter = { userId };
    if (category && category !== 'All') filter.category = category;
    if (rsvpStatus && rsvpStatus !== 'All') filter.rsvpStatus = rsvpStatus;
    if (side && side !== 'All') filter.side = side;
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const [guests, allGuests] = await Promise.all([
      Guest.find(filter).sort({ createdAt: -1 }),
      Guest.find({ userId }).lean()
    ]);

    // Compute live analytics from MongoDB
    const totalInvited = allGuests.reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);
    const confirmed = allGuests.filter(g => g.rsvpStatus === 'Confirmed').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);
    const pending = allGuests.filter(g => g.rsvpStatus === 'Pending').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);
    const declined = allGuests.filter(g => g.rsvpStatus === 'Declined').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);

    const categories = [
      { name: 'Family', count: allGuests.filter(g => g.category === 'Family').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0), color: '#ec4899' },
      { name: 'Friends', count: allGuests.filter(g => g.category === 'Friends').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0), color: '#3b82f6' },
      { name: 'Colleagues', count: allGuests.filter(g => g.category === 'Colleagues').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0), color: '#10b981' },
      { name: 'VIP', count: allGuests.filter(g => g.category === 'VIP').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0), color: '#f59e0b' },
      { name: 'Others', count: allGuests.filter(g => g.category === 'Others').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0), color: '#8b5cf6' }
    ];

    res.status(200).json({
      success: true,
      data: {
        guests,
        stats: {
          totalGuests: allGuests.length,
          totalInvited,
          confirmed,
          pending,
          declined,
          responseRate: totalInvited > 0 ? Math.round(((confirmed + declined) / totalInvited) * 100) : 0,
          categories
        }
      }
    });
  } catch (error) {
    console.error('getGuests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve guest list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add a guest to user's list
// @route   POST /api/user/guests
// @access  Private (User)
exports.createGuest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phone, email, category, side, rsvpStatus, guestCount, mealPreference, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Guest name is required'
      });
    }

    const newGuest = await Guest.create({
      userId,
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      category: ['Family', 'Friends', 'Colleagues', 'VIP', 'Others'].includes(category) ? category : 'Family',
      side: ['Bride', 'Groom', 'Mutual'].includes(side) ? side : 'Mutual',
      rsvpStatus: ['Pending', 'Confirmed', 'Declined'].includes(rsvpStatus) ? rsvpStatus : 'Pending',
      guestCount: Math.max(1, Number(guestCount) || 1),
      mealPreference: ['Veg', 'Non-Veg', 'Jain', 'Vegan', 'No Preference'].includes(mealPreference) ? mealPreference : 'No Preference',
      notes: notes ? notes.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Guest added successfully',
      data: { guest: newGuest }
    });
  } catch (error) {
    console.error('createGuest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add guest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update guest details
// @route   PUT /api/user/guests/:id
// @access  Private (User)
exports.updateGuest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid guest ID format' });
    }

    const guest = await Guest.findOne({ _id: id, userId });
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found or unauthorized' });
    }

    const { name, phone, email, category, side, rsvpStatus, guestCount, mealPreference, notes, invitationSent } = req.body;

    if (name !== undefined) guest.name = String(name).trim();
    if (phone !== undefined) guest.phone = String(phone).trim();
    if (email !== undefined) guest.email = String(email).trim().toLowerCase();
    if (category !== undefined && ['Family', 'Friends', 'Colleagues', 'VIP', 'Others'].includes(category)) guest.category = category;
    if (side !== undefined && ['Bride', 'Groom', 'Mutual'].includes(side)) guest.side = side;
    if (rsvpStatus !== undefined && ['Pending', 'Confirmed', 'Declined'].includes(rsvpStatus)) guest.rsvpStatus = rsvpStatus;
    if (guestCount !== undefined) guest.guestCount = Math.max(1, Number(guestCount) || 1);
    if (mealPreference !== undefined && ['Veg', 'Non-Veg', 'Jain', 'Vegan', 'No Preference'].includes(mealPreference)) guest.mealPreference = mealPreference;
    if (notes !== undefined) guest.notes = String(notes).trim();
    if (invitationSent !== undefined) guest.invitationSent = Boolean(invitationSent);

    await guest.save();

    res.status(200).json({
      success: true,
      message: 'Guest updated successfully',
      data: { guest }
    });
  } catch (error) {
    console.error('updateGuest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update guest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update guest RSVP status
// @route   PATCH /api/user/guests/:id/rsvp
// @access  Private (User)
exports.updateGuestRSVP = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { rsvpStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid guest ID format' });
    }

    if (!['Pending', 'Confirmed', 'Declined'].includes(rsvpStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RSVP status. Allowed: Pending, Confirmed, Declined'
      });
    }

    const guest = await Guest.findOneAndUpdate(
      { _id: id, userId },
      { rsvpStatus },
      { new: true }
    );

    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: `RSVP status updated to ${rsvpStatus}`,
      data: { guest }
    });
  } catch (error) {
    console.error('updateGuestRSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update RSVP status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete guest
// @route   DELETE /api/user/guests/:id
// @access  Private (User)
exports.deleteGuest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid guest ID format' });
    }

    const guest = await Guest.findOneAndDelete({ _id: id, userId });
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Guest deleted successfully'
    });
  } catch (error) {
    console.error('deleteGuest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete guest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
