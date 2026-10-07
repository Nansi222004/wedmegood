const express = require('express');
const { protect } = require('./auth.middleware');
const {
    createLead,
    getUserLeads,
    getUserLeadById,
    getAssignedVendor
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

// Auto-assigned vendor for a category
router.get('/vendors/assigned', getAssignedVendor);

// Quote routes
router.get('/quotes', getUserQuotes);
router.get('/quotes/:id', getUserQuoteById);
// Users can view quotations in the app but not download them
router.get('/quotes/:id/pdf', (req, res) => res.status(403).json({
    success: false,
    message: 'Quotations can be viewed in the app but not downloaded'
}));
router.put('/quotes/:id/accept', acceptQuote);
router.put('/quotes/:id/reject', rejectQuote);

// Booking routes
router.get('/bookings', getUserBookings);
router.get('/bookings/:id', getUserBookingById);
router.put('/bookings/:id/cancel', cancelBooking);

// Payment routes
// Booking payments are no longer taken in the app (taxation): the customer pays the vendor directly
// and the vendor records it on the booking. Verifying orders created before this change still works.
router.post('/payments/create-order', (req, res) => res.status(403).json({
    success: false,
    code: 'ONLINE_BOOKING_PAYMENTS_DISABLED',
    message: 'Payments are made directly to the vendor. The vendor will record the amount you pay on your booking.'
}));
router.post('/payments/verify', verifyPayment);
router.get('/payments', getUserPayments);
router.get('/payments/:id', getUserPaymentById);
router.get('/payments/:id/receipt', getPaymentReceipt);
router.get('/bookings/:id/receipt', getPaymentReceipt);

// Review routes
router.post('/reviews', createReview);
router.get('/reviews', getUserReviews);

// Weather Forecast Route (Real Open-Meteo Geocoded Forecast)
const { getWeatherForDate } = require('../../services/weather.service');
router.get('/weather-forecast', async (req, res, next) => {
    try {
        const { date, location, venueType } = req.query;
        const targetCity = location || req.user?.city || '';
        const forecast = await getWeatherForDate(targetCity, date, venueType || 'Not Specified');
        res.status(200).json({
            success: true,
            data: forecast
        });
    } catch (err) {
        next(err);
    }
});
router.get('/reviews/eligible-bookings', getEligibleReviewBookings);

module.exports = router;
