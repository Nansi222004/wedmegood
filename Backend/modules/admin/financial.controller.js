const mongoose = require('mongoose');
const FinancialLedger = require('./FinancialLedger');
const Payment = require('../user/Payment');
const Booking = require('../vendor/Booking');
const VendorWallet = require('../vendor/VendorWallet');
const WithdrawalRequest = require('../vendor/WithdrawalRequest');
const Vendor = require('../vendor/Vendor');
const User = require('../user/user.model');

// @desc    Get aggregate financial summary
// @route   GET /api/admin/financial/summary
// @access  Private/Admin
exports.getFinancialSummary = async (req, res, next) => {
    try {
        const [
            paymentStats,
            refundStats,
            walletStats,
            withdrawalStats
        ] = await Promise.all([
            // Completed / Paid Customer Payments
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
            // Refunds
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
            // Wallets
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
            // Withdrawals
            WithdrawalRequest.aggregate([
                {
                    $group: {
                        _id: '$status',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const payments = paymentStats[0] || { totalGMV: 0, totalCommission: 0, totalVendorEarnings: 0, count: 0 };
        const refunds = refundStats[0] || { totalRefunded: 0, count: 0 };
        const wallets = walletStats[0] || { totalAvailable: 0, totalPending: 0, totalLocked: 0, totalWithdrawn: 0 };

        const withdrawalsByStatus = {};
        withdrawalStats.forEach(item => {
            withdrawalsByStatus[item._id] = { amount: item.totalAmount, count: item.count };
        });

        const pendingPayoutsAmount = ['Requested', 'Pending', 'Approved', 'Processing']
            .reduce((sum, st) => sum + (withdrawalsByStatus[st]?.amount || 0), 0);
        const pendingPayoutsCount = ['Requested', 'Pending', 'Approved', 'Processing']
            .reduce((sum, st) => sum + (withdrawalsByStatus[st]?.count || 0), 0);

        const netPlatformRevenue = Math.max(0, payments.totalCommission - refunds.totalRefunded);

        res.status(200).json({
            success: true,
            data: {
                totalGMV: payments.totalGMV,
                totalPlatformCommission: payments.totalCommission,
                totalVendorEarnings: payments.totalVendorEarnings,
                netPlatformRevenue,
                totalRefunds: refunds.totalRefunded,
                refundCount: refunds.count,
                totalPaymentsCount: payments.count,
                pendingVendorSettlements: wallets.totalPending,
                availableVendorBalances: wallets.totalAvailable,
                completedPayouts: withdrawalsByStatus['Paid']?.amount || wallets.totalWithdrawn,
                pendingPayouts: pendingPayoutsAmount,
                pendingPayoutsCount,
                currency: 'INR'
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get paginated financial transactions from immutable ledger
// @route   GET /api/admin/financial/transactions
// @access  Private/Admin
exports.getFinancialTransactions = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.entryType) filter.entryType = req.query.entryType;
        if (req.query.vendorId && mongoose.Types.ObjectId.isValid(req.query.vendorId)) {
            filter.vendorId = req.query.vendorId;
        }
        if (req.query.direction) filter.direction = req.query.direction;

        const [transactions, total] = await Promise.all([
            FinancialLedger.find(filter)
                .populate('vendorId', 'businessName email phone city')
                .populate('userId', 'fullName name email phone')
                .populate('bookingId', 'totalPrice eventDate status')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean(),
            FinancialLedger.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: transactions
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get customer payments list for admin
// @route   GET /api/admin/financial/payments
// @access  Private/Admin
exports.getAdminPayments = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.vendorId && mongoose.Types.ObjectId.isValid(req.query.vendorId)) {
            filter.vendorId = req.query.vendorId;
        }

        const [payments, total, totalSettledAgg, pendingAgg] = await Promise.all([
            Payment.find(filter)
                .populate('vendorId', 'businessName city phone email category')
                .populate('userId', 'fullName name email phone')
                .populate('bookingId', 'totalPrice eventDate status paymentStatus')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean(),
            Payment.countDocuments(filter),
            Payment.aggregate([
                { $match: { status: { $in: ['Completed', 'Paid'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Payment.aggregate([
                { $match: { status: 'Pending' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ])
        ]);

        const totalSettled = totalSettledAgg[0]?.total || 0;
        const pendingPayouts = pendingAgg[0]?.total || 0;
        const pendingCount = pendingAgg[0]?.count || 0;

        // Structure matches AdminPayments.jsx expectations
        const formattedPayments = payments.map(p => ({
            id: p._id.toString(),
            vendor: p.vendorId?.businessName || 'Vendor Entity',
            amount: `₹${(p.amount || 0).toLocaleString('en-IN')}`,
            date: new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: p.status === 'Completed' || p.status === 'Paid' ? 'Settled' : p.status,
            raw: p
        }));

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: {
                payments: formattedPayments,
                stats: {
                    totalSettled: `₹${(totalSettled / 100000).toFixed(2)}L`,
                    pendingPayouts: `₹${pendingPayouts.toLocaleString('en-IN')}`,
                    pendingCount
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get vendor withdrawal requests for admin
// @route   GET /api/admin/financial/withdrawals
// @access  Private/Admin
exports.getAdminWithdrawals = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status) filter.status = req.query.status;

        const [withdrawals, total] = await Promise.all([
            WithdrawalRequest.find(filter)
                .populate('vendorId', 'businessName email phone city bank bankDetails')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean(),
            WithdrawalRequest.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: withdrawals
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update vendor withdrawal status (Approve, Process, Pay, Reject)
// @route   PUT /api/admin/financial/withdrawals/:id
// @access  Private/Admin
exports.updateWithdrawalStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, payoutReference, rejectionReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid withdrawal ID' });
        }

        const validStatuses = ['Approved', 'Processing', 'Paid', 'Rejected', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const withdrawal = await WithdrawalRequest.findById(id);
        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
        }

        // Prevent modifying already completed or finalized requests
        if (withdrawal.status === 'Paid') {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify a withdrawal that has already been Paid'
            });
        }
        if (withdrawal.status === 'Rejected' || withdrawal.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify a withdrawal that has already been Rejected or Cancelled'
            });
        }

        const vendorId = withdrawal.vendorId;
        const amount = withdrawal.amount;

        // Transition: Paid
        if (status === 'Paid') {
            const ref = payoutReference || `UTR-${Date.now().toString().slice(-8)}`;

            withdrawal.status = 'Paid';
            withdrawal.payoutReference = ref;
            withdrawal.adminNotes = adminNotes || withdrawal.adminNotes;
            withdrawal.processedAt = new Date();
            withdrawal.processedBy = req.user._id;
            await withdrawal.save();

            // Clear locked balance and increment totalWithdrawn atomically
            await VendorWallet.findOneAndUpdate(
                { vendorId },
                {
                    $inc: {
                        lockedBalance: -amount,
                        totalWithdrawn: amount
                    }
                }
            );

            // Log final settlement entry
            await FinancialLedger.create({
                entryType: 'VENDOR_SETTLEMENT',
                direction: 'DEBIT',
                amount,
                currency: 'INR',
                referenceId: ref,
                withdrawalId: withdrawal._id,
                vendorId,
                status: 'POSTED',
                description: `Payout #${withdrawal._id.toString().slice(-6).toUpperCase()} marked Paid with reference ${ref}`
            });
        }
        // Transition: Rejected or Cancelled
        else if (status === 'Rejected' || status === 'Cancelled') {
            withdrawal.status = status;
            withdrawal.rejectionReason = rejectionReason || adminNotes || 'Rejected by Admin';
            withdrawal.adminNotes = adminNotes || withdrawal.adminNotes;
            withdrawal.processedAt = new Date();
            withdrawal.processedBy = req.user._id;
            await withdrawal.save();

            // Return locked amount back to availableBalance atomically
            await VendorWallet.findOneAndUpdate(
                { vendorId },
                {
                    $inc: {
                        lockedBalance: -amount,
                        availableBalance: amount
                    }
                }
            );

            // Log reversal entry
            await FinancialLedger.create({
                entryType: 'PAYOUT_REVERSAL',
                direction: 'CREDIT',
                amount,
                currency: 'INR',
                referenceId: withdrawal._id.toString(),
                withdrawalId: withdrawal._id,
                vendorId,
                status: 'POSTED',
                description: `Withdrawal #${withdrawal._id.toString().slice(-6).toUpperCase()} ${status}: ₹${amount.toLocaleString()} restored to available balance`
            });
        }
        // Transition: Approved or Processing
        else {
            withdrawal.status = status;
            if (adminNotes) withdrawal.adminNotes = adminNotes;
            if (payoutReference) withdrawal.payoutReference = payoutReference;
            await withdrawal.save();
        }

        res.status(200).json({
            success: true,
            message: `Withdrawal request status updated to ${status}`,
            data: withdrawal
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Process refund for a customer payment/booking
// @route   POST /api/admin/financial/refund
// @access  Private/Admin
exports.processRefund = async (req, res, next) => {
    try {
        const { paymentId, bookingId, reason, refundAmount: reqRefundAmount } = req.body;

        const query = {};
        if (paymentId && mongoose.Types.ObjectId.isValid(paymentId)) {
            query._id = paymentId;
        } else if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
            query.bookingId = bookingId;
        } else {
            return res.status(400).json({
                success: false,
                message: 'A valid paymentId or bookingId is required'
            });
        }

        const payment = await Payment.findOne(query);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        const existingPaymentRefund = Number(payment.refundAmount) || 0;
        const maxRefundableOnPayment = Math.max(0, payment.amount - existingPaymentRefund);

        if (maxRefundableOnPayment <= 0) {
            return res.status(400).json({
                success: false,
                message: 'This payment has already been fully refunded'
            });
        }

        const refundAmount = reqRefundAmount ? Math.min(maxRefundableOnPayment, Number(reqRefundAmount)) : maxRefundableOnPayment;

        if (refundAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid refund amount' });
        }

        const booking = await Booking.findById(payment.bookingId);

        // Proportional commission and vendor earning reversal
        const originalAmount = payment.amount || 1;
        const refundRatio = refundAmount / originalAmount;
        const commissionToReverse = payment.commissionAmount !== undefined && payment.commissionAmount !== null
            ? Math.round((payment.commissionAmount * refundRatio) * 100) / 100
            : 0;
        const vendorEarningToReverse = Math.max(0, Math.round((refundAmount - commissionToReverse) * 100) / 100);

        // 1. Update Payment record
        const newPaymentRefundTotal = existingPaymentRefund + refundAmount;
        payment.refundAmount = newPaymentRefundTotal;
        payment.status = newPaymentRefundTotal >= payment.amount ? 'Refunded' : 'PartiallyRefunded';
        payment.refundedAt = new Date();
        payment.commissionAmount = Math.max(0, (payment.commissionAmount || 0) - commissionToReverse);
        payment.vendorEarning = Math.max(0, (payment.vendorEarning || 0) - vendorEarningToReverse);
        payment.notes = reason ? `Refund reason: ${reason}` : payment.notes;
        await payment.save();

        // 2. Update Booking record
        if (booking) {
            const allPayments = await Payment.find({ bookingId: booking._id }).lean();
            const totalRefundsOnBooking = allPayments.reduce((acc, p) => {
                const pRefund = p._id.toString() === payment._id.toString() ? newPaymentRefundTotal : (Number(p.refundAmount) || 0);
                return acc + pRefund;
            }, 0);
            const totalGrossPaidOnBooking = allPayments.reduce((acc, p) => {
                return acc + (['Completed', 'Paid', 'PartiallyRefunded', 'Refunded'].includes(p.status) ? Number(p.amount) : 0);
            }, 0);

            booking.refundAmount = totalRefundsOnBooking;
            booking.refundedAt = new Date();
            if (totalRefundsOnBooking >= totalGrossPaidOnBooking && totalGrossPaidOnBooking > 0) {
                booking.paymentStatus = 'Refunded';
                booking.settlementStatus = 'Refunded';
                booking.status = 'Cancelled';
                booking.cancelledBy = booking.cancelledBy || 'Admin';
                booking.cancellationReason = reason || 'Fully refunded by Admin';
            } else if (totalRefundsOnBooking > 0) {
                booking.paymentStatus = 'PartiallyRefunded';
            }
            await booking.save();
        }

        // 3. Reverse Vendor Wallet balances
        const vendorId = payment.vendorId;
        const wallet = await VendorWallet.findOne({ vendorId });
        if (wallet) {
            if (wallet.pendingBalance >= vendorEarningToReverse) {
                wallet.pendingBalance = Math.max(0, wallet.pendingBalance - vendorEarningToReverse);
            } else {
                const remainingToDebit = vendorEarningToReverse - wallet.pendingBalance;
                wallet.pendingBalance = 0;
                wallet.availableBalance = Math.max(0, wallet.availableBalance - remainingToDebit);
            }
            wallet.totalRefunded = (wallet.totalRefunded || 0) + vendorEarningToReverse;
            await wallet.save();
        }

        // 4. Log Financial Ledger Entries
        await FinancialLedger.create([
            {
                entryType: 'REFUND',
                direction: 'DEBIT',
                amount: refundAmount,
                currency: 'INR',
                referenceId: payment._id.toString(),
                paymentId: payment._id,
                bookingId: payment.bookingId,
                vendorId: payment.vendorId,
                userId: payment.userId,
                status: 'POSTED',
                description: `Customer refund for Payment #${payment._id} (${reason || 'Admin refund'})`
            },
            {
                entryType: 'PAYOUT_REVERSAL',
                direction: 'DEBIT',
                amount: vendorEarningToReverse,
                currency: 'INR',
                referenceId: payment._id.toString(),
                paymentId: payment._id,
                bookingId: payment.bookingId,
                vendorId: payment.vendorId,
                status: 'POSTED',
                description: `Vendor earning reversal of ₹${vendorEarningToReverse.toLocaleString()} due to refund`
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'Refund processed and recorded successfully',
            data: {
                payment,
                booking,
                refundAmount,
                commissionReversed: commissionToReverse,
                vendorEarningReversed: vendorEarningToReverse
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Financial Reconciliation Summary
// @route   GET /api/admin/financial/reconciliation
// @access  Private/Admin
exports.getReconciliation = async (req, res, next) => {
    try {
        const [
            paymentTotals,
            refundTotals,
            walletTotals,
            ledgerTotals
        ] = await Promise.all([
            Payment.aggregate([
                { $match: { status: { $in: ['Completed', 'Paid', 'PartiallyRefunded'] } } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        totalCommission: {
                            $sum: { $ifNull: ['$commissionAmount', 0] }
                        },
                        totalVendorEarnings: {
                            $sum: { $ifNull: ['$vendorEarning', { $subtract: ['$amount', { $ifNull: ['$commissionAmount', 0] }] }] }
                        }
                    }
                }
            ]),
            Payment.aggregate([
                { $match: { status: { $in: ['Refunded', 'PartiallyRefunded'] } } },
                { $group: { _id: null, totalRefunded: { $sum: '$refundAmount' } } }
            ]),
            VendorWallet.aggregate([
                {
                    $group: {
                        _id: null,
                        totalPending: { $sum: '$pendingBalance' },
                        totalAvailable: { $sum: '$availableBalance' },
                        totalLocked: { $sum: '$lockedBalance' },
                        totalWithdrawn: { $sum: '$totalWithdrawn' },
                        totalRefunded: { $sum: '$totalRefunded' },
                        totalEarned: { $sum: '$totalEarned' }
                    }
                }
            ]),
            FinancialLedger.aggregate([
                {
                    $group: {
                        _id: '$entryType',
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ])
        ]);

        const payments = paymentTotals[0] || { totalAmount: 0, totalCommission: 0, totalVendorEarnings: 0 };
        const refunds = refundTotals[0]?.totalRefunded || 0;
        const wallets = walletTotals[0] || { totalPending: 0, totalAvailable: 0, totalLocked: 0, totalWithdrawn: 0, totalRefunded: 0, totalEarned: 0 };

        const ledgerMap = {};
        ledgerTotals.forEach(item => {
            ledgerMap[item._id] = item.totalAmount;
        });

        // Accounting Equation Check:
        // Customer Payments should equal Platform Commission + Vendor Earnings
        const paymentDistributionDiff = Math.abs(payments.totalAmount - (payments.totalCommission + payments.totalVendorEarnings));
        const isPaymentBalanced = paymentDistributionDiff < 1; // Within 1 INR rounding

        res.status(200).json({
            success: true,
            isBalanced: isPaymentBalanced,
            accountingEquation: 'Customer Payments = Platform Commission + Vendor Earnings',
            totals: {
                customerPayments: payments.totalAmount,
                platformCommission: payments.totalCommission,
                vendorEarnings: payments.totalVendorEarnings,
                refunds,
                walletSummary: {
                    pendingBalance: wallets.totalPending,
                    availableBalance: wallets.totalAvailable,
                    lockedBalance: wallets.totalLocked,
                    totalWithdrawn: wallets.totalWithdrawn,
                    totalRefunded: wallets.totalRefunded
                },
                ledgerBreakdown: ledgerMap
            }
        });
    } catch (err) {
        next(err);
    }
};
