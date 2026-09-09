const express = require('express');
const { body } = require('express-validator');
const userController = require('./user.controller');
const { protect, requireVerification, checkProfileCompleteness } = require('./auth.middleware');

const router = express.Router();

// All user routes are protected
router.use(protect);

// Validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('City must be between 2 and 30 characters'),
  
  body('weddingDate')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value && value <= new Date()) {
        throw new Error('Wedding date must be in the future');
      }
      return true;
    }),
  
  body('profileImage')
    .optional()
    .isURL()
    .withMessage('Profile image must be a valid URL'),
  
  body('preferences.language')
    .optional()
    .isIn(['en', 'hi', 'gu', 'mr', 'ta', 'te'])
    .withMessage('Invalid language preference'),
  
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Invalid theme preference'),
  
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be boolean'),
  
  body('preferences.notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification preference must be boolean'),
  
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification preference must be boolean')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const addFamilyMemberValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Family member name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number'),
  
  body('relationship')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Relationship must be between 2 and 30 characters')
    .withMessage('Please specify the relationship')
];

// User profile routes
router.get('/', checkProfileCompleteness, userController.getProfile);
router.put('/', updateProfileValidation, userController.updateProfile);
router.patch('/', updateProfileValidation, userController.patchProfile);

// Password management
router.post('/change-password', changePasswordValidation, userController.changePassword);
router.post('/delete-account', userController.deleteAccount);

// Family members management
router.get('/family', userController.getFamilyMembers);
router.post('/family', addFamilyMemberValidation, userController.addFamilyMember);
router.put('/family/:memberId', addFamilyMemberValidation, userController.updateFamilyMember);
router.delete('/family/:memberId', userController.removeFamilyMember);

// User statistics and analytics
router.get('/stats', userController.getUserStats);
router.get('/activity', userController.getUserActivity);

// Preferences management
router.get('/preferences', userController.getPreferences);
router.put('/preferences', userController.updatePreferences);

// Wedding progress tracking
router.get('/wedding-progress', userController.getWeddingProgress);
router.put('/wedding-progress', userController.updateWeddingProgress);

// Search and filter users (for admin or family features)
router.get('/search', userController.searchUsers);

// Account verification status
router.get('/verification-status', userController.getVerificationStatus);

// Upload profile picture
router.post('/upload-profile-picture', userController.uploadProfilePicture);

// Social links management
router.get('/social-links', userController.getSocialLinks);
router.put('/social-links', userController.updateSocialLinks);

// Export user data (GDPR compliance)
router.get('/export-data', userController.exportUserData);

module.exports = router;
