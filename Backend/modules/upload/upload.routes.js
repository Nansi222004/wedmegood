const express = require('express');
const router = express.Router();
const { upload } = require('../../utils/cloudinary');
const { uploadSingleImage, uploadMultipleImages } = require('./upload.controller');

// @route   POST /api/upload/single
// @desc    Upload a single image using Cloudinary
router.post('/single', upload.single('image'), uploadSingleImage);

// @route   POST /api/upload/multiple
// @desc    Upload multiple images using Cloudinary (max 10)
router.post('/multiple', upload.array('images', 10), uploadMultipleImages);

module.exports = router;
