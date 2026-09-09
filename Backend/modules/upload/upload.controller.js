// @desc    Handle single image upload
// @route   POST /api/upload/single
// @access  Public
exports.uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please upload an image with the field name "image".'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: req.file.path,
        filename: req.file.filename,
        format: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error in uploadSingleImage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during single image upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Handle multiple images upload
// @route   POST /api/upload/multiple
// @access  Public
exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided. Please upload images with the field name "images".'
      });
    }

    const uploadedImages = req.files.map(file => ({
      url: file.path,
      filename: file.filename,
      folder: req.body.folder || 'utsavo/general',
      format: file.mimetype,
      size: file.size
    }));

    res.status(200).json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      data: uploadedImages
    });
  } catch (error) {
    console.error('Error in uploadMultipleImages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during multiple images upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
