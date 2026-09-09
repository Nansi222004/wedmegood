const crypto = require('crypto');

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with expiration
const storeOTP = (identifier, otp, type, expiresIn = 10) => {
  const key = `${type}:${identifier}`;
  const expiresAt = Date.now() + (expiresIn * 60 * 1000); // Convert minutes to milliseconds
  
  otpStore.set(key, {
    otp,
    type,
    identifier,
    createdAt: Date.now(),
    expiresAt,
    attempts: 0,
    maxAttempts: 3
  });
  
  // Auto-cleanup after expiration
  setTimeout(() => {
    otpStore.delete(key);
  }, expiresIn * 60 * 1000);
  
  console.log(`OTP stored for ${key}, expires at: ${new Date(expiresAt)}`);
};

// Verify OTP
const verifyOTP = (identifier, otp, type) => {
  const key = `${type}:${identifier}`;
  const storedData = otpStore.get(key);
  
  if (!storedData) {
    console.log(`No OTP found for ${key}`);
    return false;
  }
  
  // Check if OTP has expired
  if (Date.now() > storedData.expiresAt) {
    console.log(`OTP expired for ${key}`);
    otpStore.delete(key);
    return false;
  }
  
  // Check maximum attempts
  if (storedData.attempts >= storedData.maxAttempts) {
    console.log(`Maximum attempts exceeded for ${key}`);
    otpStore.delete(key);
    return false;
  }
  
  // Increment attempts
  storedData.attempts++;
  
  // Verify OTP
  if (storedData.otp === otp) {
    console.log(`OTP verified successfully for ${key}`);
    otpStore.delete(key);
    return true;
  } else {
    console.log(`Invalid OTP for ${key}, attempt ${storedData.attempts}`);
    return false;
  }
};

// Check if OTP exists and is valid
const checkOTPStatus = (identifier, type) => {
  const key = `${type}:${identifier}`;
  const storedData = otpStore.get(key);
  
  if (!storedData) {
    return { exists: false, message: 'No OTP found' };
  }
  
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(key);
    return { exists: false, message: 'OTP has expired' };
  }
  
  if (storedData.attempts >= storedData.maxAttempts) {
    otpStore.delete(key);
    return { exists: false, message: 'Maximum attempts exceeded' };
  }
  
  return {
    exists: true,
    attempts: storedData.attempts,
    maxAttempts: storedData.maxAttempts,
    expiresAt: storedData.expiresAt,
    timeRemaining: Math.max(0, storedData.expiresAt - Date.now())
  };
};

// Clear OTP manually
const clearOTP = (identifier, type) => {
  const key = `${type}:${identifier}`;
  const deleted = otpStore.delete(key);
  console.log(`OTP cleared for ${key}: ${deleted}`);
  return deleted;
};

// Clean up expired OTPs (run periodically)
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(key);
      cleanedCount++;
    }
  }
  
  console.log(`Cleaned up ${cleanedCount} expired OTPs`);
  return cleanedCount;
};

// Get OTP statistics
const getOTPStats = () => {
  const stats = {
    totalOTPs: otpStore.size,
    emailOTPs: 0,
    phoneOTPs: 0,
    expiredOTPs: 0,
    activeOTPs: 0
  };
  
  const now = Date.now();
  
  for (const [key, data] of otpStore.entries()) {
    if (key.startsWith('email:')) {
      stats.emailOTPs++;
    } else if (key.startsWith('phone:')) {
      stats.phoneOTPs++;
    }
    
    if (now > data.expiresAt) {
      stats.expiredOTPs++;
    } else {
      stats.activeOTPs++;
    }
  }
  
  return stats;
};

// Generate secure token for password reset
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate numeric OTP with custom length
const generateCustomOTP = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

// Rate limiting for OTP requests
const otpRateLimit = new Map();

const checkRateLimit = (identifier, type, maxRequests = 3, windowMs = 5 * 60 * 1000) => {
  const key = `${type}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!otpRateLimit.has(key)) {
    otpRateLimit.set(key, []);
  }
  
  const requests = otpRateLimit.get(key);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  otpRateLimit.set(key, validRequests);
  
  if (validRequests.length >= maxRequests) {
    return {
      allowed: false,
      message: `Too many OTP requests. Please try again after ${Math.ceil((validRequests[0] + windowMs - now) / 60000)} minutes.`,
      nextRequestTime: validRequests[0] + windowMs
    };
  }
  
  // Add current request
  validRequests.push(now);
  
  return {
    allowed: true,
    remainingRequests: maxRequests - validRequests.length,
    windowEndsAt: now + windowMs
  };
};

// Mock SMS service for phone OTP (in production, integrate with actual SMS provider)
const sendSMSOTP = async (phone, otp, name) => {
  try {
    // This is a mock implementation
    // In production, integrate with services like Twilio, AWS SNS, or local SMS providers
    
    console.log(`MOCK SMS: Sending OTP ${otp} to ${phone} for ${name}`);
    
    // Example with Twilio (commented out for demo):
    /*
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await twilio.messages.create({
      body: `Your Utsavo verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`
    });
    */
    
    return { success: true, message: 'SMS sent successfully' };
    
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
};

// Validate phone number format
const validatePhoneNumber = (phone) => {
  // Indian phone number validation
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Enhanced OTP generation with patterns
const generatePatternOTP = (pattern = 'XXXXXX') => {
  let otp = '';
  for (let char of pattern) {
    if (char === 'X') {
      otp += Math.floor(Math.random() * 10);
    } else {
      otp += char;
    }
  }
  return otp;
};

// Set up periodic cleanup (run every 5 minutes)
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  checkOTPStatus,
  clearOTP,
  cleanupExpiredOTPs,
  getOTPStats,
  generateSecureToken,
  generateCustomOTP,
  checkRateLimit,
  sendSMSOTP,
  validatePhoneNumber,
  validateEmail,
  generatePatternOTP
};
