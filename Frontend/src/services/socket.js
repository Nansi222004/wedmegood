import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.currentConversationId = null;
        this.listeners = new Map();
    }

    connect(token) {
        if (this.socket && this.socket.connected) {
            return this.socket;
        }

        const backendUrl = import.meta.env.VITE_API_BASE_URL 
            ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '') 
            : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);

        this.socket = io(backendUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000
        });

        this.socket.on('connect', () => {
            // If reconnecting to an open conversation, automatically rejoin room
            if (this.currentConversationId) {
                this.socket.emit('conversation:join', { conversationId: this.currentConversationId });
            }
        });

        this.socket.on('connect_error', (err) => {
            console.warn('Socket connection error:', err.message);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.currentConversationId = null;
        }
    }

    joinConversation(conversationId, callback) {
        this.currentConversationId = conversationId;
        if (this.socket && this.socket.connected) {
            this.socket.emit('conversation:join', { conversationId }, callback);
        }
    }

    leaveConversation(conversationId) {
        if (this.currentConversationId === conversationId) {
            this.currentConversationId = null;
        }
        if (this.socket && this.socket.connected) {
            this.socket.emit('conversation:leave', { conversationId });
        }
    }

    sendMessage(data, callback) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('message:send', data, callback);
        } else if (callback) {
            callback({ success: false, error: 'Socket disconnected' });
        }
    }

    markAsRead(conversationId, callback) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('message:read', { conversationId }, callback);
        }
    }

    startTyping(conversationId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('typing:start', { conversationId });
        }
    }

    stopTyping(conversationId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('typing:stop', { conversationId });
        }
    }

    onMessage(callback) {
        if (!this.socket) return () => {};
        this.socket.on('message:new', callback);
        return () => this.socket?.off('message:new', callback);
    }

    onRead(callback) {
        if (!this.socket) return () => {};
        this.socket.on('message:read', callback);
        return () => this.socket?.off('message:read', callback);
    }

    onTypingStart(callback) {
        if (!this.socket) return () => {};
        this.socket.on('typing:start', callback);
        return () => this.socket?.off('typing:start', callback);
    }

    onTypingStop(callback) {
        if (!this.socket) return () => {};
        this.socket.on('typing:stop', callback);
        return () => this.socket?.off('typing:stop', callback);
    }

    onUserOnline(callback) {
        if (!this.socket) return () => {};
        this.socket.on('user:online', callback);
        return () => this.socket?.off('user:online', callback);
    }

    onUserOffline(callback) {
        if (!this.socket) return () => {};
        this.socket.on('user:offline', callback);
        return () => this.socket?.off('user:offline', callback);
    }

    onError(callback) {
        if (!this.socket) return () => {};
        this.socket.on('chat:error', callback);
        return () => this.socket?.off('chat:error', callback);
    }
}

export const socketService = new SocketService();
export default socketService;
