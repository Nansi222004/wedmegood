const mongoose = require('mongoose');
const crypto = require('crypto');
const WorkJob = require('./WorkJob');
const WorkOffer = require('./WorkOffer');
const WorkAssignment = require('./WorkAssignment');
const WorkerProfile = require('./WorkerProfile');
const { SKILLS, LEVELS } = require('./skills');
const wf = require('../../services/workforce.service');
const { lookupPincode, isPincode } = require('../../services/pincode.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const int = (v, min = 0) => Math.max(min, Math.round(Number(v) || 0));
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Work a customer can request at home (wedding-home housekeeping, guest assistance...)
const CUSTOMER_SKILLS = ['Housekeeping', 'Guest assistance / usher', 'Catering helper', 'Waiter / server', 'Cook assistant',
    'Decoration helper', 'Loader / labour', 'Security', 'Valet parking', 'Mehndi artist', 'Makeup assistant', 'Driver'];

/** Poster identity for vendor routes (after protectOps) */
const vendorPoster = (req, res, next) => {
    req.poster = { type: 'Vendor', vendorId: req.vendor._id, name: req.vendor.businessName, actor: req.actor.name };
    next();
};
/** Poster identity for customer routes (after the user protect middleware) */
const customerPoster = (req, res, next) => {
    req.poster = { type: 'Customer', userId: req.user._id, name: req.user.name, actor: req.user.name };
    next();
};

const ownerQuery = (req) => (req.poster.type === 'Vendor' ? { vendorId: req.poster.vendorId } : { userId: req.poster.userId });

async function ownJob(req) {
    if (!isId(req.params.id)) return null;
    return WorkJob.findOne({ _id: req.params.id, ...ownerQuery(req) });
}

// @desc    Post a job. Pay, food, travel and the total budget are declared before it goes out.
// @route   POST /api/work/vendor/jobs  |  POST /api/work/customer/jobs
exports.createJob = async (req, res, next) => {
    try {
        const b = req.body || {};
        const isCustomer = req.poster.type === 'Customer';
        const allowedSkills = isCustomer ? CUSTOMER_SKILLS : SKILLS;
        if (!allowedSkills.includes(b.category)) return bad(res, isCustomer ? 'Choose a home service' : 'Choose the kind of work');
        const title = String(b.title || '').trim();
        if (!title) return bad(res, 'Give the job a title');
        const date = new Date(b.date);
        const today = new Date(); today.setUTCHours(0, 0, 0, 0);
        if (isNaN(date) || date < today) return bad(res, 'Choose a date from today onwards');
        if (!TIME.test(b.startTime || '') || !TIME.test(b.endTime || '')) return bad(res, 'Enter start and end times like 16:00');
        const duties = String(b.duties || '').trim();
        if (duties.length < 10) return bad(res, 'Describe the duties clearly');
        const positions = int(b.positions, 1);
        if (positions > 100) return bad(res, 'Up to 100 positions per job');
        const pay = int(b.payPerPerson);
        if (pay < 100) return bad(res, 'Enter the pay per person (at least ₹100)');
        if (b.foodProvided === undefined) return bad(res, 'Say whether food is provided');
        if (!isPincode(b.pincode)) return bad(res, 'Enter the PIN code of the work location');
        if (isCustomer && String(b.exactAddress || '').trim().length < 10) return bad(res, 'Enter the full address (shared only with the workers who accept)');
        const travelAllowance = int(b.travelAllowance);
        const totalBudget = positions * (pay + travelAllowance);
        if (!b.budgetConfirmed) {
            return res.status(400).json({
                success: false, code: 'CONFIRM_BUDGET',
                message: `Total budget is ₹${totalBudget.toLocaleString('en-IN')} (${positions} × ₹${pay + travelAllowance}). Confirm to post the job.`,
                data: { totalBudget }
            });
        }

        let workspaceId = null;
        if (!isCustomer && b.eventId) {
            const EventWorkspace = require('../operations/EventWorkspace');
            const ws = isId(b.eventId) && await EventWorkspace.findOne({ _id: b.eventId, vendorId: req.poster.vendorId }).select('_id').lean();
            if (!ws) return bad(res, 'Event not found');
            workspaceId = ws._id;
        }
        const place = await lookupPincode(b.pincode);
        const job = await WorkJob.create({
            posterType: req.poster.type,
            vendorId: req.poster.vendorId || null,
            userId: req.poster.userId || null,
            posterName: req.poster.name,
            workspaceId,
            title: title.slice(0, 160),
            category: b.category,
            skillLevel: LEVELS.includes(b.skillLevel) ? b.skillLevel : 'Fresher',
            positions,
            date,
            startTime: b.startTime,
            endTime: b.endTime,
            breakMinutes: int(b.breakMinutes),
            duties: duties.slice(0, 2000),
            dressCode: String(b.dressCode || '').slice(0, 200),
            equipment: String(b.equipment || '').slice(0, 300),
            payPerPerson: pay,
            overtimeRatePerHour: int(b.overtimeRatePerHour),
            foodProvided: Boolean(b.foodProvided),
            travelAllowance,
            totalBudget,
            paymentTerms: ['Same day', 'Within 3 days', 'Within 7 days'].includes(b.paymentTerms) ? b.paymentTerms : 'Same day',
            cancellationRules: String(b.cancellationRules || '').slice(0, 500),
            driver: b.category === 'Driver' ? {
                vehicleRequired: Boolean(b.driver?.vehicleRequired), vehicleType: String(b.driver?.vehicleType || '').slice(0, 40),
                licenceRequired: b.driver?.licenceRequired !== false, tripDetails: String(b.driver?.tripDetails || '').slice(0, 300)
            } : undefined,
            city: String(b.city || place?.city || place?.district || '').slice(0, 80) || 'Unknown',
            pincode: b.pincode,
            area: String(b.area || place?.places?.[0] || '').slice(0, 120),
            exactAddress: String(b.exactAddress || '').slice(0, 400),
            location: { lat: place?.lat ?? null, lng: place?.lng ?? null },
            searchRadiusKm: Math.min(200, Math.max(1, int(b.searchRadiusKm) || 15)),
            urgency: b.urgency === 'Urgent' ? 'Urgent' : 'Normal',
            offerWindowSeconds: b.urgency === 'Urgent' ? 60 : 180,
            checkInCode: String(crypto.randomInt(100000, 999999))
        });
        await wf.dispatchJob(job._id);
        const fresh = await WorkJob.findById(job._id).lean();
        res.status(201).json({
            success: true,
            data: fresh,
            message: fresh.status === 'Unfilled'
                ? 'Posted, but no verified worker nearby matches yet. Widen the area or adjust pay or timing.'
                : 'Posted. Workers are being offered the job one by one.'
        });
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/work/{vendor|customer}/jobs
exports.listJobs = async (req, res, next) => {
    try {
        const jobs = await WorkJob.find(ownerQuery(req)).sort('-date').limit(200).lean();
        const counts = await WorkAssignment.aggregate([
            { $match: { jobId: { $in: jobs.map(j => j._id) } } },
            { $group: { _id: { job: '$jobId', status: '$status' }, n: { $sum: 1 } } }
        ]);
        const byJob = (id, status) => counts.filter(c => String(c._id.job) === String(id) && (!status || status.includes(c._id.status))).reduce((s, c) => s + c.n, 0);
        res.status(200).json({
            success: true,
            data: jobs.map(j => ({
                _id: j._id, title: j.title, category: j.category, date: j.date, startTime: j.startTime, endTime: j.endTime,
                positions: j.positions, filled: j.filled, status: j.status, payPerPerson: j.payPerPerson, city: j.city,
                workspaceId: j.workspaceId, checkedIn: byJob(j._id, ['CheckedIn', 'CheckedOut', 'Approved', 'Paid']),
                toApprove: byJob(j._id, ['CheckedOut']), disputes: byJob(j._id, ['Disputed'])
            })),
            skills: req.poster.type === 'Customer' ? CUSTOMER_SKILLS : SKILLS,
            levels: LEVELS
        });
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/work/{vendor|customer}/jobs/:id
exports.getJob = async (req, res, next) => {
    try {
        const job = await ownJob(req);
        if (!job) return bad(res, 'Job not found', 404);
        const [assignments, currentOffer, offers] = await Promise.all([
            WorkAssignment.find({ jobId: job._id }).sort('createdAt').lean(),
            job.currentOfferId ? WorkOffer.findById(job.currentOfferId).lean() : null,
            WorkOffer.aggregate([{ $match: { jobId: job._id } }, { $group: { _id: '$status', n: { $sum: 1 } } }])
        ]);
        const workers = await WorkerProfile.find({ _id: { $in: assignments.map(a => a.workerId) } }).populate('userId', 'phone').lean();
        const wById = new Map(workers.map(w => [String(w._id), w]));
        res.status(200).json({
            success: true,
            data: {
                ...job.toObject(),
                currentOffer: currentOffer && currentOffer.status === 'Pending' ? { expiresAt: currentOffer.expiresAt } : null,
                offerStats: Object.fromEntries(offers.map(o => [o._id, o.n])),
                assignments: assignments.map(a => {
                    const w = wById.get(String(a.workerId));
                    const active = !['Cancelled'].includes(a.status);
                    return {
                        ...a,
                        worker: w ? {
                            _id: w._id, name: w.name, skills: w.skills, verified: w.verification?.status === 'Verified',
                            rating: w.stats?.ratingCount ? Math.round((w.stats.ratingSum / w.stats.ratingCount) * 10) / 10 : null,
                            completed: w.stats?.completed || 0,
                            // Contact only for people actually working the job
                            phone: active ? w.userId?.phone : undefined
                        } : null
                    };
                })
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Adjust an open job: more positions, higher pay, timing, wider area. Workers who said no
//          before are offered again when the terms change.
// @route   PUT /api/work/{vendor|customer}/jobs/:id
exports.updateJob = async (req, res, next) => {
    try {
        const job = await ownJob(req);
        if (!job) return bad(res, 'Job not found', 404);
        if (!['Open', 'Unfilled', 'Filled'].includes(job.status)) return bad(res, 'This job can no longer be changed');
        const b = req.body || {};
        let termsChanged = false;
        if (b.positions !== undefined) {
            const p = int(b.positions, 1);
            if (p < job.filled) return bad(res, `${job.filled} workers are already confirmed`);
            job.positions = Math.min(100, p);
        }
        if (b.payPerPerson !== undefined) {
            const pay = int(b.payPerPerson);
            // Confirmed workers keep their agreed pay; it is never lowered for anyone silently
            if (pay < job.payPerPerson && job.filled > 0) return bad(res, 'Pay cannot be lowered after workers have confirmed');
            if (pay !== job.payPerPerson) { job.payPerPerson = pay; termsChanged = true; }
        }
        if (b.searchRadiusKm !== undefined) {
            const r = Math.min(200, Math.max(1, int(b.searchRadiusKm)));
            if (r > job.searchRadiusKm) termsChanged = true;
            job.searchRadiusKm = r;
        }
        for (const f of ['startTime', 'endTime']) {
            if (b[f] !== undefined) {
                if (!TIME.test(b[f])) return bad(res, 'Times must be like 16:00');
                if (job.filled > 0 && b[f] !== job[f]) return bad(res, 'Timing cannot change after workers have confirmed. Cancel and repost instead.');
                if (b[f] !== job[f]) { job[f] = b[f]; termsChanged = true; }
            }
        }
        if (b.overtimeRatePerHour !== undefined) job.overtimeRatePerHour = Math.max(job.overtimeRatePerHour, int(b.overtimeRatePerHour));
        job.totalBudget = job.positions * (job.payPerPerson + job.travelAllowance);
        if (termsChanged) {
            job.round = (job.round || 1) + 1;
            await wf.revokeCurrentOffer(job);
            job.currentOfferId = null;
        }
        if (job.filled < job.positions && job.status !== 'Open') job.status = 'Open';
        await job.save();
        await wf.dispatchJob(job._id);
        res.status(200).json({ success: true, data: await WorkJob.findById(job._id).lean(), message: 'Job updated' });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/work/{vendor|customer}/jobs/:id/cancel   body: { reason }
exports.cancelJob = async (req, res, next) => {
    try {
        const job = await ownJob(req);
        if (!job) return bad(res, 'Job not found', 404);
        if (['Cancelled', 'Completed'].includes(job.status)) return bad(res, 'This job is already closed');
        await wf.revokeCurrentOffer(job);
        job.status = 'Cancelled';
        job.currentOfferId = null;
        await job.save();
        const reason = String(req.body?.reason || '').slice(0, 300);
        const affected = await WorkAssignment.find({ jobId: job._id, status: 'Confirmed' });
        for (const a of affected) {
            a.status = 'Cancelled';
            a.cancelledBy = 'Poster';
            a.cancelReason = reason;
            await a.save();
            const w = await WorkerProfile.findById(a.workerId).lean();
            if (w) await wf.notifyWorker(w, 'Job cancelled', `"${job.title}" on ${new Date(job.date).toLocaleDateString('en-IN')} was cancelled by ${job.posterName}.${reason ? ` Reason: ${reason}` : ''}${job.cancellationRules ? ` Cancellation terms: ${job.cancellationRules}` : ''}`);
        }
        res.status(200).json({ success: true, message: `Job cancelled${affected.length ? `; ${affected.length} worker(s) told` : ''}` });
    } catch (err) {
        next(err);
    }
};

async function ownAssignment(req) {
    const job = await ownJob(req);
    if (!job || !isId(req.params.aid)) return {};
    const a = await WorkAssignment.findOne({ _id: req.params.aid, jobId: job._id });
    return { job, a };
}

// @desc    Supervisor confirms a worker is at the venue
// @route   POST .../jobs/:id/assignments/:aid/checkin
exports.markCheckIn = async (req, res, next) => {
    try {
        const { job, a } = await ownAssignment(req);
        if (!a) return bad(res, 'Worker not found', 404);
        if (a.status !== 'Confirmed') return bad(res, 'Already checked in or closed');
        a.status = 'CheckedIn';
        a.checkInAt = new Date();
        a.checkInBy = req.poster.actor;
        await a.save();
        res.status(200).json({ success: true, data: a, job: job._id });
    } catch (err) {
        next(err);
    }
};

// @desc    Confirm the shift: agreed pay + travel + approved overtime becomes payable. For a vendor
//          job linked to an event, the same amount is recorded as a labour cost on that event.
// @route   POST .../jobs/:id/assignments/:aid/approve   body: { overtimeHours, breakMinutes }
exports.approveShift = async (req, res, next) => {
    try {
        const { job, a } = await ownAssignment(req);
        if (!a) return bad(res, 'Worker not found', 404);
        if (!['CheckedIn', 'CheckedOut'].includes(a.status)) return bad(res, 'The worker has not checked in');
        if (!a.checkOutAt) a.checkOutAt = new Date();
        a.overtimeHours = Math.max(0, Math.min(12, Number(req.body?.overtimeHours) || 0));
        if (a.overtimeHours && !a.overtimeRatePerHour) return bad(res, 'This job has no overtime rate agreed, so overtime cannot be added');
        a.overtimeApprovedBy = a.overtimeHours ? req.poster.actor : '';
        a.breakMinutes = int(req.body?.breakMinutes ?? job.breakMinutes);
        a.totalPayable = a.agreedPay + (job.travelAllowance || 0) + Math.round(a.overtimeHours * a.overtimeRatePerHour);
        a.status = 'Approved';
        a.approvedAt = new Date();
        a.approvedBy = req.poster.actor;

        if (job.posterType === 'Vendor' && job.workspaceId && !a.expenseId) {
            const OpsExpense = require('../operations/OpsExpense');
            const worker = await WorkerProfile.findById(a.workerId).select('name').lean();
            const e = await OpsExpense.create({
                vendorId: job.vendorId, scope: 'Event', workspaceId: job.workspaceId, date: job.date, category: 'Labour',
                description: `${job.category}: ${worker?.name || 'worker'} (temporary)${a.overtimeHours ? ` + ${a.overtimeHours}h overtime` : ''}`,
                amount: a.totalPayable, workers: 1,
                hours: Math.round(((a.checkOutAt - a.checkInAt) / 3600000 - a.breakMinutes / 60) * 10) / 10,
                payee: worker?.name || '', paymentMethod: 'Credit (unpaid)', paymentStatus: 'Unpaid',
                source: 'workforce', sourceRef: String(a._id), audit: [{ action: 'Created from confirmed workforce shift', by: req.poster.actor }]
            });
            a.expenseId = e._id;
        }
        await a.save();
        await WorkerProfile.updateOne({ _id: a.workerId }, { $inc: { 'stats.completed': 1 } });
        const w = await WorkerProfile.findById(a.workerId).lean();
        if (w) await wf.notifyWorker(w, 'Shift confirmed', `₹${a.totalPayable.toLocaleString('en-IN')} is payable for "${job.title}" (${job.paymentTerms.toLowerCase()}).`);
        res.status(200).json({ success: true, data: a });
    } catch (err) {
        next(err);
    }
};

// @desc    Record the payment: the worker gets a receipt and the event cost is marked paid
// @route   POST .../jobs/:id/assignments/:aid/pay   body: { method, reference }
exports.recordPayment = async (req, res, next) => {
    try {
        const { job, a } = await ownAssignment(req);
        if (!a) return bad(res, 'Worker not found', 404);
        if (!['Approved', 'Disputed'].includes(a.status)) return bad(res, 'Confirm the shift first');
        const method = ['Cash', 'UPI', 'Bank transfer'].includes(req.body?.method) ? req.body.method : 'Cash';
        a.payment = {
            method,
            reference: String(req.body?.reference || '').slice(0, 80),
            paidAt: new Date(),
            receiptNumber: `UTS-WR-${Date.now().toString().slice(-8)}`
        };
        a.status = 'Paid';
        if (a.dispute?.raisedBy && !a.dispute.resolvedAt) {
            a.dispute.resolution = 'Payment recorded by poster';
            a.dispute.resolvedAt = new Date();
        }
        await a.save();
        if (a.expenseId) {
            const OpsExpense = require('../operations/OpsExpense');
            await OpsExpense.updateOne({ _id: a.expenseId }, {
                $set: { paymentStatus: 'Paid', paymentMethod: method === 'Bank transfer' ? 'Bank transfer' : method, receiptNumber: a.payment.receiptNumber },
                $push: { audit: { action: 'Paid to worker', by: req.poster.actor } }
            });
        }
        const w = await WorkerProfile.findById(a.workerId).lean();
        if (w) await wf.notifyWorker(w, 'Payment recorded', `₹${a.totalPayable.toLocaleString('en-IN')} for "${job.title}" paid by ${method}. Receipt ${a.payment.receiptNumber}. Report it if you did not receive it.`);
        res.status(200).json({ success: true, data: a });
    } catch (err) {
        next(err);
    }
};

// @desc    Worker did not turn up: reopen the position; repeated no-shows trigger a review
// @route   POST .../jobs/:id/assignments/:aid/noshow
exports.markNoShow = async (req, res, next) => {
    try {
        const { job, a } = await ownAssignment(req);
        if (!a) return bad(res, 'Worker not found', 404);
        if (a.status !== 'Confirmed') return bad(res, 'Only a worker who has not checked in can be marked no-show');
        if (wf.jobStart(job) > new Date()) return bad(res, 'The job has not started yet');
        a.status = 'NoShow';
        await a.save();
        await wf.recordNoShow(a.workerId);
        if (wf.jobEnd(job) > new Date()) {
            await WorkJob.updateOne({ _id: job._id, filled: { $gt: 0 } }, { $inc: { filled: -1 }, $set: { status: 'Open', urgency: 'Urgent', offerWindowSeconds: 60 } });
            await wf.dispatchJob(job._id);
        }
        res.status(200).json({ success: true, message: 'Marked no-show. Looking for a replacement.' });
    } catch (err) {
        next(err);
    }
};

// @route   POST .../jobs/:id/assignments/:aid/rate   body: { rating }
exports.rateWorker = async (req, res, next) => {
    try {
        const { a } = await ownAssignment(req);
        if (!a) return bad(res, 'Worker not found', 404);
        if (!['Approved', 'Paid'].includes(a.status)) return bad(res, 'Rate after the shift is confirmed');
        if (a.rating) return bad(res, 'Already rated');
        const rating = Math.min(5, Math.max(1, int(req.body?.rating, 1)));
        a.rating = rating;
        await a.save();
        await WorkerProfile.updateOne({ _id: a.workerId }, { $inc: { 'stats.ratingSum': rating, 'stats.ratingCount': 1 } });
        res.status(200).json({ success: true, data: a });
    } catch (err) {
        next(err);
    }
};

exports.vendorPoster = vendorPoster;
exports.customerPoster = customerPoster;
exports.CUSTOMER_SKILLS = CUSTOMER_SKILLS;
