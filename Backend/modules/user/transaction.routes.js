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

// Private reference photos (no public links; streamed to the owner and the assigned vendor only)
const { referencePhotoUpload } = require('../../utils/cloudinary');
const referencePhotos = require('./referencePhoto.controller');
router.post('/reference-photos', (req, res, next) => referencePhotoUpload.array('photos', 10)(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be under 10 MB' : err.message });
    next();
}), referencePhotos.uploadReferencePhotos);
router.get('/reference-photos/:id', referencePhotos.getReferencePhoto);
router.delete('/reference-photos/:id', referencePhotos.deleteReferencePhoto);

// The vendor's preparation for a booked event, and change requests to approve
const eventCustomer = require('../operations/customer.controller');
router.get('/events/:bookingId', eventCustomer.getMyEvent);
router.post('/events/:bookingId/change-requests/:crId', eventCustomer.respondChangeRequest);

// Event requirements: one enquiry, one lead per service, dispatched to vendors
const enquiry = require('./enquiry.controller');
router.get('/pincode/:pincode', enquiry.lookupPincode);
router.get('/enquiries/options', enquiry.getEnquiryOptions);
router.post('/enquiries', enquiry.createEnquiry);
router.get('/enquiries', enquiry.getMyEnquiries);
router.get('/enquiries/:id', enquiry.getEnquiry);
router.post('/enquiries/:id/cancel', enquiry.cancelEnquiry);
router.put('/enquiries/:id/services/:leadId', enquiry.updateServiceDetails);
router.post('/enquiries/:id/services/:leadId/decline', enquiry.declineVendor);
router.get('/enquiries/:id/services/:leadId/alternatives', enquiry.getAlternatives);
router.post('/enquiries/:id/services/:leadId/select', enquiry.selectVendor);
router.post('/enquiries/:id/services/:leadId/widen', enquiry.widenSearch);
router.post('/enquiries/:id/services/:leadId/cancel', enquiry.cancelService);

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
router.put('/quotes/:id/request-revision', require('./quote.controller').requestRevision);

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
