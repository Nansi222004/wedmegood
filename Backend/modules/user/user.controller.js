const User = require('./user.model');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toAPIResponse(),
        profileCompleteness: req.profileCompleteness
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['name', 'weddingDate', 'city', 'profileImage', 'preferences'];
    const filteredData = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredData[key] = req.body[key];
      }
    });

    // Handle nested preferences
    if (req.body.preferences) {
      filteredData.preferences = { ...req.user.preferences, ...req.body.preferences };
    }

    if (filteredData.weddingDate) {
      filteredData.weddingDate = new Date(filteredData.weddingDate);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      filteredData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toAPIResponse()
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Partially update user profile
// @route   PATCH /api/user/profile
// @access  Private
exports.patchProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toAPIResponse()
      }
    });

  } catch (error) {
    console.error('Patch profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Change password
// @route   POST /api/user/profile/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete account
// @route   POST /api/user/profile/delete-account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const { password, confirmation } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    if (confirmation !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Please type "DELETE" to confirm account deletion'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Soft delete (deactivate account)
    await user.softDelete();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get family members
// @route   GET /api/user/profile/family
// @access  Private
exports.getFamilyMembers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('familyMembers');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        familyMembers: user.familyMembers,
        totalMembers: user.familyMembers.length,
        registeredMembers: user.familyMembers.filter(member => member.isRegistered).length
      }
    });

  } catch (error) {
    console.error('Get family members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching family members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add family member
// @route   POST /api/user/profile/family
// @access  Private
exports.addFamilyMember = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, relationship } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if family member already exists
    const existingMember = user.familyMembers.find(
      member => (email && member.email === email) || (phone && member.phone === phone)
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Family member with this email or phone already exists'
      });
    }

    // Check if the person is already a registered user
    let registeredUser = null;
    if (email) {
      registeredUser = await User.findOne({ email });
    } else if (phone) {
      registeredUser = await User.findOne({ phone });
    }

    const familyMember = {
      name,
      email,
      phone,
      relationship,
      isRegistered: !!registeredUser,
      userId: registeredUser ? registeredUser._id : null
    };

    user.familyMembers.push(familyMember);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Family member added successfully',
      data: {
        familyMember,
        totalMembers: user.familyMembers.length
      }
    });

  } catch (error) {
    console.error('Add family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding family member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update family member
// @route   PUT /api/user/profile/family/:memberId
// @access  Private
exports.updateFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const familyMember = user.familyMembers.id(memberId);

    if (!familyMember) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    // Update family member details
    Object.assign(familyMember, req.body);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Family member updated successfully',
      data: {
        familyMember
      }
    });

  } catch (error) {
    console.error('Update family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating family member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Remove family member
// @route   DELETE /api/user/profile/family/:memberId
// @access  Private
exports.removeFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const familyMember = user.familyMembers.id(memberId);

    if (!familyMember) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    user.familyMembers.pull(memberId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Family member removed successfully',
      data: {
        totalMembers: user.familyMembers.length
      }
    });

  } catch (error) {
    console.error('Remove family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing family member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/user/profile/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stats = {
      weddingDaysLeft: user.weddingDaysLeft,
      checklistProgress: user.checklistProgress,
      totalFamilyMembers: user.familyMembers.length,
      registeredFamilyMembers: user.familyMembers.filter(member => member.isRegistered).length,
      loginCount: user.loginCount,
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
      lastLogin: user.lastLogin,
      profileCompleteness: req.profileCompleteness
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user activity
// @route   GET /api/user/profile/activity
// @access  Private
exports.getUserActivity = async (req, res) => {
  try {
    // This would typically fetch from an ActivityLog collection
    // For now, return basic login information
    const user = await User.findById(req.user._id).select('lastLogin loginCount createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const activity = {
      lastLogin: user.lastLogin,
      loginCount: user.loginCount,
      accountCreated: user.createdAt,
      recentActivity: [
        {
          type: 'login',
          timestamp: user.lastLogin,
          description: 'Logged in to account'
        },
        {
          type: 'profile_update',
          timestamp: user.updatedAt,
          description: 'Profile updated'
        }
      ]
    };

    res.status(200).json({
      success: true,
      data: { activity }
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user preferences
// @route   GET /api/user/profile/preferences
// @access  Private
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user preferences
// @route   PUT /api/user/profile/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    user.preferences = { ...user.preferences, ...req.body };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/user/profile/upload-profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    const uploadSingle = upload.single('profilePicture');

    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      try {
        const fileUrl = `/uploads/profiles/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(
          req.user._id,
          { profileImage: fileUrl },
          { new: true }
        );

        res.status(200).json({
          success: true,
          message: 'Profile picture uploaded successfully',
          data: {
            profileImage: fileUrl,
            user: user.toAPIResponse()
          }
        });

      } catch (error) {
        // Delete uploaded file if there's an error
        await fs.unlink(req.file.path).catch(() => {});
        
        res.status(500).json({
          success: false,
          message: 'Server error while saving profile picture',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading profile picture',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Placeholder functions for remaining routes
exports.getWeddingProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('weddingProgress');
    
    res.status(200).json({
      success: true,
      data: { weddingProgress: user.weddingProgress }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching wedding progress'
    });
  }
};

exports.updateWeddingProgress = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'weddingProgress': req.body } },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Wedding progress updated',
      data: { weddingProgress: user.weddingProgress }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating wedding progress'
    });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $and: [
        { isActive: true, isBlocked: false },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { city: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name city profileImage weddingDate');

    res.status(200).json({
      success: true,
      data: { users }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
};

exports.getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('isEmailVerified isPhoneVerified email phone');
    
    res.status(200).json({
      success: true,
      data: {
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        email: user.email.replace(/(.{2}).*(@.*)/, '$1****$2'),
        phone: user.phone.replace(/(.{3}).*(.{4})/, '$1****$2')
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching verification status'
    });
  }
};

exports.getSocialLinks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('socialLinks');
    
    res.status(200).json({
      success: true,
      data: { socialLinks: user.socialLinks }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching social links'
    });
  }
};

exports.updateSocialLinks = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { socialLinks: req.body },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Social links updated',
      data: { socialLinks: user.socialLinks }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating social links'
    });
  }
};

exports.exportUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        exportDate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while exporting user data'
    });
  }
};
