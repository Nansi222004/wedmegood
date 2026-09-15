const mongoose = require('mongoose');
const Lead = require('../vendor/Lead');
const Quote = require('../vendor/Quote');
const Booking = require('../vendor/Booking');
const Favorite = require('./Favorite');

// @desc    Get aggregated Vendor Management dashboard from real Phase 1 models
// @route   GET /api/user/vendor-management
// @access  Private (User)
exports.getVendorManagement = async (req, res) => {
  try {
    const userId = req.user._id;

    const [leads, quotes, bookings, favorites] = await Promise.all([
      Lead.find({ userId })
        .populate('vendorId', 'businessName name category serviceType rating city coverImage images')
        .sort({ createdAt: -1 })
        .lean(),
      Quote.find({ userId })
        .populate('vendorId', 'businessName name category serviceType rating city coverImage images')
        .sort({ createdAt: -1 })
        .lean(),
      Booking.find({ userId })
        .populate('vendorId', 'businessName name category serviceType rating city coverImage images')
        .sort({ createdAt: -1 })
        .lean(),
      Favorite.find({ userId })
        .populate('vendorId', 'businessName name category serviceType rating city coverImage images')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // Map unique vendors with highest engagement lifecycle status
    const vendorMap = new Map();

    // 1. Bookings (highest priority)
    bookings.forEach(b => {
      if (!b.vendorId) return;
      const vId = b.vendorId._id.toString();
      const statusLabel = b.status === 'completed' ? 'Completed' : (b.status === 'cancelled' ? 'Cancelled' : 'Booked');
      vendorMap.set(vId, {
        vendorId: b.vendorId._id,
        name: b.vendorId.businessName || b.vendorId.name,
        category: b.vendorId.category || b.vendorId.serviceType || 'Vendor',
        rating: b.vendorId.rating?.average || 4.8,
        city: b.vendorId.city || 'India',
        image: b.vendorId.coverImage || (b.vendorId.images && b.vendorId.images[0]?.url) || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
        status: statusLabel,
        bookingId: b._id,
        bookingDate: b.eventDate,
        amount: b.totalPrice || 0,
        updatedAt: b.updatedAt || b.createdAt
      });
    });

    // 2. Quotes (if not booked)
    quotes.forEach(q => {
      if (!q.vendorId) return;
      const vId = q.vendorId._id.toString();
      if (!vendorMap.has(vId)) {
        vendorMap.set(vId, {
          vendorId: q.vendorId._id,
          name: q.vendorId.businessName || q.vendorId.name,
          category: q.vendorId.category || q.vendorId.serviceType || 'Vendor',
          rating: q.vendorId.rating?.average || 4.8,
          city: q.vendorId.city || 'India',
          image: q.vendorId.coverImage || (q.vendorId.images && q.vendorId.images[0]?.url) || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
          status: q.status === 'accepted' ? 'Booked' : 'Quote Received',
          quoteId: q._id,
          amount: q.totalAmount || 0,
          updatedAt: q.updatedAt || q.createdAt
        });
      }
    });

    // 3. Leads (if not quoted or booked)
    leads.forEach(l => {
      if (!l.vendorId) return;
      const vId = l.vendorId._id.toString();
      if (!vendorMap.has(vId)) {
        vendorMap.set(vId, {
          vendorId: l.vendorId._id,
          name: l.vendorId.businessName || l.vendorId.name,
          category: l.vendorId.category || l.vendorId.serviceType || 'Vendor',
          rating: l.vendorId.rating?.average || 4.8,
          city: l.vendorId.city || 'India',
          image: l.vendorId.coverImage || (l.vendorId.images && l.vendorId.images[0]?.url) || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
          status: 'Inquiry',
          leadId: l._id,
          amount: 0,
          updatedAt: l.updatedAt || l.createdAt
        });
      }
    });

    // 4. Favorites (if not in leads, quotes, or bookings)
    favorites.forEach(f => {
      if (!f.vendorId) return;
      const vId = f.vendorId._id.toString();
      if (!vendorMap.has(vId)) {
        vendorMap.set(vId, {
          vendorId: f.vendorId._id,
          name: f.vendorId.businessName || f.vendorId.name,
          category: f.vendorId.category || f.vendorId.serviceType || 'Vendor',
          rating: f.vendorId.rating?.average || 4.8,
          city: f.vendorId.city || 'India',
          image: f.vendorId.coverImage || (f.vendorId.images && f.vendorId.images[0]?.url) || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
          status: 'Shortlisted',
          favoriteId: f._id,
          amount: 0,
          updatedAt: f.createdAt
        });
      }
    });

    const vendorList = Array.from(vendorMap.values());

    const bookedVendors = vendorList.filter(v => v.status === 'Booked' || v.status === 'Completed').length;
    const pendingVendors = vendorList.filter(v => v.status === 'Inquiry' || v.status === 'Quote Received').length;
    const shortlistedVendors = vendorList.filter(v => v.status === 'Shortlisted').length;
    const totalSpentOnBookings = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    // Build real recent activity timeline from transaction records
    const recentActivity = [];
    bookings.slice(0, 3).forEach(b => {
      recentActivity.push({
        action: `Booked ${b.vendorId?.businessName || b.vendorId?.name || 'Vendor'}`,
        time: new Date(b.createdAt).toLocaleDateString(),
        type: 'booking'
      });
    });
    quotes.slice(0, 3).forEach(q => {
      recentActivity.push({
        action: `Quote received from ${q.vendorId?.businessName || q.vendorId?.name || 'Vendor'}`,
        time: new Date(q.createdAt).toLocaleDateString(),
        type: 'quote'
      });
    });
    leads.slice(0, 2).forEach(l => {
      recentActivity.push({
        action: `Inquired with ${l.vendorId?.businessName || l.vendorId?.name || 'Vendor'}`,
        time: new Date(l.createdAt).toLocaleDateString(),
        type: 'lead'
      });
    });

    res.status(200).json({
      success: true,
      data: {
        vendors: vendorList,
        stats: {
          totalVendors: vendorList.length,
          bookedVendors,
          pendingVendors,
          shortlistedVendors,
          totalBookedValue: totalSpentOnBookings
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('getVendorManagement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendor management data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
