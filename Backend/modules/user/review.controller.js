const mongoose = require('mongoose');
const Review = require('../vendor/Review');
const Booking = require('../vendor/Booking');
const Notification = require('../vendor/Notification');

// @desc    Create a verified review for a completed/eligible booking
// @route   POST /api/user/reviews
// @access  Private (User)
exports.createReview = async (req, res, next) => {
    try {
        const { bookingId, rating, comment, photos } = req.body;

        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                success: false,
                message: 'A valid booking ID is required to submit a review'
            });
        }

        const numRating = Number(rating);
        if (!numRating || numRating < 1 || numRating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid rating between 1 and 5'
            });
        }

        if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a review comment'
            });
        }

        // 1. Fetch booking and verify existence
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // 2. Strict Ownership Check: Must be booked by the authenticated user
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only review your own bookings'
            });
        }

        // 2b. Target Vendor Validation: If vendorId is specified, it must match booking vendor
        if (req.body.vendorId && booking.vendorId.toString() !== req.body.vendorId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Booking does not belong to the target vendor'
            });
        }

        // 3. Status Eligibility Check: Cancelled bookings cannot be reviewed
        if (booking.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot review a cancelled booking'
            });
        }

        // 4. Duplicate Prevention: Only 1 review permitted per booking
        const existingReview = await Review.findOne({
            bookingId: booking._id,
            userId: req.user._id
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a review for this booking'
            });
        }

        // 5. Create real Review in MongoDB
        const review = await Review.create({
            vendorId: booking.vendorId,
            userId: req.user._id,
            bookingId: booking._id,
            rating: numRating,
            comment: comment.trim(),
            photos: Array.isArray(photos) ? photos : [],
            status: 'Approved'
        });

        // 6. Notify Vendor
        await Notification.create({
            vendorId: booking.vendorId,
            message: `New ${numRating}★ review received from ${req.user.name || 'a customer'} for booking #${booking._id.toString().slice(-6).toUpperCase()}!`,
            type: 'Review',
            isRead: false
        });

        // 7. Record user activity (Non-blocking)
        try {
            const { recordActivity } = require('../../services/notification.service');
            await recordActivity({
                userId: req.user._id,
                type: 'review_submitted',
                title: 'Review Submitted',
                message: `Submitted a ${numRating}★ review for your booking.`,
                entityType: 'Review',
                entityId: review._id,
                eventKey: `review_submit_${review._id}`
            });
        } catch (actErr) {}

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: {
                review
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all reviews submitted by the authenticated user
// @route   GET /api/user/reviews
// @access  Private (User)
exports.getUserReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ userId: req.user._id })
            .populate('vendorId', 'businessName profileImage city services')
            .populate('bookingId', 'services eventDate location totalPrice')
            .sort('-createdAt')
            .lean();

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: {
                reviews
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user bookings that are eligible to be reviewed (not cancelled and not yet reviewed)
// @route   GET /api/user/reviews/eligible-bookings
// @access  Private (User)
exports.getEligibleReviewBookings = async (req, res, next) => {
    try {
        // Find confirmed or completed bookings
        const bookings = await Booking.find({
            userId: req.user._id,
            status: { $in: ['Confirmed', 'Completed'] }
        })
            .populate('vendorId', 'businessName profileImage city')
            .sort('-eventDate')
            .lean();

        // Find existing reviews submitted by this user
        const existingReviews = await Review.find({ userId: req.user._id })
            .select('bookingId')
            .lean();

        const reviewedBookingIds = new Set(
            existingReviews
                .filter(r => r.bookingId)
                .map(r => r.bookingId.toString())
        );

        // Filter out bookings that have already been reviewed
        const eligible = bookings.filter(b => !reviewedBookingIds.has(b._id.toString()));

        res.status(200).json({
            success: true,
            count: eligible.length,
            data: {
                eligibleBookings: eligible
            }
        });
    } catch (err) {
        next(err);
    }
};
