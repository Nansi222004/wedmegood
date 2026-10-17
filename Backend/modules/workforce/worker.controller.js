const mongoose = require('mongoose');
const WorkerProfile = require('./WorkerProfile');
const WorkJob = require('./WorkJob');
const WorkAssignment = require('./WorkAssignment');
const { SKILLS, LEVELS } = require('./skills');
const wf = require('../../services/workforce.service');
const { lookupPincode, isPincode } = require('../../services/pincode.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const sendError = (res, err, next) => (err instanceof wf.WorkError ? bad(res, err.message, err.status) : next(err));

const ownProfile = (req) => WorkerProfile.findOne({ userId: req.user._id });

const profileView = (w) => ({
    _id: w._id,
    name: w.name,
    dateOfBirth: w.dateOfBirth,
    gender: w.gender,
    city: w.city,
    pincode: w.pincode,
    travelRadiusKm: w.travelRadiusKm,
    skills: w.skills,
    languages: w.languages,
    about: w.about,
    hasVehicle: w.hasVehicle,
    vehicleType: w.vehicleType,
    drivingLicence: w.drivingLicence,
    available: w.available,
    unavailableDates: w.unavailableDates,
    quietHours: w.quietHours,
    soundOn: w.soundOn,
    verification: {
        status: w.verification?.status,
        method: w.verification?.method,
        documentType: w.verification?.documentType,
        rejectionReason: w.verification?.rejectionReason
    },
    stats: w.stats,
    rating: w.stats?.ratingCount ? Math.round((w.stats.ratingSum / w.stats.ratingCount) * 10) / 10 : null,
    underReview: w.underReview
});

// @route   GET /api/work/options (public)
exports.options = (req, res) => {
    res.status(200).json({ success: true, data: { skills: SKILLS, levels: LEVELS, digilocker: wf.digilockerConfigured() } });
};

// @route   GET /api/work/me
exports.getMe = async (req, res, next) => {
    try {
        const w = await ownProfile(req);
        res.status(200).json({ success: true, data: w ? profileView(w) : null });
    } catch (err) {
        next(err);
    }
};

// @desc    Create or update the worker profile
// @route   PUT /api/work/me
exports.saveMe = async (req, res, next) => {
    try {
        if (!req.user.isPhoneVerified) return bad(res, 'Verify your mobile number first', 403);
        const b = req.body || {};
        const existing = await ownProfile(req);
        const data = {};
        if (b.name !== undefined) data.name = String(b.name).trim().slice(0, 120);
        if (b.dateOfBirth !== undefined) {
            const dob = new Date(b.dateOfBirth);
            if (isNaN(dob)) return bad(res, 'Enter your date of birth');
            if (wf.ageOn(dob) < 18) return bad(res, 'You must be 18 or older to take jobs on Utsavo');
            // A DigiLocker-verified date of birth cannot be changed
            if (!(existing?.verification?.status === 'Verified' && existing.verification.verifiedDob)) data.dateOfBirth = dob;
        }
        if (b.gender !== undefined) data.gender = ['Female', 'Male', 'Other'].includes(b.gender) ? b.gender : 'Prefer not to say';
        if (b.pincode !== undefined) {
            if (!isPincode(b.pincode)) return bad(res, 'Enter a valid 6-digit PIN code');
            data.pincode = b.pincode;
            const place = await lookupPincode(b.pincode);
            data.location = { lat: place?.lat ?? null, lng: place?.lng ?? null };
            data.city = String(b.city || place?.city || place?.district || '').trim().slice(0, 80);
        } else if (b.city !== undefined) data.city = String(b.city).trim().slice(0, 80);
        if (b.travelRadiusKm !== undefined) data.travelRadiusKm = Math.min(200, Math.max(1, Math.round(Number(b.travelRadiusKm) || 15)));
        if (Array.isArray(b.skills)) {
            const seen = new Set();
            data.skills = b.skills.filter(s => SKILLS.includes(s.category) && !seen.has(s.category) && seen.add(s.category))
                .map(s => ({ category: s.category, level: LEVELS.includes(s.level) ? s.level : 'Fresher', years: Math.max(0, Math.min(50, Number(s.years) || 0)) }))
                .slice(0, 10);
            if (data.skills.length === 0) return bad(res, 'Choose at least one kind of work you can do');
        }
        if (Array.isArray(b.languages)) data.languages = b.languages.map(String).slice(0, 10);
        if (b.about !== undefined) data.about = String(b.about).slice(0, 500);
        if (b.hasVehicle !== undefined) data.hasVehicle = Boolean(b.hasVehicle);
        if (b.vehicleType !== undefined) data.vehicleType = String(b.vehicleType).slice(0, 40);
        if (b.drivingLicence !== undefined) data.drivingLicence = Boolean(b.drivingLicence);

        // Changing the name after verification needs verification again
        if (existing?.verification?.status === 'Verified' && data.name && data.name !== existing.name) {
            data['verification.status'] = 'Unverified';
            data['verification.method'] = '';
        }

        if (!existing) {
            for (const f of ['name', 'dateOfBirth', 'pincode', 'city']) {
                if (!data[f]) return bad(res, 'Fill in your name, date of birth and PIN code');
            }
            if (!data.skills?.length) return bad(res, 'Choose at least one kind of work you can do');
            const created = await WorkerProfile.create({ ...data, userId: req.user._id });
            return res.status(201).json({ success: true, data: profileView(created), message: 'Worker profile created. Verify your ID to start receiving jobs.' });
        }
        const updated = await WorkerProfile.findOneAndUpdate({ _id: existing._id }, { $set: data }, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: profileView(updated) });
    } catch (err) {
        next(err);
    }
};

// @desc    Availability, unavailable dates, quiet hours, sound
// @route   PUT /api/work/me/availability
exports.setAvailability = async (req, res, next) => {
    try {
        const w = await ownProfile(req);
        if (!w) return bad(res, 'Create your worker profile first', 404);
        const b = req.body || {};
        if (b.available !== undefined) w.available = Boolean(b.available);
        if (b.soundOn !== undefined) w.soundOn = Boolean(b.soundOn);
        if (b.quietHours) {
            const ok = (t) => !t || /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
            if (!ok(b.quietHours.start) || !ok(b.quietHours.end)) return bad(res, 'Quiet hours must be like 22:00');
            w.quietHours = { start: b.quietHours.start || '', end: b.quietHours.end || '' };
        }
        if (Array.isArray(b.unavailableDates)) {
            w.unavailableDates = b.unavailableDates.map(d => new Date(d)).filter(d => !isNaN(d) && d >= new Date(Date.now() - 86400000)).slice(0, 120);
        }
        await w.save();
        res.status(200).json({ success: true, data: profileView(w) });
    } catch (err) {
        next(err);
    }
};

// @desc    Start DigiLocker verification (returns the URL to open)
// @route   POST /api/work/me/digilocker
exports.startDigilocker = async (req, res, next) => {
    try {
        const w = await ownProfile(req);
        if (!w) return bad(res, 'Create your worker profile first', 404);
        if (w.verification.status === 'Verified') return bad(res, 'You are already verified');
        const url = await wf.startDigilocker(w);
        res.status(200).json({ success: true, data: { url } });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    DigiLocker sends the worker back here (public; matched by the one-time state)
// @route   GET /api/work/digilocker/callback?code=&state=
exports.digilockerCallback = async (req, res) => {
    const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    try {
        const w = await wf.completeDigilocker({ code: req.query.code, state: req.query.state });
        return res.redirect(302, `${frontend}/user/work?verification=${w.verification.status.toLowerCase()}`);
    } catch (err) {
        return res.redirect(302, `${frontend}/user/work?verification=error&message=${encodeURIComponent(err.message || 'Verification failed')}`);
    }
};

// @desc    Manual verification: an ID photo (uploaded privately) checked by the Utsavo team
// @route   POST /api/work/me/verification   body: { idPhotoId, documentType }
exports.submitManualVerification = async (req, res, next) => {
    try {
        const w = await ownProfile(req);
        if (!w) return bad(res, 'Create your worker profile first', 404);
        if (w.verification.status === 'Verified') return bad(res, 'You are already verified');
        const { idPhotoId, documentType } = req.body || {};
        const ReferencePhoto = require('../user/ReferencePhoto');
        if (!isId(idPhotoId) || !(await ReferencePhoto.exists({ _id: idPhotoId, userId: req.user._id }))) {
            return bad(res, 'Upload a photo of your ID');
        }
        w.verification.status = 'Pending';
        w.verification.method = 'Manual';
        w.verification.idPhotoId = idPhotoId;
        w.verification.documentType = ['Aadhaar', 'PAN', 'Voter ID', 'Driving licence', 'Passport'].includes(documentType) ? documentType : 'Other ID';
        w.verification.rejectionReason = '';
        await w.save();
        res.status(200).json({ success: true, data: profileView(w), message: 'Sent for verification. This usually takes a day.' });
    } catch (err) {
        next(err);
    }
};

// @desc    How many matching jobs were posted recently (before deciding to subscribe)
// @route   GET /api/work/demand?category=&city=
exports.demand = async (req, res, next) => {
    try {
        const w = await ownProfile(req);
        const categories = req.query.category ? [req.query.category] : (w?.skills || []).map(s => s.category);
        const city = String(req.query.city || w?.city || '').trim();
        const since = new Date(Date.now() - 30 * 86400000);
        const rows = await WorkJob.aggregate([
            {
                $match: {
                    createdAt: { $gte: since },
                    ...(categories.length ? { category: { $in: categories } } : {}),
                    ...(city ? { city: new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } : {})
                }
            },
            { $group: { _id: '$category', jobs: { $sum: 1 }, positions: { $sum: '$positions' }, avgPay: { $avg: '$payPerPerson' } } },
            { $sort: { positions: -1 } }
        ]);
        res.status(200).json({
            success: true,
            data: {
                city, periodDays: 30,
                categories: rows.map(r => ({ category: r._id, jobs: r.jobs, positions: r.positions, avgPay: Math.round(r.avgPay || 0) })),
                note: 'Past demand in your area. Utsavo does not guarantee a number of jobs.'
            }
        });
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/work/offers/active
exports.activeOffers = async (req, res, next) => {
    try {
        const w = await ownProfile(req);
        if (!w) return res.status(200).json({ success: true, data: [], serverTime: new Date() });
        res.status(200).json({ success: true, data: await wf.activeOffersFor(w), serverTime: new Date() });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/work/offers/:offerId/accept
exports.acceptOffer = async (req, res, next) => {
    try {
        const w = await ownProfile(req);
        if (!w || !isId(req.params.offerId)) return bad(res, 'Offer not found', 404);
        const { assignment } = await wf.acceptOffer(req.params.offerId, w);
        res.status(200).json({ success: true, message: 'Job confirmed. Your job card has the venue and reporting details.', data: { assignmentId: assignment._id } });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @route   POST /api/work/offers/:offerId/decline   body: { reason }
exports.declineOffer = async (req, res, next) => {
    try {
        const w = await ownProfile(req);
        if (!w || !isId(req.params.offerId)) return bad(res, 'Offer not found', 404);
        await wf.declineOffer(req.params.offerId, w, req.body?.reason);
        res.status(200).json({ success: true, message: 'Declined. Declining does not affect future offers.' });
    } catch (err) {
        sendError(res, err, next);
    }
};

/** The job card: everything the worker needs, the exact address only once confirmed. */
function jobCard(a, job) {
    return {
        _id: a._id,
        status: a.status,
        agreedPay: a.agreedPay,
        agreedHours: a.agreedHours,
        overtimeRatePerHour: a.overtimeRatePerHour,
        overtimeHours: a.overtimeHours,
        totalPayable: a.totalPayable,
        checkInAt: a.checkInAt,
        checkOutAt: a.checkOutAt,
        approvedAt: a.approvedAt,
        payment: a.payment,
        workerConfirmedPaymentAt: a.workerConfirmedPaymentAt,
        dispute: a.dispute,
        rating: a.rating,
        job: job ? {
            _id: job._id, title: job.title, category: job.category, posterName: job.posterName, posterType: job.posterType,
            date: job.date, startTime: job.startTime, endTime: job.endTime, breakMinutes: job.breakMinutes,
            duties: job.duties, dressCode: job.dressCode, equipment: job.equipment, foodProvided: job.foodProvided,
            travelAllowance: job.travelAllowance, paymentTerms: job.paymentTerms, cancellationRules: job.cancellationRules,
            city: job.city, pincode: job.pincode, area: job.area,
            exactAddress: ['Confirmed', 'CheckedIn', 'CheckedOut'].includes(a.status) ? job.exactAddress : '',
            status: job.status
        } : null
    };
}

// @route   GET /api/work/assignments
exports.myAssignments = async (req, res, next) => {
    try {
        const w = await ownProfile(req);
        if (!w) return res.status(200).json({ success: true, data: [] });
        const list = await WorkAssignment.find({ workerId: w._id }).sort('-createdAt').limit(100).lean();
        const jobs = await WorkJob.find({ _id: { $in: list.map(a => a.jobId) } }).lean();
        const byId = new Map(jobs.map(j => [String(j._id), j]));
        const cards = list.map(a => jobCard(a, byId.get(String(a.jobId))));
        const earned = list.filter(a => a.status === 'Paid').reduce((s, a) => s + (a.totalPayable || 0), 0);
        const pending = list.filter(a => ['Approved', 'Disputed'].includes(a.status)).reduce((s, a) => s + (a.totalPayable || 0), 0);
        res.status(200).json({ success: true, data: cards, summary: { earned, pending } });
    } catch (err) {
        next(err);
    }
};

async function ownAssignment(req) {
    const w = await ownProfile(req);
    if (!w || !isId(req.params.aid)) return {};
    const a = await WorkAssignment.findOne({ _id: req.params.aid, workerId: w._id });
    const job = a ? await WorkJob.findById(a.jobId) : null;
    return { w, a, job };
}

// @desc    Check in at the venue with the job's check-in code
// @route   POST /api/work/assignments/:aid/checkin   body: { code }
exports.checkIn = async (req, res, next) => {
    try {
        const { a, job } = await ownAssignment(req);
        if (!a) return bad(res, 'Job not found', 404);
        if (a.status !== 'Confirmed') return bad(res, 'You are already checked in, or this job is closed');
        if (String(req.body?.code || '').trim() !== job.checkInCode) return bad(res, 'Wrong check-in code. Ask the supervisor at the venue.');
        const start = wf.jobStart(job).getTime();
        if (Date.now() < start - 2 * 3600000) return bad(res, 'Check-in opens 2 hours before the start time');
        a.status = 'CheckedIn';
        a.checkInAt = new Date();
        a.checkInBy = 'code';
        await a.save();
        res.status(200).json({ success: true, data: jobCard(a.toObject(), job) });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/work/assignments/:aid/checkout
exports.checkOut = async (req, res, next) => {
    try {
        const { a, job } = await ownAssignment(req);
        if (!a) return bad(res, 'Job not found', 404);
        if (a.status !== 'CheckedIn') return bad(res, 'Check in first');
        a.status = 'CheckedOut';
        a.checkOutAt = new Date();
        await a.save();
        await wf.notifyPoster(job, 'Worker checked out', `A worker finished "${job.title}". Confirm the shift so the pay is recorded.`);
        res.status(200).json({ success: true, data: jobCard(a.toObject(), job) });
    } catch (err) {
        next(err);
    }
};

// @desc    Worker confirms the payment arrived
// @route   POST /api/work/assignments/:aid/confirm-payment
exports.confirmPayment = async (req, res, next) => {
    try {
        const { a, job } = await ownAssignment(req);
        if (!a) return bad(res, 'Job not found', 404);
        if (a.status !== 'Paid') return bad(res, 'The poster has not recorded a payment yet');
        a.workerConfirmedPaymentAt = new Date();
        await a.save();
        res.status(200).json({ success: true, data: jobCard(a.toObject(), job) });
    } catch (err) {
        next(err);
    }
};

// @desc    Report unpaid pay or wrong hours
// @route   POST /api/work/assignments/:aid/dispute   body: { reason }
exports.raiseDispute = async (req, res, next) => {
    try {
        const { a, job } = await ownAssignment(req);
        if (!a) return bad(res, 'Job not found', 404);
        const reason = String(req.body?.reason || '').trim();
        if (!reason) return bad(res, 'Describe the problem');
        if (!['CheckedOut', 'Approved', 'Paid'].includes(a.status)) return bad(res, 'You can report a problem after the shift');
        a.dispute = { raisedBy: 'Worker', reason: reason.slice(0, 1000), raisedAt: new Date(), resolution: '', resolvedAt: null };
        a.status = 'Disputed';
        await a.save();
        await wf.notifyPoster(job, 'Worker reported a problem', `${reason.slice(0, 150)} (job "${job.title}"). The Utsavo team can see this.`);
        res.status(200).json({ success: true, message: 'Reported. The poster and the Utsavo team have been told.' });
    } catch (err) {
        next(err);
    }
};

// @desc    Worker cancels a confirmed job (before it starts)
// @route   POST /api/work/assignments/:aid/cancel   body: { reason }
exports.cancelAssignment = async (req, res, next) => {
    try {
        const { w, a, job } = await ownAssignment(req);
        if (!a) return bad(res, 'Job not found', 404);
        if (a.status !== 'Confirmed') return bad(res, 'This job can no longer be cancelled');
        if (wf.jobStart(job) < new Date()) return bad(res, 'The job has started');
        a.status = 'Cancelled';
        a.cancelledBy = 'Worker';
        a.cancelReason = String(req.body?.reason || '').slice(0, 300);
        await a.save();
        // Re-open the position and keep looking
        await WorkJob.updateOne({ _id: job._id, filled: { $gt: 0 } }, { $inc: { filled: -1 }, $set: { status: 'Open' } });
        await wf.dispatchJob(job._id);
        await wf.notifyPoster(job, 'A worker cancelled', `${w.name} cancelled "${job.title}". Utsavo is offering the position to the next worker.`);
        res.status(200).json({ success: true, message: 'Cancelled' });
    } catch (err) {
        next(err);
    }
};

exports.profileView = profileView;
exports.jobCard = jobCard;
