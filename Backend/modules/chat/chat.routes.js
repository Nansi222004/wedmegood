const express = require('express');
const jwt = require('jsonwebtoken');
const { upload } = require('../../utils/cloudinary');
const { protect, protectVendor } = require('../../middleware/auth.middleware');
const User = require('../user/user.model');
const Vendor = require('../vendor/Vendor');
const Conversation = require('../vendor/Conversation');
const chatController = require('./chat.controller');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

/**
 * Unified auth middleware accepting either valid User or Vendor JWT.
 */
const protectAny = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || !decoded.id) {
            return res.status(401).json({ success: false, message: 'Invalid token payload.' });
        }

        // Try User first
        const user = await User.findById(decoded.id);
        if (user && user.isActive !== false && !user.isBlocked) {
            req.user = user;
            return next();
        }

        // Try Vendor next
        const vendor = await Vendor.findById(decoded.id);
        if (vendor && vendor.isActive !== false && vendor.status !== 'Suspended') {
            req.vendor = vendor;
            return next();
        }

        return res.status(401).json({ success: false, message: 'Invalid token. Entity not found or inactive.' });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

/**
 * Pre-upload conversation membership check.
 * Strictly verifies caller is a conversation participant BEFORE Multer handles the file.
 */
const verifyConversationMembership = async (req, res, next) => {
    try {
        const conversationId = req.params.conversationId || req.params.id;
        if (!conversationId) {
            return res.status(400).json({ success: false, message: 'conversationId parameter is required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const callerId = req.user ? req.user._id.toString() : (req.vendor.id || req.vendor._id).toString();
        const isUserMember = conversation.userId && conversation.userId.toString() === callerId;
        const isVendorMember = conversation.vendorId && conversation.vendorId.toString() === callerId;

        if (!isUserMember && !isVendorMember) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not a participant in this conversation' });
        }

        req.conversation = conversation;
        next();
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error verifying conversation membership' });
    }
};

// -----------------------------------------------------------------
// USER CHAT ROUTES (Mounted at /api/user/conversations)
// -----------------------------------------------------------------
const userRouter = express.Router();
userRouter.use(protect);
userRouter.post('/', chatController.createConversation);
userRouter.get('/', chatController.getUserConversations);
userRouter.get('/:id', chatController.getUserConversationById);
userRouter.get('/:id/messages', chatController.getConversationMessages);
userRouter.post('/:id/messages', chatController.sendMessage);
userRouter.post('/:id/read', chatController.markAsRead);
userRouter.post('/:id/reports', chatController.createReport);

// -----------------------------------------------------------------
// VENDOR CHAT ROUTES (Mounted at /api/vendor/conversations)
// -----------------------------------------------------------------
const vendorRouter = express.Router();
vendorRouter.use(protectVendor);
vendorRouter.get('/', chatController.getVendorConversations);
vendorRouter.get('/:id', chatController.getVendorConversationById);
vendorRouter.get('/:id/messages', chatController.getConversationMessages);
vendorRouter.post('/:id/messages', chatController.sendMessage);
vendorRouter.post('/:id/read', chatController.markAsRead);
vendorRouter.post('/:id/quote', chatController.shareQuote);
vendorRouter.post('/:id/reports', chatController.createReport);

// -----------------------------------------------------------------
// PRE-AUTHORIZED ATTACHMENT UPLOAD ROUTE
// -----------------------------------------------------------------
const uploadRouter = express.Router();

const handleAttachmentUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Invalid file type. Only allowed media formats are permitted.'
            });
        }
        next();
    });
};

uploadRouter.post(
    '/conversations/:conversationId/attachments',
    protectAny,
    verifyConversationMembership,
    handleAttachmentUpload,
    chatController.uploadAttachment
);
uploadRouter.post('/report', protectAny, chatController.createReport);
uploadRouter.post('/reports', protectAny, chatController.createReport);

module.exports = {
    userRouter,
    vendorRouter,
    uploadRouter,
    protectAny,
    verifyConversationMembership
};
