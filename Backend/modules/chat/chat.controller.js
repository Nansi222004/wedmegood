const chatService = require('./chat.service');

// @desc    Start or get conversation with a vendor
// @route   POST /api/user/conversations
// @access  Private (User)
exports.createConversation = async (req, res, next) => {
    try {
        const { vendorId } = req.body;
        if (!vendorId) {
            return res.status(400).json({ success: false, message: 'vendorId is required' });
        }
        const conversation = await chatService.getOrCreateConversation({
            userId: req.user._id,
            vendorId
        });
        res.status(201).json({
            success: true,
            data: conversation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user conversations
// @route   GET /api/user/conversations
// @access  Private (User)
exports.getUserConversations = async (req, res, next) => {
    try {
        const conversations = await chatService.getUserConversations(req.user._id);
        res.status(200).json({
            success: true,
            count: conversations.length,
            data: conversations
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single user conversation by ID
// @route   GET /api/user/conversations/:id
// @access  Private (User)
exports.getUserConversationById = async (req, res, next) => {
    try {
        const conversation = await chatService.getAuthorizedConversation({
            conversationId: req.params.id,
            requesterId: req.user._id,
            requesterRole: 'User'
        });
        res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get vendor conversations
// @route   GET /api/vendor/conversations
// @access  Private (Vendor)
exports.getVendorConversations = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id || req.vendor._id;
        const conversations = await chatService.getVendorConversations(vendorId);
        res.status(200).json({
            success: true,
            count: conversations.length,
            data: conversations
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single vendor conversation by ID
// @route   GET /api/vendor/conversations/:id
// @access  Private (Vendor)
exports.getVendorConversationById = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id || req.vendor._id;
        const conversation = await chatService.getAuthorizedConversation({
            conversationId: req.params.id,
            requesterId: vendorId,
            requesterRole: 'Vendor'
        });
        res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get messages for a conversation (User or Vendor)
// @route   GET /api/user/conversations/:id/messages OR /api/vendor/conversations/:id/messages
// @access  Private
exports.getConversationMessages = async (req, res, next) => {
    try {
        const requesterId = req.user ? req.user._id : (req.vendor.id || req.vendor._id);
        const requesterRole = req.user ? 'User' : 'Vendor';

        const result = await chatService.getConversationMessages({
            conversationId: req.params.id,
            requesterId,
            requesterRole,
            limit: req.query.limit,
            before: req.query.before
        });

        res.status(200).json({
            success: true,
            count: result.messages.length,
            hasMore: result.hasMore,
            data: result.messages
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Send a message via REST (User or Vendor)
// @route   POST /api/user/conversations/:id/messages OR /api/vendor/conversations/:id/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
        const requesterId = req.user ? req.user._id : (req.vendor.id || req.vendor._id);
        const requesterRole = req.user ? 'User' : 'Vendor';
        const conversationId = req.params.id || req.body.conversationId;

        const {
            text,
            type = 'text',
            attachments,
            quoteId,
            metadata,
            clientMessageId
        } = req.body;

        const result = await chatService.createMessage({
            conversationId,
            senderId: requesterId,
            senderRole: requesterRole,
            type,
            text,
            attachments,
            quoteId,
            metadata,
            clientMessageId
        });

        // Broadcast to Socket.io room if available
        const io = req.app.get('io');
        if (io && !result.isDuplicate) {
            io.to(`conversation_${conversationId}`).emit('message:received', {
                message: result.message,
                conversationId
            });
            io.to(`conversation_${conversationId}`).emit('message:new', {
                message: result.message,
                conversation: result.conversation
            });
        }

        res.status(result.isDuplicate ? 200 : 201).json({
            success: true,
            data: result.message,
            isDuplicate: result.isDuplicate
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Mark conversation as read (User or Vendor)
// @route   POST /api/user/conversations/:id/read OR /api/vendor/conversations/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
    try {
        const requesterId = req.user ? req.user._id : (req.vendor.id || req.vendor._id);
        const requesterRole = req.user ? 'User' : 'Vendor';
        const conversationId = req.params.id;

        const result = await chatService.markMessagesRead({
            conversationId,
            readerId: requesterId,
            readerRole: requesterRole
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`conversation_${conversationId}`).emit('message:read', {
                conversationId,
                readerId: requesterId,
                readerRole: requesterRole,
                readAt: result.readAt
            });
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Share a quote in chat (Vendor only)
// @route   POST /api/vendor/conversations/:id/quote
// @access  Private (Vendor)
exports.shareQuote = async (req, res, next) => {
    try {
        const vendorId = req.vendor.id || req.vendor._id;
        const conversationId = req.params.id;
        const { quoteId } = req.body;

        if (!quoteId) {
            return res.status(400).json({ success: false, message: 'quoteId is required' });
        }

        const result = await chatService.createMessage({
            conversationId,
            senderId: vendorId,
            senderRole: 'Vendor',
            type: 'quote',
            quoteId
        });

        const io = req.app.get('io');
        if (io && !result.isDuplicate) {
            io.to(`conversation_${conversationId}`).emit('message:received', {
                message: result.message,
                conversationId
            });
            io.to(`conversation_${conversationId}`).emit('message:new', {
                message: result.message,
                conversation: result.conversation
            });
        }

        res.status(201).json({
            success: true,
            data: result.message
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Pre-authorized attachment upload and message dispatch
// @route   POST /api/chat/conversations/:conversationId/attachments
// @access  Private (User or Vendor)
exports.uploadAttachment = async (req, res, next) => {
    try {
        const requesterId = req.user ? req.user._id : (req.vendor.id || req.vendor._id);
        const requesterRole = req.user ? 'User' : 'Vendor';
        const conversationId = req.params.conversationId;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const isImage = req.file.mimetype.startsWith('image/');
        const isDoc = req.file.mimetype.includes('pdf') || req.file.mimetype.includes('document') || req.file.mimetype.includes('msword') || req.file.mimetype.includes('text');
        const isAudio = req.file.mimetype.startsWith('audio/');

        const attachmentType = isImage ? 'Image' : (isDoc ? 'Document' : (isAudio ? 'Audio' : 'Document'));
        const messageType = isImage ? 'image' : (isDoc ? 'document' : (isAudio ? 'voice' : 'document'));

        const fileUrl = req.file.path || req.file.secure_url;
        const fileName = req.file.originalname || 'attachment';

        const result = await chatService.createMessage({
            conversationId,
            senderId: requesterId,
            senderRole: requesterRole,
            type: messageType,
            text: req.body.text || '',
            attachments: [{
                url: fileUrl,
                type: attachmentType,
                name: fileName,
                size: req.file.size || 0,
                mimeType: req.file.mimetype
            }]
        });

        const io = req.app.get('io');
        if (io && !result.isDuplicate) {
            io.to(`conversation_${conversationId}`).emit('message:received', {
                message: result.message,
                conversationId
            });
            io.to(`conversation_${conversationId}`).emit('message:new', {
                message: result.message,
                conversation: result.conversation
            });
        }

        res.status(201).json({
            success: true,
            data: result.message
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Report a conversation or message
// @route   POST /api/user/conversations/:id/reports OR /api/vendor/conversations/:id/reports
// @access  Private
exports.createReport = async (req, res, next) => {
    try {
        const requesterId = req.user ? req.user._id : (req.vendor.id || req.vendor._id);
        const requesterRole = req.user ? 'User' : 'Vendor';
        const conversationId = req.params.id || req.body.conversationId;
        const { messageId, reason, description } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Reason is required' });
        }

        const result = await chatService.createChatReport({
            reporterId: requesterId,
            reporterRole: requesterRole,
            conversationId,
            messageId,
            reason,
            description
        });

        res.status(201).json({
            success: true,
            data: result.report,
            isDuplicate: result.isDuplicate
        });
    } catch (err) {
        next(err);
    }
};
