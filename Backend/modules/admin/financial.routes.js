const express = require('express');
const { protect, authorize } = require('../../middleware/auth.middleware');
const {
    getFinancialSummary,
    getFinancialTransactions,
    getAdminPayments,
    getAdminWithdrawals,
    updateWithdrawalStatus,
    processRefund,
    getReconciliation
} = require('./financial.controller');

const router = express.Router();

// Strict Admin RBAC protection
router.use(protect);
router.use(authorize('admin'));

router.get('/summary', getFinancialSummary);
router.get('/transactions', getFinancialTransactions);
router.get('/payments', getAdminPayments);
router.get('/withdrawals', getAdminWithdrawals);
router.put('/withdrawals/:id', updateWithdrawalStatus);
router.post('/refund', processRefund);
router.get('/reconciliation', getReconciliation);

module.exports = router;
