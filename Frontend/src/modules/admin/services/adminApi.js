const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wedmegood-u0n7.onrender.com/api';
const API_URL = `${API_BASE_URL}/admin`;

export const adminApi = {
    getVendors: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/vendors${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getVendorsWithServices: async (token) => {
        const res = await fetch(`${API_URL}/vendors-services`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getUsers: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/users${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getUserById: async (id, token) => {
        const res = await fetch(`${API_URL}/users/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    updateUserStatus: async (id, data, token) => {
        const res = await fetch(`${API_URL}/users/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    updateVendorFeatured: async (vendorId, isFeatured, token) => {
        const res = await fetch(`${API_URL}/vendors/${vendorId}/featured`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isFeatured })
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

    getReviews: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/reviews${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    updateReviewStatus: async (id, status, token) => {
        const res = await fetch(`${API_URL}/reviews/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
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

    getBookings: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/bookings${query ? `?${query}` : ''}`, {
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
    },

    getVendorInventories: async (token) => {
        const res = await fetch(`${API_URL}/vendor-inventory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await res.json();
    },

    // Phase 5: Financial Management & Payouts
    getPayments: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/financial/payments${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getFinancialSummary: async (token) => {
        const res = await fetch(`${API_URL}/financial/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getFinancialTransactions: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/financial/transactions${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getWithdrawals: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/financial/withdrawals${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    updateWithdrawalStatus: async (id, data, token) => {
        const res = await fetch(`${API_URL}/financial/withdrawals/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    processRefund: async (data, token) => {
        const res = await fetch(`${API_URL}/financial/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    getReconciliation: async (token) => {
        const res = await fetch(`${API_URL}/financial/reconciliation`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    // Phase 6: Dashboard, Operations & Settings
    getDashboardSummary: async (token) => {
        const res = await fetch(`${API_URL}/dashboard/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getLeads: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/leads${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getQuotes: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/quotes${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    getComplaints: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/complaints${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    updateComplaintStatus: async (id, data, token) => {
        const res = await fetch(`${API_URL}/complaints/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    getPlatformSettings: async (token) => {
        const res = await fetch(`${API_URL}/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    updatePlatformSettings: async (data, token) => {
        const res = await fetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    getAuditLogs: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/logs${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    }
};

