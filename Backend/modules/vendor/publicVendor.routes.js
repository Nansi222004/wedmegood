const express = require('express');
const {
    getPublicVendors,
    getPublicVendorById,
    getVendorAvailability,
    getFeaturedVendors,
    getTrendingVendors,
    getRecommendedVendors
} = require('./publicVendor.controller');

const router = express.Router();

// Specific marketplace collections must precede :id parameter
router.get('/featured', getFeaturedVendors);
router.get('/trending', getTrendingVendors);
router.get('/recommendations', getRecommendedVendors);

// Vendor availability
router.get('/:id/availability', getVendorAvailability);

// Individual vendor details
router.get('/:id', getPublicVendorById);

// General paginated search and multi-filtered marketplace query
router.get('/', getPublicVendors);

module.exports = router;
