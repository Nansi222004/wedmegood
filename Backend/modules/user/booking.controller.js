const mongoose = require('mongoose');
const Booking = require('../vendor/Booking');
const Notification = require('../vendor/Notification');

// @desc    Get current user's bookings
// @route   GET /api/user/bookings
// @access  Private (User)
exports.getUserBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id })
            .populate('vendorId', 'businessName city profileImage phone pricing rating reviewCount')
            .populate('leadId')
            .populate('quoteId')
            .sort('-createdAt')
            .lean();

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
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
            .populate('vendorId', 'businessName city profileImage phone pricing')
            .populate('leadId')
            .populate('quoteId')
            .lean();

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            data: booking
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

        const booking = await Booking.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or unauthorized'
            });
        }

        if (booking.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        if (booking.status === 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a completed event'
            });
        }

        booking.status = 'Cancelled';
        booking.cancellationReason = reason || 'Cancelled by user';
        booking.cancelledBy = 'User';
        booking.cancelledAt = new Date();

        // If booking was paid, reverse financial state, record refund, and debit vendor wallet
        if (booking.paymentStatus === 'Paid') {
            const Payment = require('./Payment');
            const payment = await Payment.findOne({ bookingId: booking._id, status: { $in: ['Completed', 'Paid'] } });
            if (payment) {
                payment.status = 'Refunded';
                payment.refundAmount = payment.amount;
                payment.refundedAt = new Date();
                payment.notes = reason || 'Cancelled by user';
                await payment.save();

                booking.paymentStatus = 'Refunded';
                booking.settlementStatus = 'Refunded';
                booking.refundAmount = payment.amount;
                booking.refundedAt = new Date();

                const VendorWallet = require('../vendor/VendorWallet');
                const FinancialLedger = require('../admin/FinancialLedger');
                const reverseAmount = payment.vendorEarning || Math.round(payment.amount * 0.9 * 100) / 100;

                const wallet = await VendorWallet.findOne({ vendorId: booking.vendorId });
                if (wallet) {
                    if (wallet.pendingBalance >= reverseAmount) {
                        wallet.pendingBalance = Math.max(0, wallet.pendingBalance - reverseAmount);
                    } else {
                        wallet.availableBalance = Math.max(0, wallet.availableBalance - reverseAmount);
                    }
                    wallet.totalRefunded = (wallet.totalRefunded || 0) + reverseAmount;
                    await wallet.save();
                }

                await FinancialLedger.create([
                    {
                        entryType: 'REFUND',
                        direction: 'DEBIT',
                        amount: payment.amount,
                        currency: 'INR',
                        referenceId: payment._id.toString(),
                        paymentId: payment._id,
                        bookingId: booking._id,
                        vendorId: booking.vendorId,
                        userId: req.user._id,
                        status: 'POSTED',
                        description: `User cancelled paid booking #${booking._id}: refund recorded`
                    },
                    {
                        entryType: 'PAYOUT_REVERSAL',
                        direction: 'DEBIT',
                        amount: reverseAmount,
                        currency: 'INR',
                        referenceId: payment._id.toString(),
                        paymentId: payment._id,
                        bookingId: booking._id,
                        vendorId: booking.vendorId,
                        status: 'POSTED',
                        description: `Vendor earning reversed due to user cancellation of booking #${booking._id}`
                    }
                ]);
            }
        }

        await booking.save();

        // Notify vendor
        await Notification.create({
            vendorId: booking.vendorId,
            message: `Booking for ${booking.customerName} on ${booking.eventDate?.toISOString()?.split('T')[0]} was cancelled: ${booking.cancellationReason}`,
            type: 'Booking',
            isRead: false
        });

        // Notify user & record activity
        try {
            const { notifyAndLogActivity } = require('../../services/notification.service');
            await notifyAndLogActivity({
                userId: req.user._id,
                notificationTitle: 'Booking Cancelled',
                notificationMessage: `Your booking scheduled for ${booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : 'event'} has been cancelled.`,
                notificationType: 'booking',
                activityType: 'booking_cancelled',
                activityTitle: 'Cancelled Booking',
                activityMessage: `Cancelled booking with reason: ${booking.cancellationReason || 'No reason provided'}`,
                entityType: 'Booking',
                entityId: booking._id,
                eventKey: `booking_cancel_${booking._id}`
            });
        } catch (notifErr) {}

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking
        });
    } catch (err) {
        next(err);
    }
};
