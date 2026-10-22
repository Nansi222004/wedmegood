const express = require('express');
const {
    getAllVendors,
    updateVendorStatus,
    toggleVendorActive,
    updateVendorFeatured,
    getStats,
    getDashboardSummary,
    getAllSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    getAllCategories,
    getAllCategoriesAdmin,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllReviews,
    updateReviewStatus,
    deleteReview,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    getAllLogs,
    getAuditLogs,
    clearLogs,
    getProfile,
    updateProfile,
    changePassword,
    getAllBookings,
    getAnalytics,
    getPayments,
    deleteVendor,
    deleteUser,
    getAllUsers,
    getUserById,
    updateUserStatus,
    getVendorLedger,
    getPolicy,
    updatePolicy,
    getAllTickets,
    updateTicketStatus,
    replyToTicket,
    deleteTicket,
    getAllFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    getSupportConfig,
    updateSupportConfig,
    getVendorsWithServices,
    toggleServiceActive,
    getAllSubCategories,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getAllFormTemplates,
    createFormTemplate,
    updateFormTemplate,
    deleteFormTemplate,
    getAllVendorServices,
    updateVendorServiceStatus,
    getAllVendorInventories,
    getAllLeads,
    getAllQuotes,
    getAllComplaints,
    updateComplaintStatus,
    getChatReports,
    getChatReportById,
    updateChatReportStatus,
    getPlatformSettings,
    updatePlatformSettings
} = require('./adminController');
const router = express.Router();

const { protect, authorize } = require('../../middleware/auth.middleware');
const { upload } = require('../../utils/cloudinary');

// Public Category Route (for vendor registration)
// Public Support Routes
router.get('/categories', getAllCategories);
router.get('/subcategories', getAllSubCategories);
router.get('/form-templates', getAllFormTemplates);
router.get('/faqs', getAllFAQs);
router.get('/support-config', getSupportConfig);

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

// Admin Dashboard Summary
router.get('/dashboard/summary', getDashboardSummary);
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);

// Admin User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Admin Vendor Management
router.get('/vendors', getAllVendors);
router.get('/vendors-services', getVendorsWithServices);
router.put('/vendors/:id/status', updateVendorStatus);
router.put('/vendors/:id/active', toggleVendorActive);
router.put('/vendors/:id/featured', updateVendorFeatured);
router.delete('/vendors/:id', deleteVendor);
router.put('/services/:id/active', toggleServiceActive);

// Admin Marketplace: Leads, Quotes, Bookings
router.get('/leads', getAllLeads);
router.get('/quotes', getAllQuotes);
router.get('/bookings', getAllBookings);
router.get('/vendor-ledger', getVendorLedger);
router.get('/payments', getPayments);

// Admin Subscriptions
router.get('/subscription-plans', getAllSubscriptionPlans);
router.post('/subscription-plans', createSubscriptionPlan);
router.put('/subscription-plans/:id', updateSubscriptionPlan);
router.delete('/subscription-plans/:id', deleteSubscriptionPlan);

// Admin Category Management
router.get('/categories/all', getAllCategoriesAdmin);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Admin SubCategory Management
router.post('/subcategories', createSubCategory);
router.put('/subcategories/:id', updateSubCategory);
router.delete('/subcategories/:id', deleteSubCategory);

// Admin FormTemplate Management
router.post('/form-templates', createFormTemplate);
router.put('/form-templates/:id', updateFormTemplate);
router.delete('/form-templates/:id', deleteFormTemplate);

// Admin VendorService Approval Management
router.get('/vendor-services', getAllVendorServices);
router.put('/vendor-services/:id/status', updateVendorServiceStatus);

// Admin Vendor Inventory Viewer
router.get('/vendor-inventory', getAllVendorInventories);

// Admin Review Management
router.get('/reviews', getAllReviews);
router.put('/reviews/:id/status', updateReviewStatus);
router.delete('/reviews/:id', deleteReview);

// Admin Complaint Management
router.get('/complaints', getAllComplaints);
router.put('/complaints/:id/status', updateComplaintStatus);
router.post('/complaints/:id/appeal-decision', require('./adminController').decideComplaintAppeal);
const customerReportsAdmin = require('../vendor/customerReport.controller');
router.get('/customer-reports', customerReportsAdmin.adminList);
router.post('/customer-reports/:id/decide', customerReportsAdmin.adminDecide);

// Admin Chat Report Moderation
router.get('/chat-reports', getChatReports);
router.get('/chat-reports/:id', getChatReportById);
router.put('/chat-reports/:id/status', updateChatReportStatus);
router.patch('/chat-reports/:id/status', updateChatReportStatus);

// Admin Platform Settings
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

// Admin Banner Management
router.get('/banners', getAllBanners);
router.post('/banners', upload.single('image'), createBanner);
router.put('/banners/:id', upload.single('image'), updateBanner);
router.delete('/banners/:id', deleteBanner);

// Admin Audit Logs
router.get('/logs', getAllLogs);
router.get('/audit-logs', getAuditLogs);
router.delete('/logs', clearLogs);

// Admin Profile Management
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/password', changePassword);

// Admin Legal Policy Management
router.get('/policies/:type', getPolicy);
router.put('/policies/:type', updatePolicy);

// Admin Support Ticket Management
router.get('/tickets', getAllTickets);
router.put('/tickets/:id/status', updateTicketStatus);
router.post('/tickets/:id/reply', replyToTicket);
router.delete('/tickets/:id', deleteTicket);

// Admin FAQ Management
router.post('/faqs', createFAQ);
router.put('/faqs/:id', updateFAQ);
router.delete('/faqs/:id', deleteFAQ);

// Admin Support Config
router.put('/support-config', updateSupportConfig);

// Fake vendor listings (shown to users on the Fake Vendors page)
const fakeVendorController = require('./fakeVendor.controller');
router.get('/fake-vendors', fakeVendorController.getFakeVendorListings);
router.post('/fake-vendors', fakeVendorController.createFakeVendorListing);
router.put('/fake-vendors/:id', fakeVendorController.updateFakeVendorListing);
router.delete('/fake-vendors/:id', fakeVendorController.deleteFakeVendorListing);
router.post('/complaints/:id/mark-fake', fakeVendorController.markComplaintVendorAsFake);

// Requirements and lead dispatch monitoring
const enquiryAdmin = require('./enquiry.controller');
router.get('/enquiries', enquiryAdmin.getEnquiries);
router.get('/lead-distribution', enquiryAdmin.getLeadDistribution);
router.get('/lead-reports', enquiryAdmin.getLeadReports);
router.put('/lead-reports/:id', enquiryAdmin.updateLeadReport);
router.get('/leads/:id/history', enquiryAdmin.getLeadHistory);
router.get('/leads/:id/candidates', enquiryAdmin.getLeadCandidates);
router.post('/leads/:id/redispatch', enquiryAdmin.redispatchLead);
router.post('/leads/:id/assign', enquiryAdmin.assignLeadManually);

// Temporary workforce: ID verification, reviews, disputes
const workforceAdmin = require('../workforce/admin.controller');
router.get('/workforce/workers', workforceAdmin.listWorkers);
router.get('/workforce/workers/:id/id-photo', workforceAdmin.getIdPhoto);
router.post('/workforce/workers/:id/verify', workforceAdmin.verifyWorker);
router.post('/workforce/workers/:id/review', workforceAdmin.reviewWorker);
router.get('/workforce/overview', workforceAdmin.overview);
router.post('/workforce/disputes/:aid/resolve', workforceAdmin.resolveDispute);
const workforceSupport = require('../workforce/support.controller');
router.get('/workforce/safety', workforceSupport.adminListSafety);
router.post('/workforce/safety/:id', workforceSupport.adminUpdateSafety);

// Admin Financial Control & Ledger (Phase 5 Reused)
const financialRoutes = require('./financial.routes');
router.use('/financial', financialRoutes);

module.exports = router;
