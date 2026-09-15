const mongoose = require('mongoose');
const Vendor = require('../vendor/Vendor');
const User = require('../user/user.model');
const SubscriptionPlan = require('./SubscriptionPlan');
const Policy = require('./Policy');
const SupportTicket = require('../vendor/SupportTicket');
const FAQ = require('./FAQ');
const SupportConfig = require('./SupportConfig');
const AdminLog = require('./AdminLog');
const PlatformSettings = require('./PlatformSettings');
const Booking = require('../vendor/Booking');
const Lead = require('../vendor/Lead');
const Quote = require('../vendor/Quote');
const Review = require('../vendor/Review');
const Complaint = require('../user/Complaint');
const Payment = require('../user/Payment');
const VendorWallet = require('../vendor/VendorWallet');
const WithdrawalRequest = require('../vendor/WithdrawalRequest');
const Category = require('./Category');
const SubCategory = require('./SubCategory');
const FormTemplate = require('./FormTemplate');
const VendorService = require('../vendor/VendorService');
const Banner = require('./Banner');
const { logAdminAction } = require('../../services/audit.service');
const { getActiveCommissionPercent } = require('../../services/commission.service');
const { invalidateMaintenanceCache } = require('../../middleware/maintenance.middleware');

// Helper to escape regex special characters
const escapeRegex = (string) => {
    if (typeof string !== 'string') return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};



// @desc    Get all subscription plans
// @route   GET /api/admin/subscription-plans
// @access  Private/Admin
exports.getAllSubscriptionPlans = async (req, res, next) => {
    try {
        const plans = await SubscriptionPlan.find().sort('-createdAt');

        if (plans.length === 0) {
            // Create initial default plan
            const defaultPlan = await SubscriptionPlan.create({
                name: 'Premium Partner',
                price: 4999,
                durationValue: 1,
                durationUnit: 'year',
                features: ['All Features']
            });
            return res.status(200).json({ success: true, data: [defaultPlan] });
        }

        res.status(200).json({
            success: true,
            data: plans
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create subscription plan
// @route   POST /api/admin/subscription-plans
// @access  Private/Admin
exports.createSubscriptionPlan = async (req, res, next) => {
    try {
        const { name, price, features, durationValue, durationUnit } = req.body;

        const plan = await SubscriptionPlan.create({
            name,
            price,
            features: features || ['Full Access'],
            durationValue,
            durationUnit,
            lastUpdatedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: plan
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update subscription plan
// @route   PUT /api/admin/subscription-plans/:id
// @access  Private/Admin
exports.updateSubscriptionPlan = async (req, res, next) => {
    try {
        const { name, price, features, durationValue, durationUnit, isActive } = req.body;

        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, {
            name,
            price,
            features,
            durationValue,
            durationUnit,
            isActive,
            lastUpdatedBy: req.user.id
        }, { new: true });

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        res.status(200).json({
            success: true,
            data: plan
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete subscription plan
// @route   DELETE /api/admin/subscription-plans/:id
// @access  Private/Admin
exports.deleteSubscriptionPlan = async (req, res, next) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Plan deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all vendors with pagination & filtering
// @route   GET /api/admin/vendors
// @access  Private/Admin
exports.getAllVendors = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, search, city, isFeatured } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const query = { status: { $ne: 'Incomplete' } };

        if (status && status !== 'All') {
            query.status = status;
        }

        if (isFeatured === 'true' || isFeatured === true) {
            query.isFeatured = true;
        }

        if (city) {
            query.city = new RegExp(`^${escapeRegex(city.trim())}$`, 'i');
        }

        if (search && search.trim()) {
            const escaped = escapeRegex(search.trim());
            const regex = new RegExp(escaped, 'i');
            query.$or = [
                { businessName: regex },
                { fullName: regex },
                { email: regex },
                { phone: regex },
                { 'selectedCategories.categoryName': regex }
            ];
        }

        const total = await Vendor.countDocuments(query);
        const vendors = await Vendor.find(query)
            .select('-password')
            .lean()
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum);

        const VendorService = require('../vendor/VendorService');
        const vendorIds = vendors.map(v => v._id);
        const vendorServices = await VendorService.find({ vendorId: { $in: vendorIds } }).lean();

        const mappedVendors = vendors.map(v => {
            const dServices = vendorServices.filter(s => s.vendorId.toString() === v._id.toString()).map(s => {
                let subcategoryName = 'Service Details';
                if (v.selectedCategories) {
                    v.selectedCategories.forEach(cat => {
                        if (cat.subcategories) {
                            cat.subcategories.forEach(sub => {
                                if (sub.subcategoryId && s.subCategoryId && sub.subcategoryId.toString() === s.subCategoryId.toString()) {
                                    subcategoryName = sub.subcategoryName;
                                }
                            });
                        }
                    });
                }
                return { ...s, subcategoryName };
            });
            return {
                ...v,
                dynamicServices: dServices
            };
        });

        res.status(200).json({
            success: true,
            count: mappedVendors.length,
            data: mappedVendors,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Get all vendors with their actual services populated
// @route   GET /api/admin/vendors-services
// @access  Private/Admin
    exports.getVendorsWithServices = async (req, res, next) => {
        try {
            const vendors = await Vendor.find({ status: { $ne: 'Incomplete' } }).lean().sort('-createdAt');
        const Service = require('../vendor/Service');
        const services = await Service.find().populate('category', 'name').lean();

        // Group services by vendor
        const vendorsWithServices = vendors.map(vendor => {
            const vendorServices = services.filter(s => s.vendor.toString() === vendor._id.toString());
            return {
                ...vendor,
                actualServices: vendorServices
            };
        });

        res.status(200).json({
            success: true,
            count: vendorsWithServices.length,
            data: vendorsWithServices
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Toggle service active status
// @route   PUT /api/admin/services/:id/active
// @access  Private/Admin
exports.toggleServiceActive = async (req, res, next) => {
    try {
        const Service = require('../vendor/Service');
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        service.isActive = req.body.isActive;
        await service.save();

        res.status(200).json({ success: true, data: service });
    } catch (err) {
        next(err);
    }
};

// @desc    Update vendor status (Approve/Reject/Suspend/Pending)
// @route   PUT /api/admin/vendors/:id/status
// @access  Private/Admin
exports.updateVendorStatus = async (req, res, next) => {
    try {
        const { status, reason } = req.body;

        if (!['Pending', 'Approved', 'Rejected', 'Suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Pending, Approved, Rejected, or Suspended'
            });
        }

        const existingVendor = await Vendor.findById(req.params.id);
        if (!existingVendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        const prevStatus = existingVendor.status;
        const prevVerified = existingVendor.isVerified;
        const prevFeatured = existingVendor.isFeatured;

        existingVendor.status = status;
        existingVendor.isVerified = status === 'Approved';

        // Ineligible vendors can no longer be featured
        if (status === 'Suspended' || status === 'Rejected' || status === 'Pending') {
            existingVendor.isFeatured = false;
        }

        await existingVendor.save();

        await logAdminAction({
            admin: req.user,
            action: `Changed vendor status for ${existingVendor.businessName} from ${prevStatus} to ${status}`,
            entityType: 'Vendor',
            entityId: existingVendor._id,
            before: { status: prevStatus, isVerified: prevVerified, isFeatured: prevFeatured },
            after: { status, isVerified: existingVendor.isVerified, isFeatured: existingVendor.isFeatured },
            reason: reason || '',
            req
        });

        res.status(200).json({
            success: true,
            data: existingVendor,
            message: `Vendor status successfully updated to ${status}`
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Toggle vendor featured status
// @route   PUT /api/admin/vendors/:id/featured
// @access  Private/Admin
exports.updateVendorFeatured = async (req, res, next) => {
    try {
        const { isFeatured, reason } = req.body;

        if (typeof isFeatured !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isFeatured must be a boolean'
            });
        }

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Rule: Only Approved and Active vendors can be featured
        if (isFeatured && (vendor.status !== 'Approved' || vendor.isActive === false)) {
            return res.status(400).json({
                success: false,
                message: 'Only approved and active vendors can be featured'
            });
        }

        const prevFeatured = vendor.isFeatured;
        vendor.isFeatured = isFeatured;
        await vendor.save();

        await logAdminAction({
            admin: req.user,
            action: `${isFeatured ? 'Featured' : 'Unfeatured'} vendor ${vendor.businessName}`,
            entityType: 'Vendor',
            entityId: vendor._id,
            before: { isFeatured: prevFeatured },
            after: { isFeatured },
            reason: reason || '',
            req
        });

        res.status(200).json({
            success: true,
            data: vendor,
            message: `Vendor successfully ${isFeatured ? 'featured' : 'unfeatured'}`
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Toggle vendor active status
// @route   PUT /api/admin/vendors/:id/active
// @access  Private/Admin
exports.toggleVendorActive = async (req, res, next) => {
    try {
        const { isActive } = req.body;

        const vendor = await Vendor.findByIdAndUpdate(req.params.id, {
            isActive
        }, {
            new: true,
            runValidators: true
        });

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.status(200).json({
            success: true,
            data: vendor,
            message: `Vendor successfully ${isActive ? 'activated' : 'deactivated'}`
        });
    } catch (err) {
        next(err);
    }
};

// Helper to create logs (Internal use)
const createAdminLog = async ({ user, action, target, level, ip, adminId }) => {
    try {
        await AdminLog.create({ user, action, target, level, ip, adminId });
    } catch (err) {
        console.error('Failed to create admin log:', err);
    }
};

// @desc    Get all users with pagination & search
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const query = {};

        if (status === 'active') {
            query.isActive = true;
            query.isBlocked = false;
        } else if (status === 'blocked') {
            query.isBlocked = true;
        } else if (status === 'deactivated') {
            query.isActive = false;
        }

        if (search && search.trim()) {
            const escaped = escapeRegex(search.trim());
            const regex = new RegExp(escaped, 'i');
            query.$or = [
                { name: regex },
                { email: regex },
                { phone: regex },
                { city: regex }
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password -emailOTP -phoneOTP -passwordResetToken -passwordResetExpires -__v')
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Compatibility mapping: expose both name and fullName for frontend
        const mappedUsers = users.map(u => ({
            ...u,
            fullName: u.name || ''
        }));

        res.status(200).json({
            success: true,
            count: mappedUsers.length,
            data: mappedUsers,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single user details with activity summary
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        const user = await User.findById(req.params.id)
            .select('-password -emailOTP -phoneOTP -passwordResetToken -passwordResetExpires -__v')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const [bookingStats, reviewCount, complaintCount, recentBookings] = await Promise.all([
            Booking.aggregate([
                { $match: { userId: user._id } },
                {
                    $group: {
                        _id: null,
                        totalBookings: { $sum: 1 },
                        totalSpent: { $sum: '$totalPrice' }
                    }
                }
            ]),
            Review.countDocuments({ userId: user._id }),
            Complaint.countDocuments({ userId: user._id }),
            Booking.find({ userId: user._id })
                .populate('vendorId', 'businessName category city')
                .sort('-createdAt')
                .limit(5)
                .lean()
        ]);

        const stats = bookingStats[0] || { totalBookings: 0, totalSpent: 0 };

        res.status(200).json({
            success: true,
            data: {
                ...user,
                fullName: user.name,
                activity: {
                    totalBookings: stats.totalBookings,
                    totalSpent: stats.totalSpent,
                    reviewCount,
                    complaintCount,
                    recentBookings
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user status (block/unblock, activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        const { isBlocked, isActive, reason } = req.body;

        // Admin self-protection
        if (req.params.id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Administrators cannot deactivate or block their own account'
            });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent deactivating the last active administrator
        if (targetUser.role === 'admin' && (isActive === false || isBlocked === true)) {
            const activeAdminCount = await User.countDocuments({
                role: 'admin',
                isActive: true,
                isBlocked: false,
                _id: { $ne: targetUser._id }
            });

            if (activeAdminCount === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot deactivate or block the last active administrator'
                });
            }
        }

        const beforeState = {
            isActive: targetUser.isActive,
            isBlocked: targetUser.isBlocked
        };

        if (typeof isBlocked === 'boolean') targetUser.isBlocked = isBlocked;
        if (typeof isActive === 'boolean') targetUser.isActive = isActive;

        await targetUser.save();

        await logAdminAction({
            admin: req.user,
            action: `Updated user account status for ${targetUser.name} (${targetUser.email})`,
            entityType: 'User',
            entityId: targetUser._id,
            before: beforeState,
            after: { isActive: targetUser.isActive, isBlocked: targetUser.isBlocked },
            reason: reason || '',
            req
        });

        res.status(200).json({
            success: true,
            data: {
                _id: targetUser._id,
                name: targetUser.name,
                fullName: targetUser.name,
                email: targetUser.email,
                isActive: targetUser.isActive,
                isBlocked: targetUser.isBlocked
            },
            message: `User status updated successfully`
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all audit logs with pagination & filtering
// @route   GET /api/admin/logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
exports.getAllLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, entityType, action, adminId, startDate, endDate } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (entityType && entityType !== 'ALL') query.entityType = entityType;
        if (action) query.action = new RegExp(escapeRegex(action.trim()), 'i');
        if (adminId && mongoose.Types.ObjectId.isValid(adminId)) query.adminId = adminId;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const total = await AdminLog.countDocuments(query);
        const logs = await AdminLog.find(query)
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum)
            .lean();

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        next(err);
    }
};

// Alias for getAuditLogs
exports.getAuditLogs = exports.getAllLogs;

// @desc    Clear log buffer (Disabled for append-only audit compliance)
// @route   DELETE /api/admin/logs
// @access  Private/Admin
exports.clearLogs = async (req, res, next) => {
    return res.status(403).json({
        success: false,
        message: 'Security policy: Audit logs are append-only and cannot be cleared or deleted'
    });
};


// @desc    Get all banners
// @route   GET /api/admin/banners
// @access  Private/Admin
exports.getAllBanners = async (req, res, next) => {
    try {
        const banners = await Banner.find().sort('-createdAt');
        res.status(200).json({ success: true, data: banners });
    } catch (err) {
        next(err);
    }
};

// @desc    Create banner
// @route   POST /api/admin/banners
// @access  Private/Admin
exports.createBanner = async (req, res, next) => {
    try {
        console.log('Incoming Banner Data:', req.body);
        console.log('Incoming Banner File:', req.file);
        const bannerData = { ...req.body };
        if (req.file) {
            bannerData.imageUrl = req.file.path; // Cloudinary URL
        }
        const banner = await Banner.create(bannerData);

        // Log action
        await createAdminLog({
            user: req.user?.fullName || 'Admin',
            adminId: req.user?.id,
            action: `Created new banner: ${banner.title}`,
            target: 'Banners',
            level: 'Success',
            ip: req.ip || 'Local'
        });

        res.status(201).json({ success: true, data: banner });
    } catch (err) {
        next(err);
    }
};

// @desc    Update banner
// @route   PUT /api/admin/banners/:id
// @access  Private/Admin
exports.updateBanner = async (req, res, next) => {
    try {
        const bannerData = { ...req.body };
        if (req.file) {
            bannerData.imageUrl = req.file.path;
        }
        const banner = await Banner.findByIdAndUpdate(req.params.id, bannerData, {
            new: true,
            runValidators: true
        });
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        // Log action
        await createAdminLog({
            user: req.user?.fullName || 'Admin',
            adminId: req.user?.id,
            action: `Updated banner: ${banner.title}`,
            target: 'Banners',
            level: 'Info',
            ip: req.ip || 'Local'
        });

        res.status(200).json({ success: true, data: banner });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete banner
// @route   DELETE /api/admin/banners/:id
// @access  Private/Admin
exports.deleteBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        // Log action
        await createAdminLog({
            user: req.user?.fullName || 'Admin',
            adminId: req.user?.id,
            action: `Deleted banner: ${banner.title}`,
            target: 'Banners',
            level: 'Warning',
            ip: req.ip || 'Local'
        });

        res.status(200).json({ success: true, message: 'Banner deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all reviews with pagination & filtering
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, rating, vendorId } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (status && status !== 'ALL') query.status = status;
        if (rating) query.rating = Number(rating);
        if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) query.vendorId = vendorId;

        const total = await Review.countDocuments(query);
        const reviews = await Review.find(query)
            .populate('userId', 'name email profileImage')
            .populate('vendorId', 'businessName category city')
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Provide user and vendor aliases for frontend backward compatibility
        const mappedReviews = reviews.map(r => ({
            ...r,
            user: r.userId ? { ...r.userId, fullName: r.userId.name } : null,
            vendor: r.vendorId || null
        }));

        res.status(200).json({
            success: true,
            count: mappedReviews.length,
            data: mappedReviews,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Moderate review status (Approved / Rejected / Pending)
// @route   PUT /api/admin/reviews/:id/status
// @access  Private/Admin
exports.updateReviewStatus = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid review ID format' });
        }

        const { status, reason } = req.body;
        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Pending, Approved, or Rejected'
            });
        }

        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const prevStatus = review.status;
        review.status = status;
        await review.save();

        // Requirement 11: Recalculate vendor average rating and review count from only 'Approved' reviews
        const approvedReviews = await Review.find({ vendorId: review.vendorId, status: 'Approved' });
        const approvedCount = approvedReviews.length;
        const avgRating = approvedCount > 0
            ? Math.round((approvedReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / approvedCount) * 10) / 10
            : 0;

        await Vendor.findByIdAndUpdate(review.vendorId, {
            rating: avgRating,
            reviewCount: approvedCount
        });

        await logAdminAction({
            admin: req.user,
            action: `Moderated review status from ${prevStatus} to ${status}`,
            entityType: 'Review',
            entityId: review._id,
            before: { status: prevStatus },
            after: { status, newVendorRating: avgRating, newVendorReviewCount: approvedCount },
            reason: reason || '',
            req
        });

        res.status(200).json({
            success: true,
            data: review,
            vendorStats: {
                rating: avgRating,
                reviewCount: approvedCount
            },
            message: `Review marked as ${status}`
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const vendorId = review.vendorId;
        await review.deleteOne();

        // Recalculate vendor stats
        if (vendorId) {
            const approvedReviews = await Review.find({ vendorId, status: 'Approved' });
            const approvedCount = approvedReviews.length;
            const avgRating = approvedCount > 0
                ? Math.round((approvedReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / approvedCount) * 10) / 10
                : 0;

            await Vendor.findByIdAndUpdate(vendorId, {
                rating: avgRating,
                reviewCount: approvedCount
            });
        }

        await logAdminAction({
            admin: req.user,
            action: `Deleted review ID ${req.params.id}`,
            entityType: 'Review',
            entityId: req.params.id,
            before: review,
            req
        });

        res.status(200).json({ success: true, message: 'Review deleted' });
    } catch (err) {
        next(err);
    }
};


// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Public (for registration) / Admin
exports.getAllCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ isActive: true }).sort('order name').lean();
        const SubCategory = require('./SubCategory');
        
        // Fetch subcategories for all active categories
        const subCategories = await SubCategory.find({ status: true }).lean();
        
        // Append subcategories to their respective categories
        const categoriesWithSubs = categories.map(cat => {
            return {
                ...cat,
                subCategories: subCategories.filter(sub => sub.categoryId.toString() === cat._id.toString())
            };
        });

        res.status(200).json({ success: true, data: categoriesWithSubs });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all categories for admin (including inactive)
// @route   GET /api/admin/categories/all
// @access  Private/Admin
exports.getAllCategoriesAdmin = async (req, res, next) => {
    try {
        const categories = await Category.find({}).sort('order name').lean();
        const SubCategory = require('./SubCategory');
        const subCategories = await SubCategory.find({}).lean();
        
        const categoriesWithSubs = categories.map(cat => ({
            ...cat,
            subCategories: subCategories.filter(sub => sub.categoryId.toString() === cat._id.toString())
        }));

        res.status(200).json({ success: true, data: categoriesWithSubs });
    } catch (err) {
        next(err);
    }
};

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
    try {
        const { name, description, order, image, subCategories } = req.body;
        const existing = await Category.findOne({ name });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }
        const category = await Category.create({ name, description, order, image, subCategories });
        res.status(201).json({ success: true, data: category });
    } catch (err) {
        next(err);
    }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
    try {
        const updateData = {};
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.description !== undefined) updateData.description = req.body.description;
        if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
        if (req.body.order !== undefined) updateData.order = req.body.order;
        if (req.body.image !== undefined) updateData.image = req.body.image;
        if (req.body.subCategories !== undefined) updateData.subCategories = req.body.subCategories;

        const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, data: category });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete category (Safe reference validation)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Requirement 7: Safety check against referencing records
        const [vendorCount, leadCount, subCount] = await Promise.all([
            Vendor.countDocuments({
                $or: [
                    { 'selectedCategories.categoryId': category._id },
                    { category: category.name }
                ]
            }),
            Lead.countDocuments({ category: category.name }),
            SubCategory.countDocuments({ categoryId: category._id })
        ]);

        if (vendorCount > 0 || leadCount > 0 || subCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category in active use (${vendorCount} vendor(s), ${leadCount} lead(s), ${subCount} subcategory(ies)). Please deactivate it (set isActive: false) instead.`
            });
        }

        await category.deleteOne();

        await logAdminAction({
            admin: req.user,
            action: `Deleted category: ${category.name}`,
            entityType: 'Category',
            entityId: category._id,
            before: category,
            req
        });

        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
        next(err);
    }
};


// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
exports.getProfile = async (req, res, next) => {
    try {
        const admin = await User.findById(req.user.id).select('-password');
        res.status(200).json({ success: true, data: admin });
    } catch (err) {
        next(err);
    }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/Admin
exports.updateProfile = async (req, res, next) => {
    try {
        const { fullName, email, bio, phone } = req.body;
        const admin = await User.findByIdAndUpdate(req.user.id, {
            fullName,
            email,
            bio,
            phone
        }, { new: true, runValidators: true }).select('-password');

        res.status(200).json({ success: true, data: admin });
    } catch (err) {
        next(err);
    }
};

// @desc    Change admin password   
// @route   PUT /api/admin/profile/password
// @access  Private/Admin
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
        }

        const admin = await User.findById(req.user.id);

        // Verify current password
        const isMatch = await admin.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid current password' });
        }

        // Update password
        admin.password = newPassword;
        await admin.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all bookings with pagination & filtering
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, paymentStatus, vendorId, userId } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (status && status !== 'ALL') query.status = status;
        if (paymentStatus && paymentStatus !== 'ALL') query.paymentStatus = paymentStatus;
        if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) query.vendorId = vendorId;
        if (userId && mongoose.Types.ObjectId.isValid(userId)) query.userId = userId;

        const total = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .populate('vendorId', 'businessName fullName email phone city')
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Compatibility mapping for user.fullName
        const mappedBookings = bookings.map(b => ({
            ...b,
            userId: b.userId ? { ...b.userId, fullName: b.userId.name } : null
        }));

        res.status(200).json({
            success: true,
            count: mappedBookings.length,
            data: mappedBookings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Get detailed vendor ledger (Vendors with their bookings)
// @route   GET /api/admin/vendor-ledger
// @access  Private/Admin
exports.getVendorLedger = async (req, res, next) => {
    try {
        const Vendor = require('../vendor/Vendor');
        const Booking = require('../vendor/Booking');

        const vendors = await Vendor.find().select('businessName fullName email phone portfolio category city status');
        const bookings = await Booking.find().populate('userId', 'fullName email');

        const ledger = vendors.map(vendor => {
            const vendorBookings = bookings.filter(b =>
                (b.vendorId && b.vendorId.toString() === vendor._id.toString())
            );
            const totalRevenue = vendorBookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);

            return {
                ...vendor._doc,
                bookings: vendorBookings,
                bookingCount: vendorBookings.length,
                totalRevenue
            };
        });

        res.status(200).json({
            success: true,
            count: ledger.length,
            data: ledger
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
    try {
        const Booking = require('../vendor/Booking');
        const Vendor = require('../vendor/Vendor');
        const Review = require('../vendor/Review');
        const User = require('../user/user.model');

        const [bookings, activeVendors, totalVendors, usersCount, reviewsCount] = await Promise.all([
            Booking.find({ status: { $ne: 'Cancelled' } }),
            Vendor.countDocuments({ status: 'Approved' }),
            Vendor.countDocuments(),
            User.countDocuments(),
            Review.countDocuments()
        ]);

        const totalRevenue = bookings.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                vendorsCount: activeVendors,
                totalVendors,
                usersCount,
                reviewsCount,
                recentBookingsCount: bookings.length
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get detailed analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res, next) => {
    try {
        const Booking = require('../vendor/Booking');
        const Vendor = require('../vendor/Vendor');
        const User = require('../user/user.model');

        // 1. Revenue Trajectory (Last 15 days)
        const trajectory = [];
        for (let i = 14; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const start = new Date(date.setHours(0, 0, 0, 0));
            const end = new Date(date.setHours(23, 59, 59, 999));

            const dayBookings = await Booking.find({
                createdAt: { $gte: start, $lte: end },
                status: { $ne: 'Cancelled' }
            });

            trajectory.push({
                day: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                revenue: dayBookings.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0)
            });
        }

        // 2. Category Distribution
        const categories = await Vendor.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const distribution = categories.map(cat => ({
            label: cat._id || 'Uncategorized',
            count: cat.count,
            percentage: 0 // Will calculate below
        }));

        const totalVendors = await Vendor.countDocuments();
        distribution.forEach(d => {
            d.percentage = totalVendors > 0 ? Math.round((d.count / totalVendors) * 100) : 0;
        });

        // 3. Growth Metrics (Current Month vs Previous Month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [currMonthUsers, prevMonthUsers, currMonthVendors, prevMonthVendors] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
            User.countDocuments({ createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth } }),
            Vendor.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Vendor.countDocuments({ createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth } })
        ]);

        const userGrowth = prevMonthUsers > 0 ? ((currMonthUsers - prevMonthUsers) / prevMonthUsers * 100).toFixed(1) : '+100';
        const vendorGrowth = prevMonthVendors > 0 ? ((currMonthVendors - prevMonthVendors) / prevMonthVendors * 100).toFixed(1) : '+100';

        res.status(200).json({
            success: true,
            data: {
                trajectory,
                distribution,
                metrics: {
                    userGrowth: `${userGrowth}%`,
                    vendorGrowth: `${vendorGrowth}%`,
                    totalRevenue: trajectory.reduce((acc, curr) => acc + curr.revenue, 0),
                    conversionLift: '3.2%' // Mocked for now
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all payments/transactions
// @route   GET /api/admin/payments
// @access  Private/Admin
exports.getPayments = async (req, res, next) => {
    try {
        const Booking = require('../vendor/Booking');

        const bookings = await Booking.find()
            .populate('vendorId', 'businessName')
            .sort('-createdAt');

        const payments = bookings.map(b => ({
            id: `TXN-${b._id.toString().slice(-6).toUpperCase()}`,
            vendor: b.vendorId?.businessName || 'Platform Service',
            amount: `₹${(b.totalPrice || 0).toLocaleString()}`,
            date: b.createdAt.toISOString().split('T')[0],
            status: b.status === 'Completed' ? 'Settled' : 'Pending',
            rawStatus: b.status,
            bookingId: b._id
        }));

        const totalSettled = bookings
            .filter(b => b.status === 'Completed')
            .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

        const pendingSettlement = bookings
            .filter(b => b.status !== 'Completed' && b.status !== 'Cancelled')
            .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                payments,
                stats: {
                    totalSettled: `₹${(totalSettled / 100000).toFixed(2)}L`,
                    pendingPayouts: `₹${pendingSettlement.toLocaleString()}`,
                    pendingCount: bookings.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled').length
                }
            }
        });
    } catch (err) {
        next(err);
    }
};
// @desc    Delete vendor
// @route   DELETE /api/admin/vendors/:id
// @access  Private/Admin
exports.deleteVendor = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        await vendor.deleteOne();

        // Log action
        await createAdminLog({
            user: req.user?.fullName || 'Admin',
            adminId: req.user?.id,
            action: `Deleted vendor: ${vendor.businessName}`,
            target: 'Vendors',
            level: 'Warning',
            ip: req.ip || 'Local'
        });

        res.status(200).json({ success: true, message: 'Vendor removed' });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await user.deleteOne();

        // Log action
        await createAdminLog({
            user: req.user?.fullName || 'Admin',
            adminId: req.user?.id,
            action: `Deleted user: ${user.fullName}`,
            target: 'Users',
            level: 'Warning',
            ip: req.ip || 'Local'
        });

        res.status(200).json({ success: true, message: 'User removed' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get policy by type
// @route   GET /api/admin/policies/:type
// @access  Private/Admin
exports.getPolicy = async (req, res, next) => {
    try {
        const { type } = req.params;
        let policy = await Policy.findOne({ type });

        if (!policy) {
            // Create default policy if it doesn't exist
            const defaults = {
                'privacy-policy': { title: 'Privacy Policy', content: 'Initial Privacy Policy content.' },
                'terms-conditions': { title: 'Terms & Conditions', content: 'Initial Terms & Conditions content.' }
            };

            if (defaults[type]) {
                policy = await Policy.create({
                    type,
                    title: defaults[type].title,
                    content: defaults[type].content
                });
            } else {
                return res.status(400).json({ success: false, message: 'Invalid policy type' });
            }
        }

        res.status(200).json({
            success: true,
            data: policy
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update policy by type
// @route   PUT /api/admin/policies/:type
// @access  Private/Admin
exports.updatePolicy = async (req, res, next) => {
    try {
        const { type } = req.params;
        const { content, title } = req.body;

        const policy = await Policy.findOneAndUpdate(
            { type },
            { content, title, lastUpdated: Date.now() },
            { new: true, runValidators: true, upsert: true }
        );

        // Log action
        await createAdminLog({
            user: req.user?.fullName || 'Admin',
            adminId: req.user?.id,
            action: `Updated legal document: ${policy.title}`,
            target: 'Legal',
            level: 'Info',
            ip: req.ip || 'Local'
        });

        res.status(200).json({
            success: true,
            data: policy
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all support tickets
// @route   GET /api/admin/tickets
// @access  Private/Admin
exports.getAllTickets = async (req, res, next) => {
    try {
        const tickets = await SupportTicket.find()
            .populate('vendorId', 'businessName email')
            .sort('-createdAt');
        res.status(200).json({ success: true, data: tickets });
    } catch (err) {
        next(err);
    }
};

// @desc    Update ticket status
// @route   PUT /api/admin/tickets/:id/status
// @access  Private/Admin
exports.updateTicketStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        res.status(200).json({ success: true, data: ticket });
    } catch (err) {
        next(err);
    }
};

// @desc    Reply to ticket
// @route   POST /api/admin/tickets/:id/reply
// @access  Private/Admin
exports.replyToTicket = async (req, res, next) => {
    try {
        const { message } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        ticket.replies.push({
            senderId: req.user.id,
            senderRole: 'Admin',
            message
        });

        if (ticket.status === 'Open') {
            ticket.status = 'In-Progress';
        }

        await ticket.save();

        res.status(200).json({ success: true, data: ticket });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete ticket
// @route   DELETE /api/admin/tickets/:id
// @access  Private/Admin
exports.deleteTicket = async (req, res, next) => {
    try {
        const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        res.status(200).json({ success: true, message: 'Ticket purged' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all FAQs
// @route   GET /api/admin/faqs
// @access  Public/Admin
exports.getAllFAQs = async (req, res, next) => {
    try {
        const faqs = await FAQ.find().sort('order');
        res.status(200).json({ success: true, data: faqs });
    } catch (err) {
        next(err);
    }
};

// @desc    Create FAQ
// @route   POST /api/admin/faqs
// @access  Private/Admin
exports.createFAQ = async (req, res, next) => {
    try {
        const faq = await FAQ.create(req.body);
        res.status(201).json({ success: true, data: faq });
    } catch (err) {
        next(err);
    }
};

// @desc    Update FAQ
// @route   PUT /api/admin/faqs/:id
// @access  Private/Admin
exports.updateFAQ = async (req, res, next) => {
    try {
        const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
        res.status(200).json({ success: true, data: faq });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete FAQ
// @route   DELETE /api/admin/faqs/:id
// @access  Private/Admin
exports.deleteFAQ = async (req, res, next) => {
    try {
        const faq = await FAQ.findByIdAndDelete(req.params.id);
        if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
        res.status(200).json({ success: true, message: 'FAQ deleted' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get support config
// @route   GET /api/admin/support-config
// @access  Public/Admin
exports.getSupportConfig = async (req, res, next) => {
    try {
        let config = await SupportConfig.findOne();
        if (!config) {
            config = await SupportConfig.create({});
        }
        res.status(200).json({ success: true, data: config });
    } catch (err) {
        next(err);
    }
};

// @desc    Update support config
// @route   PUT /api/admin/support-config
// @access  Private/Admin
exports.updateSupportConfig = async (req, res, next) => {
    try {
        let config = await SupportConfig.findOne();
        if (!config) {
            config = await SupportConfig.create(req.body);
        } else {
            config = await SupportConfig.findOneAndUpdate({}, req.body, { new: true, runValidators: true });
        }
        res.status(200).json({ success: true, data: config });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all subcategories (optionally filter by categoryId)
// @route   GET /api/admin/subcategories
// @access  Public (for registration) / Admin
exports.getAllSubCategories = async (req, res, next) => {
    try {
        const query = req.query.categoryId ? { categoryId: req.query.categoryId } : {};
        const subcategories = await SubCategory.find(query).populate('categoryId', 'name').sort('-createdAt');
        res.status(200).json({ success: true, data: subcategories });
    } catch (err) {
        next(err);
    }
};

// @desc    Create subcategory
// @route   POST /api/admin/subcategories
// @access  Private/Admin
exports.createSubCategory = async (req, res, next) => {
    try {
        const subcategory = await SubCategory.create(req.body);
        res.status(201).json({ success: true, data: subcategory });
    } catch (err) {
        next(err);
    }
};

// @desc    Update subcategory
// @route   PUT /api/admin/subcategories/:id
// @access  Private/Admin
exports.updateSubCategory = async (req, res, next) => {
    try {
        const subcategory = await SubCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!subcategory) return res.status(404).json({ success: false, message: 'SubCategory not found' });
        res.status(200).json({ success: true, data: subcategory });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete subcategory
// @route   DELETE /api/admin/subcategories/:id
// @access  Private/Admin
exports.deleteSubCategory = async (req, res, next) => {
    try {
        const subcategory = await SubCategory.findByIdAndDelete(req.params.id);
        if (!subcategory) return res.status(404).json({ success: false, message: 'SubCategory not found' });
        res.status(200).json({ success: true, message: 'SubCategory deleted' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all form templates (optionally filter by categoryId/subCategoryId)
// @route   GET /api/admin/form-templates
// @access  Public (for registration) / Admin
exports.getAllFormTemplates = async (req, res, next) => {
    try {
        const query = {};
        if (req.query.categoryId) query.categoryId = req.query.categoryId;
        if (req.query.subCategoryId) {
            query.$or = [
                { subCategoryId: req.query.subCategoryId },
                { subCategoryId: null },
                { subCategoryId: { $exists: false } }
            ];
        }
        const templates = await FormTemplate.find(query)
            .populate('categoryId', 'name')
            .populate('subCategoryId', 'name')
            .sort('-createdAt');
        res.status(200).json({ success: true, data: templates });
    } catch (err) {
        next(err);
    }
};

// @desc    Create form template
// @route   POST /api/admin/form-templates
// @access  Private/Admin
exports.createFormTemplate = async (req, res, next) => {
    try {
        const template = await FormTemplate.create(req.body);
        res.status(201).json({ success: true, data: template });
    } catch (err) {
        next(err);
    }
};

// @desc    Update form template
// @route   PUT /api/admin/form-templates/:id
// @access  Private/Admin
exports.updateFormTemplate = async (req, res, next) => {
    try {
        const template = await FormTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!template) return res.status(404).json({ success: false, message: 'FormTemplate not found' });
        res.status(200).json({ success: true, data: template });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete form template
// @route   DELETE /api/admin/form-templates/:id
// @access  Private/Admin
exports.deleteFormTemplate = async (req, res, next) => {
    try {
        const template = await FormTemplate.findByIdAndDelete(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'FormTemplate not found' });
        res.status(200).json({ success: true, message: 'FormTemplate deleted' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all vendor services (for approval)
// @route   GET /api/admin/vendor-services
// @access  Private/Admin
exports.getAllVendorServices = async (req, res, next) => {
    try {
        const query = req.query.status ? { status: req.query.status } : {};
        const vendorServices = await VendorService.find(query)
            .populate('vendorId', 'businessName email')
            .populate('categoryId', 'name')
            .populate('subCategoryId', 'name')
            .sort('-createdAt');
        res.status(200).json({ success: true, data: vendorServices });
    } catch (err) {
        next(err);
    }
};

// @desc    Update vendor service status (Approve/Reject)
// @route   PUT /api/admin/vendor-services/:id/status
// @access  Private/Admin
exports.updateVendorServiceStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['Pending Approval', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const vendorService = await VendorService.findByIdAndUpdate(req.params.id, { status }, { new: true })
            .populate('vendorId', 'businessName email')
            .populate('categoryId', 'name')
            .populate('subCategoryId', 'name');

        if (!vendorService) {
            return res.status(404).json({ success: false, message: 'VendorService not found' });
        }

        res.status(200).json({ success: true, data: vendorService });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// Vendor Inventory Management
// ==========================================

const Inventory = require('../vendor/Inventory');

// @desc    Get all vendor inventories
// @route   GET /api/admin/vendor-inventory
// @access  Private/Admin
exports.getAllVendorInventories = async (req, res, next) => {
    try {
        const query = {};
        
        if (req.query.vendorId) {
            query.vendor = req.query.vendorId;
        }
        
        if (req.query.categoryId) {
            query.category = req.query.categoryId;
        }

        const inventories = await Inventory.find(query)
            .populate('vendor', 'businessName email phone')
            .populate('category', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: inventories.length, data: inventories });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// Phase 6: Ecosystem Oversight & Settings
// ==========================================

// @desc    Get complete administrative dashboard summary
// @route   GET /api/admin/dashboard/summary
// @access  Private/Admin
exports.getDashboardSummary = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [
            // User metrics
            userTotal,
            userActive,
            userBlocked,
            userNew,

            // Vendor metrics
            vendorTotal,
            vendorPending,
            vendorApproved,
            vendorRejected,
            vendorSuspended,
            vendorFeatured,

            // Marketplace metrics
            leadsTotal,
            leadsNew,
            quotesTotal,
            bookingsConfirmed,
            bookingsCompleted,
            bookingsCancelled,

            // Financial metrics (Payment aggregate)
            paymentStats,
            refundStats,
            walletStats,
            withdrawalStats,

            // Reviews & Complaints
            reviewsTotal,
            reviewsPending,
            complaintsOpen,
            complaintsResolved
        ] = await Promise.all([
            // Users
            User.countDocuments(),
            User.countDocuments({ isActive: true, isBlocked: false }),
            User.countDocuments({ isBlocked: true }),
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

            // Vendors
            Vendor.countDocuments({ status: { $ne: 'Incomplete' } }),
            Vendor.countDocuments({ status: 'Pending' }),
            Vendor.countDocuments({ status: 'Approved' }),
            Vendor.countDocuments({ status: 'Rejected' }),
            Vendor.countDocuments({ status: 'Suspended' }),
            Vendor.countDocuments({ isFeatured: true, status: 'Approved', isActive: true }),

            // Marketplace
            Lead.countDocuments(),
            Lead.countDocuments({ status: 'New' }),
            Quote.countDocuments(),
            Booking.countDocuments({ status: 'Confirmed' }),
            Booking.countDocuments({ status: 'Completed' }),
            Booking.countDocuments({ status: 'Cancelled' }),

            // Financial
            Payment.aggregate([
                { $match: { status: { $in: ['Completed', 'Paid'] } } },
                {
                    $group: {
                        _id: null,
                        totalGMV: { $sum: '$amount' },
                        totalCommission: { $sum: '$commissionAmount' },
                        totalVendorEarnings: { $sum: '$vendorEarning' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Payment.aggregate([
                { $match: { status: 'Refunded' } },
                {
                    $group: {
                        _id: null,
                        totalRefunded: { $sum: '$refundAmount' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            VendorWallet.aggregate([
                {
                    $group: {
                        _id: null,
                        totalAvailable: { $sum: '$availableBalance' },
                        totalPending: { $sum: '$pendingBalance' },
                        totalLocked: { $sum: '$lockedBalance' },
                        totalWithdrawn: { $sum: '$totalWithdrawn' }
                    }
                }
            ]),
            WithdrawalRequest.aggregate([
                {
                    $group: {
                        _id: '$status',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Reviews & Complaints
            Review.countDocuments(),
            Review.countDocuments({ status: 'Pending' }),
            Complaint.countDocuments({ status: { $in: ['Pending', 'In-Review'] } }),
            Complaint.countDocuments({ status: 'Resolved' })
        ]);

        const payments = paymentStats[0] || { totalGMV: 0, totalCommission: 0, totalVendorEarnings: 0, count: 0 };
        const refunds = refundStats[0] || { totalRefunded: 0, count: 0 };
        const wallets = walletStats[0] || { totalAvailable: 0, totalPending: 0, totalLocked: 0, totalWithdrawn: 0 };

        const withdrawalsByStatus = {};
        withdrawalStats.forEach(item => {
            withdrawalsByStatus[item._id] = { amount: item.totalAmount, count: item.count };
        });

        const pendingPayouts = ['Requested', 'Pending', 'Approved', 'Processing']
            .reduce((sum, st) => sum + (withdrawalsByStatus[st]?.amount || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: userTotal,
                    active: userActive,
                    blocked: userBlocked,
                    new: userNew
                },
                vendors: {
                    total: vendorTotal,
                    pending: vendorPending,
                    approved: vendorApproved,
                    rejected: vendorRejected,
                    suspended: vendorSuspended,
                    featured: vendorFeatured
                },
                marketplace: {
                    totalLeads: leadsTotal,
                    newLeads: leadsNew,
                    totalQuotes: quotesTotal,
                    confirmedBookings: bookingsConfirmed,
                    completedBookings: bookingsCompleted,
                    cancelledBookings: bookingsCancelled
                },
                financial: {
                    totalGMV: payments.totalGMV,
                    successfulPayments: payments.count,
                    platformCommission: payments.totalCommission,
                    vendorEarnings: payments.totalVendorEarnings,
                    pendingSettlements: wallets.totalPending,
                    availableBalances: wallets.totalAvailable,
                    pendingPayouts,
                    completedPayouts: withdrawalsByStatus['Paid']?.amount || wallets.totalWithdrawn,
                    totalRefunds: refunds.totalRefunded,
                    refundCount: refunds.count
                },
                reviews: {
                    total: reviewsTotal,
                    pending: reviewsPending
                },
                complaints: {
                    open: complaintsOpen,
                    resolved: complaintsResolved
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all leads with pagination & filtering
// @route   GET /api/admin/leads
// @access  Private/Admin
exports.getAllLeads = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, category, assignedType, search } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (status && status !== 'ALL') query.status = status;
        if (category && category !== 'ALL') query.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
        if (assignedType && assignedType !== 'ALL') query.assignedType = assignedType;

        if (search && search.trim()) {
            const escaped = escapeRegex(search.trim());
            const regex = new RegExp(escaped, 'i');
            query.$or = [
                { customerName: regex },
                { phone: regex },
                { eventLocation: regex },
                { message: regex }
            ];
        }

        const total = await Lead.countDocuments(query);
        const leads = await Lead.find(query)
            .populate('vendorId', 'businessName fullName email phone city')
            .populate('userId', 'name email phone')
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum)
            .lean();

        res.status(200).json({
            success: true,
            count: leads.length,
            data: leads,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all quotes with pagination & filtering
// @route   GET /api/admin/quotes
// @access  Private/Admin
exports.getAllQuotes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, vendorId } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (status && status !== 'ALL') query.status = status;
        if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) query.vendorId = vendorId;

        const total = await Quote.countDocuments(query);
        const quotes = await Quote.find(query)
            .populate('vendorId', 'businessName fullName email phone city')
            .populate('userId', 'name email phone')
            .populate('leadId', 'customerName eventDate eventLocation')
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum)
            .lean();

        res.status(200).json({
            success: true,
            count: quotes.length,
            data: quotes,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all complaints with pagination & filtering
// @route   GET /api/admin/complaints
// @access  Private/Admin
exports.getAllComplaints = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, category } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (status && status !== 'ALL') query.status = status;
        if (category && category !== 'ALL') query.category = category;

        const total = await Complaint.countDocuments(query);
        const complaints = await Complaint.find(query)
            .populate('userId', 'name email phone')
            .populate('vendorId', 'businessName fullName email phone city')
            .populate('bookingId', 'totalPrice eventDate status')
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum)
            .lean();

        const mappedComplaints = complaints.map(c => ({
            ...c,
            user: c.userId ? { ...c.userId, fullName: c.userId.name } : null,
            vendor: c.vendorId || null
        }));

        res.status(200).json({
            success: true,
            count: mappedComplaints.length,
            data: mappedComplaints,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update complaint status & resolution notes
// @route   PUT /api/admin/complaints/:id/status
// @access  Private/Admin
exports.updateComplaintStatus = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid complaint ID format' });
        }

        const { status, adminNotes } = req.body;
        // Exact Phase 3 enum: ['Pending', 'In-Review', 'Resolved', 'Dismissed']
        if (!['Pending', 'In-Review', 'Resolved', 'Dismissed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Pending, In-Review, Resolved, or Dismissed'
            });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        const prevStatus = complaint.status;
        complaint.status = status;
        if (adminNotes !== undefined) complaint.adminNotes = adminNotes;
        if (status === 'Resolved' || status === 'Dismissed') {
            complaint.resolvedAt = new Date();
        }

        await complaint.save();

        await logAdminAction({
            admin: req.user,
            action: `Updated complaint status from ${prevStatus} to ${status}`,
            entityType: 'Complaint',
            entityId: complaint._id,
            before: { status: prevStatus, adminNotes: complaint.adminNotes },
            after: { status, adminNotes: complaint.adminNotes, resolvedAt: complaint.resolvedAt },
            reason: adminNotes || '',
            req
        });

        res.status(200).json({
            success: true,
            data: complaint,
            message: `Complaint status updated to ${status}`
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current platform settings
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getPlatformSettings = async (req, res, next) => {
    try {
        let settings = await PlatformSettings.findOne().lean();
        const activeCommission = await getActiveCommissionPercent();

        if (!settings) {
            settings = {
                platformCommissionPercent: null,
                serviceGstPercent: null,
                minWithdrawalAmount: null,
                maintenanceMode: false,
                autoPayouts: false
            };
        }

        res.status(200).json({
            success: true,
            data: {
                ...settings,
                effectiveCommissionPercent: activeCommission
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update platform settings with strict validation
// @route   PUT /api/admin/settings
// @access  Private/Admin
exports.updatePlatformSettings = async (req, res, next) => {
    try {
        const allowedKeys = [
            'platformCommissionPercent',
            'serviceGstPercent',
            'minWithdrawalAmount',
            'maintenanceMode',
            'autoPayouts',
            'reason'
        ];

        // Reject unexpected keys
        for (const key of Object.keys(req.body)) {
            if (!allowedKeys.includes(key)) {
                return res.status(400).json({
                    success: false,
                    message: `Unexpected parameter '${key}' in settings payload`
                });
            }
        }

        const updateData = {};

        // Commission validation: 0 <= commission <= 100 or null
        if (req.body.platformCommissionPercent !== undefined) {
            const val = req.body.platformCommissionPercent;
            if (val === null || val === '') {
                updateData.platformCommissionPercent = null;
            } else {
                const num = Number(val);
                if (isNaN(num) || !isFinite(num) || num < 0 || num > 100) {
                    return res.status(400).json({
                        success: false,
                        message: 'Platform commission percent must be a valid number between 0 and 100'
                    });
                }
                updateData.platformCommissionPercent = Math.round(num * 100) / 100;
            }
        }

        // GST validation: 0 <= GST <= 100 or null
        if (req.body.serviceGstPercent !== undefined) {
            const val = req.body.serviceGstPercent;
            if (val === null || val === '') {
                updateData.serviceGstPercent = null;
            } else {
                const num = Number(val);
                if (isNaN(num) || !isFinite(num) || num < 0 || num > 100) {
                    return res.status(400).json({
                        success: false,
                        message: 'Service GST percent must be a valid number between 0 and 100'
                    });
                }
                updateData.serviceGstPercent = Math.round(num * 100) / 100;
            }
        }

        // Minimum withdrawal validation: >= 0 or null
        if (req.body.minWithdrawalAmount !== undefined) {
            const val = req.body.minWithdrawalAmount;
            if (val === null || val === '') {
                updateData.minWithdrawalAmount = null;
            } else {
                const num = Number(val);
                if (isNaN(num) || !isFinite(num) || num < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Minimum withdrawal amount must be a positive number or zero'
                    });
                }
                updateData.minWithdrawalAmount = Math.round(num * 100) / 100;
            }
        }

        if (typeof req.body.maintenanceMode === 'boolean') {
            updateData.maintenanceMode = req.body.maintenanceMode;
        }

        if (typeof req.body.autoPayouts === 'boolean') {
            updateData.autoPayouts = req.body.autoPayouts;
        }

        updateData.updatedBy = req.user._id;

        const previousSettings = await PlatformSettings.findOne().lean();

        let updatedSettings = await PlatformSettings.findOneAndUpdate(
            {},
            updateData,
            { new: true, upsert: true, runValidators: true }
        );

        // Invalidate maintenance mode cache immediately on settings change
        invalidateMaintenanceCache();

        await logAdminAction({
            admin: req.user,
            action: 'Updated platform configuration settings',
            entityType: 'Settings',
            entityId: updatedSettings._id,
            before: previousSettings,
            after: updatedSettings,
            reason: req.body.reason || '',
            req
        });

        const effectiveCommission = await getActiveCommissionPercent();

        res.status(200).json({
            success: true,
            data: {
                ...updatedSettings.toObject(),
                effectiveCommissionPercent: effectiveCommission
            },
            message: 'Platform settings updated successfully'
        });
    } catch (err) {
        next(err);
    }
};

