const mongoose = require('mongoose');
const WorkJob = require('./WorkJob');
const WorkAssignment = require('./WorkAssignment');
const WorkerProfile = require('./WorkerProfile');
const WorkMessage = require('./WorkMessage');
const SafetyReport = require('./SafetyReport');
const wf = require('../../services/workforce.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const DAY = 24 * 60 * 60 * 1000;
// Messages stay open from acceptance until a week after the job
const CHAT_CLOSED = ['Cancelled', 'NoShow'];
const chatOpen = (a, job) => !CHAT_CLOSED.includes(a.status) && Date.now() < wf.jobEnd(job).getTime() + 7 * DAY;

// Who is asking: the poster (vendor team or customer, through jobs.vendorPoster/customerPoster) or the worker
async function resolveThread(req, side) {
    if (!isId(req.params.aid)) return {};
    if (side === 'Poster') {
        if (!isId(req.params.id)) return {};
        const owner = req.poster.type === 'Vendor' ? { vendorId: req.poster.vendorId } : { userId: req.poster.userId };
        const job = await WorkJob.findOne({ _id: req.params.id, ...owner });
        if (!job) return {};
        const a = await WorkAssignment.findOne({ _id: req.params.aid, jobId: job._id });
        return { job, a, name: req.poster.actor || req.poster.name };
    }
    const w = await WorkerProfile.findOne({ userId: req.user._id });
    if (!w) return {};
    const a = await WorkAssignment.findOne({ _id: req.params.aid, workerId: w._id });
    const job = a ? await WorkJob.findById(a.jobId) : null;
    return { job, a, w, name: w.name };
}

const listMessages = (side) => async (req, res, next) => {
    try {
        const { job, a } = await resolveThread(req, side);
        if (!a) return bad(res, 'Job not found', 404);
        const other = side === 'Poster' ? 'Worker' : 'Poster';
        await WorkMessage.updateMany({ assignmentId: a._id, from: other, readAt: null }, { $set: { readAt: new Date() } });
        const list = await WorkMessage.find({ assignmentId: a._id }).sort('createdAt').limit(300).lean();
        res.status(200).json({ success: true, data: list, open: chatOpen(a, job) });
    } catch (err) {
        next(err);
    }
};

const sendMessage = (side) => async (req, res, next) => {
    try {
        const { job, a, name } = await resolveThread(req, side);
        if (!a) return bad(res, 'Job not found', 404);
        if (!chatOpen(a, job)) return bad(res, 'Messages for this job are closed');
        const text = String(req.body?.text || '').trim();
        if (!text) return bad(res, 'Type a message');
        const msg = await WorkMessage.create({ assignmentId: a._id, jobId: job._id, from: side, senderName: name, text: text.slice(0, 1000) });

        const preview = text.length > 120 ? `${text.slice(0, 120)}…` : text;
        if (side === 'Poster') {
            const worker = await WorkerProfile.findById(a.workerId).select('userId').lean();
            if (worker) {
                await wf.notifyWorker(worker, `Message about "${job.title}"`, `${name}: ${preview}`, '/user/work');
                wf.emitToUser?.(worker.userId, 'work:message', { assignmentId: a._id, message: msg });
            }
        } else {
            await wf.notifyPoster(job, `Message from ${name}`, `${preview} (job "${job.title}")`);
            if (job.userId) wf.emitToUser?.(job.userId, 'work:message', { assignmentId: a._id, message: msg });
        }
        res.status(201).json({ success: true, data: msg });
    } catch (err) {
        next(err);
    }
};

exports.posterMessages = listMessages('Poster');
exports.posterSend = sendMessage('Poster');
exports.workerMessages = listMessages('Worker');
exports.workerSend = sendMessage('Worker');

const alertAdmins = (report) => {
    try {
        const { emitToAdmins } = require('../../services/leadDispatch.service');
        emitToAdmins('work:safety', { reportId: report._id, kind: report.kind, jobId: report.jobId });
    } catch (_) { /* best effort */ }
};

const createReport = (side) => async (req, res, next) => {
    try {
        const b = req.body || {};
        const kind = SafetyReport.KINDS.includes(b.kind) ? b.kind : null;
        if (!kind) return bad(res, 'Choose what happened');
        const details = String(b.details || '').trim().slice(0, 2000);
        if (kind !== 'Emergency' && details.length < 5) return bad(res, 'Tell us briefly what happened');

        let job;
        let a = null;
        let reporter;
        if (side === 'Worker') {
            const t = await resolveThread(req, 'Worker');
            if (!t.a) return bad(res, 'Job not found', 404);
            ({ job, a } = t);
            reporter = { reporterName: t.w.name, reporterUserId: req.user._id, reporterPhone: req.user.phone || '' };
        } else {
            if (!isId(req.params.id)) return bad(res, 'Job not found', 404);
            const owner = req.poster.type === 'Vendor' ? { vendorId: req.poster.vendorId } : { userId: req.poster.userId };
            job = await WorkJob.findOne({ _id: req.params.id, ...owner });
            if (!job) return bad(res, 'Job not found', 404);
            if (isId(b.assignmentId)) a = await WorkAssignment.findOne({ _id: b.assignmentId, jobId: job._id });
            reporter = req.poster.type === 'Vendor'
                ? { reporterName: req.poster.actor, reporterVendorId: req.poster.vendorId, reporterPhone: req.vendor?.phone || '' }
                : { reporterName: req.poster.name, reporterUserId: req.poster.userId, reporterPhone: req.user?.phone || '' };
        }

        const lat = Number(b.location?.lat);
        const lng = Number(b.location?.lng);
        const report = await SafetyReport.create({
            jobId: job._id, assignmentId: a?._id || null, reportedBy: side, ...reporter, kind, details,
            location: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : { lat: null, lng: null }
        });
        alertAdmins(report);
        if (side === 'Worker') {
            await wf.notifyPoster(job, 'Safety alert from a worker', `${reporter.reporterName} raised "${kind}" on "${job.title}". The Utsavo team has been alerted.`);
        }
        res.status(201).json({
            success: true,
            data: { _id: report._id, status: report.status },
            message: kind === 'Emergency'
                ? 'The Utsavo team has been alerted. If you are in danger, call 112 now.'
                : 'Reported. The Utsavo team will contact you.'
        });
    } catch (err) {
        next(err);
    }
};

exports.workerSafety = createReport('Worker');
exports.posterSafety = createReport('Poster');

// ---------------------------------------------------------------- admin

// @route   GET /api/admin/workforce/safety?status=Open
exports.adminListSafety = async (req, res, next) => {
    try {
        const q = {};
        if (['Open', 'Acknowledged', 'Resolved'].includes(req.query.status)) q.status = req.query.status;
        const list = await SafetyReport.find(q)
            .populate('jobId', 'title date startTime endTime city area exactAddress posterType posterName')
            .sort({ status: 1, createdAt: -1 }).limit(200).lean();
        // Open reports first, emergencies at the top
        const rank = (r) => (r.status === 'Open' ? 0 : r.status === 'Acknowledged' ? 1 : 2) * 2 + (r.kind === 'Emergency' ? 0 : 1);
        list.sort((x, y) => rank(x) - rank(y) || new Date(y.createdAt) - new Date(x.createdAt));
        res.status(200).json({ success: true, data: list, open: await SafetyReport.countDocuments({ status: 'Open' }) });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/admin/workforce/safety/:id   body: { status: 'Acknowledged'|'Resolved', actionTaken }
exports.adminUpdateSafety = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Report not found', 404);
        const report = await SafetyReport.findById(req.params.id);
        if (!report) return bad(res, 'Report not found', 404);
        const status = req.body?.status;
        const actionTaken = String(req.body?.actionTaken || '').trim().slice(0, 2000);
        const adminName = req.user?.name || req.user?.email || 'Admin';
        if (status === 'Acknowledged') {
            if (report.status !== 'Open') return bad(res, 'Already acknowledged');
            report.status = 'Acknowledged';
            report.acknowledgedAt = new Date();
            report.acknowledgedBy = adminName;
        } else if (status === 'Resolved') {
            if (actionTaken.length < 5) return bad(res, 'Write what was done');
            report.status = 'Resolved';
            report.resolvedAt = new Date();
            if (!report.acknowledgedAt) { report.acknowledgedAt = new Date(); report.acknowledgedBy = adminName; }
        } else {
            return bad(res, 'Choose Acknowledged or Resolved');
        }
        if (actionTaken) report.actionTaken = actionTaken;
        await report.save();

        // Tell the person who raised it
        const message = report.status === 'Resolved'
            ? `Your safety report was closed: ${report.actionTaken}`
            : 'The Utsavo team is looking into your safety report.';
        try {
            if (report.reporterUserId) {
                const { createNotification } = require('../../services/notification.service');
                await createNotification({ userId: report.reporterUserId, title: 'Safety report update', message, type: 'booking', entityType: 'General', customLink: '/user/work' });
            } else if (report.reporterVendorId) {
                const Notification = require('../vendor/Notification');
                await Notification.create({ vendorId: report.reporterVendorId, message: `Safety report update: ${message}`, type: 'System' });
            }
        } catch (_) { /* best effort */ }
        res.status(200).json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
};

exports.KINDS = SafetyReport.KINDS;
