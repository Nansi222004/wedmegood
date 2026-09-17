const mongoose = require('mongoose');
const Booking = require('../vendor/Booking');
const Payment = require('./Payment');
const Notification = require('../vendor/Notification');
const { reconcileBookingPayments } = require('../../utils/financialReconciliation');

// @desc    Get current user's bookings
// @route   GET /api/user/bookings
// @access  Private (User)
exports.getUserBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id })
            .populate('vendorId', 'businessName city profileImage phone pricing rating reviewCount email category')
            .populate('leadId')
            .populate('quoteId')
            .sort('-createdAt')
            .lean();

        const bookingIds = bookings.map(b => b._id);
        const payments = await Payment.find({
            bookingId: { $in: bookingIds }
        }).sort('-createdAt').lean();

        const enrichedBookings = bookings.map(booking => {
            const financial = reconcileBookingPayments(booking, payments);
            // Omit internal vendor & platform margin data from customer portal
            const {
                commission,
                commissionRate,
                commissionRatePercent,
                commissionBasis,
                commissionConfigSource,
                vendorEarning,
                vendorAmountSettled,
                ...customerFinancial
            } = financial;

            const sanitizedPayments = (customerFinancial.payments || []).map(p => ({
                _id: p._id,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                refundAmount: p.refundAmount,
                refundedAt: p.refundedAt,
                paymentMethod: p.paymentMethod,
                razorpayPaymentId: p.razorpayPaymentId,
                createdAt: p.createdAt
            }));

            return {
                ...booking,
                commission: undefined,
                vendorEarning: undefined,
                commissionRate: undefined,
                commissionRatePercent: undefined,
                commissionBasis: undefined,
                commissionConfigSource: undefined,
                ...customerFinancial,
                payments: sanitizedPayments
            };
        });

        res.status(200).json({
            success: true,
            count: enrichedBookings.length,
            data: enrichedBookings
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single booking by ID
// @route   GET /api/user/bookings/:id
// @access  Private (User)
exports.getUserBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID format'
            });
        }

        const booking = await Booking.findOne({
            _id: id,
            userId: req.user._id
        })
            .populate('vendorId', 'businessName city profileImage phone pricing rating reviewCount email category')
            .populate('leadId')
            .populate('quoteId')
            .lean();

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const payments = await Payment.find({ bookingId: booking._id }).sort('-createdAt').lean();
        const financial = reconcileBookingPayments(booking, payments);

        const {
            commission,
            commissionRate,
            commissionRatePercent,
            commissionBasis,
            commissionConfigSource,
            vendorEarning,
            vendorAmountSettled,
            ...customerFinancial
        } = financial;

        const sanitizedPayments = (customerFinancial.payments || []).map(p => ({
            _id: p._id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            refundAmount: p.refundAmount,
            refundedAt: p.refundedAt,
            paymentMethod: p.paymentMethod,
            razorpayPaymentId: p.razorpayPaymentId,
            createdAt: p.createdAt
        }));

        res.status(200).json({
            success: true,
            data: {
                ...booking,
                commission: undefined,
                vendorEarning: undefined,
                commissionRate: undefined,
                commissionRatePercent: undefined,
                commissionBasis: undefined,
                commissionConfigSource: undefined,
                ...customerFinancial,
                payments: sanitizedPayments
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Cancel a booking
// @route   PUT /api/user/bookings/:id/cancel
// @access  Private (User)
exports.cancelBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID format'
            });
        }

        const { cancelAndRefundBooking } = require('../../services/settlement.service');
        const result = await cancelAndRefundBooking({
            bookingId: id,
            cancelledBy: 'User',
            actorId: req.user._id,
            reason: reason || 'Cancelled by user'
        });

        if (!result.success) {
            return res.status(result.statusCode).json({
                success: false,
                message: result.message
            });
        }

        res.status(result.statusCode).json({
            success: true,
            message: result.message,
            data: result.data
        });
    } catch (err) {
        next(err);
    }
};
