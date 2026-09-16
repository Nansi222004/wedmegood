const Booking = require('../modules/vendor/Booking');
const VendorWallet = require('../modules/vendor/VendorWallet');
const FinancialLedger = require('../modules/admin/FinancialLedger');

/**
 * Releases vendor earnings from pendingBalance to availableBalance
 * when a booking is completed and paid.
 * @param {string|ObjectId} bookingId
 * @returns {Promise<{ settled: boolean, amount: number, booking: any }>}
 */
async function settleBookingEarnings(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return { settled: false, reason: 'Booking not found' };
    }

    if (booking.paymentStatus !== 'Paid') {
        return { settled: false, reason: 'Booking is not paid' };
    }

    if (booking.settlementStatus === 'Eligible' || booking.settlementStatus === 'Settled') {
        return { settled: false, reason: 'Booking earnings already settled or eligible' };
    }

    const earningToRelease = booking.vendorEarning > 0
        ? booking.vendorEarning
        : Math.round(Number(booking.totalPrice || 0) * 0.9 * 100) / 100;

    if (earningToRelease <= 0) {
        return { settled: false, reason: 'Zero earning to release' };
    }

    // Mark booking eligible for payout
    booking.settlementStatus = 'Eligible';
    await booking.save();

    // Move from pendingBalance to availableBalance atomically
    await VendorWallet.findOneAndUpdate(
        { vendorId: booking.vendorId },
        {
            $inc: {
                pendingBalance: -earningToRelease,
                availableBalance: earningToRelease
            }
        },
        { upsert: true, new: true }
    );

    // Record ledger entry
    await FinancialLedger.create({
        entryType: 'VENDOR_SETTLEMENT',
        direction: 'CREDIT',
        amount: earningToRelease,
        currency: 'INR',
        referenceId: booking._id.toString(),
        bookingId: booking._id,
        vendorId: booking.vendorId,
        userId: booking.userId,
        status: 'POSTED',
        description: `Booking #${booking._id} completed: ₹${earningToRelease.toLocaleString()} moved from pending to available balance`
    });

    return {
        settled: true,
        amount: earningToRelease,
        booking
    };
}

/**
 * Canonical cancellation and financial refund handler for bookings.
 * Shared by User cancellation, Vendor cancellation, and Admin cancellation.
 * 
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.bookingId
 * @param {string} params.cancelledBy - 'User' | 'Vendor' | 'Admin'
 * @param {string|mongoose.Types.ObjectId} [params.actorId] - ID of user/vendor/admin initiating
 * @param {string} [params.reason] - Reason for cancellation
 * @returns {Promise<{ success: boolean, statusCode: number, message: string, data?: any }>}
 */
async function cancelAndRefundBooking({ bookingId, cancelledBy, actorId, reason }) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return { success: false, statusCode: 404, message: 'Booking not found' };
    }

    // Authorization check
    if (cancelledBy === 'User' && actorId && booking.userId && booking.userId.toString() !== actorId.toString()) {
        return { success: false, statusCode: 403, message: 'Unauthorized to cancel this booking' };
    }
    if (cancelledBy === 'Vendor' && actorId && booking.vendorId.toString() !== actorId.toString()) {
        return { success: false, statusCode: 403, message: 'Unauthorized to cancel this booking' };
    }

    // Status idempotency check
    if (booking.status === 'Cancelled') {
        return { success: false, statusCode: 400, message: 'Booking is already cancelled' };
    }
    if (booking.status === 'Completed') {
        return { success: false, statusCode: 400, message: 'Cannot cancel a completed event' };
    }

    booking.status = 'Cancelled';
    booking.cancellationReason = reason || `Cancelled by ${cancelledBy.toLowerCase()}`;
    booking.cancelledBy = cancelledBy;
    booking.cancelledAt = new Date();

    // Financial reversal if booking was paid
    const Payment = require('../modules/user/Payment');
    const payment = await Payment.findOne({ 
        bookingId: booking._id, 
        status: { $in: ['Completed', 'Paid'] } 
    });

    if (payment && booking.paymentStatus !== 'Refunded') {
        payment.status = 'Refunded';
        payment.refundAmount = payment.amount;
        payment.refundedAt = new Date();
        payment.notes = reason || `Cancelled by ${cancelledBy.toLowerCase()}`;
        await payment.save();

        booking.paymentStatus = 'Refunded';
        booking.settlementStatus = 'Refunded';
        booking.refundAmount = payment.amount;
        booking.refundedAt = new Date();

        const reverseAmount = payment.vendorEarning || Math.round(payment.amount * 0.9 * 100) / 100;

        // Debit vendor wallet safely (safe when balance is insufficient)
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

        // Prevent duplicate ledger entries
        const existingRefundLedger = await FinancialLedger.findOne({
            bookingId: booking._id,
            entryType: 'REFUND'
        });

        if (!existingRefundLedger) {
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
                    userId: booking.userId,
                    status: 'POSTED',
                    description: `${cancelledBy} cancelled paid booking #${booking._id}: refund recorded`
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
                    description: `Vendor earning reversed due to ${cancelledBy.toLowerCase()} cancellation of booking #${booking._id}`
                }
            ]);
        }
    }

    await booking.save();

    // Side-effects: Notifications & activity logging
    const Notification = require('../modules/vendor/Notification');
    if (cancelledBy === 'User') {
        await Notification.create({
            vendorId: booking.vendorId,
            message: `Booking for ${booking.customerName} on ${booking.eventDate?.toISOString()?.split('T')[0]} was cancelled: ${booking.cancellationReason}`,
            type: 'Booking',
            isRead: false
        }).catch(() => {});
    } else if (cancelledBy === 'Vendor') {
        await Notification.create({
            vendorId: booking.vendorId,
            message: `You cancelled the booking for ${booking.customerName} on ${booking.eventDate?.toISOString()?.split('T')[0]}`,
            type: 'Booking',
            isRead: false
        }).catch(() => {});
    }

    if (booking.userId) {
        try {
            const { notifyAndLogActivity } = require('./notification.service');
            await notifyAndLogActivity({
                userId: booking.userId,
                notificationTitle: 'Booking Cancelled',
                notificationMessage: `Your booking scheduled for ${booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : 'event'} has been cancelled by ${cancelledBy.toLowerCase()}.`,
                notificationType: 'booking',
                activityType: 'booking_cancelled',
                activityTitle: 'Cancelled Booking',
                activityMessage: `Booking cancelled by ${cancelledBy.toLowerCase()}: ${booking.cancellationReason}`,
                entityType: 'Booking',
                entityId: booking._id,
                eventKey: `booking_cancel_${booking._id}`
            });
        } catch (_) {}
    }

    return {
        success: true,
        statusCode: 200,
        message: 'Booking cancelled successfully',
        data: booking
    };
}

module.exports = {
    settleBookingEarnings,
    cancelAndRefundBooking
};
