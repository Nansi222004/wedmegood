const jwt = require('jsonwebtoken');
const User = require('./user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }

      // Check if user is active
      if (!user.isActive || user.isBlocked) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated or blocked. Please contact support.'
        });
      }

      // Add user to request object
      req.user = user;
      next();

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user && user.isActive && !user.isBlocked) {
          req.user = user;
        }
      } catch (jwtError) {
        // Token is invalid, but we don't fail the request
        console.log('Invalid token in optional auth:', jwtError.message);
      }
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Don't fail the request for optional auth
  }
};

// Check if user is verified (email and phone)
const requireVerification = (req, res, next) => {
  if (!req.user.isEmailVerified || !req.user.isPhoneVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required. Please verify your email and phone number.',
      data: {
        isEmailVerified: req.user.isEmailVerified,
        isPhoneVerified: req.user.isPhoneVerified
      }
    });
  }
  next();
};

// Check if user has specific role (for future role-based access)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Rate limiting middleware for auth endpoints
const rateLimit = require('express-rate-limit');

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 OTP requests per windowMs
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validate request origin for additional security
const validateOrigin = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://yourdomain.com',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin;
  
  if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Invalid origin.'
    });
  }

  next();
};

// Check if user's wedding date is approaching (for special features)
const checkWeddingDate = (req, res, next) => {
  if (req.user.weddingDate) {
    const daysUntilWedding = req.user.weddingDaysLeft;
    
    // Add wedding urgency to request for other middleware/routes
    req.weddingUrgency = {
      daysLeft: daysUntilWedding,
      isUrgent: daysUntilWedding <= 30, // 30 days or less
      isVeryUrgent: daysUntilWedding <= 7, // 7 days or less
      isPast: daysUntilWedding === 0
    };
  }

  next();
};

// Middleware to check if user can access family features
const requireFamilyAccess = (req, res, next) => {
  if (!req.user.isEmailVerified || !req.user.isPhoneVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required for family features.',
      data: {
        isEmailVerified: req.user.isEmailVerified,
        isPhoneVerified: req.user.isPhoneVerified
      }
    });
  }

  // Check if user has wedding date set (required for family features)
  if (!req.user.weddingDate) {
    return res.status(403).json({
      success: false,
      message: 'Wedding date is required to access family features.'
    });
  }

  next();
};

// Middleware to log user activity
const logActivity = (activity) => {
  return (req, res, next) => {
    // Log user activity for analytics and security
    console.log(`User Activity: ${req.user?.email || 'Anonymous'} - ${activity} - ${new Date().toISOString()}`);
    
    // You can store this in database for analytics
    // ActivityLog.create({
    //   user: req.user?._id,
    //   activity,
    //   ipAddress: req.ip,
    //   userAgent: req.get('User-Agent'),
    //   timestamp: new Date()
    // });

    next();
  };
};

// Middleware to check account completeness
const checkProfileCompleteness = (req, res, next) => {
  const user = req.user;
  const requiredFields = ['name', 'email', 'phone', 'city'];
  const optionalFields = ['weddingDate', 'profileImage'];
  
  const missingRequired = requiredFields.filter(field => !user[field]);
  const missingOptional = optionalFields.filter(field => !user[field]);
  
  const completeness = {
    required: requiredFields.length - missingRequired.length,
    optional: optionalFields.length - missingOptional.length,
    total: requiredFields.length + optionalFields.length,
    percentage: Math.round(((requiredFields.length - missingRequired.length) / requiredFields.length) * 100)
  };

  req.profileCompleteness = completeness;
  
  // Add profile completeness to response headers for frontend
  res.set('X-Profile-Completeness', completeness.percentage.toString());
  
  next();
};

module.exports = {
  protect,
  optionalAuth,
  requireVerification,
  authorize,
  authRateLimit,
  otpRateLimit,
  validateOrigin,
  checkWeddingDate,
  requireFamilyAccess,
  logActivity,
  checkProfileCompleteness
};
