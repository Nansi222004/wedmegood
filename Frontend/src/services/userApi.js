const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

/**
 * Helper to get the current authenticated user's JWT token
 */
export const getAuthToken = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.token) return parsed.token;
    }
    return localStorage.getItem('token') || localStorage.getItem('userToken') || null;
  } catch (e) {
    console.error('Failed to parse auth token', e);
    return null;
  }
};

/**
 * Base fetch wrapper with auth header injection and standardized error handling
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  const headers = {
    ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && !options.isFormData && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  delete config.isFormData;

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMessage = data?.message || data?.error;
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        const errorDetails = data.errors.map(err => err.msg || err.message).filter(Boolean).join(', ');
        if (errorDetails) {
          errorMessage = errorMessage ? `${errorMessage}: ${errorDetails}` : errorDetails;
        }
      }
      if (!errorMessage) {
        errorMessage = `HTTP ${response.status}: Request failed`;
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      // Network failure
      const networkError = new Error('Network failure: Unable to reach the server. Please check your connection.');
      networkError.status = 0;
      throw networkError;
    }
    throw err;
  }
};

export const userApi = {
  // Public Vendors & Marketplace
  getVendors: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.subCategory && params.subCategory !== 'all') query.append('subCategory', params.subCategory);
    if (params.city && params.city !== 'all') query.append('city', params.city);
    if (params.search) query.append('search', params.search);
    if (params.sort) query.append('sort', params.sort);
    if (params.minPrice) query.append('minPrice', params.minPrice);
    if (params.maxPrice) query.append('maxPrice', params.maxPrice);
    if (params.minRating && params.minRating !== 'all') query.append('minRating', params.minRating);
    if (params.minExperience && params.minExperience !== 'all') query.append('minExperience', params.minExperience);
    if (params.serviceType && params.serviceType !== 'all') query.append('serviceType', params.serviceType);
    if (params.featured) query.append('featured', 'true');
    if (params.date) query.append('date', params.date);
    if (params.availability) query.append('availability', params.availability);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    
    const qs = query.toString();
    return request(`/vendors${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  getVendorById: async (vendorId) => {
    return request(`/vendors/${vendorId}`, { method: 'GET' });
  },

  getVendorAvailability: async (vendorId, params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.month) query.append('month', params.month);
    const qs = query.toString();
    return request(`/vendors/${vendorId}/availability${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  getFeaturedVendors: async () => {
    return request('/vendors/featured', { method: 'GET' });
  },

  getTrendingVendors: async () => {
    return request('/vendors/trending', { method: 'GET' });
  },

  getRecommendedVendors: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.city) query.append('city', params.city);
    if (params.category) query.append('category', params.category);
    if (params.budget) query.append('budget', params.budget);
    if (params.date) query.append('date', params.date);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return request(`/vendors/recommendations${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  getCategories: async () => {
    return request('/categories', { method: 'GET' });
  },

  // Leads & Inquiries
  createLead: async (leadData) => {
    return request('/user/leads', {
      method: 'POST',
      body: leadData
    });
  },

  getUserLeads: async () => {
    return request('/user/leads', { method: 'GET' });
  },

  getUserLeadById: async (id) => {
    return request(`/user/leads/${id}`, { method: 'GET' });
  },

  // Quotes
  getUserQuotes: async () => {
    return request('/user/quotes', { method: 'GET' });
  },

  getUserQuoteById: async (id) => {
    return request(`/user/quotes/${id}`, { method: 'GET' });
  },

  acceptQuote: async (quoteId) => {
    return request(`/user/quotes/${quoteId}/accept`, {
      method: 'PUT'
    });
  },

  rejectQuote: async (quoteId) => {
    return request(`/user/quotes/${quoteId}/reject`, {
      method: 'PUT'
    });
  },

  // Bookings
  getUserBookings: async () => {
    return request('/user/bookings', { method: 'GET' });
  },

  getUserBookingById: async (id) => {
    return request(`/user/bookings/${id}`, { method: 'GET' });
  },

  cancelBooking: async (bookingId, reason) => {
    return request(`/user/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      body: { reason }
    });
  },

  // Razorpay Payments
  createPaymentOrder: async (bookingId) => {
    return request('/user/payments/create-order', {
      method: 'POST',
      body: { bookingId }
    });
  },

  verifyPayment: async (verificationData) => {
    return request('/user/payments/verify', {
      method: 'POST',
      body: verificationData
    });
  },

  getUserPayments: async () => {
    return request('/user/payments', { method: 'GET' });
  },

  getUserPaymentById: async (id) => {
    return request(`/user/payments/${id}`, { method: 'GET' });
  },

  getPaymentReceipt: async (id) => {
    return request(`/user/payments/${id}/receipt`, { method: 'GET' });
  },

  // User Profile & Settings (Phase 2)
  getUserProfile: async () => {
    return request('/user/profile', { method: 'GET' });
  },

  updateUserProfile: async (profileData) => {
    return request('/user/profile', {
      method: 'PUT',
      body: profileData
    });
  },

  getWeddingDetails: async () => {
    return request('/user/wedding', { method: 'GET' });
  },

  updateWeddingDetails: async (weddingData) => {
    return request('/user/wedding', {
      method: 'PUT',
      body: weddingData
    });
  },

  getUserPreferences: async () => {
    return request('/user/preferences', { method: 'GET' });
  },

  updateUserPreferences: async (preferences) => {
    return request('/user/preferences', {
      method: 'PUT',
      body: preferences
    });
  },

  getUserStats: async () => {
    return request('/user/stats', { method: 'GET' });
  },

  // Reviews (Phase 2)
  createReview: async (reviewData) => {
    return request('/user/reviews', {
      method: 'POST',
      body: reviewData
    });
  },

  getUserReviews: async () => {
    return request('/user/reviews', { method: 'GET' });
  },

  getEligibleReviewBookings: async () => {
    return request('/user/reviews/eligible-bookings', { method: 'GET' });
  },

  // Cloudinary File Uploads
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/upload/single', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  },

  uploadImages: async (files) => {
    const formData = new FormData();
    Array.from(files).forEach((f) => {
      formData.append('images', f);
    });
    return request('/upload/multiple', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  },

  // ==========================================
  // PHASE 3 — PLANNING SUITE APIS
  // ==========================================

  // 1. Budget Planner
  getBudget: async () => {
    return request('/user/budget', { method: 'GET' });
  },

  updateBudget: async (budgetData) => {
    return request('/user/budget', {
      method: 'PUT',
      body: budgetData
    });
  },

  // 2. Wedding Checklist
  getChecklist: async () => {
    return request('/user/checklist', { method: 'GET' });
  },

  createChecklistTask: async (taskData) => {
    return request('/user/checklist', {
      method: 'POST',
      body: taskData
    });
  },

  updateChecklistTask: async (taskId, taskData) => {
    return request(`/user/checklist/${taskId}`, {
      method: 'PUT',
      body: taskData
    });
  },

  toggleChecklistTask: async (taskId) => {
    return request(`/user/checklist/${taskId}/toggle`, {
      method: 'PATCH'
    });
  },

  deleteChecklistTask: async (taskId) => {
    return request(`/user/checklist/${taskId}`, {
      method: 'DELETE'
    });
  },

  resetChecklist: async () => {
    return request('/user/checklist/reset', {
      method: 'POST'
    });
  },

  // 3. Guest List & RSVP
  getGuests: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/user/guests${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  createGuest: async (guestData) => {
    return request('/user/guests', {
      method: 'POST',
      body: guestData
    });
  },

  updateGuest: async (guestId, guestData) => {
    return request(`/user/guests/${guestId}`, {
      method: 'PUT',
      body: guestData
    });
  },

  updateGuestRSVP: async (guestId, rsvpStatus) => {
    return request(`/user/guests/${guestId}/rsvp`, {
      method: 'PATCH',
      body: { rsvpStatus }
    });
  },

  deleteGuest: async (guestId) => {
    return request(`/user/guests/${guestId}`, {
      method: 'DELETE'
    });
  },

  // 4. Wedding Timeline
  getTimeline: async () => {
    return request('/user/timeline', { method: 'GET' });
  },

  createTimelineEvent: async (eventData) => {
    return request('/user/timeline', {
      method: 'POST',
      body: eventData
    });
  },

  updateTimelineEvent: async (eventId, eventData) => {
    return request(`/user/timeline/${eventId}`, {
      method: 'PUT',
      body: eventData
    });
  },

  deleteTimelineEvent: async (eventId) => {
    return request(`/user/timeline/${eventId}`, {
      method: 'DELETE'
    });
  },

  // 5. Canonical Favorites / Shortlist
  getFavorites: async (category = '') => {
    const query = category && category !== 'all' ? `?category=${category}` : '';
    return request(`/user/favorites${query}`, { method: 'GET' });
  },

  addFavorite: async (vendorId, notes = '') => {
    return request('/user/favorites', {
      method: 'POST',
      body: { vendorId, notes }
    });
  },

  removeFavorite: async (vendorId) => {
    return request(`/user/favorites/${vendorId}`, {
      method: 'DELETE'
    });
  },

  checkFavorite: async (vendorId) => {
    return request(`/user/favorites/check/${vendorId}`, {
      method: 'GET'
    });
  },

  // 6. Inspiration Board
  getInspirations: async (category = '') => {
    const query = category && category !== 'all' ? `?category=${category}` : '';
    return request(`/user/inspiration${query}`, { method: 'GET' });
  },

  saveInspiration: async (inspirationData) => {
    return request('/user/inspiration', {
      method: 'POST',
      body: inspirationData
    });
  },

  deleteInspiration: async (inspirationId) => {
    return request(`/user/inspiration/${inspirationId}`, {
      method: 'DELETE'
    });
  },

  // 7. Vendor Management (Aggregated from Phase 1 models)
  getVendorManagement: async () => {
    return request('/user/vendor-management', { method: 'GET' });
  },

  // 8. Family Collaboration (Groups)
  getFamilyGroups: async () => {
    return request('/user/family-groups', { method: 'GET' });
  },

  createFamilyGroup: async (groupData) => {
    return request('/user/family-groups', {
      method: 'POST',
      body: groupData
    });
  },

  deleteFamilyGroup: async (groupId) => {
    return request(`/user/family-groups/${groupId}`, {
      method: 'DELETE'
    });
  },

  getFamilyGroupMessages: async (groupId) => {
    return request(`/user/family-groups/${groupId}/messages`, { method: 'GET' });
  },

  sendFamilyGroupMessage: async (groupId, data) => {
    return request(`/user/family-groups/${groupId}/messages`, {
      method: 'POST',
      body: data
    });
  },

  // 9. E-Invites (Owner)
  getInvites: async () => {
    return request('/user/invites', { method: 'GET' });
  },

  getInviteById: async (inviteId) => {
    return request(`/user/invites/${inviteId}`, { method: 'GET' });
  },

  createInvite: async (inviteData) => {
    return request('/user/invites', {
      method: 'POST',
      body: inviteData
    });
  },

  updateInvite: async (inviteId, inviteData) => {
    return request(`/user/invites/${inviteId}`, {
      method: 'PUT',
      body: inviteData
    });
  },

  deleteInvite: async (inviteId) => {
    return request(`/user/invites/${inviteId}`, {
      method: 'DELETE'
    });
  },

  // 10. Public Invitation & RSVP
  getPublicInvite: async (slug) => {
    return request(`/public/invites/${slug}`, { method: 'GET' });
  },

  submitPublicRSVP: async (slug, rsvpData) => {
    return request(`/public/invites/${slug}/rsvp`, {
      method: 'POST',
      body: rsvpData
    });
  },

  // 11. Vendor Complaints / Reports
  createComplaint: async (complaintData) => {
    return request('/user/complaints', {
      method: 'POST',
      body: complaintData
    });
  },

  getUserComplaints: async () => {
    return request('/user/complaints', { method: 'GET' });
  },

  getComplaintById: async (complaintId) => {
    return request(`/user/complaints/${complaintId}`, { method: 'GET' });
  },

  // 12. Planning Dashboard Consolidated Summary & Weather
  getPlanningSummary: async () => {
    return request('/user/planning-summary', { method: 'GET' });
  },

  getWeather: async (city = '', date = '') => {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (date) params.append('date', date);
    const query = params.toString();
    return request(`/user/weather${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  // ==========================================
  // PHASE 7 — ADVANCED USER EXPERIENCE APIS
  // ==========================================

  // 13. Personalized Dashboard Summary
  getDashboardSummary: async () => {
    return request('/user/dashboard-summary', { method: 'GET' });
  },

  // 14. Planning Calendar
  getCalendar: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/user/calendar${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  // 15. User Notifications & Activities
  getNotifications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/user/notifications${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  getUnreadNotificationCount: async () => {
    return request('/user/notifications/unread-count', { method: 'GET' });
  },

  markNotificationRead: async (notificationId) => {
    return request(`/user/notifications/${notificationId}/read`, { method: 'PUT' });
  },

  markAllNotificationsRead: async () => {
    return request('/user/notifications/read-all', { method: 'PUT' });
  },

  getUserActivities: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/user/activities${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  // 16. Family Collaboration Extensions
  getFamilyGroupById: async (groupId) => {
    return request(`/user/family-groups/${groupId}`, { method: 'GET' });
  },

  updateFamilyGroup: async (groupId, groupData) => {
    return request(`/user/family-groups/${groupId}`, {
      method: 'PUT',
      body: groupData
    });
  },

  inviteFamilyMember: async (groupId, memberData) => {
    return request(`/user/family-groups/${groupId}/members`, {
      method: 'POST',
      body: memberData
    });
  },

  respondFamilyInvitation: async (groupId, accept) => {
    return request(`/user/family-groups/${groupId}/invitations/respond`, {
      method: 'PUT',
      body: { accept }
    });
  },

  removeFamilyMember: async (groupId, memberId) => {
    return request(`/user/family-groups/${groupId}/members/${memberId}`, {
      method: 'DELETE'
    });
  },

  getFamilySharedData: async (groupId) => {
    return request(`/user/family-groups/${groupId}/shared-data`, { method: 'GET' });
  },

  // 17. Inspiration Gallery
  getInspirationGallery: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/user/inspiration-gallery${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  // 18. E-Invite Share Tracking
  trackInviteShare: async (slug, platform) => {
    try {
      return await request(`/public/invites/${slug}/share`, {
        method: 'POST',
        body: { platform }
      });
    } catch (e) {
      return { success: true };
    }
  },

  // 19. User Authentication & Account Management
  forgotPassword: async (email) => {
    return request('/user/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },

  resetPassword: async (token, newPassword) => {
    return request('/user/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword }
    });
  },

  changePassword: async (currentPassword, newPassword) => {
    return request('/user/profile/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword }
    });
  },

  deleteAccount: async (password, confirmation = 'DELETE') => {
    return request('/user/profile/delete-account', {
      method: 'POST',
      body: { password, confirmation }
    });
  }
};

export default userApi;

