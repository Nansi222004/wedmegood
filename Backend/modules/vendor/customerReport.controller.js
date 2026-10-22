const mongoose = require('mongoose');
const CustomerReport = require('./CustomerReport');
const Lead = require('./Lead');
const Booking = require('./Booking');
const LeadOffer = require('./LeadOffer');
const { cleanConduct, CONDUCT_LEVELS } = require('../../utils/conduct');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

async function notifyUser(userId, title, message) {
    try {
        const { createNotification } = require('../../services/notification.service');
        await createNotification({ userId, title, message, type: 'complaint', entityType: 'General', customLink: '/user/complaints' });
    } catch (_) { /* best effort */ }
}
async function notifyVendor(vendorId, message) {
    try {
        const Notification = require('./Notification');
        await Notification.create({ vendorId, message, type: 'System' });
    } catch (_) { /* best effort */ }
}

/**
 * What other vendors are told about a customer: confirmed reports only, never who reported.
 * Each aspect shows how many reports rated it Poor or Very poor.
 */
async function conductSummary(userId) {
    const reports = await CustomerReport.find({ userId, status: 'Confirmed' })
        .select('vendorId conduct issues description createdAt').sort('-createdAt').lean();
    if (reports.length === 0) return { reports: 0 };
    const issues = {};
    for (const r of reports) for (const i of r.issues || []) issues[i] = (issues[i] || 0) + 1;
    const poor = {};
    for (const a of CustomerReport.ASPECTS) {
        poor[a] = reports.filter(r => ['Poor', 'Very poor'].includes(r.conduct?.[a])).length;
    }
    return {
        reports: reports.length,
        vendors: new Set(reports.map(r => String(r.vendorId))).size,
        issues: Object.entries(issues).sort((a, b) => b[1] - a[1]).map(([issue, count]) => ({ issue, count })),
        poorRatings: poor,
        recent: reports.slice(0, 3).map(r => ({ at: r.createdAt, issues: r.issues, description: r.description, conduct: r.conduct }))
    };
}
exports.conductSummary = conductSummary;

// ------------------------------------------------------------------ vendor

// @desc    Report a customer's behaviour. Only for a customer the vendor has dealt with.
// @route   POST /api/vendor/customer-reports   body: { leadId | bookingId, conduct, issues, description }
exports.createReport = async (req, res, next) => {
    try {
        const b = req.body || {};
        const vendorId = req.vendor._id || req.vendor.id;
        let userId = null;
        let leadId = null;
        let bookingId = null;
        if (isId(b.bookingId)) {
            const booking = await Booking.findOne({ _id: b.bookingId, vendorId }).select('userId leadId').lean();
            if (!booking?.userId) return bad(res, 'Booking not found', 404);
            ({ userId } = booking);
            bookingId = booking._id;
            leadId = booking.leadId || null;
        } else if (isId(b.leadId)) {
            const lead = await Lead.findOne({ _id: b.leadId, vendorId }).select('userId').lean();
            if (!lead?.userId) return bad(res, 'You can report only customers whose requirement was assigned to you', 404);
            ({ userId } = lead);
            leadId = lead._id;
        } else {
            return bad(res, 'Choose the booking or lead this is about');
        }

        const conduct = cleanConduct(b.conduct, CustomerReport.ASPECTS);
        if (!conduct) return bad(res, `Rate each point: ${CONDUCT_LEVELS.join(', ')}`);
        const issues = [...new Set((Array.isArray(b.issues) ? b.issues : []).filter(i => CustomerReport.ISSUES.includes(i)))];
        const description = String(b.description || '').trim();
        if (description.length < 10) return bad(res, 'Describe what happened in a few words (at least 10 characters)');

        const anchor = bookingId ? { bookingId } : { leadId };
        if (await CustomerReport.exists({ vendorId, ...anchor })) return bad(res, 'You have already reported this customer for this job');

        const report = await CustomerReport.create({
            vendorId, userId, leadId, bookingId, conduct, issues, description: description.slice(0, 1000)
        });
        await notifyUser(userId, 'A vendor reported a concern about your booking',
            'A vendor raised a concern about how a booking went. You can give your side under My Complaints. The Utsavo team reviews both sides before anything is shown to other vendors.');
        res.status(201).json({ success: true, data: report, message: 'Reported. The Utsavo team will review it; the customer can give their side.' });
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/vendor/customer-reports   (reports this vendor made)
exports.myReports = async (req, res, next) => {
    try {
        const list = await CustomerReport.find({ vendorId: req.vendor._id || req.vendor.id })
            .populate('userId', 'name').sort('-createdAt').limit(200).lean();
        res.status(200).json({
            success: true,
            data: list.map(r => ({ ...r, customerName: r.userId?.name || 'Customer', userId: r.userId?._id })),
            options: { levels: CONDUCT_LEVELS, issues: CustomerReport.ISSUES, aspects: CustomerReport.ASPECTS }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Confirmed behaviour reports about the customer of a lead offered or assigned to this vendor
// @route   GET /api/vendor/leads/:id/customer-conduct
exports.leadCustomerConduct = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Invalid lead');
        const vendorId = req.vendor._id || req.vendor.id;
        const lead = await Lead.findById(req.params.id).select('userId vendorId').lean();
        if (!lead?.userId) return bad(res, 'Lead not found', 404);
        const mine = String(lead.vendorId) === String(vendorId)
            || await LeadOffer.exists({ leadId: lead._id, vendorId });
        if (!mine) return bad(res, 'Lead not found', 404);
        res.status(200).json({ success: true, data: await conductSummary(lead.userId) });
    } catch (err) {
        next(err);
    }
};

// ------------------------------------------------------------------ customer

// @route   GET /api/user/conduct-reports   (reports about this customer, with the vendor's name)
exports.reportsAboutMe = async (req, res, next) => {
    try {
        const list = await CustomerReport.find({ userId: req.user._id, status: { $ne: 'Rejected' } })
            .populate('vendorId', 'businessName').sort('-createdAt').lean();
        res.status(200).json({
            success: true,
            data: list.map(r => ({
                _id: r._id, vendorName: r.vendorId?.businessName || 'Vendor', conduct: r.conduct, issues: r.issues,
                description: r.description, status: r.status, customerResponse: r.customerResponse, createdAt: r.createdAt
            }))
        });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/user/conduct-reports/:id/respond   body: { statement }
exports.respondAsCustomer = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Report not found', 404);
        const statement = String(req.body?.statement || '').trim();
        if (statement.length < 10) return bad(res, 'Give your side in a few words (at least 10 characters)');
        const report = await CustomerReport.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id, status: 'Pending' },
            { $set: { customerResponse: { statement: statement.slice(0, 2000), respondedAt: new Date() } } },
            { new: true }
        );
        if (!report) return bad(res, 'This report has already been decided');
        res.status(200).json({ success: true, message: 'Thank you. The Utsavo team will consider your side.' });
    } catch (err) {
        next(err);
    }
};

// ------------------------------------------------------------------ admin

// @route   GET /api/admin/customer-reports?status=Pending
exports.adminList = async (req, res, next) => {
    try {
        const q = {};
        if (['Pending', 'Confirmed', 'Rejected'].includes(req.query.status)) q.status = req.query.status;
        const list = await CustomerReport.find(q)
            .populate('vendorId', 'businessName city').populate('userId', 'name email phone')
            .sort({ status: 1, createdAt: -1 }).limit(300).lean();
        res.status(200).json({ success: true, data: list, pending: await CustomerReport.countDocuments({ status: 'Pending' }) });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/admin/customer-reports/:id/decide   body: { decision: 'Confirmed'|'Rejected', note }
exports.adminDecide = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Report not found', 404);
        const decision = req.body?.decision;
        if (!['Confirmed', 'Rejected'].includes(decision)) return bad(res, 'Choose Confirmed or Rejected');
        const note = String(req.body?.note || '').trim().slice(0, 1000);
        if (note.length < 5) return bad(res, 'Write a short reason for the decision');
        const report = await CustomerReport.findOneAndUpdate(
            { _id: req.params.id, status: 'Pending' },
            { $set: { status: decision, adminNote: note, decidedAt: new Date(), decidedBy: req.user?.name || 'Admin' } },
            { new: true }
        );
        if (!report) return bad(res, 'This report has already been decided');
        await notifyVendor(report.vendorId, `Your report about a customer was ${decision.toLowerCase()} by the Utsavo team: ${note}`);
        await notifyUser(report.userId, 'Update on a vendor\'s report',
            decision === 'Confirmed'
                ? `The Utsavo team reviewed a vendor's concern about your booking and confirmed it: ${note}. Other vendors may see a summary.`
                : `The Utsavo team reviewed a vendor's concern about your booking and did not uphold it: ${note}.`);
        res.status(200).json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
};
