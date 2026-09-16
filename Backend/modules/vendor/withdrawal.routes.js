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

router.use(protectVendor);

router.get('/earnings', getVendorEarnings);
router.get('/transactions', getVendorTransactions);
router.get('/withdrawals', getVendorWithdrawals);
router.post('/withdrawals', requestWithdrawal);
router.get('/withdrawals/:id', getVendorWithdrawalById);

module.exports = router;
