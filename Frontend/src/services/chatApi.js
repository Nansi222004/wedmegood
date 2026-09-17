const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeaders(isVendor = false) {
    let token;
    if (isVendor) {
        token = localStorage.getItem('vendorToken');
    } else {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            token = userData?.token || null;
        } catch {
            token = null;
        }
    }
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

export const chatApi = {
    // User endpoints
    createConversation: async (vendorId) => {
        const res = await fetch(`${API_BASE_URL}/user/conversations`, {
            method: 'POST',
            headers: getAuthHeaders(false),
            body: JSON.stringify({ vendorId })
        });
        return res.json();
    },

    getUserConversations: async () => {
        const res = await fetch(`${API_BASE_URL}/user/conversations`, {
            headers: getAuthHeaders(false)
        });
        return res.json();
    },

    getUserConversationById: async (id) => {
        const res = await fetch(`${API_BASE_URL}/user/conversations/${id}`, {
            headers: getAuthHeaders(false)
        });
        return res.json();
    },

    // Vendor endpoints
    getVendorConversations: async () => {
        const res = await fetch(`${API_BASE_URL}/vendor/conversations`, {
            headers: getAuthHeaders(true)
        });
        return res.json();
    },

    getVendorConversationById: async (id) => {
        const res = await fetch(`${API_BASE_URL}/vendor/conversations/${id}`, {
            headers: getAuthHeaders(true)
        });
        return res.json();
    },

    // Shared message history
    getMessages: async (conversationId, { before = null, limit = 30 } = {}, isVendor = false) => {
        const prefix = isVendor ? 'vendor' : 'user';
        let url = `${API_BASE_URL}/${prefix}/conversations/${conversationId}/messages?limit=${limit}`;
        if (before) {
            url += `&before=${encodeURIComponent(before)}`;
        }
        const res = await fetch(url, {
            headers: getAuthHeaders(isVendor)
        });
        return res.json();
    },

    // REST fallback for sending messages
    sendMessage: async (conversationId, data, isVendor = false) => {
        const prefix = isVendor ? 'vendor' : 'user';
        const res = await fetch(`${API_BASE_URL}/${prefix}/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: getAuthHeaders(isVendor),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // Mark messages as read
    markAsRead: async (conversationId, isVendor = false) => {
        const prefix = isVendor ? 'vendor' : 'user';
        const res = await fetch(`${API_BASE_URL}/${prefix}/conversations/${conversationId}/read`, {
            method: 'POST',
            headers: getAuthHeaders(isVendor)
        });
        return res.json();
    },

    // Share quote (Vendor only)
    shareQuote: async (conversationId, quoteId) => {
        const res = await fetch(`${API_BASE_URL}/vendor/conversations/${conversationId}/quote`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: JSON.stringify({ quoteId })
        });
        return res.json();
    },

    // Pre-authorized media upload
    uploadAttachment: async (conversationId, file, text = '', isVendor = false) => {
        const token = isVendor ? localStorage.getItem('vendorToken') : localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);
        if (text) formData.append('text', text);

        const res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/attachments`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
        });
        return res.json();
    },

    // Report conversation or message
    reportChat: async (conversationId, { messageId = null, reason, description = '' }, isVendor = false) => {
        const prefix = isVendor ? 'vendor' : 'user';
        const res = await fetch(`${API_BASE_URL}/${prefix}/conversations/${conversationId}/reports`, {
            method: 'POST',
            headers: getAuthHeaders(isVendor),
            body: JSON.stringify({ messageId, reason, description })
        });
        return res.json();
    }
};

export default chatApi;
