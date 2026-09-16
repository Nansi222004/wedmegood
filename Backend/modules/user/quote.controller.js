const mongoose = require('mongoose');
const Quote = require('../vendor/Quote');
const Lead = require('../vendor/Lead');
const Booking = require('../vendor/Booking');
const Vendor = require('../vendor/Vendor');
const Notification = require('../vendor/Notification');

// @desc    Get current user's quotes
// @route   GET /api/user/quotes
// @access  Private (User)
exports.getUserQuotes = async (req, res, next) => {
    try {
        const quotes = await Quote.find({ userId: req.user._id })
            .populate('vendorId', 'businessName city profileImage phone pricing rating reviewCount')
            .populate('leadId')
            .sort('-createdAt')
            .lean();

        res.status(200).json({
            success: true,
            count: quotes.length,
            data: quotes
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single quote by ID
// @route   GET /api/user/quotes/:id
// @access  Private (User)
exports.getUserQuoteById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quote ID format'
            });
        }

        const quote = await Quote.findOne({
            _id: id,
            userId: req.user._id
        })
            .populate('vendorId', 'businessName city profileImage phone pricing')
            .populate('leadId')
            .lean();

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        res.status(200).json({
            success: true,
            data: quote
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Accept quote and atomically create real Booking
// @route   PUT /api/user/quotes/:id/accept
// @access  Private (User)
exports.acceptQuote = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quote ID format'
            });
        }

        // 1. Find quote and verify ownership
        const quote = await Quote.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found or unauthorized'
            });
        }

        // 2. Verify quote status eligibility
        if (quote.status === 'Accepted') {
            return res.status(400).json({
                success: false,
                message: 'This quote has already been accepted'
            });
        }

        if (quote.status === 'Rejected') {
            return res.status(400).json({
                success: false,
                message: 'Cannot accept a rejected quote'
            });
        }

        if (quote.status === 'Expired') {
            return res.status(400).json({
                success: false,
                message: 'Cannot accept an expired quote'
            });
        }

        if (quote.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot accept a cancelled quote'
            });
        }

        if (quote.status !== 'Sent' && quote.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Quote is not available for acceptance'
            });
        }

        // Check if quote has passed its validity date
        if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
            quote.status = 'Expired';
            await quote.save();
            return res.status(400).json({
                success: false,
                message: 'Quote has expired and cannot be accepted'
            });
        }

        // 3. Verify related Lead belongs to the same user and vendor
        const lead = await Lead.findById(quote.leadId);
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Related lead inquiry not found'
            });
        }

        if (lead.userId && lead.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Lead owner mismatch'
            });
        }

        if (lead.vendorId && lead.vendorId.toString() !== quote.vendorId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Vendor mismatch between quote and lead'
            });
        }

        // 4. Verify Vendor status, activity, and active subscription
        const vendor = await Vendor.findById(quote.vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor associated with quote not found'
            });
        }

        if (vendor.status !== 'Approved') {
            return res.status(400).json({
                success: false,
                message: 'Vendor is not currently approved to accept bookings'
            });
        }

        if (!vendor.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Vendor account is currently inactive'
            });
        }

        if (vendor.subscription && vendor.subscription.status === 'Expired') {
            return res.status(400).json({
                success: false,
                message: 'Vendor subscription has expired and cannot accept bookings'
            });
        }

        // 5. Check date availability against vendor calendar
        const targetDate = new Date(lead.eventDate);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event date on lead inquiry'
            });
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Check if vendor blocked this date
        const isBlocked = (vendor.blockedDates || []).some(bDate => {
            const b = new Date(bDate);
            return b >= startOfDay && b <= endOfDay;
        });

        if (isBlocked) {
            return res.status(409).json({
                success: false,
                message: 'Vendor is unavailable on this date (marked as blocked)'
            });
        }

        // 6. Atomic Execution with MongoDB Session / Transaction
        const session = await mongoose.startSession();
        session.startTransaction();
        let booking;

        try {
            // Lock Vendor document for the duration of this transaction to serialize concurrent bookings
            await Vendor.findOneAndUpdate(
                { _id: quote.vendorId },
                { $set: { updatedAt: new Date() } },
                { session }
            );

            // Check for existing booking for this quote
            const existingBooking = await Booking.findOne({ quoteId: quote._id }).session(session);
            if (existingBooking) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: 'Booking already exists for this quote',
                    data: { booking: existingBooking }
                });
            }

            // Check for conflicting confirmed/in-progress booking on the same date
            const conflictingBooking = await Booking.findOne({
                vendorId: quote.vendorId,
                eventDate: { $gte: startOfDay, $lte: endOfDay },
                status: { $in: ['Confirmed', 'In Progress'] }
            }).session(session);

            if (conflictingBooking) {
                await session.abortTransaction();
                session.endSession();
                return res.status(409).json({
                    success: false,
                    message: 'Vendor already has a confirmed booking on this date'
                });
            }

            // Atomically update Quote status
            const updatedQuote = await Quote.findOneAndUpdate(
                { _id: quote._id, status: { $in: ['Pending', 'Sent'] } },
                { status: 'Accepted' },
                { new: true, session }
            );

            if (!updatedQuote) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: 'Quote is no longer available for acceptance'
                });
            }

            // Update Lead status
            await Lead.findByIdAndUpdate(lead._id, { status: 'Booked' }, { session });

            // Create real MongoDB Booking
            const servicesList = (quote.items && quote.items.length > 0)
                ? quote.items.map(item => item.service || 'Service')
                : [lead.category || 'Wedding Service'];

            const createdBookings = await Booking.create([{
                vendorId: quote.vendorId,
                userId: req.user._id,
                customerName: req.user.name || lead.customerName || 'Customer',
                leadId: lead._id,
                quoteId: quote._id,
                eventDate: targetDate,
                location: lead.eventLocation || 'Venue to be confirmed',
                eventType: 'Wedding',
                services: servicesList,
                guestCount: lead.guestCount || 0,
                notes: quote.notes || lead.message || '',
                totalPrice: quote.totalAmount || 0,
                status: 'Confirmed',
                paymentStatus: 'Pending'
            }], { session });

            booking = createdBookings[0];

            await session.commitTransaction();
            session.endSession();
        } catch (txError) {
            await session.abortTransaction();
            session.endSession();

            if (txError.code === 11000 || txError.message?.includes('duplicate key')) {
                return res.status(400).json({
                    success: false,
                    message: 'Booking already exists for this quote'
                });
            }

            if (txError.code === 112 || txError.codeName === 'WriteConflict' || txError.hasErrorLabel?.('TransientTransactionError') || txError.message?.includes('WriteConflict')) {
                return res.status(409).json({
                    success: false,
                    message: 'Concurrent booking conflict on this date. Vendor already booked.'
                });
            }

            throw txError;
        }

        // 7. Post-commit side-effects: Vendor notification
        await Notification.create({
            vendorId: quote.vendorId,
            message: `Quote accepted by ${booking.customerName}! New booking confirmed for ₹${(booking.totalPrice || 0).toLocaleString()}`,
            type: 'Booking',
            isRead: false
        }).catch(() => {});

        // 8. Link Booking to Conversation and record System message
        try {
            const chatService = require('../chat/chat.service');
            const conv = await chatService.getOrCreateConversation({
                userId: req.user._id,
                vendorId: quote.vendorId,
                bookingId: booking._id,
                leadId: lead._id
            });
            await chatService.createMessage({
                conversationId: conv._id,
                senderId: req.user._id,
                senderRole: 'System',
                type: 'system',
                text: `Quote accepted. Booking confirmed!`,
                metadata: { bookingId: booking._id, quoteId: quote._id }
            });
        } catch (chatErr) {
            console.warn('Booking conversation link notice:', chatErr.message);
        }

        // 9. Create User Notification & Activity
        try {
            const servicesList = (quote.items && quote.items.length > 0)
                ? quote.items.map(item => item.service || 'Service')
                : [lead.category || 'Wedding Service'];
            const { notifyAndLogActivity } = require('../../services/notification.service');
            await notifyAndLogActivity({
                userId: req.user._id,
                notificationTitle: 'Quote Accepted & Booking Confirmed',
                notificationMessage: `You accepted the quote for ${servicesList.join(', ')}. Booking confirmed for ₹${(booking.totalPrice || 0).toLocaleString()}.`,
                notificationType: 'booking',
                activityType: 'quote_accepted',
                activityTitle: 'Accepted Quote',
                activityMessage: `Confirmed booking for ₹${(booking.totalPrice || 0).toLocaleString()} (${servicesList.join(', ')}).`,
                entityType: 'Booking',
                entityId: booking._id,
                eventKey: `quote_accept_${quote._id}`
            });
        } catch (notifErr) {
            // Non-blocking side effect
        }

        res.status(200).json({
            success: true,
            message: 'Quote accepted successfully and booking confirmed',
            data: {
                booking,
                quote
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Reject quote
// @route   PUT /api/user/quotes/:id/reject
// @access  Private (User)
exports.rejectQuote = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quote ID format'
            });
        }

        const quote = await Quote.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found or unauthorized'
            });
        }

        quote.status = 'Rejected';
        await quote.save();

        if (quote.leadId) {
            await Lead.findByIdAndUpdate(quote.leadId, { status: 'Rejected' });
        }

        await Notification.create({
            vendorId: quote.vendorId,
            message: `Quote was rejected by the customer`,
            type: 'Lead',
            isRead: false
        });

        try {
            const { recordActivity } = require('../../services/notification.service');
            await recordActivity({
                userId: req.user._id,
                type: 'quote_rejected',
                title: 'Declined Quote',
                message: `Declined quote from vendor for ₹${(quote.totalAmount || 0).toLocaleString()}.`,
                entityType: 'Quote',
                entityId: quote._id,
                eventKey: `quote_reject_${quote._id}`
            });
        } catch (notifErr) {}

        res.status(200).json({
            success: true,
            message: 'Quote rejected',
            data: quote
        });
    } catch (err) {
        next(err);
    }
};
