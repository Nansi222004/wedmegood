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

module.exports = {
    settleBookingEarnings
};
