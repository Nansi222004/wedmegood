const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');
const Vendor = require('../modules/vendor/Vendor');

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

// Protect vendor routes
const protectVendor = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const vendor = await Vendor.findById(decoded.id);

      if (!vendor) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Vendor not found.'
        });
      }

      req.vendor = vendor;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    console.error('Vendor Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in vendor authentication'
    });
  }
};

// Check if vendor has active subscription
const requireSubscription = (req, res, next) => {
  if (!req.vendor.subscription || req.vendor.subscription.status !== 'Active') {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required. Please complete your subscription.',
      subscriptionRequired: true
    });
  }
  next();
};

// Check if vendor is approved by admin
const requireVendorApproval = (req, res, next) => {
  if (req.vendor.status !== 'Approved') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending approval from admin. Please wait for verification.',
      approvalPending: true,
      status: req.vendor.status
    });
  }
  next();
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

module.exports = {
  protect,
  protectVendor,
  optionalAuth,
  requireVerification,
  requireSubscription,
  requireVendorApproval,
  authorize,
  authRateLimit,
  otpRateLimit,
  validateOrigin
};
