const mongoose = require('mongoose');
const Lead = require('../vendor/Lead');
const Vendor = require('../vendor/Vendor');
const Notification = require('../vendor/Notification');
const Category = require('../admin/Category');
const RoundRobinSequence = require('../vendor/RoundRobinSequence');

const SPECIAL_ROUND_ROBIN_CATEGORIES = [
    'led walls', 'led wall', 'led-walls', 'led-wall',
    'live streaming', 'live stream', 'live-streaming', 'live-stream',
    'flower decorators', 'flower decorator', 'flower-decorators', 'floral decor', 'flower decoration',
    'special welcome / entry', 'special welcome', 'special entry', 'special-entry', 'welcome-entry', 'grand entry'
];

function isSpecialRoundRobinCategory(catName = '') {
    if (!catName) return false;
    const clean = catName.trim().toLowerCase();
    return SPECIAL_ROUND_ROBIN_CATEGORIES.some(special => clean.includes(special) || special.includes(clean));
}

// @desc    Create a new lead (Direct or Category Round-Robin)
// @route   POST /api/user/leads
// @access  Private (User)
exports.createLead = async (req, res, next) => {
    try {
        const {
            vendorId,
            category,
            weddingType,
            eventDate,
            eventLocation,
            guestCount,
            budget,
            requirements,
            venueType,
            message,
            referencePhotos,
            phone
        } = req.body;

        if (!eventDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide event date'
            });
        }

        let assignedVendorId = null;
        let assignedType = 'Direct';

        // Check if category is a designated Round-Robin Special Category
        const isSpecialCategory = isSpecialRoundRobinCategory(category);

        if (vendorId && !isSpecialCategory) {
            // Direct inquiry (only if not an enforced round-robin special category)
            if (!mongoose.Types.ObjectId.isValid(vendorId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid vendor ID format'
                });
            }

            const vendor = await Vendor.findOne({
                _id: vendorId,
                status: 'Approved',
                isActive: true
            });

            if (!vendor) {
                return res.status(404).json({
                    success: false,
                    message: 'Vendor not found or not active'
                });
            }

            assignedVendorId = vendor._id;
            assignedType = 'Direct';
        } else if (category || isSpecialCategory) {
            // Round-robin sequential assignment among eligible subscribed vendors
            const catDoc = await Category.findOne({
                $or: [
                    { slug: (category || '').toLowerCase() },
                    { name: new RegExp(`^${(category || '').trim()}$`, 'i') }
                ]
            });

            const categoryFilter = catDoc
                ? {
                    $or: [
                        { 'selectedCategories.categoryId': catDoc._id },
                        { 'selectedCategories.categoryName': new RegExp(`^${catDoc.name}$`, 'i') },
                        { 'services.category': new RegExp(`^${catDoc.name}$`, 'i') },
                        { 'services.name': new RegExp(category, 'i') }
                    ]
                }
                : {
                    $or: [
                        { 'selectedCategories.categoryName': new RegExp((category || '').replace(/-/g, ' '), 'i') },
                        { 'services.category': new RegExp((category || '').replace(/-/g, ' '), 'i') },
                        { 'services.name': new RegExp((category || '').replace(/-/g, ' '), 'i') }
                    ]
                };

            // Only approved, active, subscribed vendors receive round-robin leads
            const eligibleVendors = await Vendor.find({
                status: 'Approved',
                isActive: true,
                'subscription.status': 'Active',
                ...categoryFilter
            }).sort('_id');

            if (!eligibleVendors || eligibleVendors.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscribed vendors currently available in this category'
                });
            }

            const categoryKey = (catDoc ? catDoc.slug : (category || 'general')).toLowerCase();

            // Atomic concurrency-safe sequential index increment
            const seq = await RoundRobinSequence.findOneAndUpdate(
                { categoryKey },
                { $inc: { currentIndex: 1 }, $set: { lastAssignedAt: new Date() } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            const nextIndex = (seq.currentIndex - 1) % eligibleVendors.length;
            assignedVendorId = eligibleVendors[nextIndex]._id;

            await RoundRobinSequence.updateOne(
                { categoryKey },
                { $set: { lastAssignedVendorId: assignedVendorId } }
            );

            assignedType = 'RoundRobin';
        } else {
            return res.status(400).json({
                success: false,
                message: 'Please provide either vendorId or category'
            });
        }

        // Create Lead
        const resolvedCustomerName = (req.body.customerName && req.body.customerName !== 'Customer' && req.body.customerName !== 'Valued Customer')
            ? req.body.customerName
            : (req.user?.name || req.body.customerName || 'Customer');

        const resolvedLocation = eventLocation || req.user?.city || 'Indore';
        const resolvedPhone = phone || req.user?.phone || 'Not Provided';

        const lead = await Lead.create({
            vendorId: assignedVendorId,
            userId: req.user._id,
            customerName: resolvedCustomerName,
            phone: resolvedPhone,
            eventDate: new Date(eventDate),
            eventLocation: resolvedLocation,
            category: category || 'General',
            guestCount: Number(guestCount) || 0,
            budget: Number(budget) || 0,
            requirements: requirements || '',
            venueType: venueType || 'Not Specified',
            referencePhotos: Array.isArray(referencePhotos) ? referencePhotos : [],
            message: message || 'Inquiry regarding wedding services',
            assignedType,
            status: 'New'
        });

        // Create vendor notification
        await Notification.create({
            vendorId: assignedVendorId,
            message: `New inquiry from ${lead.customerName} for ${lead.eventLocation}`,
            type: 'Lead',
            isRead: false
        });

        // Auto-link canonical conversation for this user and vendor
        try {
            const chatService = require('../chat/chat.service');
            await chatService.getOrCreateConversation({
                userId: req.user._id,
                vendorId: assignedVendorId,
                leadId: lead._id,
                initialMessage: message || 'Inquiry regarding wedding services'
            });
        } catch (chatErr) {
            console.warn('Auto conversation creation notice:', chatErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Inquiry submitted successfully',
            data: lead
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current user's leads/inquiries
// @route   GET /api/user/leads
// @access  Private (User)
exports.getUserLeads = async (req, res, next) => {
    try {
        const leads = await Lead.find({ userId: req.user._id })
            .populate('vendorId', 'businessName city profileImage phone pricing rating reviewCount')
            .sort('-createdAt')
            .lean();

        res.status(200).json({
            success: true,
            count: leads.length,
            data: leads
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single lead by ID
// @route   GET /api/user/leads/:id
// @access  Private (User)
exports.getUserLeadById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lead ID format'
            });
        }

        const lead = await Lead.findOne({
            _id: id,
            userId: req.user._id
        })
            .populate('vendorId', 'businessName city profileImage phone pricing')
            .lean();

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead inquiry not found'
            });
        }

        res.status(200).json({
            success: true,
            data: lead
        });
    } catch (err) {
        next(err);
    }
};
