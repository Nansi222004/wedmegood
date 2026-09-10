const User = require('./user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../../utils/emailService');
const { generateOTP, storeOTP, verifyOTP } = require('../../utils/otpService');

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
  }

  // Generate JWT token
  generateToken(userId, email) {
    return jwt.sign(
      { id: userId, email },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRE }
    );
  }

  // Verify JWT token
  verifyToken(token) {
    return jwt.verify(token, this.JWT_SECRET);
  }

  // Register new user
  async register(userData) {
    try {
      const { name, email, phone, password, weddingDate, city } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { phone }] 
      });

      if (existingUser) {
        throw new Error('User with this email or phone already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate verification OTPs
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
        password: hashedPassword,
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
      // TODO: Send SMS for phone verification

      // Generate JWT token
      const token = this.generateToken(user._id, user.email);

      return {
        success: true,
        message: 'User registered successfully. Please verify your email and phone.',
        data: {
          user: user.toAPIResponse(),
          token
        }
      };

    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive || user.isBlocked) {
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      // Generate JWT token
      const token = this.generateToken(user._id, user.email);

      // Update last login
      await user.incrementLoginCount();

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: user.toAPIResponse(),
          token
        }
      };

    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Verify email
  async verifyEmail(email, otp) {
    try {
      // Verify OTP
      const isValidOTP = verifyOTP(email, otp, 'email');

      if (!isValidOTP) {
        throw new Error('Invalid or expired OTP');
      }

      // Update user verification status
      const user = await User.findOneAndUpdate(
        { email },
        { 
          isEmailVerified: true,
          $unset: { emailOTP: 1 }
        },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Send welcome email
      await sendWelcomeEmail(email, user.name);

      return {
        success: true,
        message: 'Email verified successfully',
        data: {
          isEmailVerified: user.isEmailVerified
        }
      };

    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  // Verify phone
  async verifyPhone(phone, otp) {
    try {
      // Verify OTP
      const isValidOTP = verifyOTP(phone, otp, 'phone');

      if (!isValidOTP) {
        throw new Error('Invalid or expired OTP');
      }

      // Update user verification status
      const user = await User.findOneAndUpdate(
        { phone },
        { 
          isPhoneVerified: true,
          $unset: { phoneOTP: 1 }
        },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'Phone verified successfully',
        data: {
          isPhoneVerified: user.isPhoneVerified
        }
      };

    } catch (error) {
      throw new Error(`Phone verification failed: ${error.message}`);
    }
  }

  // Resend OTP
  async resendOTP(identifier, type) {
    try {
      let user;
      let otpType;

      if (type === 'email') {
        user = await User.findOne({ email: identifier });
        otpType = 'email';
      } else if (type === 'phone') {
        user = await User.findOne({ phone: identifier });
        otpType = 'phone';
      } else {
        throw new Error('Invalid type. Must be email or phone');
      }

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new OTP
      const newOTP = generateOTP();
      
      // Store new OTP
      storeOTP(identifier, newOTP, otpType);

      // Update user record
      if (otpType === 'email') {
        user.emailOTP = newOTP;
        await sendVerificationEmail(identifier, user.name, newOTP);
      } else {
        user.phoneOTP = newOTP;
        // TODO: Send SMS for phone verification
      }

      await user.save();

      return {
        success: true,
        message: `OTP resent successfully to your ${otpType}`,
        data: {
          identifier: identifier.replace(/(.{3}).*(.{4})/, '$1****$2') // Mask sensitive info
        }
      };

    } catch (error) {
      throw new Error(`Resend OTP failed: ${error.message}`);
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error('User not found with this email');
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: user._id, type: 'password-reset' },
        this.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Save reset token to user
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send reset email
      await sendPasswordResetEmail(email, user.name, resetToken);

      return {
        success: true,
        message: 'Password reset instructions sent to your email',
        data: {
          resetToken // Remove this in production
        }
      };

    } catch (error) {
      throw new Error(`Forgot password failed: ${error.message}`);
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      // Verify token
      const decoded = jwt.verify(token, this.JWT_SECRET);

      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid reset token');
      }

      // Find user with valid reset token
      const user = await User.findOne({
        _id: decoded.id,
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset fields
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return {
        success: true,
        message: 'Password reset successful. Please login with your new password.'
      };

    } catch (error) {
      throw new Error(`Reset password failed: ${error.message}`);
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: {
          user: user.toAPIResponse()
        }
      };

    } catch (error) {
      throw new Error(`Get profile failed: ${error.message}`);
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const allowedUpdates = ['name', 'weddingDate', 'city', 'profileImage', 'preferences'];
      const filteredData = {};

      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      if (filteredData.weddingDate) {
        filteredData.weddingDate = new Date(filteredData.weddingDate);
      }

      const user = await User.findByIdAndUpdate(
        userId,
        filteredData,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toAPIResponse()
        }
      };

    } catch (error) {
      throw new Error(`Update profile failed: ${error.message}`);
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      user.password = hashedPassword;
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      throw new Error(`Change password failed: ${error.message}`);
    }
  }

  // Delete account
  async deleteAccount(userId, password) {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error('Password is incorrect');
      }

      // Soft delete (deactivate account)
      await user.softDelete();

      return {
        success: true,
        message: 'Account deleted successfully'
      };

    } catch (error) {
      throw new Error(`Delete account failed: ${error.message}`);
    }
  }

  // Get user statistics
  async getUserStats(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const stats = {
        weddingDaysLeft: user.weddingDaysLeft,
        checklistProgress: user.checklistProgress,
        totalFamilyMembers: user.familyMembers.length,
        registeredFamilyMembers: user.familyMembers.filter(member => member.isRegistered).length,
        loginCount: user.loginCount,
        accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
        lastLogin: user.lastLogin
      };

      return {
        success: true,
        data: { stats }
      };

    } catch (error) {
      throw new Error(`Get user stats failed: ${error.message}`);
    }
  }
}

module.exports = new AuthService();
