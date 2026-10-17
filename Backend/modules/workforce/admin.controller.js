const mongoose = require('mongoose');
const WorkerProfile = require('./WorkerProfile');
const WorkJob = require('./WorkJob');
const WorkAssignment = require('./WorkAssignment');
const wf = require('../../services/workforce.service');
const { logAdminAction } = require('../../services/audit.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

// @desc    Workers, filtered by verification status or under review
// @route   GET /api/admin/workforce/workers?status=Pending|Verified|Rejected|Unverified&review=1&search=
exports.listWorkers = async (req, res, next) => {
    try {
        const q = {};
        if (['Pending', 'Verified', 'Rejected', 'Unverified'].includes(req.query.status)) q['verification.status'] = req.query.status;
        if (req.query.review === '1') q.underReview = true;
        const search = String(req.query.search || '').trim();
        if (search) q.$or = [{ name: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { city: new RegExp(search, 'i') }, { pincode: search }];
        const [workers, counts] = await Promise.all([
            WorkerProfile.find(q).populate('userId', 'phone email').sort('-updatedAt').limit(300).lean(),
            WorkerProfile.aggregate([{ $group: { _id: '$verification.status', n: { $sum: 1 } } }])
        ]);
        const review = await WorkerProfile.countDocuments({ underReview: true });
        res.status(200).json({
            success: true,
            data: workers.map(w => ({
                _id: w._id, name: w.name, phone: w.userId?.phone, email: w.userId?.email, city: w.city, pincode: w.pincode,
                age: wf.ageOn(w.dateOfBirth), skills: w.skills, verification: w.verification, stats: w.stats,
                underReview: w.underReview, isActive: w.isActive, createdAt: w.createdAt,
                hasIdPhoto: Boolean(w.verification?.idPhotoId)
            })),
            counts: { ...Object.fromEntries(counts.map(c => [c._id, c.n])), underReview: review }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    The worker's ID photo (private; streamed to the admin only)
// @route   GET /api/admin/workforce/workers/:id/id-photo
exports.getIdPhoto = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Invalid worker');
        const w = await WorkerProfile.findById(req.params.id).select('verification.idPhotoId').lean();
        if (!w?.verification?.idPhotoId) return bad(res, 'No ID photo', 404);
        const ReferencePhoto = require('../user/ReferencePhoto');
        const photo = await ReferencePhoto.findById(w.verification.idPhotoId).lean();
        if (!photo) return bad(res, 'Photo not found', 404);
        const { streamPhoto, watermarkText } = require('../../services/referencePhoto.service');
        await streamPhoto(res, photo, { width: 1400, watermark: watermarkText('Admin review') });
    } catch (err) {
        next(err);
    }
};

// @desc    Approve or reject an ID; the date of birth on the ID must show 18+
// @route   POST /api/admin/workforce/workers/:id/verify   body: { approve, reason, verifiedDob, verifiedName }
exports.verifyWorker = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Invalid worker');
        const w = await WorkerProfile.findById(req.params.id);
        if (!w) return bad(res, 'Worker not found', 404);
        const approve = Boolean(req.body?.approve);
        if (approve) {
            const dob = req.body?.verifiedDob ? new Date(req.body.verifiedDob) : w.dateOfBirth;
            if (!dob || isNaN(dob)) return bad(res, 'Enter the date of birth shown on the ID');
            if (wf.ageOn(dob) < 18) return bad(res, 'The ID shows the worker is under 18');
            w.verification.status = 'Verified';
            w.verification.verifiedDob = dob;
            w.verification.verifiedName = String(req.body?.verifiedName || w.name).slice(0, 120);
            w.verification.rejectionReason = '';
            w.dateOfBirth = dob;
        } else {
            const reason = String(req.body?.reason || '').trim();
            if (!reason) return bad(res, 'Give a reason the worker can act on');
            w.verification.status = 'Rejected';
            w.verification.rejectionReason = reason.slice(0, 300);
        }
        if (!w.verification.method) w.verification.method = 'Manual';
        w.verification.reviewedBy = req.user?.name || 'Admin';
        w.verification.reviewedAt = new Date();
        await w.save();
        await wf.notifyWorker(w, approve ? 'You are verified' : 'ID verification failed',
            approve ? 'Your ID is verified. You will now receive job offers that match your skills and area.' : `Reason: ${w.verification.rejectionReason}. Please submit a clear photo of a valid ID.`);
        await logAdminAction({ admin: req.user, action: `${approve ? 'Verified' : 'Rejected'} worker ${w.name}`, entityType: 'User', entityId: w.userId, reason: req.body?.reason, req });
        res.status(200).json({ success: true, data: { _id: w._id, verification: w.verification } });
    } catch (err) {
        next(err);
    }
};

// @desc    Clear a review after repeated no-shows (or keep the worker paused)
// @route   POST /api/admin/workforce/workers/:id/review   body: { clear, note, deactivate }
exports.reviewWorker = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Invalid worker');
        const w = await WorkerProfile.findById(req.params.id);
        if (!w) return bad(res, 'Worker not found', 404);
        if (req.body?.clear) w.underReview = false;
        if (req.body?.deactivate !== undefined) w.isActive = !req.body.deactivate;
        await w.save();
        await logAdminAction({ admin: req.user, action: `Workforce review for ${w.name}: ${req.body?.clear ? 'cleared' : 'kept'}${req.body?.deactivate ? ', deactivated' : ''}`, entityType: 'User', entityId: w.userId, reason: req.body?.note, req });
        res.status(200).json({ success: true, data: { underReview: w.underReview, isActive: w.isActive } });
    } catch (err) {
        next(err);
    }
};

// @desc    Jobs overview and disputes
// @route   GET /api/admin/workforce/overview
exports.overview = async (req, res, next) => {
    try {
        const since = new Date(Date.now() - 30 * 86400000);
        const [byStatus, disputes, jobs] = await Promise.all([
            WorkJob.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$status', n: { $sum: 1 }, positions: { $sum: '$positions' }, filled: { $sum: '$filled' } } }]),
            WorkAssignment.find({ status: 'Disputed' }).populate('workerId', 'name').populate('jobId', 'title posterName posterType date').sort('-updatedAt').limit(100).lean(),
            WorkJob.find({}).sort('-createdAt').limit(50).select('title category posterName posterType date city positions filled status payPerPerson').lean()
        ]);
        res.status(200).json({ success: true, data: { last30Days: byStatus, disputes, recentJobs: jobs } });
    } catch (err) {
        next(err);
    }
};

// @desc    Close a dispute with a decision recorded on the job card
// @route   POST /api/admin/workforce/disputes/:aid/resolve   body: { resolution, markPaid }
exports.resolveDispute = async (req, res, next) => {
    try {
        if (!isId(req.params.aid)) return bad(res, 'Invalid record');
        const resolution = String(req.body?.resolution || '').trim();
        if (!resolution) return bad(res, 'Write the decision');
        const a = await WorkAssignment.findOne({ _id: req.params.aid, status: 'Disputed' });
        if (!a) return bad(res, 'Dispute not found', 404);
        a.dispute.resolution = resolution.slice(0, 1000);
        a.dispute.resolvedAt = new Date();
        a.status = req.body?.markPaid ? 'Paid' : 'Approved';
        await a.save();
        const w = await WorkerProfile.findById(a.workerId).lean();
        if (w) await wf.notifyWorker(w, 'Your reported problem was reviewed', resolution.slice(0, 200));
        await logAdminAction({ admin: req.user, action: 'Resolved workforce dispute', entityType: 'User', entityId: w?.userId, reason: resolution, req });
        res.status(200).json({ success: true, data: a });
    } catch (err) {
        next(err);
    }
};
