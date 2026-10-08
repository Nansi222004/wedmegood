const express = require('express');
const { body } = require('express-validator');
const authController = require('./auth.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('city')
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
    })
];

// `email` carries the login identifier: an email address or a 10-digit mobile number
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email or mobile number is required')
    .bail()
    .custom((value) => {
      const digits = value.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
      if (/^[6-9]\d{9}$/.test(digits) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
      throw new Error('Please provide a valid email address or 10-digit mobile number');
    }),

  // Normalize emails the same way registration does so lookups match
  body('email')
    .if(body('email').isEmail())
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const emailVerificationValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
];

const phoneVerificationValidation = [
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
];

const resendOTPValidation = [
  body('type')
    .isIn(['email', 'phone'])
    .withMessage('Type must be either email or phone'),
  
  body('email')
    .if(body('type').equals('email'))
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .if(body('type').equals('phone'))
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number')
];

const indianPhoneValidation = body('phone')
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Please provide a valid 10-digit Indian phone number');

const otpValidation = body('otp')
  .isLength({ min: 6, max: 6 })
  .isNumeric()
  .withMessage('OTP must be a 6-digit number');

const sendOTPValidation = [
  indianPhoneValidation,
  body('purpose')
    .isIn(['register', 'login'])
    .withMessage('Purpose must be either register or login')
];

const phoneOTPValidation = [indianPhoneValidation, otpValidation];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/verify-email', emailVerificationValidation, authController.verifyEmail);
router.post('/verify-phone', phoneVerificationValidation, authController.verifyPhone);
router.post('/resend-otp', resendOTPValidation, authController.resendOTP);
router.post('/send-otp', sendOTPValidation, authController.sendOtp);
router.post('/verify-otp', phoneOTPValidation, authController.verifySignupOtp);
router.post('/login-otp', phoneOTPValidation, authController.loginWithOtp);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;
