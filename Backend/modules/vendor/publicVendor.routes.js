const express = require('express');
const {
    getPublicVendors,
    getPublicVendorById,
    getVendorAvailability,
    getFeaturedVendors,
    getTrendingVendors,
    getRecommendedVendors
} = require('./publicVendor.controller');

const { cacheResponse } = require('../../utils/responseCache');

const router = express.Router();

// Specific marketplace collections must precede :id parameter
// Turns a plain-language requirement into search filters ("decorator in Jaipur for 300 guests under 2 lakh")
router.get('/interpret', async (req, res, next) => {
    try {
        const { parseRequirement } = require('../../services/requirementParser.service');
        res.status(200).json({ success: true, data: await parseRequirement(req.query.q) });
    } catch (err) {
        next(err);
    }
});
router.get('/setup-options', (req, res) => res.status(200).json({ success: true, data: require('../../utils/serviceSetup').SETUP_TAGS }));

router.get('/featured', cacheResponse(30000, 15), getFeaturedVendors);
router.get('/trending', cacheResponse(30000, 15), getTrendingVendors);
router.get('/recommendations', cacheResponse(30000, 15), getRecommendedVendors);

// Vendor availability
router.get('/:id/availability', getVendorAvailability);

// Individual vendor details
router.get('/:id', getPublicVendorById);

// General paginated search and multi-filtered marketplace query
router.get('/', cacheResponse(30000, 15), getPublicVendors);

module.exports = router;
