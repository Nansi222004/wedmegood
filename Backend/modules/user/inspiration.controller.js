const mongoose = require('mongoose');
const Inspiration = require('./Inspiration');
const Vendor = require('../vendor/Vendor');

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// @desc    Get user's saved wedding inspirations and board analytics
// @route   GET /api/user/inspiration
// @access  Private (User)
exports.getInspirations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category } = req.query;

    const filter = { userId };
    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }

    const [items, allItems] = await Promise.all([
      Inspiration.find(filter).sort({ createdAt: -1 }),
      Inspiration.find({ userId }).lean()
    ]);

    // Derive category distribution
    const categoryColors = {
      'decor': '#ec4899',
      'bridal': '#f59e0b',
      'venues': '#10b981',
      'photography': '#8b5cf6',
      'outfits': '#06b6d4',
      'mehndi': '#ef4444',
      'jewelry': '#eab308',
      'other': '#6b7280'
    };

    const categoryCounts = {};
    allItems.forEach(item => {
      const cat = item.category || 'other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categories = Object.keys(categoryCounts).map(cat => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      id: cat,
      count: categoryCounts[cat],
      color: categoryColors[cat] || '#ec4899'
    }));

    // Derive monthly stats from real createdAt
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};
    allItems.forEach(item => {
      const m = monthNames[new Date(item.createdAt).getMonth()];
      monthlyMap[m] = (monthlyMap[m] || 0) + 1;
    });

    const monthlyStats = Object.keys(monthlyMap).map(m => ({
      month: m,
      saved: monthlyMap[m]
    }));

    // Recent activity
    const recentActivity = allItems.slice(0, 5).map(item => ({
      action: 'Saved',
      item: item.title,
      category: item.category,
      time: new Date(item.createdAt).toLocaleDateString()
    }));

    res.status(200).json({
      success: true,
      data: {
        items,
        totalSaved: allItems.length,
        categories: categories.length > 0 ? categories : [
          { name: 'Decor', id: 'decor', count: 0, color: '#ec4899' },
          { name: 'Bridal', id: 'bridal', count: 0, color: '#f59e0b' },
          { name: 'Venues', id: 'venues', count: 0, color: '#10b981' }
        ],
        monthlyStats: monthlyStats.length > 0 ? monthlyStats : [{ month: 'Current', saved: allItems.length }],
        recentActivity
      }
    });
  } catch (error) {
    console.error('getInspirations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inspirations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get marketplace inspiration gallery (from approved, active vendors)
// @route   GET /api/user/inspiration-gallery
// @access  Private/Public
exports.getInspirationGallery = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { category, style, search } = req.query;

    // Build filter for public inspirations
    const filter = { isPublic: true };

    if (category && category !== 'all') {
      filter.category = category.toLowerCase().trim();
    }
    if (style && style !== 'all') {
      filter.style = { $regex: new RegExp(escapeRegex(style.trim()), 'i') };
    }
    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { title: { $regex: new RegExp(safeSearch, 'i') } },
        { vendorBusinessName: { $regex: new RegExp(safeSearch, 'i') } },
        { tags: { $regex: new RegExp(safeSearch, 'i') } }
      ];
    }

    // Retrieve public inspirations with populated vendor details
    const rawItems = await Inspiration.find(filter)
      .populate('vendorId', 'businessName city profileImage status isActive rating')
      .sort({ createdAt: -1 })
      .lean();

    // Enforce Rule 15: If an item has a vendor, vendor MUST be status === 'Approved' && isActive === true
    const validItems = rawItems.filter(item => {
      if (item.vendorId) {
        return item.vendorId.status === 'Approved' && item.vendorId.isActive === true;
      }
      return true; // user-curated public inspiration without vendor link
    });

    // If gallery has vendor inspirations, paginate and return
    const total = validItems.length;
    const paginatedItems = validItems.slice(skip, skip + limit);

    // If validItems is empty, generate dynamic gallery from approved, active vendors' portfolios
    if (validItems.length === 0) {
      const vendorQuery = { status: 'Approved', isActive: true, 'portfolio.0': { $exists: true } };
      if (search && search.trim()) {
        vendorQuery.businessName = { $regex: new RegExp(escapeRegex(search.trim()), 'i') };
      }

      const activeVendors = await Vendor.find(vendorQuery)
        .select('businessName city profileImage rating startingPrice portfolio selectedCategories')
        .limit(20)
        .lean();

      const portfolioGallery = [];
      activeVendors.forEach(v => {
        if (Array.isArray(v.portfolio)) {
          v.portfolio.forEach((p, idx) => {
            if (p.url) {
              portfolioGallery.push({
                _id: new mongoose.Types.ObjectId(),
                title: p.title || `${v.businessName} Showcase`,
                category: (p.tag || v.selectedCategories?.[0]?.categoryName || 'photography').toLowerCase(),
                image: p.url,
                style: 'Traditional',
                vendorId: {
                  _id: v._id,
                  businessName: v.businessName,
                  city: v.city,
                  profileImage: v.profileImage,
                  rating: v.rating
                },
                vendorBusinessName: v.businessName,
                isPublic: true,
                sourceType: 'vendor'
              });
            }
          });
        }
      });

      const filteredPortfolio = (category && category !== 'all')
        ? portfolioGallery.filter(item => item.category.includes(category.toLowerCase()))
        : portfolioGallery;

      return res.status(200).json({
        success: true,
        data: {
          items: filteredPortfolio.slice(skip, skip + limit),
          total: filteredPortfolio.length,
          page,
          limit,
          totalPages: Math.ceil(filteredPortfolio.length / limit) || 1
        },
        pagination: {
          total: filteredPortfolio.length,
          page,
          limit,
          totalPages: Math.ceil(filteredPortfolio.length / limit) || 1
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        items: paginatedItems,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('getInspirationGallery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inspiration gallery',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Save wedding idea to user inspiration board
// @route   POST /api/user/inspiration
// @access  Private (User)
exports.saveInspiration = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, image, category, notes, source, vendorId, vendorBusinessName, style, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Inspiration title is required' });
    }

    if (!image || !image.trim()) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    let resolvedVendorName = vendorBusinessName ? vendorBusinessName.trim() : '';
    let resolvedVendorId = null;

    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      resolvedVendorId = vendorId;
      if (!resolvedVendorName) {
        const v = await Vendor.findById(vendorId).select('businessName').lean();
        if (v) resolvedVendorName = v.businessName;
      }
    }

    const newInspiration = await Inspiration.create({
      userId,
      title: title.trim(),
      image: image.trim(),
      category: category ? category.toLowerCase().trim() : 'other',
      notes: notes ? notes.trim() : '',
      source: source ? source.trim() : '',
      sourceType: 'user', // User-saved is private by default (Rule 14)
      vendorId: resolvedVendorId,
      vendorBusinessName: resolvedVendorName,
      style: style ? style.trim() : 'Traditional',
      tags: Array.isArray(tags) ? tags : [],
      isPublic: false
    });

    const inspObj = newInspiration.toObject ? newInspiration.toObject() : newInspiration;
    res.status(201).json({
      success: true,
      message: 'Inspiration saved successfully',
      data: {
        ...inspObj,
        inspiration: newInspiration
      }
    });
  } catch (error) {
    console.error('saveInspiration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save inspiration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete saved inspiration
// @route   DELETE /api/user/inspiration/:id
// @access  Private (User)
exports.deleteInspiration = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid inspiration ID format' });
    }

    const removed = await Inspiration.findOneAndDelete({ _id: id, userId });
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Inspiration not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Inspiration removed successfully'
    });
  } catch (error) {
    console.error('deleteInspiration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inspiration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
