/**
 * Canonical Financial Reconciliation Engine for Bookings, Payments, and Settlements
 *
 * Source of Truth Principles:
 * - Agreed package total: Booking.totalPrice (derived strictly from accepted quote or booking agreement)
 * - Customer paid funds: Net sum of verified payments (status 'Completed', 'Paid', or 'PartiallyRefunded' minus refunds)
 * - Refunds: Actual persisted refund amounts across payment transactions and booking cancellation records
 * - Outstanding balance: Server-side calculation from packageTotal minus verified net payments (0 for cancelled)
 * - Platform commission: Derived strictly from persisted historical record or authoritative Admin PlatformSettings
 * - Vendor net earnings: Derived strictly from gross agreed amount minus applicable platform commission
 * - Vendor amount settled: Actual funds disbursed via completed settlement/payout
 * - Escrow-held amount: Actual funds held pending event completion and settlement eligibility
 * - Discrepancy detection: Identifies any disagreement between database status and actual verified ledger
 */

/**
 * Reconcile a booking with its payment records and active configuration.
 *
 * @param {Object} booking - Raw or lean Booking document
 * @param {Array<Object>} paymentsList - List of Payment documents associated with the booking
 * @param {Object} [options] - Optional active commission config or settlement data
 * @returns {Object} Enriched canonical financial reconciliation details
 */
function reconcileBookingPayments(booking, paymentsList = [], options = {}) {
    if (!booking) {
        return {
            packageTotal: 0,
            paidAmount: 0,
            totalRefunded: 0,
            outstandingBalance: 0,
            commission: 0,
            commissionRatePercent: null,
            commissionBasis: 'UNCONFIGURED',
            commissionConfigSource: 'UNCONFIGURED',
            vendorEarning: 0,
            vendorAmountSettled: 0,
            escrowHeldAmount: 0,
            escrowStatus: 'Awaiting Customer Payment',
            settlementStatus: 'Pending',
            isFullyPaid: false,
            hasDiscrepancy: true,
            discrepancyNote: 'Booking record not provided',
            payments: []
        };
    }

    const bookingIdStr = booking._id ? booking._id.toString() : '';
    const bookingPayments = paymentsList.filter(
        p => p.bookingId && p.bookingId.toString() === bookingIdStr
    );

    // Deduplicate valid payments by razorpayPaymentId (or distinct _id if offline/direct)
    const seenTxns = new Set();
    const verifiedPayments = [];
    let totalRefunded = 0;

    for (const p of bookingPayments) {
        const refundOnPayment = Number(p.refundAmount) || 0;
        totalRefunded += refundOnPayment;

        if (p.status === 'Completed' || p.status === 'Paid' || p.status === 'PartiallyRefunded' || p.status === 'Refunded') {
            const key = p.razorpayPaymentId ? `rp_${p.razorpayPaymentId}` : `id_${p._id ? p._id.toString() : Math.random()}`;
            if (!seenTxns.has(key)) {
                seenTxns.add(key);
                verifiedPayments.push(p);
            }
        }
    }

    // Add booking-level refund if recorded and not duplicated
    if (booking.refundAmount && Number(booking.refundAmount) > totalRefunded) {
        totalRefunded = Number(booking.refundAmount);
    }

    const packageTotal = Math.max(0, Number(booking.totalPrice) || 0);

    // Gross customer payments verified from gateway records
    const verifiedGrossPaid = verifiedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    // Sum net customer payments (gross minus transaction-specific refund)
    const netCustomerFundsRetained = Math.max(0, Math.round((verifiedGrossPaid - totalRefunded) * 100) / 100);
    const customerPaidAmount = netCustomerFundsRetained;
    const remainingRefundableAmount = netCustomerFundsRetained;

    // Outstanding balance due from customer (0 if cancelled, since booking obligation terminates)
    const isCancelled = booking.status === 'Cancelled';
    const rawOutstanding = Math.max(0, Math.round((packageTotal - netCustomerFundsRetained) * 100) / 100);
    const outstandingBalance = isCancelled ? 0 : rawOutstanding;

    // Commission Resolution:
    // 1. Preserved historical rate on booking
    // 2. Persisted rate on successful payments
    // 3. Active configuration from options.activeConfig
    // 4. Unconfigured flag (never invent 10%)
    let commission = typeof booking.commission === 'number' ? booking.commission : null;
    let commissionRatePercent = typeof booking.commissionRatePercent === 'number' ? booking.commissionRatePercent : null;
    let commissionBasis = booking.commissionBasis || 'GROSS_PACKAGE_AMOUNT';
    let commissionConfigSource = booking.commissionConfigSource || null;

    let snapshotMismatch = false;
    let paymentRateDetected = null;

    if (verifiedPayments.length > 0) {
        const firstWithRate = verifiedPayments.find(p => typeof p.commissionRatePercent === 'number' || typeof p.commissionRate === 'number');
        if (firstWithRate) {
            paymentRateDetected = typeof firstWithRate.commissionRatePercent === 'number'
                ? firstWithRate.commissionRatePercent
                : (firstWithRate.commissionRate <= 1 ? Math.round(firstWithRate.commissionRate * 100) : firstWithRate.commissionRate);
            
            if (commissionRatePercent !== null && paymentRateDetected !== null && commissionRatePercent !== paymentRateDetected) {
                snapshotMismatch = true;
            }

            if (commissionRatePercent === null) {
                commissionRatePercent = paymentRateDetected;
                commissionConfigSource = firstWithRate.commissionConfigSource || 'PAYMENT_RECORD';
            }
        }
    }

    if (commission === null || commission === 0) {
        const paymentCommissions = verifiedPayments.reduce((acc, p) => acc + (Number(p.commissionAmount) || 0), 0);
        if (paymentCommissions > 0) {
            commission = paymentCommissions;
        }
    }

    // If still null/unconfigured, check active config from options
    let commissionUnconfigured = false;
    if (commission === null && commissionRatePercent === null) {
        if (options.activeConfig && options.activeConfig.isConfigured && typeof options.activeConfig.ratePercent === 'number') {
            commissionRatePercent = options.activeConfig.ratePercent;
            commissionBasis = options.activeConfig.basis || 'GROSS_PACKAGE_AMOUNT';
            commissionConfigSource = options.activeConfig.source || 'DATABASE_PLATFORM_SETTINGS';
            commission = Math.round(packageTotal * (commissionRatePercent / 100) * 100) / 100;
        } else if (packageTotal > 0) {
            commissionUnconfigured = true;
        }
    } else if (commissionRatePercent !== null && (commission === null || commission === 0) && packageTotal > 0) {
        commission = Math.round(packageTotal * (commissionRatePercent / 100) * 100) / 100;
    } else if (commissionRatePercent === null && packageTotal > 0 && typeof commission === 'number' && commission > 0) {
        commissionRatePercent = Math.round((commission / packageTotal) * 100);
    }

    // Proportional commission on retained funds vs reversed
    const commissionRetained = commissionRatePercent !== null
        ? Math.round(netCustomerFundsRetained * (commissionRatePercent / 100) * 100) / 100
        : 0;
    const commissionReversed = commissionRatePercent !== null
        ? Math.round(totalRefunded * (commissionRatePercent / 100) * 100) / 100
        : 0;

    // Vendor Net Earnings & Entitlement
    let vendorEarning = typeof booking.vendorEarning === 'number' && booking.vendorEarning > 0
        ? booking.vendorEarning
        : (typeof commission === 'number' ? Math.max(0, Math.round((packageTotal - commission) * 100) / 100) : null);

    // If cancelled, vendor entitlement cannot exceed net retained customer funds minus commission
    const vendorEntitlement = isCancelled
        ? Math.max(0, Math.round((netCustomerFundsRetained - commissionRetained) * 100) / 100)
        : (vendorEarning || 0);

    // Vendor Amount Settled (actual completed payout to vendor)
    const settlementStatus = booking.settlementStatus || (isCancelled && totalRefunded > 0 ? 'Refunded' : 'Pending');
    let vendorAmountSettled = 0;
    if (settlementStatus === 'Settled' && vendorEarning !== null) {
        vendorAmountSettled = vendorEarning;
    }

    // Escrow Held Amount & Status:
    // Escrow is customer funds currently held safely pending event completion and vendor payout
    let escrowHeldAmount = 0;
    let escrowStatus = 'Awaiting Customer Payment';

    if (isCancelled) {
        escrowHeldAmount = 0;
        if (totalRefunded >= verifiedGrossPaid && verifiedGrossPaid > 0) {
            escrowStatus = 'Fully Refunded & Closed';
        } else if (netCustomerFundsRetained > 0) {
            escrowStatus = 'Cancelled (Funds Retained Pending Refund Resolution)';
        } else {
            escrowStatus = 'Cancelled (No Funds Collected)';
        }
    } else if (settlementStatus === 'Settled') {
        escrowHeldAmount = 0;
        escrowStatus = 'Settled & Released to Vendor';
    } else if (netCustomerFundsRetained > 0) {
        escrowHeldAmount = netCustomerFundsRetained;
        escrowStatus = netCustomerFundsRetained >= packageTotal 
            ? 'Held in Escrow (Fully Protected)' 
            : 'Held in Escrow (Partial Deposit)';
    }

    const allocatedFundsAmount = escrowHeldAmount;

    // Discrepancy Diagnostics
    let hasDiscrepancy = false;
    let discrepancyNote = null;
    const discrepancyReasons = [];

    if (booking.paymentStatus === 'Paid' && netCustomerFundsRetained < packageTotal && !isCancelled) {
        hasDiscrepancy = true;
        const msg = `Booking is marked 'Paid' in database but verified payments (₹${netCustomerFundsRetained.toLocaleString('en-IN')}) do not cover the package total (₹${packageTotal.toLocaleString('en-IN')}).`;
        discrepancyReasons.push(msg);
        discrepancyNote = msg;
    } else if (booking.paymentStatus === 'Pending' && netCustomerFundsRetained >= packageTotal && packageTotal > 0) {
        hasDiscrepancy = true;
        const msg = `Booking is marked 'Pending' but ₹${netCustomerFundsRetained.toLocaleString('en-IN')} in verified payments was found.`;
        discrepancyReasons.push(msg);
        discrepancyNote = msg;
    }

    if (verifiedGrossPaid > packageTotal && packageTotal > 0) {
        hasDiscrepancy = true;
        const msg = `Verified customer payments (₹${verifiedGrossPaid.toLocaleString('en-IN')}) exceed the agreed package total (₹${packageTotal.toLocaleString('en-IN')}). Overpayment flagged for review.`;
        discrepancyReasons.push(msg);
        discrepancyNote = msg;
    }

    if (commissionUnconfigured) {
        hasDiscrepancy = true;
        const msg = 'Platform commission rate is unconfigured in Admin Settings. Commission amount cannot be calculated.';
        discrepancyReasons.push(msg);
        discrepancyNote = msg;
    }

    if (snapshotMismatch) {
        hasDiscrepancy = true;
        const msg = `Commission snapshot mismatch: Booking has ${commissionRatePercent}% while payment record has ${paymentRateDetected}%.`;
        discrepancyReasons.push(msg);
        discrepancyNote = msg;
    }

    if (vendorAmountSettled > (vendorEarning || 0) && (vendorEarning || 0) > 0) {
        hasDiscrepancy = true;
        const msg = `Settled payout amount (₹${vendorAmountSettled}) exceeds vendor net entitlement (₹${vendorEarning}).`;
        discrepancyReasons.push(msg);
        discrepancyNote = msg;
    }

    // Ledger cross-verification if options.ledgerEntries passed
    if (Array.isArray(options.ledgerEntries) && options.ledgerEntries.length > 0) {
        const ledgerPayments = options.ledgerEntries
            .filter(e => e.entryType === 'CUSTOMER_PAYMENT' && e.direction === 'CREDIT')
            .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
        if (Math.abs(ledgerPayments - verifiedGrossPaid) > 0.01) {
            hasDiscrepancy = true;
            const msg = `Ledger entries (₹${ledgerPayments}) do not match verified customer payments (₹${verifiedGrossPaid}).`;
            discrepancyReasons.push(msg);
            discrepancyNote = msg;
        }
    }

    const isFullyPaid = netCustomerFundsRetained >= packageTotal && packageTotal > 0;

    return {
        packageTotal,
        agreedPackageTotal: packageTotal,
        paidAmount: customerPaidAmount,
        verifiedCustomerPayments: verifiedGrossPaid,
        totalRefunded,
        refundAmountCompleted: totalRefunded,
        refundAmountPending: 0,
        netCustomerFundsRetained,
        remainingRefundableAmount,
        outstandingBalance,
        commission: typeof commission === 'number' ? commission : 0,
        commissionRetained,
        commissionReversed,
        commissionRatePercent,
        commissionBasis,
        commissionConfigSource,
        commissionUnconfigured,
        vendorEarning: typeof vendorEarning === 'number' ? vendorEarning : 0,
        vendorEntitlement,
        vendorAmountSettled,
        allocatedFundsAmount,
        escrowHeldAmount,
        custodyType: 'Calculated / Allocated Platform Custody',
        custodyStatus: escrowStatus,
        escrowStatus,
        settlementStatus,
        isFullyPaid,
        hasDiscrepancy,
        discrepancyNote,
        discrepancyReasons,
        payments: bookingPayments.map(p => ({
            _id: p._id,
            amount: p.amount,
            currency: p.currency || 'INR',
            status: p.status,
            refundAmount: p.refundAmount || 0,
            refundedAt: p.refundedAt || null,
            paymentMethod: p.paymentMethod || 'Razorpay',
            razorpayPaymentId: p.razorpayPaymentId || null,
            razorpayOrderId: p.razorpayOrderId || null,
            createdAt: p.createdAt,
            commissionRatePercent: p.commissionRatePercent || null,
            commissionAmount: p.commissionAmount || 0,
            vendorEarning: p.vendorEarning || 0
        }))
    };
}

module.exports = {
    reconcileBookingPayments
};
