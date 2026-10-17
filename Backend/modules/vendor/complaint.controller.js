const mongoose = require('mongoose');
const Complaint = require('../user/Complaint');
const { canAppeal, notifyUser } = require('../../services/complaint.service');

const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

/** What the vendor sees: the complaint, their own response and the decision, never the customer's contact */
const vendorView = (c) => ({
    _id: c._id,
    category: c.category,
    description: c.description,
    evidence: c.evidence,
    status: c.status,
    createdAt: c.createdAt,
    booking: c.bookingId ? { eventDate: c.bookingId.eventDate, status: c.bookingId.status } : null,
    customerName: c.userId?.name ? c.userId.name.split(' ')[0] : 'Customer',
    respondBy: c.tat?.vendorResponseBy || null,
    vendorResponse: c.vendorResponse,
    outcome: c.outcome || '',
    resolvedAt: c.resolvedAt,
    appeal: c.appeal?.by ? { by: c.appeal.by, at: c.appeal.at, decision: c.appeal.decision, decisionNote: c.appeal.decisionNote } : null,
    canAppeal: canAppeal(c)
});

// @desc    Complaints about this vendor
// @route   GET /api/vendor/complaints
exports.listComplaints = async (req, res, next) => {
    try {
        const list = await Complaint.find({ vendorId: req.vendor.id })
            .populate('userId', 'name').populate('bookingId', 'eventDate status')
            .sort('-createdAt').limit(200).lean();
        res.status(200).json({ success: true, data: list.map(vendorView) });
    } catch (err) {
        next(err);
    }
};

// @desc    The vendor's side of the story, with evidence
// @route   POST /api/vendor/complaints/:id/respond   body: { statement, evidence: [{type, url}] }
exports.respond = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return bad(res, 'Invalid complaint');
        const statement = String(req.body?.statement || '').trim();
        if (statement.length < 10) return bad(res, 'Write your side of what happened');
        const complaint = await Complaint.findOne({ _id: req.params.id, vendorId: req.vendor.id });
        if (!complaint) return bad(res, 'Complaint not found', 404);
        if (!['Pending', 'In-Review', 'Appealed'].includes(complaint.status)) return bad(res, 'This complaint is already decided. You can appeal the decision instead.');
        complaint.vendorResponse = {
            statement: statement.slice(0, 3000),
            evidence: (Array.isArray(req.body?.evidence) ? req.body.evidence : [])
                .filter(e => /^https?:\/\//.test(e?.url || '')).slice(0, 10)
                .map(e => ({ type: e.type === 'document' ? 'document' : 'image', url: e.url })),
            respondedAt: new Date()
        };
        await complaint.save();
        res.status(200).json({ success: true, message: 'Your response was sent to the Utsavo team' });
    } catch (err) {
        next(err);
    }
};

// @desc    Appeal a decision (once, within 7 days)
// @route   POST /api/vendor/complaints/:id/appeal   body: { reason }
exports.appeal = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return bad(res, 'Invalid complaint');
        const reason = String(req.body?.reason || '').trim();
        if (reason.length < 10) return bad(res, 'Explain why the decision should be reviewed again');
        const complaint = await Complaint.findOne({ _id: req.params.id, vendorId: req.vendor.id });
        if (!complaint) return bad(res, 'Complaint not found', 404);
        if (!canAppeal(complaint)) return bad(res, 'This complaint can no longer be appealed');
        complaint.appeal = { by: 'Vendor', reason: reason.slice(0, 2000), at: new Date(), decision: '', decisionNote: '', decidedAt: null, previousStatus: complaint.status };
        complaint.status = 'Appealed';
        await complaint.save();
        await notifyUser(complaint.userId, 'A complaint decision was appealed', 'The vendor appealed the decision on your complaint. The Utsavo team will review it again.');
        res.status(200).json({ success: true, message: 'Appeal submitted' });
    } catch (err) {
        next(err);
    }
};
