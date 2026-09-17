const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('./Payment');
const Booking = require('../vendor/Booking');
const Vendor = require('../vendor/Vendor');
const User = require('./user.model');
const Notification = require('../vendor/Notification');
const FinancialLedger = require('../admin/FinancialLedger');
const VendorWallet = require('../vendor/VendorWallet');
const { calculateCommission, calculateActiveCommission } = require('../../services/commission.service');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay order for booking payment
// @route   POST /api/user/payments/create-order
// @access  Private (User)
exports.createPaymentOrder = async (req, res, next) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                success: false,
                message: 'A valid booking ID is required'
            });
        }

        // Fetch booking and verify ownership (Backend is source of truth for money)
        const booking = await Booking.findOne({
            _id: bookingId,
            userId: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or unauthorized'
            });
        }

        if (booking.paymentStatus === 'Paid') {
            return res.status(400).json({
                success: false,
                message: 'This booking has already been paid'
            });
        }

        if (booking.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot pay for a cancelled booking'
            });
        }

        if (booking.status === 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already marked as completed'
            });
        }

        // Fetch existing successful payments to determine server-side outstanding balance
        const payments = await Payment.find({ bookingId: booking._id }).lean();
        const { reconcileBookingPayments } = require('../../utils/financialReconciliation');
        const financial = reconcileBookingPayments(booking, payments);

        if (financial.outstandingBalance <= 0) {
            return res.status(400).json({
                success: false,
                message: 'This booking has already been fully paid'
            });
        }

        const payableAmount = financial.outstandingBalance;
        const amountInPaise = Math.round(Number(payableAmount) * 100);
        if (!amountInPaise || amountInPaise <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking payable amount'
            });
        }

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${booking._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
            notes: {
                bookingId: booking._id.toString(),
                userId: req.user._id.toString(),
                vendorId: booking.vendorId.toString()
            }
        };

        const order = await razorpay.orders.create(options);

        // Record pending payment for the exact outstanding balance
        await Payment.create({
            userId: req.user._id,
            bookingId: booking._id,
            vendorId: booking.vendorId,
            quoteId: booking.quoteId,
            razorpayOrderId: order.id,
            amount: payableAmount,
            currency: 'INR',
            status: 'Pending',
            paymentMethod: 'Razorpay'
        });

        res.status(200).json({
            success: true,
            order,
            booking: {
                id: booking._id,
                totalPrice: booking.totalPrice,
                paidAmount: financial.paidAmount,
                outstandingBalance: payableAmount,
                payableAmount,
                customerName: booking.customerName,
                eventDate: booking.eventDate
            },
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Verify Razorpay payment and update booking status
// @route   POST /api/user/payments/verify
// @access  Private (User)
exports.verifyPayment = async (req, res, next) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Incomplete payment verification payload'
            });
        }

        // Verify booking ownership
        const booking = await Booking.findOne({
            _id: bookingId,
            userId: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or unauthorized'
            });
        }

        // Server-side HMAC SHA256 Signature Verification
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        const isValid = (razorpay_signature === expectedSign);

        if (!isValid) {
            await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                {
                    status: 'Failed',
                    failureInfo: {
                        reason: 'Invalid signature',
                        code: 'BAD_SIGNATURE',
                        failedAt: new Date()
                    }
                }
            );
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed: Invalid signature'
            });
        }

        let payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

        // Idempotency: if already paid or completed, do not double-credit wallet or ledger
        if (payment && (payment.status === 'Completed' || payment.status === 'Paid')) {
            return res.status(200).json({
                success: true,
                message: 'Payment already verified and recorded',
                data: {
                    payment,
                    booking
                }
            });
        }

        // Determine payment amount from record or remaining balance
        const paymentAmount = payment && payment.amount > 0
            ? payment.amount
            : Math.max(0, Number(booking.totalPrice) || 0);

        // Server-side authoritative commission calculation (honors booking rate if historical)
        const explicitRate = booking.commissionRatePercent;
        const commissionCalc = await calculateActiveCommission(paymentAmount, explicitRate);
        const commissionRate = commissionCalc.commissionRate;
        const commissionRatePercent = commissionCalc.commissionPercent;
        const commissionAmount = commissionCalc.commissionAmount || 0;
        const vendorEarning = commissionCalc.vendorEarning !== null ? commissionCalc.vendorEarning : paymentAmount;
        const commissionBasis = commissionCalc.basis || 'GROSS_PACKAGE_AMOUNT';
        const commissionConfigSource = commissionCalc.source || 'DATABASE_PLATFORM_SETTINGS';

        if (payment) {
            payment.razorpayPaymentId = razorpay_payment_id;
            payment.razorpaySignature = razorpay_signature;
            payment.status = 'Completed';
            payment.commissionRate = commissionRate;
            payment.commissionRatePercent = commissionRatePercent;
            payment.commissionAmount = commissionAmount;
            payment.vendorEarning = vendorEarning;
            payment.commissionBasis = commissionBasis;
            payment.commissionConfigSource = commissionConfigSource;
            payment.quoteId = booking.quoteId;
            await payment.save();
        } else {
            payment = await Payment.create({
                userId: req.user._id,
                bookingId: booking._id,
                vendorId: booking.vendorId,
                quoteId: booking.quoteId,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                amount: paymentAmount,
                currency: 'INR',
                commissionRate,
                commissionRatePercent,
                commissionAmount,
                vendorEarning,
                commissionBasis,
                commissionConfigSource,
                status: 'Completed',
                paymentMethod: 'Razorpay'
            });
        }

        // Reconcile all payments for this booking to update booking payment status & financial totals
        const allPayments = await Payment.find({ bookingId: booking._id }).lean();
        const { reconcileBookingPayments } = require('../../utils/financialReconciliation');
        const reconciled = reconcileBookingPayments(booking, allPayments);

        booking.paymentStatus = reconciled.isFullyPaid ? 'Paid' : (reconciled.paidAmount > 0 ? 'Partial' : 'Pending');
        booking.commission = reconciled.commission;
        booking.commissionRate = commissionRate;
        booking.commissionRatePercent = commissionRatePercent;
        booking.commissionBasis = commissionBasis;
        booking.commissionConfigSource = commissionConfigSource;
        booking.vendorEarning = reconciled.vendorEarning;
        booking.settlementStatus = booking.settlementStatus || 'Pending';
        await booking.save();

        // 1. Immutable Financial Ledger Entries
        await FinancialLedger.create([
            {
                entryType: 'CUSTOMER_PAYMENT',
                direction: 'CREDIT',
                amount: paymentAmount,
                currency: 'INR',
                referenceId: razorpay_payment_id,
                bookingId: booking._id,
                paymentId: payment._id,
                vendorId: booking.vendorId,
                userId: req.user._id,
                status: 'POSTED',
                description: `Customer payment of ₹${paymentAmount.toLocaleString('en-IN')} received for Booking #${booking._id}`
            },
            {
                entryType: 'PLATFORM_COMMISSION',
                direction: 'CREDIT',
                amount: commissionAmount,
                currency: 'INR',
                referenceId: razorpay_payment_id,
                bookingId: booking._id,
                paymentId: payment._id,
                vendorId: booking.vendorId,
                userId: req.user._id,
                status: 'POSTED',
                description: `Platform fee (${(commissionRate * 100).toFixed(0)}%) for Booking #${booking._id}`
            },
            {
                entryType: 'VENDOR_EARNING',
                direction: 'CREDIT',
                amount: vendorEarning,
                currency: 'INR',
                referenceId: razorpay_payment_id,
                bookingId: booking._id,
                paymentId: payment._id,
                vendorId: booking.vendorId,
                userId: req.user._id,
                status: 'POSTED',
                description: `Vendor pending earning for Booking #${booking._id}`
            }
        ]);

        // 2. Atomic Vendor Wallet Update (Recorded in pendingBalance until booking completion)
        await VendorWallet.findOneAndUpdate(
            { vendorId: booking.vendorId },
            {
                $inc: {
                    pendingBalance: vendorEarning,
                    totalEarned: vendorEarning,
                    totalCommission: commissionAmount
                }
            },
            { upsert: true, new: true }
        );

        // Notify Vendor
        await Notification.create({
            vendorId: booking.vendorId,
            message: `Payment of ₹${(booking.totalPrice || 0).toLocaleString()} received for booking by ${booking.customerName}!`,
            type: 'Booking',
            isRead: false
        });

        // Notify User & Record Activity (Non-blocking)
        try {
            const { notifyAndLogActivity } = require('../../services/notification.service');
            await notifyAndLogActivity({
                userId: req.user._id,
                notificationTitle: 'Payment Successful',
                notificationMessage: `Payment of ₹${(payment.amount || 0).toLocaleString()} for your wedding booking was successful.`,
                notificationType: 'payment',
                activityType: 'payment_success',
                activityTitle: 'Payment Successful',
                activityMessage: `Paid ₹${(payment.amount || 0).toLocaleString()} via ${payment.paymentMethod || 'Razorpay'}.`,
                entityType: 'Payment',
                entityId: payment._id,
                eventKey: `payment_success_${payment._id}`
            });
        } catch (notifErr) {}

        res.status(200).json({
            success: true,
            message: 'Payment verified and recorded successfully',
            data: {
                payment,
                booking
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user's real payment history
// @route   GET /api/user/payments
// @access  Private (User)
exports.getUserPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({ userId: req.user._id })
            .populate('vendorId', 'businessName city profileImage phone')
            .populate('bookingId', 'eventDate location services totalPrice status paymentStatus')
            .sort('-createdAt')
            .lean();

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single user payment details
// @route   GET /api/user/payments/:id
// @access  Private (User)
exports.getUserPaymentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid payment ID' });
        }

        const payment = await Payment.findOne({ _id: id, userId: req.user._id })
            .populate('vendorId', 'businessName city profileImage phone category')
            .populate('bookingId', 'eventDate location services totalPrice status paymentStatus customerName eventType')
            .lean();

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get official payment receipt
// @route   GET /api/user/payments/:id/receipt or GET /api/user/bookings/:id/receipt
// @access  Private (User)
exports.getPaymentReceipt = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid ID' });
        }

        // Try lookup by paymentId or bookingId
        let payment = await Payment.findOne({
            $or: [
                { _id: id, userId: req.user._id },
                { bookingId: id, userId: req.user._id }
            ],
            status: { $in: ['Completed', 'Paid'] }
        })
        .populate('vendorId', 'businessName city phone email category')
        .populate('bookingId', 'eventDate location eventType services guestCount totalPrice customerName')
        .lean();

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Receipt not found for this completed payment'
            });
        }

        const user = await User.findById(req.user._id).select('fullName name email phone').lean();

        const receipt = {
            receiptNumber: `RCP-${payment._id.toString().slice(-8).toUpperCase()}`,
            issuedAt: payment.updatedAt || payment.createdAt,
            platform: {
                name: 'Utsavo / WedMeGood',
                legalEntity: 'WedMeGood Event Tech Pvt. Ltd.',
                supportEmail: 'support@wedmegood.com',
                currency: payment.currency || 'INR'
            },
            customer: {
                name: user?.name || user?.fullName || payment.bookingId?.customerName || 'Customer',
                email: user?.email || '',
                phone: user?.phone || ''
            },
            vendor: {
                businessName: payment.vendorId?.businessName || 'Verified Partner',
                city: payment.vendorId?.city || '',
                category: payment.vendorId?.category || 'Wedding Vendor',
                phone: payment.vendorId?.phone || ''
            },
            booking: {
                bookingId: payment.bookingId?._id,
                totalPrice: payment.bookingId?.totalPrice || payment.amount,
                eventDate: payment.bookingId?.eventDate,
                location: payment.bookingId?.location,
                eventType: payment.bookingId?.eventType,
                services: payment.bookingId?.services || [],
                customerName: payment.bookingId?.customerName
            },
            payment: {
                paymentId: payment._id,
                transactionId: payment.razorpayPaymentId || payment.razorpayOrderId,
                orderId: payment.razorpayOrderId,
                paymentMethod: payment.paymentMethod || 'Razorpay',
                status: 'Paid',
                amount: payment.amount,
                currency: payment.currency || 'INR'
            }
        };

        res.status(200).json({
            success: true,
            data: receipt
        });
    } catch (err) {
        next(err);
    }
};
