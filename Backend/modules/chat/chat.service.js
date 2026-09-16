const mongoose = require('mongoose');
const Conversation = require('../vendor/Conversation');
const Message = require('../vendor/Message');
const ChatReport = require('../vendor/ChatReport');
const Lead = require('../vendor/Lead');
const Quote = require('../vendor/Quote');
const User = require('../user/user.model');
const Vendor = require('../vendor/Vendor');
const { createNotification } = require('../../services/notification.service');

/**
 * Sanitizes a message for safe socket/REST transmission without exposing PII.
 */
function sanitizeMessage(msg) {
    if (!msg) return null;
    const doc = msg.toObject ? msg.toObject() : msg;
    return {
        _id: doc._id,
        conversationId: doc.conversationId,
        senderId: doc.senderId,
        senderRole: doc.senderRole,
        senderModel: doc.senderModel || (doc.senderRole === 'Vendor' ? 'Vendor' : 'User'),
        type: doc.type || 'text',
        text: doc.text || '',
        clientMessageId: doc.clientMessageId,
        attachments: doc.attachments || [],
        quoteId: doc.quoteId,
        metadata: doc.metadata || {},
        isRead: doc.isRead || false,
        readAt: doc.readAt,
        deliveredAt: doc.deliveredAt || doc.createdAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    };
}

/**
 * Sanitizes conversation metadata for safe client consumption.
 */
function sanitizeConversation(conv) {
    if (!conv) return null;
    const doc = conv.toObject ? conv.toObject() : conv;
    return {
        _id: doc._id,
        userId: doc.userId,
        vendorId: doc.vendorId,
        leadId: doc.leadId,
        bookingId: doc.bookingId,
        status: doc.status || 'Active',
        userUnreadCount: doc.userUnreadCount || 0,
        vendorUnreadCount: doc.vendorUnreadCount || 0,
        lastMessage: doc.lastMessage || null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    };
}

/**
 * Find or create a canonical conversation for a (userId, vendorId) pair.
 */
async function getOrCreateConversation({ userId, vendorId, leadId = null, bookingId = null, initialMessage = null }) {
    if (!userId || !vendorId) {
        throw new Error('userId and vendorId are required');
    }

    let conversation = await Conversation.findOne({
        userId,
        vendorId
    });

    if (conversation) {
        let modified = false;
        // If a new lead is associated, record it without losing past history
        if (leadId && (!conversation.leadId || conversation.leadId.toString() !== leadId.toString())) {
            conversation.leadHistory = conversation.leadHistory || [];
            if (conversation.leadId) {
                conversation.leadHistory.push({
                    leadId: conversation.leadId,
                    linkedAt: new Date()
                });
            }
            conversation.leadId = leadId;
            modified = true;
        }

        if (bookingId && (!conversation.bookingId || conversation.bookingId.toString() !== bookingId.toString())) {
            conversation.bookingId = bookingId;
            modified = true;
        }

        if (modified) {
            await conversation.save();
        }
    } else {
        // Create new canonical conversation
        conversation = await Conversation.create({
            userId,
            vendorId,
            leadId,
            bookingId,
            status: 'Active',
            userUnreadCount: 0,
            vendorUnreadCount: 0,
            participants: [
                { participantId: userId, participantModel: 'User' },
                { participantId: vendorId, participantModel: 'Vendor' }
            ]
        });

        if (initialMessage && initialMessage.trim()) {
            await createMessage({
                conversationId: conversation._id,
                senderId: userId,
                senderRole: 'User',
                type: 'text',
                text: initialMessage.trim()
            });
        }
    }

    return conversation;
}

/**
 * Fetch a conversation and enforce tenant authorization.
 */
async function getAuthorizedConversation({ conversationId, requesterId, requesterRole }) {
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
        const err = new Error('Invalid conversation ID');
        err.status = 400;
        throw err;
    }

    const conversation = await Conversation.findById(conversationId)
        .populate('userId', 'name profileImage city')
        .populate('vendorId', 'name businessName profileImage category city rating isVerified')
        .populate('leadId', 'service eventDate status budget guestCount')
        .populate('bookingId', 'bookingNumber eventDate totalPrice status paymentStatus');

    if (!conversation) {
        const err = new Error('Conversation not found');
        err.status = 404;
        throw err;
    }

    // Role-based tenant isolation
    if (requesterRole === 'User') {
        const convUserId = conversation.userId?._id || conversation.userId;
        if (convUserId.toString() !== requesterId.toString()) {
            const err = new Error('Unauthorized access to conversation');
            err.status = 403;
            throw err;
        }
    } else if (requesterRole === 'Vendor') {
        const convVendorId = conversation.vendorId?._id || conversation.vendorId;
        if (convVendorId.toString() !== requesterId.toString()) {
            const err = new Error('Unauthorized access to conversation');
            err.status = 403;
            throw err;
        }
    } else if (requesterRole !== 'Admin') {
        const err = new Error('Forbidden');
        err.status = 403;
        throw err;
    }

    return conversation;
}

/**
 * List conversations for a User.
 */
async function getUserConversations(userId) {
    return Conversation.find({ userId })
        .populate('vendorId', 'name businessName profileImage category city rating isVerified')
        .populate('leadId', 'service eventDate status')
        .populate('bookingId', 'bookingNumber eventDate totalPrice status paymentStatus')
        .sort({ updatedAt: -1 })
        .lean();
}

/**
 * List conversations for a Vendor.
 */
async function getVendorConversations(vendorId) {
    return Conversation.find({ vendorId })
        .populate('userId', 'name profileImage city')
        .populate('leadId', 'service eventDate status')
        .populate('bookingId', 'bookingNumber eventDate totalPrice status paymentStatus')
        .sort({ updatedAt: -1 })
        .lean();
}

/**
 * Fetch messages with cursor pagination.
 */
async function getConversationMessages({ conversationId, requesterId, requesterRole, limit = 30, before = null }) {
    await getAuthorizedConversation({ conversationId, requesterId, requesterRole });

    const query = { conversationId };
    if (before) {
        const beforeDate = new Date(before);
        if (!isNaN(beforeDate.getTime())) {
            query.createdAt = { $lt: beforeDate };
        }
    }

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

    const messages = await Message.find(query)
        .populate('quoteId', 'items totalAmount taxAmount discountAmount status validUntil')
        .sort({ createdAt: -1 })
        .limit(limitNum + 1)
        .lean();

    const hasMore = messages.length > limitNum;
    if (hasMore) {
        messages.pop();
    }

    // Return in chronological order
    messages.reverse();

    return {
        messages: messages.map(sanitizeMessage),
        hasMore
    };
}

/**
 * Single source of truth for creating a message (used by Socket.IO and REST).
 */
async function createMessage({
    conversationId,
    senderId,
    senderRole,
    type = 'text',
    text = '',
    attachments = [],
    quoteId = null,
    metadata = {},
    clientMessageId = null
}) {
    if (!conversationId || !senderId || !senderRole) {
        const err = new Error('Missing required message parameters');
        err.status = 400;
        throw err;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        const err = new Error('Conversation not found');
        err.status = 404;
        throw err;
    }

    if (conversation.status === 'Blocked') {
        const err = new Error('Conversation is blocked');
        err.status = 403;
        throw err;
    }

    // Verify sender belongs to conversation
    if (senderRole === 'User') {
        if (conversation.userId.toString() !== senderId.toString()) {
            const err = new Error('Unauthorized sender for conversation');
            err.status = 403;
            throw err;
        }
    } else if (senderRole === 'Vendor') {
        if (conversation.vendorId.toString() !== senderId.toString()) {
            const err = new Error('Unauthorized sender for conversation');
            err.status = 403;
            throw err;
        }
    } else if (senderRole !== 'System' && senderRole !== 'Admin') {
        const err = new Error('Invalid sender role');
        err.status = 403;
        throw err;
    }

    // Idempotency check: if clientMessageId provided, return existing message if already saved
    if (clientMessageId && typeof clientMessageId === 'string' && clientMessageId.trim()) {
        const existingMessage = await Message.findOne({
            conversationId,
            senderId,
            clientMessageId: clientMessageId.trim()
        }).populate('quoteId', 'items totalAmount status validUntil');

        if (existingMessage) {
            return {
                message: sanitizeMessage(existingMessage),
                conversation: sanitizeConversation(conversation),
                isDuplicate: true
            };
        }
    }

    // Strict Quote Validation
    if (type === 'quote') {
        if (!quoteId) {
            const err = new Error('quoteId is required for quote messages');
            err.status = 400;
            throw err;
        }

        if (senderRole !== 'Vendor') {
            const err = new Error('Only vendors can share quotes in chat');
            err.status = 403;
            throw err;
        }

        const quote = await Quote.findById(quoteId);
        if (!quote) {
            const err = new Error('Quote not found');
            err.status = 404;
            throw err;
        }

        // Strict cross-vendor quote ownership check
        if (quote.vendorId.toString() !== senderId.toString()) {
            const err = new Error('Cannot share quote belonging to another vendor');
            err.status = 403;
            throw err;
        }

        // Quote must belong to same user as conversation
        if (quote.userId.toString() !== conversation.userId.toString()) {
            const err = new Error('Quote user does not match conversation user');
            err.status = 403;
            throw err;
        }

        if (!metadata || Object.keys(metadata).length === 0) {
            metadata = {
                quoteAmount: quote.totalAmount || 0,
                quoteStatus: quote.status,
                quoteItems: quote.items || [],
                quoteValidUntil: quote.validUntil
            };
        }
    }

    // Text length guard
    let cleanText = typeof text === 'string' ? text.trim().slice(0, 5000) : '';
    if (!cleanText && type === 'quote' && metadata?.quoteAmount) {
        cleanText = `Formal Quote for ₹${Number(metadata.quoteAmount).toLocaleString()}`;
    }

    const message = await Message.create({
        conversationId,
        senderId,
        senderRole,
        senderModel: senderRole === 'Vendor' ? 'Vendor' : 'User',
        type,
        text: cleanText,
        clientMessageId: clientMessageId ? clientMessageId.trim() : undefined,
        attachments: Array.isArray(attachments) ? attachments : [],
        quoteId,
        metadata,
        isRead: false,
        deliveredAt: new Date()
    });

    // Populate quote if type is quote
    if (quoteId) {
        await message.populate('quoteId', 'items totalAmount taxAmount discountAmount status validUntil');
    }

    // Prepare preview text for lastMessage
    let previewText = cleanText;
    if (!previewText) {
        if (type === 'quote') previewText = 'Shared a customized quote';
        else if (type === 'image') previewText = 'Shared an image';
        else if (type === 'document') previewText = 'Shared a document';
        else if (type === 'voice') previewText = 'Shared a voice note';
        else previewText = 'Sent a message';
    }

    // Atomic update of conversation: lastMessage and recipient unread count
    const incField = senderRole === 'User' ? { vendorUnreadCount: 1 } : { userUnreadCount: 1 };
    const updatedConversation = await Conversation.findByIdAndUpdate(
        conversationId,
        {
            $set: {
                lastMessage: {
                    text: previewText,
                    senderId,
                    senderRole,
                    type,
                    createdAt: new Date()
                }
            },
            $inc: incField
        },
        { new: true }
    );

    // Non-blocking async notification dispatch for offline recipients
    if (senderRole === 'Vendor') {
        createNotification({
            userId: conversation.userId,
            title: 'New message from vendor',
            message: previewText.slice(0, 100),
            type: 'booking',
            entityType: 'General',
            entityId: conversation._id,
            customLink: `/user/chats/${conversation.vendorId}`
        }).catch(() => {});
    }

    return {
        message: sanitizeMessage(message),
        conversation: sanitizeConversation(updatedConversation),
        isDuplicate: false
    };
}

/**
 * Bulk read receipts execution directly in MongoDB.
 */
async function markMessagesRead({ conversationId, readerId, readerRole }) {
    await getAuthorizedConversation({ conversationId, requesterId: readerId, requesterRole: readerRole });

    const readAt = new Date();

    // Mark all unread messages from the other participant as read
    await Message.updateMany(
        {
            conversationId,
            senderId: { $ne: readerId },
            isRead: false
        },
        {
            $set: {
                isRead: true,
                readAt
            }
        }
    );

    // Reset reader's unread counter atomically
    const resetField = readerRole === 'User' ? { userUnreadCount: 0 } : { vendorUnreadCount: 0 };
    await Conversation.findByIdAndUpdate(conversationId, { $set: resetField });

    return {
        success: true,
        conversationId,
        readerId,
        readerRole,
        readAt
    };
}

/**
 * Submit report for a message or conversation.
 */
async function createChatReport({ reporterId, reporterRole, conversationId, messageId = null, reason, description = '' }) {
    await getAuthorizedConversation({ conversationId, requesterId: reporterId, requesterRole: reporterRole });

    // Check duplicate pending report
    const existing = await ChatReport.findOne({
        conversationId,
        reporterId,
        messageId: messageId || null,
        status: { $in: ['Pending', 'In-Review'] }
    });

    if (existing) {
        return { report: existing, isDuplicate: true };
    }

    const report = await ChatReport.create({
        reporterId,
        reporterRole,
        reporterModel: reporterRole === 'Vendor' ? 'Vendor' : 'User',
        conversationId,
        messageId: messageId || null,
        reason,
        description: (description || '').trim().slice(0, 1000),
        status: 'Pending'
    });

    try {
        const AdminLog = require('../admin/AdminLog');
        await AdminLog.create({
            user: reporterRole || 'User',
            action: 'CHAT_REPORT_SUBMITTED',
            entityType: 'ChatReport',
            entityId: report._id.toString(),
            targetId: report._id.toString(),
            details: {
                reporterId: reporterId.toString(),
                reporterRole,
                conversationId: conversationId.toString(),
                reason
            }
        });
    } catch (logErr) {
        console.warn('ChatReport AdminLog notice:', logErr.message);
    }

    return { report, isDuplicate: false };
}

module.exports = {
    sanitizeMessage,
    sanitizeConversation,
    getOrCreateConversation,
    getAuthorizedConversation,
    getUserConversations,
    getVendorConversations,
    getConversationMessages,
    createMessage,
    markMessagesRead,
    createChatReport
};
