const mongoose = require('mongoose');
const VendorWallet = require('./VendorWallet');
const WithdrawalRequest = require('./WithdrawalRequest');
const Vendor = require('./Vendor');
const FinancialLedger = require('../admin/FinancialLedger');

// Helper to ensure vendor wallet exists
async function getOrCreateWallet(vendorId) {
    let wallet = await VendorWallet.findOne({ vendorId });
    if (!wallet) {
        wallet = await VendorWallet.create({
            vendorId,
            availableBalance: 0,
            pendingBalance: 0,
            lockedBalance: 0,
            totalEarned: 0,
            totalCommission: 0,
            totalWithdrawn: 0,
            totalRefunded: 0,
            currency: 'INR'
        });
    }
    return wallet;
}

// @desc    Get detailed vendor earnings and wallet overview
// @route   GET /api/vendor/earnings
// @access  Private (Vendor)
exports.getVendorEarnings = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id;
        const wallet = await getOrCreateWallet(vendorId);

        const recentWithdrawals = await WithdrawalRequest.find({ vendorId })
            .sort('-createdAt')
            .limit(5)
            .lean();

        res.status(200).json({
            success: true,
            data: {
                // Backward-compatible fields for VendorEarnings.jsx
                totalEarnings: wallet.totalEarned,
                pendingPayments: wallet.pendingBalance,
                platformCommission: wallet.totalCommission,
                currency: wallet.currency || 'INR',

                // Complete Phase 5 Canonical Financial fields
                availableBalance: wallet.availableBalance,
                pendingBalance: wallet.pendingBalance,
                lockedBalance: wallet.lockedBalance,
                totalWithdrawn: wallet.totalWithdrawn,
                totalRefunded: wallet.totalRefunded,
                netEarnings: Math.max(0, wallet.totalEarned - wallet.totalCommission),
                recentWithdrawals,
                wallet
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get vendor transaction history from financial ledger
// @route   GET /api/vendor/transactions
// @access  Private (Vendor)
exports.getVendorTransactions = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter = { vendorId };
        if (req.query.entryType) {
            filter.entryType = req.query.entryType;
        }

        const [transactions, total] = await Promise.all([
            FinancialLedger.find(filter)
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

// @desc    Get vendor withdrawal requests
// @route   GET /api/vendor/withdrawals
// @access  Private (Vendor)
exports.getVendorWithdrawals = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id;
        const withdrawals = await WithdrawalRequest.find({ vendorId })
            .sort('-createdAt')
            .lean();

        res.status(200).json({
            success: true,
            count: withdrawals.length,
            data: withdrawals
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single withdrawal request details
// @route   GET /api/vendor/withdrawals/:id
// @access  Private (Vendor)
exports.getVendorWithdrawalById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid withdrawal ID' });
        }

        const withdrawal = await WithdrawalRequest.findOne({
            _id: id,
            vendorId: req.vendor.id
        }).lean();

        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
        }

        res.status(200).json({
            success: true,
            data: withdrawal
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Submit withdrawal request (with atomic double-spend prevention)
// @route   POST /api/vendor/withdrawals
// @access  Private (Vendor)
exports.requestWithdrawal = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id;
        const requestedAmount = Math.round(Number(req.body.amount) * 100) / 100;
        const payoutMethod = req.body.payoutMethod === 'UPI' ? 'UPI' : 'BankTransfer';

        if (!requestedAmount || requestedAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid positive withdrawal amount is required'
            });
        }

        // Fetch vendor bank details
        const vendor = await Vendor.findById(vendorId).select('bank bankDetails businessName');
        const bankData = req.body.bankDetails || vendor?.bank || vendor?.bankDetails;

        if (payoutMethod === 'BankTransfer') {
            if (!bankData?.accountNumber || !bankData?.ifsc) {
                return res.status(400).json({
                    success: false,
                    message: 'Bank account number and IFSC code are required for withdrawal'
                });
            }
        } else if (payoutMethod === 'UPI') {
            if (!bankData?.upiId) {
                return res.status(400).json({
                    success: false,
                    message: 'UPI ID is required for UPI payout'
                });
            }
        }

        // ATOMIC DOUBLE-SPEND SAFEGUARD:
        // Attempt to atomically decrement availableBalance and increment lockedBalance
        // Query condition availableBalance: { $gte: requestedAmount } ensures race-condition immunity
        const updatedWallet = await VendorWallet.findOneAndUpdate(
            {
                vendorId,
                availableBalance: { $gte: requestedAmount }
            },
            {
                $inc: {
                    availableBalance: -requestedAmount,
                    lockedBalance: requestedAmount
                }
            },
            { new: true }
        );

        if (!updatedWallet) {
            // Check current balance to provide clear feedback
            const currentWallet = await getOrCreateWallet(vendorId);
            return res.status(400).json({
                success: false,
                message: `Insufficient available balance. You requested ₹${requestedAmount.toLocaleString()}, but only ₹${(currentWallet.availableBalance || 0).toLocaleString()} is available.`
            });
        }

        // Create Withdrawal Request record
        const withdrawal = await WithdrawalRequest.create({
            vendorId,
            amount: requestedAmount,
            currency: 'INR',
            status: 'Requested',
            payoutMethod,
            bankDetails: {
                accountName: bankData.accountName || vendor?.businessName,
                accountNumber: bankData.accountNumber,
                ifsc: bankData.ifsc,
                upiId: bankData.upiId
            }
        });

        // Record pending debit in FinancialLedger
        await FinancialLedger.create({
            entryType: 'VENDOR_WITHDRAWAL',
            direction: 'DEBIT',
            amount: requestedAmount,
            currency: 'INR',
            referenceId: withdrawal._id.toString(),
            withdrawalId: withdrawal._id,
            vendorId,
            status: 'PENDING',
            description: `Withdrawal request #${withdrawal._id.toString().slice(-6).toUpperCase()} submitted by vendor`
        });

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: {
                withdrawal,
                availableBalance: updatedWallet.availableBalance,
                lockedBalance: updatedWallet.lockedBalance
            }
        });
    } catch (err) {
        next(err);
    }
};
