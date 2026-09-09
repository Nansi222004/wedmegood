const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') + '/vendor';

export const vendorApi = {
    register: async (data) => {
        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    login: async (email, password) => {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return response.json();
    },

    sendRegistrationOtp: async (phone) => {
        const response = await fetch(`${BASE_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        return response.json();
    },

    verifyRegistrationOtp: async (phone, otp) => {
        const response = await fetch(`${BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
        });
        return response.json();
    },

    uploadPublicMedia: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${BASE_URL}/upload/public`, {
            method: 'POST',
            body: formData
        });
        return response.json();
    },

    uploadPublicMultipleMedia: async (files) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const response = await fetch(`${BASE_URL}/upload-multiple/public`, {
            method: 'POST',
            body: formData
        });
        return response.json();
    },

    updateOnboarding: async (step, data, token) => {

        const response = await fetch(`${BASE_URL}/onboarding/${step}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    getProfile: async (token) => {
        const response = await fetch(`${BASE_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    },

    uploadMedia: async (file, token) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        return response.json();
    },

    getStats: async (token) => {
        const response = await fetch(`${BASE_URL}/stats`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    getLeads: async (token) => {
        const response = await fetch(`${BASE_URL}/leads`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    updateLeadStatus: async (id, status, token) => {
        const response = await fetch(`${BASE_URL}/leads/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        return response.json();
    },

    getBookings: async (token) => {
        const response = await fetch(`${BASE_URL}/bookings`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    updateBookingStatus: async (id, status, token) => {
        const response = await fetch(`${BASE_URL}/bookings/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        return response.json();
    },

    getReviews: async (token) => {
        const response = await fetch(`${BASE_URL}/reviews`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    replyToReview: async (id, reply, token) => {
        const response = await fetch(`${BASE_URL}/reviews/${id}/reply`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reply })
        });
        return response.json();
    },

    getNotifications: async (token) => {
        const response = await fetch(`${BASE_URL}/notifications`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    markNotificationRead: async (id, token) => {
        const response = await fetch(`${BASE_URL}/notifications/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    getSubscriptionPlans: async (token) => {
        const response = await fetch(`${BASE_URL}/subscription/plans`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    createSubscriptionOrder: async (data, token) => {
        const response = await fetch(`${BASE_URL}/subscription/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    verifySubscriptionPayment: async (data, token) => {
        const response = await fetch(`${BASE_URL}/subscription/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    updateProfile: async (data, token) => {
        const response = await fetch(`${BASE_URL}/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    changePassword: async (currentPassword, newPassword, token) => {
        const response = await fetch(`${BASE_URL}/settings/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        return response.json();
    },

    deactivateAccount: async (token) => {
        const response = await fetch(`${BASE_URL}/settings/deactivate`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },



    getQuotes: async (token) => {
        const response = await fetch(`${BASE_URL}/quotes`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    createQuote: async (data, token) => {
        const response = await fetch(`${BASE_URL}/quotes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    updateQuote: async (id, data, token) => {
        const response = await fetch(`${BASE_URL}/quotes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    createBooking: async (data, token) => {
        const response = await fetch(`${BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    deleteQuote: async (id, token) => {
        const response = await fetch(`${BASE_URL}/quotes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    },

    getEarnings: async (token) => {
        const response = await fetch(`${BASE_URL}/earnings`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    updatePortfolio: async (data, token) => {
        const response = await fetch(`${BASE_URL}/portfolio`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ portfolio: data })
        });
        return response.json();
    },

    getDashboardBanners: async (token) => {
        const response = await fetch(`${BASE_URL}/banners`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    getFAQs: async () => {
        const response = await fetch(`${BASE_URL.replace('/vendor', '/admin')}/faqs`);
        return response.json();
    },

    getSupportConfig: async () => {
        const response = await fetch(`${BASE_URL.replace('/vendor', '/admin')}/support-config`);
        return response.json();
    },

    // ---------------------------------
    // Service Management
    // ---------------------------------
    getCategories: async () => {
        const response = await fetch(`${BASE_URL.replace('/vendor', '/admin')}/categories`);
        return response.json();
    },

    getServices: async (token) => {
        const response = await fetch(`${BASE_URL}/services`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    createService: async (formData, token) => {
        const response = await fetch(`${BASE_URL}/services`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        return response.json();
    },

    updateService: async (id, formData, token) => {
        const response = await fetch(`${BASE_URL}/services/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        return response.json();
    },

    deleteService: async (id, token) => {
        const response = await fetch(`${BASE_URL}/services/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    getDynamicVendorServices: async (token) => {
        const response = await fetch(`${BASE_URL}/dynamic-services`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    createDynamicVendorService: async (data, token) => {
        const response = await fetch(`${BASE_URL}/dynamic-services`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: data
        });
        return response.json();
    },

    getProfileProgress: async (token) => {
        const response = await fetch(`${BASE_URL}/profile-progress`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    uploadMissingDocuments: async (data, token) => {
        const response = await fetch(`${BASE_URL}/upload-document`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    requestApproval: async (token) => {
        const response = await fetch(`${BASE_URL}/request-approval`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });
        return response.json();
    }
};

