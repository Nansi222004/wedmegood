/**
 * Centralized Error-to-User-Message Formatter
 * 
 * Translates technical error objects, HTTP response codes, and database/network errors
 * into safe, helpful, user-friendly messages without exposing raw database, Cloudinary,
 * or server internals to end users.
 */

const TECHNICAL_PATTERNS = [
  /mongodb/i,
  /mongoose/i,
  /e11000/i,
  /cast\s*to\s*objectid/i,
  /validationerror/i,
  /cloudinary/i,
  /axioserror/i,
  /internal\s*server\s*error/i,
  /jwt\s*(expired|malformed|must be provided)/i,
  /cannot\s*read\s*propert(y|ies)/i,
  /is\s*not\s*a\s*function/i,
  /syntaxerror/i,
  /network\s*error/i,
  /failed\s*to\s*fetch/i,
  /load\s*failed/i,
  /status\s*code\s*500/i,
  /cors/i,
  /err_connection_refused/i
];

/**
 * Checks if a string contains internal technical or database keywords
 */
export const isTechnicalMessage = (msg) => {
  if (!msg || typeof msg !== 'string') return false;
  return TECHNICAL_PATTERNS.some(regex => regex.test(msg));
};

/**
 * Extracts and maps any error into a safe, human-readable message.
 * 
 * @param {Error|Object|string} error - The caught error or API response
 * @param {string} fallback - Optional fallback message if no specific message can be deduced
 * @returns {string} Safe user-facing message
 */
export const getFriendlyErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  // Development debugging log
  if (import.meta.env?.DEV) {
    console.debug('[ErrorHandler] Caught error:', error);
  }

  if (!error) return fallback;

  // 1. Handle plain strings
  if (typeof error === 'string') {
    if (isTechnicalMessage(error)) {
      if (/cloudinary/i.test(error)) {
        return "We couldn't upload your image. Please check the file format and size, then try again.";
      }
      if (/network|failed to fetch|connection/i.test(error)) {
        return "Network connection issue. Please check your internet connection and try again.";
      }
      return fallback;
    }
    return error;
  }

  // 2. Extract message candidates (checking axios response data first)
  let rawMsg =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.response?.data?.msg ||
    error.message ||
    error.error ||
    error.msg ||
    '';

  const status = error.status || error.response?.status || error.statusCode;

  // Handle arrays of validation errors (e.g. express-validator)
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    const firstErr = error.errors[0];
    const validationMsg = firstErr.msg || firstErr.message;
    if (validationMsg && !isTechnicalMessage(validationMsg)) {
      return validationMsg;
    }
  }

  // Handle errors array from axios response data
  if (Array.isArray(error.response?.data?.errors) && error.response.data.errors.length > 0) {
    const firstErr = error.response.data.errors[0];
    const validationMsg = firstErr.msg || firstErr.message;
    if (validationMsg && !isTechnicalMessage(validationMsg)) {
      return validationMsg;
    }
  }

  // If server provided a clean, safe business message, prioritize it
  if (rawMsg && typeof rawMsg === 'string' && !isTechnicalMessage(rawMsg)) {
    const trimmed = rawMsg.trim();
    // Only return if it's meaningful business text and not a generic axios/HTTP status string
    if (trimmed.length > 2 && trimmed.length < 250 && !/^request failed with status code/i.test(trimmed)) {
      return trimmed;
    }
  }

  // 3. Map HTTP Status Codes when no specific safe server message is available
  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 403) {
    return "You don't have permission to perform this action.";
  }
  if (status === 404) {
    return "We couldn't find the requested information.";
  }
  if (status === 409) {
    return 'There was a scheduling or update conflict. Please refresh and try again.';
  }
  if (status === 413) {
    return 'The uploaded file is too large. Please select a smaller file.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait a moment before trying again.';
  }
  if (status >= 500) {
    return 'Something went wrong on our end. Please try again later.';
  }

  // 4. Check for network errors
  if (
    rawMsg.includes('Failed to fetch') ||
    rawMsg.includes('Network Error') ||
    rawMsg.includes('ERR_CONNECTION_REFUSED') ||
    (error.name === 'TypeError' && rawMsg.includes('fetch'))
  ) {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }

  // 5. Check for Cloudinary / upload errors
  if (/cloudinary/i.test(rawMsg)) {
    return "We couldn't upload your image. Please select a valid JPEG, PNG, or WebP image and try again.";
  }

  // 6. If the message is technical or database-related, return the fallback
  if (isTechnicalMessage(rawMsg)) {
    return fallback;
  }

  return fallback;
};

export default getFriendlyErrorMessage;
