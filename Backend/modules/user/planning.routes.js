const express = require('express');
const { protect } = require('./auth.middleware');

const budgetController = require('./budget.controller');
const checklistController = require('./checklist.controller');
const guestController = require('./guest.controller');
const timelineController = require('./timeline.controller');
const favoriteController = require('./favorite.controller');
const inspirationController = require('./inspiration.controller');
const vendorManagementController = require('./vendorManagement.controller');
const familyController = require('./family.controller');
const inviteController = require('./invite.controller');
const complaintController = require('./complaint.controller');
const planningDashboardController = require('./planningDashboard.controller');

const router = express.Router();

// All planning routes require authenticated user
router.use(protect);

// 1. Budget
router.get('/budget', budgetController.getBudget);
router.put('/budget', budgetController.updateBudget);

// 2. Checklist
router.get('/checklist', checklistController.getChecklist);
router.post('/checklist', checklistController.createChecklistTask);
router.put('/checklist/:id', checklistController.updateChecklistTask);
router.patch('/checklist/:id/toggle', checklistController.toggleChecklistTask);
router.delete('/checklist/:id', checklistController.deleteChecklistTask);
router.post('/checklist/reset', checklistController.resetChecklist);

// 3. Guests
router.get('/guests', guestController.getGuests);
router.post('/guests', guestController.createGuest);
router.put('/guests/:id', guestController.updateGuest);
router.patch('/guests/:id/rsvp', guestController.updateGuestRSVP);
router.delete('/guests/:id', guestController.deleteGuest);

// 4. Timeline
router.get('/timeline', timelineController.getTimeline);
router.post('/timeline', timelineController.createTimelineEvent);
router.put('/timeline/:id', timelineController.updateTimelineEvent);
router.delete('/timeline/:id', timelineController.deleteTimelineEvent);

// 5. Canonical Favorites / Shortlist
router.get('/favorites', favoriteController.getFavorites);
router.post('/favorites', favoriteController.addFavorite);
router.post('/favorites/:vendorId', favoriteController.addFavorite);
router.delete('/favorites/:vendorId', favoriteController.removeFavorite);
router.get('/favorites/check/:vendorId', favoriteController.checkFavorite);

// 6. Inspiration Board & Gallery
router.get('/inspiration', inspirationController.getInspirations);
router.post('/inspiration', inspirationController.saveInspiration);
router.delete('/inspiration/:id', inspirationController.deleteInspiration);
router.get('/inspiration-gallery', inspirationController.getInspirationGallery);

// 7. Vendor Management (aggregated from Phase 1 models)
router.get('/vendor-management', vendorManagementController.getVendorManagement);

const { verifyAcceptedFamilyMember, verifyGroupAdminOrOwner } = require('../../middleware/familyGroupAuth.middleware');
const { familyUpload } = require('../../utils/cloudinary');

const handleFamilyAttachmentUpload = (req, res, next) => {
  familyUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds maximum allowed limit (50MB)'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file upload'
      });
    }
    next();
  });
};

// 8. Family Collaboration (Groups)
router.get('/family-groups', familyController.getFamilyGroups);
router.get('/family-groups/invitations/pending', familyController.getPendingInvitations);
router.post('/family-groups/join/:token', familyController.joinGroupWithToken);
router.post('/family-groups/join-group/:token', familyController.requestJoinGroupWithToken);
router.get('/family-groups/:id', familyController.getFamilyGroupById);
router.get('/family-groups/:id/messages', familyController.getGroupMessages);
router.post('/family-groups/:id/messages', familyController.sendMessage);
router.post('/family-groups', familyController.createFamilyGroup);
router.put('/family-groups/:id', familyController.updateFamilyGroup);
router.delete('/family-groups/:id', familyController.deleteFamilyGroup);
router.post('/family-groups/:id/members', familyController.inviteMember);
router.post('/family-groups/:id/members/:memberId/share-link', familyController.getOrRefreshMemberInviteLink);
router.delete('/family-groups/:id/invitations/:memberId/revoke', familyController.revokeInvitation);
router.put('/family-groups/:id/invitations/respond', familyController.respondInvitation);
router.post('/family-groups/:id/invitations/respond', familyController.respondInvitation);
router.delete('/family-groups/:id/members/:memberId', familyController.removeMember);
router.get('/family-groups/:id/shared-data', familyController.getSharedPlanningData);

// General Group Invite & Join Request Approval Routes
router.post('/family-groups/:id/group-invite/share-link', verifyGroupAdminOrOwner, familyController.getOrRefreshGroupInviteLink);
router.delete('/family-groups/:id/group-invite/revoke', verifyGroupAdminOrOwner, familyController.revokeGroupInviteLink);
router.get('/family-groups/:id/join-requests', verifyGroupAdminOrOwner, familyController.getJoinRequests);
router.put('/family-groups/:id/join-requests/:memberId', verifyGroupAdminOrOwner, familyController.respondJoinRequest);

// Pre-Authorized Attachment Upload & Protected Gateway
router.post(
  '/family-groups/:id/attachments',
  verifyAcceptedFamilyMember,
  handleFamilyAttachmentUpload,
  familyController.uploadFamilyAttachment
);
router.get(
  '/family-groups/:id/attachments/:messageId/:attachmentIndex?',
  verifyAcceptedFamilyMember,
  familyController.getPrivateAttachment
);

// 9. E-Invites (Owner Management)
router.get('/invites', inviteController.getInvites);
router.get('/invites/:id', inviteController.getInviteById);
router.post('/invites', inviteController.createInvite);
router.put('/invites/:id', inviteController.updateInvite);
router.delete('/invites/:id', inviteController.deleteInvite);

// 10. Vendor Complaint / Report
router.post('/complaints', complaintController.createComplaint);
router.get('/complaints', complaintController.getUserComplaints);
router.get('/complaints/:id', complaintController.getComplaintById);

// 11. Dashboard & Calendar (Phase 7)
router.get('/dashboard-summary', planningDashboardController.getDashboardSummary);
router.get('/calendar', planningDashboardController.getPlanningCalendar);
router.get('/planning-summary', planningDashboardController.getPlanningDashboardSummary);
router.get('/weather', planningDashboardController.getWeather);

// 12. User Notifications & Activities (Phase 7)
const notificationController = require('./notification.controller');
router.get('/notifications', notificationController.getUserNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadNotificationCount);
router.put('/notifications/read-all', notificationController.markAllNotificationsRead);
router.put('/notifications/:id/read', notificationController.markNotificationRead);
router.get('/activities', notificationController.getUserActivities);

module.exports = router;

