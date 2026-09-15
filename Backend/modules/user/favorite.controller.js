const mongoose = require('mongoose');
const Favorite = require('./Favorite');
const Vendor = require('../vendor/Vendor');

// @desc    Get all saved / favorited vendors for current user
// @route   GET /api/user/favorites
// @access  Private (User)
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category } = req.query;

    const favorites = await Favorite.find({ userId })
      .populate({
        path: 'vendorId',
        select: 'businessName name category serviceType rating reviewsCount pricing address city coverImage images status isFeatured'
      })
      .sort({ createdAt: -1 });

    // Filter out if vendor was deleted or unapproved, and format for UI
    let formatted = favorites
      .filter(fav => fav.vendorId && (fav.vendorId.status || '').toLowerCase() === 'approved')
      .map(fav => {
        const v = fav.vendorId;
        return {
          favoriteId: fav._id,
          id: v._id,
          vendorId: v._id,
          name: v.businessName || v.name,
          category: v.category || v.serviceType || 'wedding',
          rating: v.rating?.average || 4.8,
          reviews: v.rating?.count || 12,
          price: v.pricing?.priceRange || (v.pricing?.startingPrice ? `₹${v.pricing.startingPrice.toLocaleString()}` : 'Price on request'),
          location: `${v.address?.city || v.city || 'India'}`,
          image: v.coverImage || (v.images && v.images[0]?.url) || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
          addedDate: fav.createdAt.toISOString().split('T')[0],
          isAvailable: true,
          isFeatured: v.isFeatured || false,
          notes: fav.notes
        };
      });

    if (category && category !== 'all') {
      formatted = formatted.filter(v => v.category.toLowerCase() === category.toLowerCase());
    }

    res.status(200).json({
      success: true,
      data: {
        favorites: formatted,
        count: formatted.length
      }
    });
  } catch (error) {
    console.error('getFavorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve favorites',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add vendor to favorites / shortlist
// @route   POST /api/user/favorites
// @access  Private (User)
exports.addFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const vendorId = req.body.vendorId || req.params.vendorId;
    const { notes } = req.body || {};

    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid vendorId is required'
      });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const statusLower = (vendor.status || '').toLowerCase();
    if (statusLower !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot favorite an unapproved or inactive vendor'
      });
    }

    // Check if already favorited (prevent duplicate via unique index or lookup)
    let favorite = await Favorite.findOne({ userId, vendorId });
    if (favorite) {
      return res.status(200).json({
        success: true,
        message: 'Vendor is already in your favorites',
        data: { favorite, isFavorite: true }
      });
    }

    favorite = await Favorite.create({
      userId,
      vendorId,
      notes: notes ? String(notes).trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Vendor added to favorites',
      data: { favorite, isFavorite: true }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'Vendor is already in your favorites',
        data: { isFavorite: true }
      });
    }
    console.error('addFavorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add favorite',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Remove vendor from favorites
// @route   DELETE /api/user/favorites/:vendorId
// @access  Private (User)
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { vendorId } = req.params;

    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid vendorId is required'
      });
    }

    const removed = await Favorite.findOneAndDelete({ userId, vendorId });

    res.status(200).json({
      success: true,
      message: removed ? 'Vendor removed from favorites' : 'Vendor was not in favorites',
      data: { isFavorite: false }
    });
  } catch (error) {
    console.error('removeFavorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove favorite',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Check if a vendor is favorited by current user
// @route   GET /api/user/favorites/check/:vendorId
// @access  Private (User)
exports.checkFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { vendorId } = req.params;

    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid vendorId is required'
      });
    }

    const favorite = await Favorite.findOne({ userId, vendorId });

    res.status(200).json({
      success: true,
      data: {
        isFavorite: !!favorite
      }
    });
  } catch (error) {
    console.error('checkFavorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
