const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// These endpoints are public (vendor sign-up uploads documents before an account exists), so
// they get a tighter per-IP cap than the rest of the API to limit storage abuse
router.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many uploads from this IP address, please try again later.' }
}));
const { upload } = require('../../utils/cloudinary');
const { uploadSingleImage, uploadMultipleImages } = require('./upload.controller');

// @route   POST /api/upload/single
// @desc    Upload a single image using Cloudinary
router.post('/single', upload.single('image'), uploadSingleImage);

// @route   POST /api/upload/multiple
// @desc    Upload multiple images using Cloudinary (max 10)
router.post('/multiple', upload.array('images', 10), uploadMultipleImages);

module.exports = router;
