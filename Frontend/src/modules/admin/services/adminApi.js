const API_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/admin` 
    : (window.location.hostname === 'localhost' ? '/api/admin' : 'https://wedmegood1-2.onrender.com/api/admin');

export const adminApi = {
    getVendors: async (token) => {
        const res = await fetch(`${API_URL}/vendors`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await res.json();
    },

    getVendorsWithServices: async (token) => {
        const res = await fetch(`${API_URL}/vendors-services`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await res.json();
    },

    getUsers: async (token) => {
        const res = await fetch(`${API_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await res.json();
    },

    updateVendorStatus: async (vendorId, status, token) => {
        const res = await fetch(`${API_URL}/vendors/${vendorId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        return await res.json();
    },

    toggleVendorActive: async (vendorId, isActive, token) => {
        const res = await fetch(`${API_URL}/vendors/${vendorId}/active`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isActive })
        });
        return await res.json();
    },

    toggleServiceActive: async (serviceId, isActive, token) => {
        const res = await fetch(`${API_URL}/services/${serviceId}/active`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isActive })
        });
        return await res.json();
    },

    getStats: async (token) => {
        const res = await fetch(`${API_URL}/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await res.json();
    },

    getSubscriptionPlans: async (token) => {
        const res = await fetch(`${API_URL}/subscription-plans`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    createSubscriptionPlan: async (data, token) => {
        const res = await fetch(`${API_URL}/subscription-plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    updateSubscriptionPlan: async (id, data, token) => {
        const res = await fetch(`${API_URL}/subscription-plans/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    deleteSubscriptionPlan: async (id, token) => {
        const res = await fetch(`${API_URL}/subscription-plans/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await res.json();
    },

    // Category Management
    getCategories: async (token) => {
        const url = token ? `${API_URL}/categories/all` : `${API_URL}/categories`;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(url, { headers });
        return await res.json();
    },

    createCategory: async (data, token) => {
        const res = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    updateCategory: async (id, data, token) => {
        const res = await fetch(`${API_URL}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    deleteCategory: async (id, token) => {
        const res = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getReviews: async (token) => {
        const res = await fetch(`${API_URL}/reviews`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    deleteReview: async (id, token) => {
        const res = await fetch(`${API_URL}/reviews/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getAnalytics: async (token) => {
        const res = await fetch(`${API_URL}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getBookings: async (token) => {
        const res = await fetch(`${API_URL}/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getVendorLedger: async (token) => {
        const res = await fetch(`${API_URL}/vendor-ledger`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getPayments: async (token) => {
        const res = await fetch(`${API_URL}/payments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    deleteVendor: async (id, token) => {
        const res = await fetch(`${API_URL}/vendors/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    deleteUser: async (id, token) => {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getPolicy: async (type, token) => {
        const res = await fetch(`${API_URL}/policies/${type}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    updatePolicy: async (type, data, token) => {
        const res = await fetch(`${API_URL}/policies/${type}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    getTickets: async (token) => {
        const res = await fetch(`${API_URL}/tickets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    updateTicketStatus: async (id, status, token) => {
        const res = await fetch(`${API_URL}/tickets/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        return await res.json();
    },

    replyToTicket: async (id, message, token) => {
        const res = await fetch(`${API_URL}/tickets/${id}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message })
        });
        return await res.json();
    },

    deleteTicket: async (id, token) => {
        const res = await fetch(`${API_URL}/tickets/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    // FAQ Management
    getFAQs: async () => {
        const res = await fetch(`${API_URL}/faqs`);
        return await res.json();
    },

    createFAQ: async (data, token) => {
        const res = await fetch(`${API_URL}/faqs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    updateFAQ: async (id, data, token) => {
        const res = await fetch(`${API_URL}/faqs/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    deleteFAQ: async (id, token) => {
        const res = await fetch(`${API_URL}/faqs/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    // Support Config
    getSupportConfig: async () => {
        const res = await fetch(`${API_URL}/support-config`);
        return await res.json();
    },

    updateSupportConfig: async (data, token) => {
        const res = await fetch(`${API_URL}/support-config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    // SubCategories
    getSubCategories: async (categoryId, token) => {
        const url = categoryId ? `${API_URL}/subcategories?categoryId=${categoryId}` : `${API_URL}/subcategories`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        return await res.json();
    },
    createSubCategory: async (data, token) => {
        const res = await fetch(`${API_URL}/subcategories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    updateSubCategory: async (id, data, token) => {
        const res = await fetch(`${API_URL}/subcategories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    deleteSubCategory: async (id, token) => {
        const res = await fetch(`${API_URL}/subcategories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    // FormTemplates
    getFormTemplates: async (categoryId, subCategoryId, token) => {
        let query = [];
        if (categoryId) query.push(`categoryId=${categoryId}`);
        if (subCategoryId) query.push(`subCategoryId=${subCategoryId}`);
        const url = `${API_URL}/form-templates` + (query.length ? `?${query.join('&')}` : '');
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        return await res.json();
    },
    createFormTemplate: async (data, token) => {
        const res = await fetch(`${API_URL}/form-templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    updateFormTemplate: async (id, data, token) => {
        const res = await fetch(`${API_URL}/form-templates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    deleteFormTemplate: async (id, token) => {
        const res = await fetch(`${API_URL}/form-templates/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    // VendorServices (Dynamic)
    getDynamicVendorServices: async (status, token) => {
        const url = status ? `${API_URL}/vendor-services?status=${status}` : `${API_URL}/vendor-services`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        return await res.json();
    },
    updateVendorServiceStatus: async (id, status, token) => {
        const res = await fetch(`${API_URL}/vendor-services/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        return await res.json();
    }
};
