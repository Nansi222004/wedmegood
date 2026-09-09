const Vendor = require('../vendor/Vendor');
const User = require('../user/user.model');
const SubscriptionPlan = require('./SubscriptionPlan');
const Policy = require('./Policy');
const SupportTicket = require('../vendor/SupportTicket');
const FAQ = require('./FAQ');
const SupportConfig = require('./SupportConfig');



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

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private/Admin
    exports.getAllVendors = async (req, res, next) => {
        try {
            const vendors = await Vendor.find({ status: { $ne: 'Incomplete' } }).lean().sort('-createdAt');
            
            const VendorService = require('../vendor/VendorService');
            const vendorServices = await VendorService.find().lean();
            
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
            data: mappedVendors
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

// @desc    Update vendor status (Approve/Reject)
// @route   PUT /api/admin/vendors/:id/status
// @access  Private/Admin
exports.updateVendorStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const vendor = await Vendor.findByIdAndUpdate(req.params.id, {
            status,
            isVerified: status === 'Approved'
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
            data: vendor
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

const Category = require('./Category');
const Review = require('./Review');
const Banner = require('./Banner');
const AdminLog = require('./AdminLog');

// Helper to create logs (Internal use)
const createAdminLog = async ({ user, action, target, level, ip, adminId }) => {
    try {
        await AdminLog.create({ user, action, target, level, ip, adminId });
    } catch (err) {
        console.error('Failed to create admin log:', err);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().sort('-createdAt');
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all audit logs
// @route   GET /api/admin/logs
// @access  Private/Admin
exports.getAllLogs = async (req, res, next) => {
    try {
        const logs = await AdminLog.find().sort('-createdAt').limit(100);
        res.status(200).json({ success: true, data: logs });
    } catch (err) {
        next(err);
    }
};

// @desc    Clear log buffer
// @route   DELETE /api/admin/logs
// @access  Private/Admin
exports.clearLogs = async (req, res, next) => {
    try {
        await AdminLog.deleteMany({});
        res.status(200).json({ success: true, message: 'Logs cleared' });
    } catch (err) {
        next(err);
    }
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

// @desc    Get all reviews
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'fullName email')
            .populate('vendor', 'businessName')
            .sort('-createdAt');
        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
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

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, message: 'Category deleted' });
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

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res, next) => {
    try {
        const Booking = require('../vendor/Booking');
        const bookings = await Booking.find()
            .populate('vendorId', 'businessName')
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
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

const SubCategory = require('./SubCategory');
const FormTemplate = require('./FormTemplate');
const VendorService = require('../vendor/VendorService');

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
