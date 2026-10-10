const express = require('express');
const { protectVendor } = require('../../middleware/auth.middleware');
const {
    getVendorEarnings,
    getVendorTransactions,
    getVendorWithdrawals,
    getVendorWithdrawalById,
    requestWithdrawal
} = require('./withdrawal.controller');

const router = express.Router();

// Auth is applied per route: this router is mounted at '/', so a router-level guard would
// also intercept every route registered after it (including public ones like /subscription/plans)
router.get('/earnings', protectVendor, getVendorEarnings);
router.get('/transactions', protectVendor, getVendorTransactions);
router.get('/withdrawals', protectVendor, getVendorWithdrawals);
router.post('/withdrawals', protectVendor, requestWithdrawal);
router.get('/withdrawals/:id', protectVendor, getVendorWithdrawalById);

module.exports = router;
