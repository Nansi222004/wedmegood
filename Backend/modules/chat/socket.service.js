const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../user/user.model');
const Vendor = require('../vendor/Vendor');
const PlatformSettings = require('../admin/PlatformSettings');
const chatService = require('./chat.service');

// Multi-tab role-prefixed presence map: Map<`${role}_${id}`, Set<socketId>>
const presenceMap = new Map();

// Rate limiting sliding window per socket: Map<socketId, number[]>
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 1000;
const MAX_MESSAGES_PER_SEC = 10;

function isRateLimited(socketId) {
    const now = Date.now();
    const timestamps = rateLimitMap.get(socketId) || [];
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    recent.push(now);
    rateLimitMap.set(socketId, recent);
    return recent.length > MAX_MESSAGES_PER_SEC;
}

/**
 * Socket.IO Handshake Authentication Middleware
 */
async function socketAuthMiddleware(socket, next) {
    try {
        const authHeader = socket.handshake.headers?.authorization;
        const authToken = socket.handshake.auth?.token;
        let token = authToken;

        if (!token && authHeader) {
            token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        }

        if (!token) {
            const err = new Error('Authentication token required');
            err.data = { code: 401, statusCode: 401 };
            return next(err);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (!decoded || !decoded.id) {
            const err = new Error('Invalid authentication token');
            err.data = { code: 401, statusCode: 401 };
            return next(err);
        }

        // Platform Maintenance Mode check
        const settings = await PlatformSettings.findOne({}).lean();
        if (settings && settings.maintenanceMode === true && decoded.role !== 'admin') {
            const err = new Error('Service unavailable - maintenance mode');
            err.data = { code: 503, statusCode: 503 };
            return next(err);
        }

        // Resolve authenticated entity
        if (decoded.role === 'admin') {
            socket.user = {
                id: decoded.id,
                role: 'Admin',
                name: 'Administrator',
                email: decoded.email || 'admin@utsavo.com'
            };
            return next();
        }

        // Check User model
        const user = await User.findById(decoded.id).select('name email isActive isBlocked role').lean();
        if (user) {
            if (user.isBlocked || user.isActive === false) {
                const err = new Error('User not found or inactive');
                err.data = { code: 403, statusCode: 403 };
                return next(err);
            }
            socket.user = {
                id: user._id.toString(),
                role: 'User',
                name: user.name,
                email: user.email
            };
            return next();
        }

        // Check Vendor model
        const vendor = await Vendor.findById(decoded.id).select('name businessName email status isActive').lean();
        if (vendor) {
            if (vendor.isActive === false || vendor.status === 'Suspended') {
                const err = new Error('User not found or inactive');
                err.data = { code: 403, statusCode: 403 };
                return next(err);
            }
            socket.user = {
                id: vendor._id.toString(),
                role: 'Vendor',
                name: vendor.businessName || vendor.name,
                email: vendor.email
            };
            return next();
        }

        const err = new Error('User not found or inactive');
        err.data = { code: 401, statusCode: 401 };
        return next(err);
    } catch (err) {
        const error = new Error('Invalid authentication token');
        error.data = { code: 401, statusCode: 401 };
        return next(error);
    }
}

/**
 * Initialize Socket.IO with complete authentication, room security, and chat event handlers.
 */
function initSocketService(io) {
    // Apply strict authentication middleware
    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
        const user = socket.user;
        const presenceKey = `${user.role}_${user.id}`;

        // Register multi-tab presence
        if (!presenceMap.has(presenceKey)) {
            presenceMap.set(presenceKey, new Set());
            // Broadcast online status to connected clients
            socket.broadcast.emit('user:online', {
                id: user.id,
                role: user.role,
                name: user.name
            });
            socket.broadcast.emit('presence:update', {
                id: user.id,
                role: user.role,
                isOnline: true
            });
        }
        presenceMap.get(presenceKey).add(socket.id);

        // ----------------------------------------------------
        // EVENT: conversation:join & join:conversation
        // ----------------------------------------------------
        const handleJoin = async (data, callback) => {
            try {
                const conversationId = typeof data === 'string' ? data : data?.conversationId;
                if (!conversationId) {
                    if (callback) callback({ success: false, error: 'conversationId required' });
                    return;
                }

                // Verify DB membership before joining room
                await chatService.getAuthorizedConversation({
                    conversationId,
                    requesterId: user.id,
                    requesterRole: user.role
                });

                const roomName = `conversation_${conversationId}`;
                socket.join(roomName);

                socket.emit('conversation:joined', { conversationId });
                if (callback) callback({ success: true, conversationId });
            } catch (err) {
                socket.emit('chat:error', { error: err.message });
                if (callback) callback({ success: false, error: err.message, status: err.status || 403 });
            }
        };
        socket.on('conversation:join', handleJoin);
        socket.on('join:conversation', handleJoin);

        // ----------------------------------------------------
        // EVENT: conversation:leave & leave:conversation
        // ----------------------------------------------------
        const handleLeave = (data, callback) => {
            const conversationId = typeof data === 'string' ? data : data?.conversationId;
            if (conversationId) {
                const roomName = `conversation_${conversationId}`;
                socket.leave(roomName);
                socket.emit('conversation:left', { conversationId });
                if (callback) callback({ success: true, conversationId });
            }
        };
        socket.on('conversation:leave', handleLeave);
        socket.on('leave:conversation', handleLeave);

        // ----------------------------------------------------
        // EVENT: family_group:join & family_group:leave
        // ----------------------------------------------------
        const handleFamilyGroupJoin = async (data, callback) => {
            try {
                const groupId = typeof data === 'string' ? data : data?.groupId;
                if (!groupId) {
                    if (callback) callback({ success: false, error: 'groupId required' });
                    return;
                }
                const FamilyGroup = require('../user/FamilyGroup');
                const group = await FamilyGroup.findById(groupId);
                if (!group) throw new Error('Group not found');
                
                const userIdStr = String(user._id || user.id || '');
                const isMember = (group.userId && (group.userId.equals ? group.userId.equals(user.id) : String(group.userId._id || group.userId) === userIdStr)) ||
                                 group.members.some(m => m.userId && (m.userId.equals ? m.userId.equals(user.id) : String(m.userId._id || m.userId) === userIdStr) && m.status === 'accepted');
                if (!isMember) throw new Error('Not a member of this group');

                const roomName = `family_group_${groupId}`;
                socket.join(roomName);

                if (callback) callback({ success: true, groupId });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        };
        socket.on('family_group:join', handleFamilyGroupJoin);

        const handleFamilyGroupLeave = (data, callback) => {
            const groupId = typeof data === 'string' ? data : data?.groupId;
            if (groupId) {
                socket.leave(`family_group_${groupId}`);
            }
            if (callback) callback({ success: true });
        };
        socket.on('family_group:leave', handleFamilyGroupLeave);

        // ----------------------------------------------------
        // EVENT: message:send
        // ----------------------------------------------------
        socket.on('message:send', async (data, callback) => {
            try {
                if (isRateLimited(socket.id)) {
                    const errorMsg = 'Rate limit exceeded. Please slow down.';
                    socket.emit('chat:error', { error: errorMsg });
                    socket.emit('rate_limit_exceeded', { error: errorMsg });
                    if (callback) callback({ success: false, error: errorMsg, status: 429 });
                    return;
                }

                const {
                    conversationId,
                    text,
                    type = 'text',
                    attachments = [],
                    quoteId = null,
                    metadata = {},
                    clientMessageId = null
                } = data || {};

                if (!conversationId) {
                    if (callback) callback({ success: false, error: 'conversationId required' });
                    return;
                }

                // Delegate to single source of truth in chat.service
                const result = await chatService.createMessage({
                    conversationId,
                    senderId: user.id,
                    senderRole: user.role,
                    type,
                    text,
                    attachments,
                    quoteId,
                    metadata,
                    clientMessageId
                });

                // Broadcast to room
                const roomName = `conversation_${conversationId}`;
                io.to(roomName).emit('message:received', {
                    message: result.message,
                    conversationId
                });

                // Legacy event
                io.to(roomName).emit('message:new', {
                    message: result.message,
                    conversation: result.conversation
                });

                if (callback) {
                    callback({
                        success: true,
                        message: result.message,
                        isDuplicate: result.isDuplicate
                    });
                }
            } catch (err) {
                socket.emit('chat:error', { error: err.message });
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // ----------------------------------------------------
        // EVENT: message:read
        // ----------------------------------------------------
        socket.on('message:read', async (data, callback) => {
            try {
                const conversationId = typeof data === 'string' ? data : data?.conversationId;
                if (!conversationId) return;

                const result = await chatService.markMessagesRead({
                    conversationId,
                    readerId: user.id,
                    readerRole: user.role
                });

                const roomName = `conversation_${conversationId}`;
                io.to(roomName).emit('message:read', {
                    conversationId,
                    readerId: user.id,
                    readerRole: user.role,
                    readAt: result.readAt
                });

                if (callback) callback({ success: true, conversationId, readAt: result.readAt });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // ----------------------------------------------------
        // EVENT: typing:start & typing:stop
        // ----------------------------------------------------
        socket.on('typing:start', (data) => {
            const conversationId = typeof data === 'string' ? data : data?.conversationId;
            if (conversationId) {
                const roomName = `conversation_${conversationId}`;
                socket.to(roomName).emit('typing:start', {
                    conversationId,
                    sender: { id: user.id, name: user.name, role: user.role }
                });
                socket.to(roomName).emit('typing:update', {
                    conversationId,
                    isTyping: true,
                    user: { id: user.id, name: user.name, role: user.role }
                });
            }
        });

        socket.on('typing:stop', (data) => {
            const conversationId = typeof data === 'string' ? data : data?.conversationId;
            if (conversationId) {
                const roomName = `conversation_${conversationId}`;
                socket.to(roomName).emit('typing:stop', {
                    conversationId,
                    sender: { id: user.id, name: user.name, role: user.role }
                });
                socket.to(roomName).emit('typing:update', {
                    conversationId,
                    isTyping: false,
                    user: { id: user.id, name: user.name, role: user.role }
                });
            }
        });

        // ----------------------------------------------------
        // DISCONNECT
        // ----------------------------------------------------
        socket.on('disconnect', () => {
            rateLimitMap.delete(socket.id);

            const socketSet = presenceMap.get(presenceKey);
            if (socketSet) {
                socketSet.delete(socket.id);
                if (socketSet.size === 0) {
                    presenceMap.delete(presenceKey);
                    // Broadcast offline status once all tabs disconnect
                    socket.broadcast.emit('user:offline', {
                        id: user.id,
                        role: user.role
                    });
                    socket.broadcast.emit('presence:update', {
                        id: user.id,
                        role: user.role,
                        isOnline: false
                    });
                }
            }
        });
    });

    return {
        io,
        presenceMap,
        isUserOnline: (role, id) => presenceMap.has(`${role}_${id}`)
    };
}

module.exports = {
    initSocketService,
    socketAuthMiddleware,
    presenceMap
};
