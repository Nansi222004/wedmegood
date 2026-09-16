const mongoose = require('mongoose');
const Lead = require('../vendor/Lead');
const Vendor = require('../vendor/Vendor');
const Notification = require('../vendor/Notification');
const Category = require('../admin/Category');

// @desc    Create a new lead (Direct or Category Round-Robin)
// @route   POST /api/user/leads
// @access  Private (User)
exports.createLead = async (req, res, next) => {
    try {
        const {
            vendorId,
            category,
            eventDate,
            eventLocation,
            guestCount,
            budget,
            requirements,
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

        if (vendorId) {
            // Direct inquiry
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
        } else if (category) {
            // Round-robin assignment based on category
            const catDoc = await Category.findOne({
                $or: [
                    { slug: category.toLowerCase() },
                    { name: new RegExp(`^${category.trim()}$`, 'i') }
                ]
            });

            const categoryFilter = catDoc
                ? {
                    $or: [
                        { 'selectedCategories.categoryId': catDoc._id },
                        { 'selectedCategories.categoryName': new RegExp(`^${catDoc.name}$`, 'i') },
                        { 'services.category': new RegExp(`^${catDoc.name}$`, 'i') }
                    ]
                }
                : {
                    $or: [
                        { 'selectedCategories.categoryName': new RegExp(category.replace(/-/g, ' '), 'i') },
                        { 'services.category': new RegExp(category.replace(/-/g, ' '), 'i') }
                    ]
                };

            const eligibleVendors = await Vendor.find({
                status: 'Approved',
                isActive: true,
                'subscription.status': 'Active',
                ...categoryFilter
            }).sort('_id');

            if (!eligibleVendors || eligibleVendors.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No active vendors currently available in this category'
                });
            }

            if (eligibleVendors.length === 1) {
                assignedVendorId = eligibleVendors[0]._id;
            } else {
                // Persistent round-robin counter on Category document
                let nextIndex = 0;
                if (catDoc) {
                    const updatedCat = await Category.findByIdAndUpdate(
                        catDoc._id,
                        { $inc: { lastAssignedVendorIndex: 1 } },
                        { new: true }
                    );
                    nextIndex = (updatedCat.lastAssignedVendorIndex - 1) % eligibleVendors.length;
                } else {
                    nextIndex = Math.floor(Math.random() * eligibleVendors.length);
                }
                assignedVendorId = eligibleVendors[nextIndex]._id;
            }

            assignedType = 'RoundRobin';
        } else {
            return res.status(400).json({
                success: false,
                message: 'Please provide either vendorId or category'
            });
        }

        // Create Lead
        const lead = await Lead.create({
            vendorId: assignedVendorId,
            userId: req.user._id,
            customerName: req.user.name || req.body.customerName || 'Customer',
            phone: phone || req.user.phone || 'Not Provided',
            eventDate: new Date(eventDate),
            eventLocation: eventLocation || 'Indore',
            category: category || 'General',
            guestCount: Number(guestCount) || 0,
            budget: Number(budget) || 0,
            requirements: requirements || '',
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
