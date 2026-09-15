const express = require('express');
const { protect } = require('./auth.middleware');
const {
    createLead,
    getUserLeads,
    getUserLeadById
} = require('./lead.controller');
const {
    getUserQuotes,
    getUserQuoteById,
    acceptQuote,
    rejectQuote
} = require('./quote.controller');
const {
    getUserBookings,
    getUserBookingById,
    cancelBooking
} = require('./booking.controller');
const {
    createPaymentOrder,
    verifyPayment,
    getUserPayments,
    getUserPaymentById,
    getPaymentReceipt
} = require('./payment.controller');
const {
    createReview,
    getUserReviews,
    getEligibleReviewBookings
} = require('./review.controller');

const router = express.Router();

// All user transaction routes are protected
router.use(protect);

// Lead routes
router.post('/leads', createLead);
router.get('/leads', getUserLeads);
router.get('/leads/:id', getUserLeadById);

// Quote routes
router.get('/quotes', getUserQuotes);
router.get('/quotes/:id', getUserQuoteById);
router.put('/quotes/:id/accept', acceptQuote);
router.put('/quotes/:id/reject', rejectQuote);

// Booking routes
router.get('/bookings', getUserBookings);
router.get('/bookings/:id', getUserBookingById);
router.put('/bookings/:id/cancel', cancelBooking);

// Payment routes
router.post('/payments/create-order', createPaymentOrder);
router.post('/payments/verify', verifyPayment);
router.get('/payments', getUserPayments);
router.get('/payments/:id', getUserPaymentById);
router.get('/payments/:id/receipt', getPaymentReceipt);
router.get('/bookings/:id/receipt', getPaymentReceipt);

// Review routes
router.post('/reviews', createReview);
router.get('/reviews', getUserReviews);
router.get('/reviews/eligible-bookings', getEligibleReviewBookings);

module.exports = router;
