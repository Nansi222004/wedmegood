const mongoose = require('mongoose');
const Vendor = require('./Vendor');
const Lead = require('./Lead');
const Booking = require('./Booking');
const Review = require('./Review');
const Notification = require('./Notification');
const Quote = require('./Quote');
const Conversation = require('./Conversation');
const Message = require('./Message');
const SupportTicket = require('./SupportTicket');
const chatService = require('../chat/chat.service');
const SubscriptionPlan = require('../admin/SubscriptionPlan');
const Banner = require('../admin/Banner');
const Service = require('./Service');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { generateOTP, storeOTP, verifyOTP, sendSMSOTP, checkRateLimit } = require('../../utils/otpService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Send Registration OTP
// @route   POST /api/vendor/send-otp
// @access  Public
exports.sendRegistrationOtp = async (req, res, next) => {
    try {
        const { phone } = req.body;
        const phoneRegex = /^[6-9]\d{9}$/;
        
        if (!phone || !phoneRegex.test(phone)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
        }

        const phoneExists = await Vendor.findOne({ phone });
        if (phoneExists) {
            return res.status(400).json({ success: false, message: 'Phone number already registered.' });
        }

        const rateLimitResult = checkRateLimit(phone, 'phone_reg');
        if (!rateLimitResult.allowed) {
            return res.status(429).json({ success: false, message: rateLimitResult.message });
        }

        const otp = generateOTP();
        storeOTP(phone, otp, 'phone_reg', 10);
        await sendSMSOTP(phone, otp, 'New Vendor');

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            ...(process.env.NODE_ENV !== 'production' && { devOtp: otp })
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Verify Registration OTP
// @route   POST /api/vendor/verify-otp
// @access  Public
exports.verifyRegistrationOtp = async (req, res, next) => {
    try {
        const { phone, otp } = req.body;
        
        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        }

        const isMasterDevOtp = process.env.NODE_ENV !== 'production' && otp === '123456';
        const isValid = isMasterDevOtp || verifyOTP(phone, otp, 'phone_reg');
        
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        next(err);
    }
};

// @desc    Register vendor
// @route   POST /api/vendor/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { fullName, businessName, email, phone, city, selectedCategories, password, portfolio, profileImage, subscriptionPlanId, languages, serviceCities, hasDocuments, idProofUrl, gstUrl } = req.body;

        // Phone validation
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phone || !phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9'
            });
        }

        // Normalize email to lowercase before any comparison or storage
        const normalizedEmail = (email || '').toLowerCase().trim();

        // Check email and phone separately to give precise error messages
        const emailExists = await Vendor.findOne({ email: normalizedEmail });
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'This email address is already registered. Please use a different email or sign in.'
            });
        }

        const phoneExists = await Vendor.findOne({ phone });
        if (phoneExists) {
            return res.status(400).json({
                success: false,
                message: 'This phone number is already registered. Please use a different number or sign in.'
            });
        }

        // Sanitize selectedCategories to ensure valid ObjectIds
        const sanitizedCategories = (selectedCategories || []).map(cat => {
            const cleanCat = {
                categoryName: cat.categoryName,
                subcategories: []
            };
            if (cat.categoryId && mongoose.Types.ObjectId.isValid(cat.categoryId)) {
                cleanCat.categoryId = cat.categoryId;
            }
            if (Array.isArray(cat.subcategories)) {
                cleanCat.subcategories = cat.subcategories.map(sub => {
                    const cleanSub = { subcategoryName: sub.subcategoryName };
                    if (sub.subcategoryId && mongoose.Types.ObjectId.isValid(sub.subcategoryId)) {
                        cleanSub.subcategoryId = sub.subcategoryId;
                    }
                    return cleanSub;
                });
            }
            return cleanCat;
        });

        // Prepare vendor object
        const vendorData = {
            fullName,
            businessName,
            email: normalizedEmail,
            phone,
            city,
            selectedCategories: sanitizedCategories,
            languages: Array.isArray(languages) ? languages : (languages ? languages.split(',').map(l => l.trim()) : []),
            serviceCities: Array.isArray(serviceCities) ? serviceCities : (serviceCities ? serviceCities.split(',').map(c => c.trim()) : []),
            hasDocuments: Boolean(hasDocuments),
            password,
            portfolio: portfolio || [],
            profileImage: profileImage || null,
            documents: {
                idProof: idProofUrl || null,
                gst: gstUrl || null
            },
            onboardingStep: 'completed',
            isServiceProfileCompleted: false,
            status: 'Incomplete'
        };
        
        // Add pending subscription if plan was selected during onboarding
        if (subscriptionPlanId) {
            vendorData.subscription = {
                planId: subscriptionPlanId,
                status: 'Pending'
            };
        }


        // Create vendor
        const vendor = await Vendor.create(vendorData);

        // Save dynamic service data if present
        if (req.body.serviceData && Object.keys(req.body.serviceData).length > 0) {
            const VendorService = require('./VendorService');
            await VendorService.create({
                vendorId: vendor._id,
                categoryId: vendor.category,
                subCategoryId: vendor.subCategory,
                dynamicData: req.body.serviceData,
                isActive: true
            });
        }

        sendTokenResponse(vendor, 201, res);
    } catch (err) {
        // Handle MongoDB duplicate key error (race condition safety net)
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0];
            const fieldLabel = field === 'email' ? 'email address' : field === 'phone' ? 'phone number' : field;
            return res.status(400).json({
                success: false,
                message: `This ${fieldLabel} is already registered. Please use a different one or sign in.`
            });
        }
        next(err);
    }
};

// @desc    Login vendor
// @route   POST /api/vendor/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email/phone and password'
            });
        }

        const rawIdentifier = (email || '').trim();
        const normalizedEmail = rawIdentifier.toLowerCase();

        // Check for vendor by email or phone
        const vendor = await Vendor.findOne({
            $or: [
                { email: normalizedEmail },
                { phone: rawIdentifier }
            ]
        }).select('+password');

        if (!vendor) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await vendor.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        sendTokenResponse(vendor, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Update onboarding details
// @route   PUT /api/vendor/onboarding/:step
// @access  Private
exports.updateOnboarding = async (req, res, next) => {
    try {
        const { step } = req.params;
        const vendorId = req.vendor.id;

        let updateData = {};
        let nextStep = '';

        switch (step) {
            case 'business':
                updateData.businessDetails = req.body;
                nextStep = 'services';
                break;
            case 'services':
                updateData.services = req.body;
                nextStep = 'pricing';
                break;
            case 'pricing':
                updateData.pricing = req.body;
                nextStep = 'portfolio';
                break;
            case 'portfolio':
                updateData.portfolio = req.body;
                nextStep = 'documents';
                break;
            case 'documents':
                updateData.documents = req.body;
                nextStep = 'bank';
                break;
            case 'bank':
                updateData.bank = req.body;
                nextStep = 'completed';
                break;
            case 'completed':
                updateData.status = 'Pending';
                nextStep = 'completed';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid onboarding step'
                });
        }

        updateData.onboardingStep = nextStep;

        const vendor = await Vendor.findByIdAndUpdate(vendorId, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: vendor
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in vendor
// @route   GET /api/vendor/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id);

        res.status(200).json({
            success: true,
            data: vendor
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Upload media to Cloudinary
// @route   POST /api/vendor/upload
// @access  Private
exports.uploadMedia = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        res.status(200).json({
            success: true,
            url: req.file.path, // Cloudinary URL
            public_id: req.file.filename,
            type: req.file.mimetype.startsWith('video') ? 'video' : 'image'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Upload multiple media files to Cloudinary
// @route   POST /api/vendor/upload-multiple
// @access  Private
exports.uploadMultipleMedia = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            url: file.path,
            public_id: file.filename,
            type: file.mimetype.startsWith('video') ? 'video' : 'image',
            originalName: file.originalname
        }));

        res.status(200).json({
            success: true,
            files: uploadedFiles
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Upload media to Cloudinary without auth (for registration)
// @route   POST /api/vendor/upload/public
// @access  Public
exports.uploadPublicMedia = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                url: req.file.path,
                public_id: req.file.filename,
                type: req.file.mimetype.startsWith('video') ? 'video' : 'image'
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Upload multiple media files to Cloudinary without auth
// @route   POST /api/vendor/upload-multiple/public
// @access  Public
exports.uploadPublicMultipleMedia = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            url: file.path,
            public_id: file.filename,
            type: file.mimetype.startsWith('video') ? 'video' : 'image',
            originalName: file.originalname
        }));

        res.status(200).json({
            success: true,
            data: uploadedFiles
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get vendor dashboard stats
// @route   GET /api/vendor/stats
// @access  Private
exports.getStats = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id;

        const [leadsCount, bookingsCount, reviewsCount, vendor] = await Promise.all([
            Lead.countDocuments({ vendorId }),
            Booking.countDocuments({ vendorId }),
            Review.countDocuments({ vendorId }),
            Vendor.findById(vendorId).select('profileViews')
        ]);

        // Calculate conversion rate (leads to bookings)
        const conversionRate = leadsCount > 0 ? ((bookingsCount / leadsCount) * 100).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                profileViews: vendor.profileViews || 0,
                inquiries: leadsCount,
                bookings: bookingsCount,
                conversionRate: parseFloat(conversionRate),
                reviewsCount
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get banners for vendor dashboard
// @route   GET /api/vendor/banners
// @access  Private
exports.getDashboardBanners = async (req, res, next) => {
    try {
        const banners = await Banner.find({
            status: 'Active',
            target: { $in: ['All', 'Vendor'] },
            category: { $in: ['All', req.vendor.category] }
        }).sort('-createdAt');

        res.status(200).json({
            success: true,
            data: banners
        });
    } catch (err) {
        next(err);
    }
};

// Helper: Mask sensitive customer contact info until permitted stage ('Booked')
const maskCustomerPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return '******';
    const clean = phone.trim();
    if (clean.length <= 4) return '****';
    if (clean.length <= 7) return clean.slice(0, 2) + '****' + clean.slice(-2);
    return clean.slice(0, 3) + '****' + clean.slice(-4);
};

const sanitizeLeadForVendor = (leadDoc) => {
    if (!leadDoc) return null;
    const lead = leadDoc.toObject ? leadDoc.toObject() : { ...leadDoc };
    const isPermitted = lead.status === 'Booked';
    if (!isPermitted && lead.phone) {
        lead.phone = maskCustomerPhone(lead.phone);
    }
    return lead;
};

// @desc    Get vendor leads (with privacy masking for early stage leads)
// @route   GET /api/vendor/leads
// @access  Private
exports.getLeads = async (req, res, next) => {
    try {
        const leads = await Lead.find({ vendorId: req.vendor.id }).sort('-createdAt');

        res.status(200).json({
            success: true,
            data: leads.map(sanitizeLeadForVendor)
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single vendor lead by ID (with privacy masking)
// @route   GET /api/vendor/leads/:id
// @access  Private
exports.getLeadById = async (req, res, next) => {
    try {
        const lead = await Lead.findOne({ _id: req.params.id, vendorId: req.vendor.id });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        res.status(200).json({
            success: true,
            data: sanitizeLeadForVendor(lead)
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update lead status
// @route   PUT /api/vendor/leads/:id
// @access  Private
exports.updateLeadStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        if (status === 'Booked') {
            return res.status(400).json({
                success: false,
                message: 'Cannot manually set lead status to Booked. Status is automatically updated upon quote acceptance.'
            });
        }

        const allowedVendorStatuses = ['Contacted', 'Quote Sent', 'Rejected'];
        if (!allowedVendorStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid lead status. Allowed values: ${allowedVendorStatuses.join(', ')}`
            });
        }

        const existingLead = await Lead.findOne({ _id: req.params.id, vendorId: req.vendor.id });
        if (!existingLead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        if (existingLead.status === 'Booked') {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify status of an already booked lead'
            });
        }

        existingLead.status = status;
        await existingLead.save();

        res.status(200).json({
            success: true,
            data: sanitizeLeadForVendor(existingLead)
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get vendor bookings
// @route   GET /api/vendor/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ vendorId: req.vendor.id }).sort('-eventDate');

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update booking status
// @route   PUT /api/vendor/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res, next) => {
    try {
        const { status, reason } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const allowedTransitions = ['In Progress', 'Completed', 'Cancelled'];
        if (!allowedTransitions.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status update. Allowed values: ${allowedTransitions.join(', ')}`
            });
        }

        const booking = await Booking.findOne({ _id: req.params.id, vendorId: req.vendor.id });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // If vendor is cancelling the booking, invoke the centralized canonical cancel/refund service
        if (status === 'Cancelled') {
            const { cancelAndRefundBooking } = require('../../services/settlement.service');
            const result = await cancelAndRefundBooking({
                bookingId: booking._id,
                cancelledBy: 'Vendor',
                actorId: req.vendor.id,
                reason: reason || 'Cancelled by vendor'
            });

            if (!result.success) {
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.message
                });
            }

            return res.status(result.statusCode).json({
                success: true,
                message: result.message,
                data: result.data
            });
        }

        if (booking.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update status of a cancelled booking'
            });
        }

        if (booking.status === 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already completed'
            });
        }

        booking.status = status;
        await booking.save();

        // Auto-settle earnings to available balance when booking is marked Completed
        if (status === 'Completed') {
            const { settleBookingEarnings } = require('../../services/settlement.service');
            await settleBookingEarnings(booking._id);
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create manual booking/event
// @route   POST /api/vendor/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
    try {
        const { customerName, eventDate, location, services, totalAmount, eventType, guestCount, notes } = req.body;

        if (!customerName || !eventDate || !location) {
            return res.status(400).json({
                success: false,
                message: 'Customer name, event date, and location are required'
            });
        }

        const targetDate = new Date(eventDate);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event date'
            });
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Check for conflicting confirmed/in-progress bookings
        const conflictingBooking = await Booking.findOne({
            vendorId: req.vendor.id,
            eventDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['Confirmed', 'In Progress'] }
        });

        if (conflictingBooking) {
            return res.status(409).json({
                success: false,
                message: 'Vendor already has a confirmed booking on this date'
            });
        }

        // Check for vendor manual blocked dates
        const vendorDoc = await Vendor.findById(req.vendor.id).select('blockedDates');
        const isBlocked = (vendorDoc?.blockedDates || []).some(bDate => {
            const b = new Date(bDate);
            return b >= startOfDay && b <= endOfDay;
        });

        if (isBlocked) {
            return res.status(409).json({
                success: false,
                message: 'This date is marked as blocked on your calendar'
            });
        }

        const booking = await Booking.create({
            vendorId: req.vendor.id,
            customerName,
            eventDate: targetDate,
            location,
            services: services || ['Manual Entry'],
            eventType: eventType || 'Wedding',
            guestCount: guestCount || 0,
            notes: notes || '',
            totalPrice: Math.max(0, Number(totalAmount) || 0),
            status: 'Confirmed'
        });

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get vendor reviews
// @route   GET /api/vendor/reviews
// @access  Private
exports.getReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ vendorId: req.vendor.id }).populate('userId', 'name profileImage').sort('-createdAt');

        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Reply to review
// @route   PUT /api/vendor/reviews/:id/reply
// @access  Private
exports.replyToReview = async (req, res, next) => {
    try {
        const { reply } = req.body;
        const review = await Review.findOneAndUpdate(
            { _id: req.params.id, vendorId: req.vendor.id },
            { reply },
            { new: true, runValidators: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get vendor notifications
// @route   GET /api/vendor/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ vendorId: req.vendor.id }).sort('-createdAt').limit(20);

        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Mark notification as read
// @route   PUT /api/vendor/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, vendorId: req.vendor.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all active subscription plans
// @route   GET /api/vendor/subscription/plans
// @access  Private
exports.getSubscriptionPlans = async (req, res, next) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true });

        if (plans.length === 0) {
            const seededPlans = await SubscriptionPlan.create([
                {
                    name: 'Basic Plan',
                    price: 1999,
                    durationValue: 1,
                    durationUnit: 'month',
                    features: ['Limited Features', '5 Bookings / Month'],
                    isActive: true
                },
                {
                    name: 'Professional Plan',
                    price: 4999,
                    durationValue: 1,
                    durationUnit: 'month',
                    features: ['All Basic Features', 'Unlimited Bookings', 'Inventory Management', 'Labour Management'],
                    isActive: true
                },
                {
                    name: 'Enterprise Plan',
                    price: 9999,
                    durationValue: 1,
                    durationUnit: 'month',
                    features: ['All Professional Features', 'Priority Support', 'Custom Solutions'],
                    isActive: true
                }
            ]);
            return res.status(200).json({ success: true, data: seededPlans });
        }

        res.status(200).json({
            success: true,
            data: plans
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create Razorpay Order for Subscription
// @route   POST /api/vendor/subscription/order
// @access  Private
exports.createSubscriptionOrder = async (req, res, next) => {
    try {
        const { planId } = req.body;

        const plan = await SubscriptionPlan.findById(planId);

        if (!plan || !plan.isActive) {
            return res.status(404).json({ success: false, message: 'Active plan not found' });
        }

        const options = {
            amount: plan.price * 100, // amount in the smallest currency unit
            currency: "INR",
            receipt: `sub_${req.vendor._id.toString().slice(-10)}_${Date.now().toString().slice(-8)}`,
            notes: {
                vendorId: req.vendor._id,
                planId: plan._id
            }
        };

        const order = await razorpay.orders.create(options);

        // Update vendor with pending order details
        await Vendor.findByIdAndUpdate(req.vendor.id, {
            'subscription.planId': plan._id,
            'subscription.planName': plan.name,
            'subscription.amount': plan.price,
            'subscription.orderId': order.id,
            'subscription.status': 'Pending'
        });

        res.status(200).json({
            success: true,
            order,
            plan,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Verify Razorpay Payment and Update Subscription
// @route   POST /api/vendor/subscription/verify
// @access  Private
exports.verifySubscriptionPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed: Missing required payment details'
            });
        }

        const vendor = await Vendor.findById(req.vendor.id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Idempotency: Check if subscription is already active with this payment
        if (vendor.subscription?.status === 'Active' && vendor.subscription?.paymentId === razorpay_payment_id) {
            return res.status(200).json({
                success: true,
                message: 'Payment already verified',
                data: vendor
            });
        }

        // Tamper check: If vendor has a recorded subscription orderId, ensure it matches
        if (vendor.subscription?.orderId && vendor.subscription.orderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed: Order ID mismatch'
            });
        }

        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!razorpaySecret) {
            return res.status(500).json({
                success: false,
                message: 'Payment gateway configuration error'
            });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", razorpaySecret)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }

        // Fetch plan to get duration
        let plan = null;
        if (vendor.subscription?.planId) {
            plan = await SubscriptionPlan.findById(vendor.subscription.planId);
        }
        if (!plan) {
            plan = await SubscriptionPlan.findOne({ isActive: true });
        }
        const durationValue = plan?.durationValue || 1;
        const durationUnit = plan?.durationUnit || 'year';

        const startDate = new Date();
        const endDate = new Date();

        if (durationUnit === 'year') {
            endDate.setFullYear(startDate.getFullYear() + durationValue);
        } else {
            endDate.setMonth(startDate.getMonth() + durationValue);
        }

        // Payment success - activate subscription
        const updatedVendor = await Vendor.findByIdAndUpdate(req.vendor.id, {
            'subscription.status': 'Active',
            'subscription.paymentId': razorpay_payment_id,
            'subscription.orderId': razorpay_order_id,
            'subscription.startDate': startDate,
            'subscription.endDate': endDate
        }, { new: true });

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: updatedVendor
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current subscription plan
// @route   GET /api/vendor/subscription/plan
// @access  Private
exports.getSubscriptionPlan = async (req, res, next) => {
    try {
        let plan = await SubscriptionPlan.findOne({ isActive: true });

        if (!plan) {
            plan = await SubscriptionPlan.create({
                name: 'Premium Partner',
                price: 4999,
                features: [
                    'Receive unlimited verified leads',
                    'Priority ranking in search results',
                    'Full portfolio & video showcase',
                    'Exclusive verified vendor badge',
                    'Direct customer chat access',
                    'Premium 24/7 dedicated support'
                ]
            });
        }

        res.status(200).json({
            success: true,
            data: plan
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Get earnings summary
// @route   GET /api/vendor/earnings
// @access  Private
exports.getEarningsSummary = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id;
        const bookings = await Booking.find({ vendorId });

        const totalEarnings = bookings
            .filter(b => b.status === 'Completed')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        const pendingPayments = bookings
            .filter(b => b.status === 'Confirmed')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        // Assume 10% commission for now
        const platformCommission = totalEarnings * 0.1;

        res.status(200).json({
            success: true,
            data: {
                totalEarnings,
                pendingPayments,
                platformCommission,
                currency: 'INR'
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get quotes
// @route   GET /api/vendor/quotes
// @access  Private
exports.getQuotes = async (req, res, next) => {
    try {
        const quotes = await Quote.find({ vendorId: req.vendor.id })
            .populate('userId', 'fullName email phone')
            .populate('leadId')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: quotes
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a quote
// @route   PUT /api/vendor/quotes/:id
// @access  Private
exports.updateQuote = async (req, res, next) => {
    try {
        const { items, taxAmount, discountAmount, notes, terms, validUntil } = req.body;

        const quote = await Quote.findOne({
            _id: req.params.id,
            vendorId: req.vendor.id
        });

        if (!quote) {
            return res.status(404).json({ success: false, message: 'Quote not found' });
        }

        if (quote.status === 'Accepted') {
            return res.status(400).json({ success: false, message: 'Cannot modify an already accepted quote' });
        }

        if (quote.status === 'Expired') {
            return res.status(400).json({ success: false, message: 'Cannot modify an expired quote' });
        }

        const itemsToUse = items !== undefined ? items : quote.items;
        if (!Array.isArray(itemsToUse) || itemsToUse.length === 0) {
            return res.status(400).json({ success: false, message: 'Quote must contain at least one item' });
        }

        const taxToUse = taxAmount !== undefined ? taxAmount : (quote.taxAmount || 0);
        const discToUse = discountAmount !== undefined ? discountAmount : (quote.discountAmount || 0);

        const subtotal = itemsToUse.reduce((sum, item) => sum + (Math.max(0, Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1)), 0);
        const tax = Math.max(0, Number(taxToUse) || 0);
        const discount = Math.max(0, Number(discToUse) || 0);
        const totalAmount = Math.max(0, subtotal + tax - discount);

        quote.items = itemsToUse;
        quote.taxAmount = tax;
        quote.discountAmount = discount;
        quote.totalAmount = totalAmount;
        if (notes !== undefined) quote.notes = notes;
        if (terms !== undefined) quote.terms = terms;
        if (validUntil !== undefined) quote.validUntil = validUntil;

        await quote.save();

        res.status(200).json({
            success: true,
            data: quote
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a quote
// @route   DELETE /api/vendor/quotes/:id
// @access  Private
exports.deleteQuote = async (req, res, next) => {
    try {
        const quote = await Quote.findOneAndDelete({
            _id: req.params.id,
            vendorId: req.vendor.id
        });

        if (!quote) {
            return res.status(404).json({ success: false, message: 'Quote not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Quote removed'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create quote
// @route   POST /api/vendor/quotes
// @access  Private
exports.createQuote = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id;
        const { leadId, items, taxAmount, discountAmount, validUntil, notes, terms } = req.body;

        if (!leadId) {
            return res.status(400).json({
                success: false,
                message: 'Lead ID is required'
            });
        }

        // Authoritatively verify Lead ownership
        const lead = await Lead.findOne({ _id: leadId, vendorId });
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found or not assigned to your vendor account'
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Quote must include at least one service item'
            });
        }

        // Server-authoritative price calculation
        const subtotal = items.reduce((sum, item) => sum + (Math.max(0, Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1)), 0);
        const tax = Math.max(0, Number(taxAmount) || 0);
        const discount = Math.max(0, Number(discountAmount) || 0);
        const totalAmount = Math.max(0, subtotal + tax - discount);

        // Derive authoritative userId from lead
        const userId = lead.userId;

        const quote = await Quote.create({
            vendorId,
            leadId: lead._id,
            userId,
            items,
            totalAmount,
            taxAmount: tax,
            discountAmount: discount,
            validUntil: validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // default 14 days
            notes,
            terms,
            status: 'Sent'
        });

        // Update lead status
        lead.status = 'Quote Sent';
        await lead.save();

        res.status(201).json({
            success: true,
            data: quote
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update vendor portfolio
// @route   PUT /api/vendor/portfolio
// @access  Private
exports.updatePortfolio = async (req, res, next) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(
            req.vendor.id,
            { portfolio: req.body.portfolio },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: vendor.portfolio
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get chat conversations
// @route   GET /api/vendor/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id || req.vendor._id;
        const conversations = await chatService.getVendorConversations(vendorId);

        res.status(200).json({
            success: true,
            count: conversations.length,
            data: conversations
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/vendor/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id || req.vendor._id;
        const result = await chatService.getConversationMessages({
            conversationId: req.params.conversationId,
            requesterId: vendorId,
            requesterRole: 'Vendor',
            limit: req.query.limit,
            before: req.query.before
        });

        res.status(200).json({
            success: true,
            count: result.messages.length,
            hasMore: result.hasMore,
            data: result.messages
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Send a message
// @route   POST /api/vendor/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id || req.vendor._id;
        const { conversationId, text, attachments, type = 'text', quoteId, clientMessageId } = req.body;

        const result = await chatService.createMessage({
            conversationId,
            senderId: vendorId,
            senderRole: 'Vendor',
            type,
            text,
            attachments,
            quoteId,
            clientMessageId
        });

        const io = req.app.get('io');
        if (io && !result.isDuplicate) {
            io.to(`conversation_${conversationId}`).emit('message:new', {
                message: result.message,
                conversation: result.conversation
            });
        }

        res.status(201).json({
            success: true,
            data: result.message,
            isDuplicate: result.isDuplicate
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get support tickets
// @route   GET /api/vendor/support
// @access  Private
exports.getSupportTickets = async (req, res, next) => {
    try {
        const tickets = await SupportTicket.find({ vendorId: req.vendor.id }).sort('-createdAt');

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create support ticket
// @route   POST /api/vendor/support
// @access  Private
exports.createSupportTicket = async (req, res, next) => {
    try {
        const { subject, category, message, priority } = req.body;

        const ticket = await SupportTicket.create({
            vendorId: req.vendor.id,
            subject,
            category,
            message,
            priority
        });

        res.status(201).json({
            success: true,
            data: ticket
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Change password
// @route   PUT /api/vendor/settings/password
// @access  Private
exports.changePassword = async (req, res, next) => {
    try {
        console.log('🔄 Password Rotation Request Received for Vendor:', req.vendor.id);
        const { currentPassword, newPassword } = req.body;


        const vendor = await Vendor.findById(req.vendor.id).select('+password');

        if (!(await vendor.matchPassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Current password incorrect' });
        }

        vendor.password = newPassword;
        await vendor.save();

        res.status(200).json({ success: true, message: 'Password updated' });
    } catch (err) {
        next(err);
    }
};

// @desc    Deactivate/Toggle account status
// @route   PUT /api/vendor/settings/deactivate
// @access  Private
exports.deactivateAccount = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id);
        vendor.isActive = !vendor.isActive;
        await vendor.save();

        res.status(200).json({ 
            success: true, 
            message: vendor.isActive ? 'Account activated' : 'Account deactivated',
            isActive: vendor.isActive 
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update profile settings


// @route   PUT /api/vendor/settings
// @access  Private
exports.updateSettings = async (req, res, next) => {
    try {
        // Prevent sensitive fields from being updated via this route
        const forbiddenFields = ['password', 'role', 'status', 'isVerified', 'subscription', 'email'];
        const updateData = { ...req.body };

        forbiddenFields.forEach(field => delete updateData[field]);

        const vendor = await Vendor.findByIdAndUpdate(req.vendor.id, {
            $set: updateData
        }, { new: true, runValidators: true });

        res.status(200).json({
            success: true,
            data: vendor
        });
    } catch (err) {
        next(err);
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (vendor, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: vendor._id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    const options = {
        expires: new Date(
            Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE) || 30) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .json({
            success: true,
            token,
            vendor: {
                id: vendor._id,
                fullName: vendor.fullName,
                businessName: vendor.businessName,
                email: vendor.email,
                onboardingStep: vendor.onboardingStep
            }
        });
};

// ==========================================
// Service Management
// ==========================================

// @desc    Get vendor services
// @route   GET /api/vendor/services
// @access  Private/Vendor
exports.getServices = async (req, res, next) => {
    try {
        const services = await Service.find({ vendor: req.vendor.id }).populate('category', 'name').sort('-createdAt');
        res.status(200).json({ success: true, data: services });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new service
// @route   POST /api/vendor/services
// @access  Private/Vendor
exports.createService = async (req, res, next) => {
    try {
        const { category, name, shortDescription, detailedDescription, features, price } = req.body;
        
        let parsedFeatures = [];
        if (features) {
            try { parsedFeatures = JSON.parse(features); } catch (e) { parsedFeatures = features; }
        }

        let parsedPrice = { original: 0, discounted: 0, currency: 'INR' };
        if (price) {
            try { parsedPrice = JSON.parse(price); } catch (e) {}
        }

        let coverImage = req.body.coverImage || '';
        let gallery = [];
        if (req.body.gallery) {
            try { gallery = JSON.parse(req.body.gallery); } catch(e) { gallery = Array.isArray(req.body.gallery) ? req.body.gallery : [req.body.gallery]; }
        }

        if (req.files) {
            if (req.files['coverImage'] && req.files['coverImage'][0]) {
                coverImage = req.files['coverImage'][0].path;
            }
            if (req.files['gallery']) {
                const uploadedGallery = req.files['gallery'].map(file => ({
                    url: file.path,
                    type: file.mimetype.startsWith('video') ? 'video' : 'image'
                }));
                gallery = [...gallery, ...uploadedGallery];
            }
        }

        if (gallery.length < 5) {
            return res.status(400).json({ success: false, message: 'Minimum 5 gallery images/videos are required.' });
        }

        const service = await Service.create({
            vendor: req.vendor.id,
            category,
            name,
            shortDescription,
            detailedDescription,
            features: parsedFeatures,
            price: parsedPrice,
            coverImage,
            gallery
        });

        res.status(201).json({ success: true, data: service });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a service
// @route   PUT /api/vendor/services/:id
// @access  Private/Vendor
exports.updateService = async (req, res, next) => {
    try {
        let service = await Service.findOne({ _id: req.params.id, vendor: req.vendor.id });
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        const { category, name, shortDescription, detailedDescription, features, price, existingGallery } = req.body;
        
        const updateData = {};
        if (category) updateData.category = category;
        if (name) updateData.name = name;
        if (shortDescription) updateData.shortDescription = shortDescription;
        if (detailedDescription) updateData.detailedDescription = detailedDescription;
        
        if (features) {
            try { updateData.features = JSON.parse(features); } catch (e) { updateData.features = features; }
        }

        if (price) {
            try { updateData.price = JSON.parse(price); } catch (e) {}
        }

        if (req.body.coverImage) {
            updateData.coverImage = req.body.coverImage;
        }

        if (req.files) {
            if (req.files['coverImage'] && req.files['coverImage'][0]) {
                updateData.coverImage = req.files['coverImage'][0].path;
            }
            
            let newGallery = [];
            if (existingGallery) {
                let parsedExisting = [];
                try { parsedExisting = JSON.parse(existingGallery); } catch(e) { parsedExisting = Array.isArray(existingGallery) ? existingGallery : [existingGallery]; }
                newGallery = parsedExisting.map(item => {
                    if (typeof item === 'string') return { url: item, type: 'image' };
                    return item;
                });
            }
            if (req.files['gallery']) {
                const uploadedGallery = req.files['gallery'].map(file => ({
                    url: file.path,
                    type: file.mimetype.startsWith('video') ? 'video' : 'image'
                }));
                newGallery = [...newGallery, ...uploadedGallery];
            }
            
            if (req.files['gallery'] || existingGallery) {
                if (newGallery.length < 5) {
                    return res.status(400).json({ success: false, message: 'Minimum 5 gallery images/videos are required.' });
                }
                updateData.gallery = newGallery;
            }
        } else if (existingGallery) {
            let parsedExisting = [];
            try { parsedExisting = JSON.parse(existingGallery); } catch(e) { parsedExisting = Array.isArray(existingGallery) ? existingGallery : [existingGallery]; }
            updateData.gallery = parsedExisting.map(item => {
                if (typeof item === 'string') return { url: item, type: 'image' };
                return item;
            });
            
            if (updateData.gallery.length < 5) {
                return res.status(400).json({ success: false, message: 'Minimum 5 gallery images/videos are required.' });
            }
        }

        service = await Service.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: service });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a service
// @route   DELETE /api/vendor/services/:id
// @access  Private/Vendor
exports.deleteService = async (req, res, next) => {
    try {
        const service = await Service.findOneAndDelete({ _id: req.params.id, vendor: req.vendor.id });
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// Dynamic Vendor Service Management
// ==========================================

const VendorService = require('./VendorService');

// @desc    Get dynamic vendor services
// @route   GET /api/vendor/dynamic-services
// @access  Private/Vendor
exports.getDynamicVendorServices = async (req, res, next) => {
    try {
        const vendorServices = await VendorService.find({ vendorId: req.vendor.id })
            .populate('categoryId', 'name')
            .populate('subCategoryId', 'name')
            .sort('-createdAt');
        res.status(200).json({ success: true, data: vendorServices });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new dynamic vendor service
// @route   POST /api/vendor/dynamic-services
// @access  Private/Vendor
exports.createDynamicVendorService = async (req, res, next) => {
    try {
        const { categoryId, subCategoryId, serviceData } = req.body;

        let parsedData = {};
        if (serviceData) {
            try { parsedData = JSON.parse(serviceData); } catch (e) { parsedData = serviceData; }
        }

        let images = [];
        let videos = [];
        let documents = [];

        if (req.files) {
            if (req.files['images']) {
                images = req.files['images'].map(file => file.path);
            }
            if (req.files['videos']) {
                videos = req.files['videos'].map(file => file.path);
            }
            if (req.files['documents']) {
                documents = req.files['documents'].map(file => file.path);
            }
        }

        const vendorService = await VendorService.create({
            vendorId: req.vendor.id,
            categoryId,
            subCategoryId,
            serviceData: parsedData,
            images,
            videos,
            documents
        });

        res.status(201).json({ success: true, data: vendorService });
    } catch (err) {
        next(err);
    }
};

// @desc    Get profile completion progress
// @route   GET /api/vendor/profile-progress
// @access  Private/Vendor
exports.getProfileProgress = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id);
        if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

        let totalItems = 0;
        let completedItems = 0;

        // --- 1. Base Registration Fields ---
        const baseFields = ['fullName', 'businessName', 'email', 'phone', 'city'];
        baseFields.forEach(field => {
            totalItems++;
            if (vendor[field]) completedItems++;
        });
        
        // --- 2. Documents ---
        const documentStatus = {
            needed: true,
            idProof: false,
            gst: false
        };
        
        totalItems += 2;
        if (vendor.documents && vendor.documents.idProof) {
            documentStatus.idProof = true;
            completedItems++;
        }
        if (vendor.documents && vendor.documents.gst) {
            documentStatus.gst = true;
            completedItems++;
        }

        // --- 5. Form Templates / Subcategories ---
        const subcategoryProgress = [];
        
        for (const cat of vendor.selectedCategories || []) {
            for (const sub of cat.subcategories || []) {
                totalItems += 1;
                
                const serviceExists = await VendorService.findOne({
                    vendorId: vendor._id,
                    categoryId: cat.categoryId,
                    subCategoryId: sub.subcategoryId
                });
                
                if (serviceExists) {
                    completedItems += 1;
                    subcategoryProgress.push({
                        categoryId: cat.categoryId,
                        categoryName: cat.categoryName,
                        subcategoryId: sub.subcategoryId,
                        subcategoryName: sub.subcategoryName,
                        completed: true
                    });
                } else {
                    subcategoryProgress.push({
                        categoryId: cat.categoryId,
                        categoryName: cat.categoryName,
                        subcategoryId: sub.subcategoryId,
                        subcategoryName: sub.subcategoryName,
                        completed: false
                    });
                }
            }
        }
        
        const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;
        const isComplete = percentage === 100;
        
        if (isComplete && !vendor.isServiceProfileCompleted) {
            vendor.isServiceProfileCompleted = true;
            await vendor.save();
        }

        res.status(200).json({ 
            success: true, 
            percentage,
            isComplete,
            documentStatus,
            subcategoryProgress
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Upload missing documents (post-registration)
// @route   POST /api/vendor/upload-document
// @access  Private/Vendor
exports.uploadMissingDocuments = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id);
        if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

        const { idProofUrl, gstUrl } = req.body;

        if (!vendor.documents) {
            vendor.documents = { idProof: null, gst: null, contract: null };
        }

        if (idProofUrl) vendor.documents.idProof = idProofUrl;
        if (gstUrl) vendor.documents.gst = gstUrl;

        await vendor.save();

        res.status(200).json({ success: true, message: 'Documents updated successfully', documents: vendor.documents });
    } catch (err) {
        next(err);
    }
};

// @desc    Request admin approval after completing profile
// @route   POST /api/vendor/request-approval
// @access  Private/Vendor
exports.requestApproval = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id);
        if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

        if (vendor.status !== 'Incomplete') {
            return res.status(400).json({ success: false, message: 'Vendor is already pending or approved' });
        }

        vendor.status = 'Pending';
        await vendor.save();

        res.status(200).json({ success: true, message: 'Profile submitted for verification successfully', status: vendor.status });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// Inventory Management
// ==========================================

const Inventory = require('./Inventory');

// @desc    Get all inventory items for a vendor
// @route   GET /api/vendor/inventory
// @access  Private/Vendor
exports.getVendorInventory = async (req, res, next) => {
    try {
        const inventory = await Inventory.find({ vendor: req.vendor.id })
            .populate('category', 'name')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, count: inventory.length, data: inventory });
    } catch (err) {
        next(err);
    }
};

// @desc    Create an inventory item
// @route   POST /api/vendor/inventory
// @access  Private/Vendor
exports.createInventoryItem = async (req, res, next) => {
    try {
        req.body.vendor = req.vendor.id;

        if (!req.body.category || !req.body.category.toString().trim()) {
            return res.status(400).json({ success: false, message: 'Please select a category for this item' });
        }

        if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
            return res.status(400).json({ success: false, message: 'Invalid category selected' });
        }
        
        // Handle images
        if (req.files && req.files.length > 0) {
            req.body.images = req.files.map(file => file.path);
        }

        const inventoryItem = await Inventory.create(req.body);
        
        res.status(201).json({ success: true, data: inventoryItem });
    } catch (err) {
        next(err);
    }
};

// @desc    Update an inventory item
// @route   PUT /api/vendor/inventory/:id
// @access  Private/Vendor
exports.updateInventoryItem = async (req, res, next) => {
    try {
        let inventoryItem = await Inventory.findById(req.params.id);

        if (!inventoryItem) {
            return res.status(404).json({ success: false, message: 'Inventory item not found' });
        }

        if (inventoryItem.vendor.toString() !== req.vendor.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this inventory item' });
        }

        if (req.body.category !== undefined) {
            if (!req.body.category || !req.body.category.toString().trim()) {
                delete req.body.category;
            } else if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
                return res.status(400).json({ success: false, message: 'Invalid category selected' });
            }
        }

        // Keep existing images and add new ones if uploaded
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            req.body.images = [...(inventoryItem.images || []), ...newImages];
        }

        inventoryItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: inventoryItem });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete an inventory item
// @route   DELETE /api/vendor/inventory/:id
// @access  Private/Vendor
exports.deleteInventoryItem = async (req, res, next) => {
    try {
        const inventoryItem = await Inventory.findById(req.params.id);

        if (!inventoryItem) {
            return res.status(404).json({ success: false, message: 'Inventory item not found' });
        }

        if (inventoryItem.vendor.toString() !== req.vendor.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this inventory item' });
        }

        await inventoryItem.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Get vendor blocked dates
// @route   GET /api/vendor/calendar/blocked-dates
// @access  Private
exports.getBlockedDates = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id).select('blockedDates');
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        const formatted = (vendor.blockedDates || []).map(d => new Date(d).toISOString().split('T')[0]);
        res.status(200).json({
            success: true,
            data: Array.from(new Set(formatted))
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add vendor blocked date
// @route   POST /api/vendor/calendar/blocked-dates
// @access  Private
exports.addBlockedDate = async (req, res, next) => {
    try {
        const { date } = req.body;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required (YYYY-MM-DD)' });
        }

        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setUTCHours(0, 0, 0, 0);
        if (startOfDay < todayStart) {
            return res.status(400).json({ success: false, message: 'Cannot block past dates' });
        }

        const vendor = await Vendor.findById(req.vendor.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        const alreadyBlocked = (vendor.blockedDates || []).some(b => {
            const bd = new Date(b);
            return bd >= startOfDay && bd <= endOfDay;
        });

        if (alreadyBlocked) {
            return res.status(400).json({ success: false, message: 'Date is already blocked' });
        }

        const conflicting = await Booking.findOne({
            vendorId: req.vendor.id,
            eventDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['Confirmed', 'In Progress'] }
        });

        if (conflicting) {
            return res.status(409).json({ success: false, message: 'Cannot block a date with an existing confirmed booking' });
        }

        vendor.blockedDates = vendor.blockedDates || [];
        vendor.blockedDates.push(startOfDay);
        await vendor.save();

        const formatted = vendor.blockedDates.map(d => new Date(d).toISOString().split('T')[0]);
        res.status(201).json({
            success: true,
            message: 'Date blocked successfully',
            data: Array.from(new Set(formatted))
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove vendor blocked date
// @route   DELETE /api/vendor/calendar/blocked-dates/:date
// @access  Private
exports.removeBlockedDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const vendor = await Vendor.findById(req.vendor.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        vendor.blockedDates = (vendor.blockedDates || []).filter(b => {
            const bd = new Date(b);
            return bd < startOfDay || bd > endOfDay;
        });
        await vendor.save();

        const formatted = vendor.blockedDates.map(d => new Date(d).toISOString().split('T')[0]);
        res.status(200).json({
            success: true,
            message: 'Date unblocked successfully',
            data: Array.from(new Set(formatted))
        });
    } catch (err) {
        next(err);
    }
};
