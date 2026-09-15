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

        // 3. Verify related Lead belongs to the same user
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

        // 4. Verify Vendor
        const vendor = await Vendor.findById(quote.vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor associated with quote not found'
            });
        }

        // 5. Ensure duplicate Booking does not already exist
        const existingBooking = await Booking.findOne({ quoteId: quote._id });
        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'Booking already exists for this quote',
                data: { booking: existingBooking }
            });
        }

        // 6. Update Quote & Lead statuses
        quote.status = 'Accepted';
        await quote.save();

        lead.status = 'Booked';
        await lead.save();

        // 7. Create real MongoDB Booking
        const servicesList = (quote.items && quote.items.length > 0)
            ? quote.items.map(item => item.service || 'Service')
            : [lead.category || 'Wedding Service'];

        const booking = await Booking.create({
            vendorId: quote.vendorId,
            userId: req.user._id,
            customerName: req.user.name || lead.customerName || 'Customer',
            leadId: lead._id,
            quoteId: quote._id,
            eventDate: lead.eventDate,
            location: lead.eventLocation,
            eventType: 'Wedding',
            services: servicesList,
            guestCount: lead.guestCount || 0,
            notes: quote.notes || lead.message || '',
            totalPrice: quote.totalAmount || 0,
            status: 'Confirmed',
            paymentStatus: 'Pending'
        });

        // 8. Create Vendor notification
        await Notification.create({
            vendorId: quote.vendorId,
            message: `Quote accepted by ${booking.customerName}! New booking confirmed for ₹${(booking.totalPrice || 0).toLocaleString()}`,
            type: 'Booking',
            isRead: false
        });

        // 9. Create User Notification & Activity
        try {
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
