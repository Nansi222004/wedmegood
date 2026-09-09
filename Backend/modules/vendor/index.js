const express = require('express');
const { upload } = require('../../utils/cloudinary');
const {
    register,
    login,
    sendRegistrationOtp,
    verifyRegistrationOtp,
    updateOnboarding,
    getMe,
    uploadMedia,
    uploadMultipleMedia,
    uploadPublicMedia,
    uploadPublicMultipleMedia,
    getStats,
    getLeads,
    updateLeadStatus,
    getBookings,
    getReviews,
    replyToReview,
    getNotifications,
    markNotificationRead,
    createSubscriptionOrder,
    verifySubscriptionPayment,
    getSubscriptionPlans,
    getEarningsSummary,
    getQuotes,
    createQuote,
    updateQuote,
    deleteQuote,
    getConversations,
    getMessages,
    sendMessage,
    getSupportTickets,
    createSupportTicket,
    deactivateAccount,
    changePassword,

    updateSettings,

    getDashboardBanners,
    updateBookingStatus,
    updatePortfolio,
    createBooking,
    getServices,
    createService,
    updateService,
    deleteService,
    getDynamicVendorServices,
    createDynamicVendorService,
    getProfileProgress,
    uploadMissingDocuments,
    requestApproval
} = require('./vendorController');


const router = express.Router();

const { protectVendor, requireSubscription, requireVendorApproval } = require('../../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendRegistrationOtp);
router.post('/verify-otp', verifyRegistrationOtp);
router.get('/me', protectVendor, getMe);
router.get('/banners', protectVendor, getDashboardBanners);
router.post('/upload', protectVendor, upload.single('file'), uploadMedia);
router.post('/upload-multiple', protectVendor, upload.array('files', 25), uploadMultipleMedia);

// Public upload routes for registration
router.post('/upload/public', upload.single('file'), uploadPublicMedia);
router.post('/upload-multiple/public', upload.array('files', 25), uploadPublicMultipleMedia);
router.put('/onboarding/:step', protectVendor, updateOnboarding);
router.put('/settings', protectVendor, updateSettings);
router.put('/settings/password', protectVendor, changePassword);
router.put('/settings/deactivate', protectVendor, deactivateAccount);


router.put('/portfolio', protectVendor, updatePortfolio);

// Services
router.get('/services', protectVendor, getServices);
router.post('/services', protectVendor, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
]), createService);
router.put('/services/:id', protectVendor, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
]), updateService);
router.delete('/services/:id', protectVendor, deleteService);

// Dynamic Services
router.get('/dynamic-services', protectVendor, getDynamicVendorServices);
router.post('/dynamic-services', protectVendor, upload.fields([
    { name: 'images', maxCount: 15 },
    { name: 'videos', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
]), createDynamicVendorService);

// Stats & Analytics
router.get('/stats', protectVendor, requireSubscription, requireVendorApproval, getStats);
router.get('/earnings', protectVendor, requireSubscription, requireVendorApproval, getEarningsSummary);

// Leads
router.get('/leads', protectVendor, requireSubscription, requireVendorApproval, getLeads);
router.put('/leads/:id', protectVendor, requireSubscription, requireVendorApproval, updateLeadStatus);

// Quotes
router.get('/quotes', protectVendor, requireSubscription, requireVendorApproval, getQuotes);
router.post('/quotes', protectVendor, requireSubscription, requireVendorApproval, createQuote);
router.put('/quotes/:id', protectVendor, requireSubscription, requireVendorApproval, updateQuote);
router.delete('/quotes/:id', protectVendor, requireSubscription, requireVendorApproval, deleteQuote);

// Bookings
router.get('/bookings', protectVendor, requireSubscription, requireVendorApproval, getBookings);
router.post('/bookings', protectVendor, requireSubscription, requireVendorApproval, createBooking);
router.put('/bookings/:id/status', protectVendor, requireSubscription, requireVendorApproval, updateBookingStatus);

// Profile Progress Tracker
router.get('/profile-progress', protectVendor, getProfileProgress);
router.post('/upload-document', protectVendor, uploadMissingDocuments);
router.post('/request-approval', protectVendor, requestApproval);


// Reviews
router.get('/reviews', protectVendor, requireSubscription, requireVendorApproval, getReviews);
router.put('/reviews/:id/reply', protectVendor, requireSubscription, requireVendorApproval, replyToReview);

// Notifications
router.get('/notifications', protectVendor, requireSubscription, requireVendorApproval, getNotifications);
router.put('/notifications/:id/read', protectVendor, requireSubscription, requireVendorApproval, markNotificationRead);

// Chat & Messaging
router.get('/conversations', protectVendor, requireSubscription, requireVendorApproval, getConversations);
router.get('/messages/:conversationId', protectVendor, requireSubscription, requireVendorApproval, getMessages);
router.post('/messages', protectVendor, requireSubscription, requireVendorApproval, sendMessage);

// Support
router.get('/support', protectVendor, requireSubscription, requireVendorApproval, getSupportTickets);
router.post('/support', protectVendor, requireSubscription, requireVendorApproval, createSupportTicket);

// Subscription Payments
router.get('/subscription/plans', protectVendor, getSubscriptionPlans);
router.post('/subscription/order', protectVendor, createSubscriptionOrder);
router.post('/subscription/verify', protectVendor, verifySubscriptionPayment);

module.exports = router;
