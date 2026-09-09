const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('./user.model');
const { sendVerificationEmail, sendWelcomeEmail } = require('../../utils/emailService');
const { generateOTP, storeOTP, verifyOTP } = require('../../utils/otpService');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
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

    const { name, email, phone, password, weddingDate, city } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Generate email verification OTP
    const emailOTP = generateOTP();
    const phoneOTP = generateOTP();

    // Store OTPs
    storeOTP(email, emailOTP, 'email');
    storeOTP(phone, phoneOTP, 'phone');

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password, // The model's pre('save') middleware will hash this automatically
      weddingDate: weddingDate ? new Date(weddingDate) : null,
      city,
      isEmailVerified: false,
      isPhoneVerified: false,
      emailOTP,
      phoneOTP
    });

    await user.save();

    // Send verification emails
    await sendVerificationEmail(email, name, emailOTP);
    // Send SMS for phone verification (you can implement SMS service here)

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email and phone.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          weddingDate: user.weddingDate,
          city: user.city,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          profileImage: user.profileImage,
          createdAt: user.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
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

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          weddingDate: user.weddingDate,
          city: user.city,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          profileImage: user.profileImage,
          loginTime: new Date().toISOString()
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Verify OTP
    const isValidOTP = verifyOTP(email, otp, 'email');

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update user verification status
    const user = await User.findOneAndUpdate(
      { email },
      { 
        isEmailVerified: true,
        emailOTP: null,
        $unset: { emailOTP: 1 }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send welcome email
    await sendWelcomeEmail(email, user.name);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify phone
// @route   POST /api/auth/verify-phone
// @access  Public
exports.verifyPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Verify OTP
    const isValidOTP = verifyOTP(phone, otp, 'phone');

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update user verification status
    const user = await User.findOneAndUpdate(
      { phone },
      { 
        isPhoneVerified: true,
        phoneOTP: null,
        $unset: { phoneOTP: 1 }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Phone verified successfully',
      data: {
        isPhoneVerified: user.isPhoneVerified
      }
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during phone verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email, phone, type } = req.body; // type: 'email' or 'phone'

    let user;
    let identifier;
    let otpType;

    if (type === 'email' && email) {
      user = await User.findOne({ email });
      identifier = email;
      otpType = 'email';
    } else if (type === 'phone' && phone) {
      user = await User.findOne({ phone });
      identifier = phone;
      otpType = 'phone';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Please provide email or phone and type.'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new OTP
    const newOTP = generateOTP();
    
    // Store new OTP
    storeOTP(identifier, newOTP, otpType);

    // Update user record
    if (otpType === 'email') {
      user.emailOTP = newOTP;
      await sendVerificationEmail(email, user.name, newOTP);
    } else {
      user.phoneOTP = newOTP;
      // Send SMS for phone verification (implement SMS service)
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `OTP resent successfully to your ${otpType}`,
      data: {
        identifier: identifier.replace(/(.{3}).*(.{4})/, '$1****$2') // Mask sensitive info
      }
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id, type: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email (implement email service)
    // await sendPasswordResetEmail(email, user.name, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to your email',
      data: {
        resetToken // Remove this in production, only for development
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing forgot password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      _id: decoded.id,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset fields
    // We pass the raw newPassword because userSchema.pre('save') will automatically hash it
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          weddingDate: user.weddingDate,
          city: user.city,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
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

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token from local storage
    // You can implement token blacklisting if needed

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
