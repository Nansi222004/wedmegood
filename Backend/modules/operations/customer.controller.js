const mongoose = require('mongoose');
const Booking = require('../vendor/Booking');
const Vendor = require('../vendor/Vendor');
const EventWorkspace = require('./EventWorkspace');
const WorkspaceTask = require('./WorkspaceTask');
const ChangeRequest = require('./ChangeRequest');
const ops = require('../../services/operations.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));

/**
 * What the customer sees of the vendor's preparation: progress, the two milestone updates and the
 * change requests waiting for them. Crew names, costs and internal notes are not shown.
 * @route GET /api/user/events/:bookingId
 */
exports.getMyEvent = async (req, res, next) => {
    try {
        if (!isId(req.params.bookingId)) return res.status(400).json({ success: false, message: 'Invalid booking' });
        const booking = await Booking.findOne({ _id: req.params.bookingId, userId: req.user._id })
            .select('vendorId eventDate eventType location status totalPrice services').lean();
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        await ops.syncWorkspaces(booking.vendorId);
        const [ws, vendor] = await Promise.all([
            EventWorkspace.findOne({ bookingId: booking._id }).lean(),
            Vendor.findById(booking.vendorId).select('businessName profileImage opsSettings').lean()
        ]);
        const [tasks, changeRequests] = ws
            ? await Promise.all([
                WorkspaceTask.find({ workspaceId: ws._id }).select('status mandatory').lean(),
                ChangeRequest.find({ workspaceId: ws._id, status: { $ne: 'Withdrawn' } }).sort('-createdAt').lean()
            ])
            : [[], []];
        // With owner review on, the customer sees only updates the owner let through, not live progress
        const review = Boolean(vendor?.opsSettings?.reviewCustomerUpdates);
        const updates = (ws?.customerUpdates || []).filter(u => u.status === 'Sent');
        const sentAt = (kind, legacy) => {
            const u = updates.filter(x => x.kind === kind).pop();
            if (u) return u.decidedAt || u.createdAt;
            return (ws?.customerUpdates || []).some(x => x.kind === kind) ? null : legacy || null;
        };
        res.status(200).json({
            success: true,
            data: {
                bookingId: booking._id,
                vendor: { _id: booking.vendorId, businessName: vendor?.businessName, profileImage: vendor?.profileImage || null },
                eventType: booking.eventType,
                eventDate: booking.eventDate,
                location: booking.location,
                bookingStatus: booking.status,
                services: booking.services || [],
                preparation: ws ? {
                    status: ws.opsStatus,
                    readiness: review ? null : ops.readinessOf(tasks),
                    tasksTotal: review ? null : tasks.length,
                    tasksVerified: review ? null : tasks.filter(t => t.status === 'Verified').length,
                    readinessUpdateAt: sentAt('readiness', ws.readiness?.updateSentAt),
                    finalConfirmedAt: sentAt('ready', ws.readiness?.finalConfirmedAt)
                } : null,
                updates: updates.map(u => ({ _id: u._id, title: u.title, message: u.message, at: u.decidedAt || u.createdAt })).reverse(),
                changeRequests: changeRequests.map(c => ({
                    _id: c._id, title: c.title, description: c.description, amount: c.amount,
                    status: c.status, createdAt: c.createdAt, respondedAt: c.respondedAt, customerNote: c.customerNote
                }))
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Approve or reject extra work. Approved work becomes a task on the vendor's checklist and its
 * price is added to the event's contract value.
 * @route POST /api/user/events/:bookingId/change-requests/:crId   body: { approve, note }
 */
exports.respondChangeRequest = async (req, res, next) => {
    try {
        const { bookingId, crId } = req.params;
        if (!isId(bookingId) || !isId(crId)) return res.status(400).json({ success: false, message: 'Invalid request' });
        const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id }).select('_id vendorId').lean();
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        const approve = Boolean(req.body?.approve);
        const cr = await ChangeRequest.findOneAndUpdate(
            { _id: crId, bookingId: booking._id, status: 'Pending' },
            { $set: { status: approve ? 'Approved' : 'Rejected', respondedAt: new Date(), customerNote: String(req.body?.note || '').slice(0, 500) } },
            { new: true }
        );
        if (!cr) return res.status(400).json({ success: false, message: 'This request was already answered' });

        if (approve) {
            const count = await WorkspaceTask.countDocuments({ workspaceId: cr.workspaceId });
            await WorkspaceTask.create({
                workspaceId: cr.workspaceId, vendorId: cr.vendorId, title: cr.title, description: cr.description,
                mandatory: true, source: 'change-request', order: count,
                history: [{ status: 'Not started', note: 'Approved change request', by: 'customer' }]
            });
        }
        await EventWorkspace.updateOne({ _id: cr.workspaceId }, {
            $push: { history: { action: `Customer ${approve ? 'approved' : 'rejected'} change request "${cr.title}"`, by: 'customer' } }
        });
        await ops.notifyVendor(cr.vendorId, `The customer ${approve ? 'approved' : 'rejected'} the change request "${cr.title}"${cr.amount ? ` (₹${cr.amount.toLocaleString('en-IN')})` : ''}.`);
        res.status(200).json({ success: true, message: approve ? 'Approved. The vendor has been told.' : 'Rejected. The vendor has been told.', data: cr });
    } catch (err) {
        next(err);
    }
};
