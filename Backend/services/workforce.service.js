const crypto = require('crypto');
const mongoose = require('mongoose');
const WorkerProfile = require('../modules/workforce/WorkerProfile');
const WorkJob = require('../modules/workforce/WorkJob');
const WorkOffer = require('../modules/workforce/WorkOffer');
const WorkAssignment = require('../modules/workforce/WorkAssignment');
const { levelRank } = require('../modules/workforce/skills');
const { distanceKm } = require('./pincode.service');

/*
 * Swiggy-style job allocation: a job is offered to ONE eligible worker at a time, for a short
 * window. Eligibility = right skill and level, verified, available, not on an overlapping shift,
 * within both the worker's and the job's distance. Among eligible workers the one offered least
 * recently goes first, so new verified workers get chances too. Declining is not penalised;
 * repeated no-shows put a worker under review. The last open position can only be taken once.
 */

const NO_SHOW_REVIEW_LIMIT = 3;
const ACTIVE_ASSIGNMENT = ['Confirmed', 'CheckedIn', 'CheckedOut'];

let io = null;
const setSocketServer = (server) => { io = server; };
const emitToUser = (userId, event, payload) => {
    try { if (io) io.to(`user:${userId}`).emit(event, payload); } catch (_) { /* best effort */ }
};

const toMinutes = (hhmm) => {
    const [h, m] = String(hhmm || '').split(':').map(Number);
    return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : null;
};
const jobHours = (job) => {
    const s = toMinutes(job.startTime);
    let e = toMinutes(job.endTime);
    if (s === null || e === null) return 0;
    if (e <= s) e += 24 * 60; // ends after midnight
    return Math.max(0, (e - s - (job.breakMinutes || 0)) / 60);
};
/** When the job starts, as a Date (job.date is the day; startTime is local "HH:MM" in IST). */
const jobStart = (job) => {
    const d = new Date(job.date);
    const mins = toMinutes(job.startTime) || 0;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + (mins - 330) * 60000);
};
const jobEnd = (job) => new Date(jobStart(job).getTime() + (jobHours(job) * 60 + (job.breakMinutes || 0)) * 60000);
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

/** Within the worker's quiet hours right now (IST)? */
function inQuietHours(worker, now = new Date()) {
    const s = toMinutes(worker.quietHours?.start);
    const e = toMinutes(worker.quietHours?.end);
    if (s === null || e === null || s === e) return false;
    const ist = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % (24 * 60);
    return s < e ? ist >= s && ist < e : ist >= s || ist < e;
}

const ageOn = (dob, at = new Date()) => {
    const d = new Date(dob);
    let age = at.getFullYear() - d.getFullYear();
    const m = at.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && at.getDate() < d.getDate())) age--;
    return age;
};

async function notifyPoster(job, title, message) {
    try {
        if (job.posterType === 'Vendor' && job.vendorId) {
            const Notification = require('../modules/vendor/Notification');
            await Notification.create({ vendorId: job.vendorId, message: `${title}: ${message}`, type: 'System' });
        } else if (job.userId) {
            const { createNotification } = require('./notification.service');
            await createNotification({ userId: job.userId, title, message, type: 'booking', entityType: 'General', customLink: `/user/work/jobs/${job._id}` });
        }
    } catch (_) { /* best effort */ }
}

async function notifyWorker(worker, title, message, link = '/user/work') {
    try {
        const { createNotification } = require('./notification.service');
        await createNotification({ userId: worker.userId, title, message, type: 'booking', entityType: 'General', customLink: link });
    } catch (_) { /* best effort */ }
}

/** Public part of a job, shown in the offer: never the exact address. */
function offerView(job, offer) {
    return {
        offerId: offer._id,
        jobId: job._id,
        expiresAt: offer.expiresAt,
        windowSeconds: job.offerWindowSeconds,
        urgency: job.urgency,
        title: job.title,
        category: job.category,
        skillLevel: job.skillLevel,
        posterName: job.posterName,
        posterType: job.posterType,
        date: job.date,
        startTime: job.startTime,
        endTime: job.endTime,
        breakMinutes: job.breakMinutes,
        hours: Math.round(jobHours(job) * 10) / 10,
        duties: job.duties,
        dressCode: job.dressCode,
        equipment: job.equipment,
        pay: job.payPerPerson,
        overtimeRatePerHour: job.overtimeRatePerHour,
        foodProvided: job.foodProvided,
        travelAllowance: job.travelAllowance,
        paymentTerms: job.paymentTerms,
        cancellationRules: job.cancellationRules,
        driver: job.driver,
        area: [job.area, job.city].filter(Boolean).join(', '),
        pincode: job.pincode,
        distanceKm: offer.distanceKm
    };
}

/** Next eligible worker for a job (least recently offered first, then nearest). */
async function pickWorker(job) {
    const [offered, assigned] = await Promise.all([
        WorkOffer.distinct('workerId', { jobId: job._id, round: job.round || 1 }),
        WorkAssignment.distinct('workerId', { jobId: job._id })
    ]);
    const exclude = new Set([...offered, ...assigned].map(String));
    const candidates = await WorkerProfile.find({
        isActive: true,
        available: true,
        underReview: false,
        'verification.status': 'Verified',
        'skills.category': job.category,
        ...(job.userId ? { userId: { $ne: job.userId } } : {})
    }).lean();

    // Workers already busy on an overlapping shift
    const sameDayJobs = await WorkJob.find({ date: job.date, status: { $nin: ['Cancelled'] }, _id: { $ne: job._id } }).select('date startTime endTime breakMinutes').lean();
    const s = jobStart(job).getTime();
    const e = jobEnd(job).getTime();
    const overlapping = sameDayJobs.filter(j => jobStart(j).getTime() < e && jobEnd(j).getTime() > s).map(j => j._id);
    const busy = new Set((await WorkAssignment.distinct('workerId', { jobId: { $in: overlapping }, status: { $in: ACTIVE_ASSIGNMENT } })).map(String));

    const required = levelRank(job.skillLevel);
    const now = new Date();
    const eligible = [];
    for (const w of candidates) {
        const id = String(w._id);
        if (exclude.has(id) || busy.has(id)) continue;
        const skill = (w.skills || []).find(sk => sk.category === job.category);
        if (!skill || levelRank(skill.level) < required) continue;
        if ((w.unavailableDates || []).some(d => dayKey(d) === dayKey(job.date))) continue;
        if (job.driver?.vehicleRequired && !w.hasVehicle) continue;
        if (job.driver?.licenceRequired && !w.drivingLicence) continue;
        if (ageOn(w.dateOfBirth, now) < 18) continue;
        // Respect quiet hours unless the job is urgent
        if (job.urgency !== 'Urgent' && inQuietHours(w, now)) continue;
        const dist = distanceKm(w.location, job.location);
        if (dist !== null) {
            if (dist > Math.min(w.travelRadiusKm || 15, job.searchRadiusKm || 15)) continue;
        } else if (w.pincode !== job.pincode && String(w.city || '').toLowerCase() !== String(job.city || '').toLowerCase()) {
            continue;
        }
        eligible.push({ worker: w, distance: dist });
    }
    eligible.sort((a, b) => {
        const ta = a.worker.lastOfferedAt ? new Date(a.worker.lastOfferedAt).getTime() : 0;
        const tb = b.worker.lastOfferedAt ? new Date(b.worker.lastOfferedAt).getTime() : 0;
        return ta - tb || (a.distance ?? 9999) - (b.distance ?? 9999);
    });
    return eligible[0] || null;
}

/**
 * Offer the job's next open position to the next eligible worker. Only one caller can hold the
 * job's offer slot at a time, so a job never has two live offers.
 */
async function dispatchJob(jobId) {
    const claimId = new mongoose.Types.ObjectId();
    const job = await WorkJob.findOneAndUpdate(
        { _id: jobId, status: { $in: ['Open', 'Unfilled'] }, currentOfferId: null, $expr: { $lt: ['$filled', '$positions'] } },
        { $set: { currentOfferId: claimId, status: 'Open' } },
        { new: true }
    );
    if (!job) return null;
    try {
        if (jobStart(job) < new Date()) {
            await WorkJob.updateOne({ _id: job._id, currentOfferId: claimId }, { $set: { currentOfferId: null, status: job.filled > 0 ? 'Filled' : 'Unfilled', unfilledAt: new Date() } });
            return null;
        }
        const pick = await pickWorker(job);
        if (!pick) {
            await WorkJob.updateOne({ _id: job._id, currentOfferId: claimId }, { $set: { currentOfferId: null, status: 'Unfilled', unfilledAt: new Date() } });
            await notifyPoster(job, 'Job not filled yet',
                `${job.positions - job.filled} of ${job.positions} position(s) for "${job.title}" are still open and no more eligible workers are available nearby. Widen the search area or adjust the pay or timing.`);
            return null;
        }
        const offer = await WorkOffer.create({
            _id: claimId, jobId: job._id, workerId: pick.worker._id,
            expiresAt: new Date(Date.now() + job.offerWindowSeconds * 1000),
            distanceKm: pick.distance,
            round: job.round || 1
        });
        await WorkerProfile.updateOne({ _id: pick.worker._id }, { $set: { lastOfferedAt: new Date() }, $inc: { 'stats.offered': 1 } });
        emitToUser(pick.worker.userId, 'work:offer', offerView(job, offer));
        try {
            const { sendPushToUser } = require('./push.service');
            await sendPushToUser(pick.worker.userId, {
                title: `${job.urgency === 'Urgent' ? 'Urgent job' : 'New job'}: ${job.category} · ₹${job.payPerPerson}`,
                body: `${job.title} on ${new Date(job.date).toLocaleDateString('en-IN')} ${job.startTime}-${job.endTime}, ${job.city}. Respond in ${Math.round(job.offerWindowSeconds / 60) || 1} min.`,
                link: '/user/work',
                data: { type: 'work_offer', offerId: String(offer._id), sound: pick.worker.soundOn ? 'on' : 'off' }
            });
        } catch (_) { /* best effort */ }
        return offer;
    } catch (err) {
        await WorkJob.updateOne({ _id: job._id, currentOfferId: claimId }, { $set: { currentOfferId: null } }).catch(() => {});
        throw err;
    }
}

async function releaseAndContinue(offer) {
    await WorkJob.updateOne({ _id: offer.jobId, currentOfferId: offer._id }, { $set: { currentOfferId: null } });
    return dispatchJob(offer.jobId);
}

class WorkError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}

/** Worker accepts: the offer must be live and a position still open (checked atomically). */
async function acceptOffer(offerId, worker) {
    const now = new Date();
    const offer = await WorkOffer.findOneAndUpdate(
        { _id: offerId, workerId: worker._id, status: 'Pending', expiresAt: { $gt: now } },
        { $set: { status: 'Accepted', respondedAt: now } },
        { new: true }
    );
    if (!offer) throw new WorkError('This job offer has ended.', 409);

    const job = await WorkJob.findOneAndUpdate(
        { _id: offer.jobId, currentOfferId: offer._id, status: 'Open', $expr: { $lt: ['$filled', '$positions'] } },
        { $inc: { filled: 1 }, $set: { currentOfferId: null } },
        { new: true }
    );
    if (!job) {
        await WorkOffer.updateOne({ _id: offer._id }, { $set: { status: 'Full' } });
        throw new WorkError('All positions for this job were just filled.', 409);
    }
    const assignment = await WorkAssignment.create({
        jobId: job._id, workerId: worker._id, offerId: offer._id,
        agreedPay: job.payPerPerson, agreedHours: Math.round(jobHours(job) * 10) / 10, overtimeRatePerHour: job.overtimeRatePerHour
    });
    await WorkerProfile.updateOne({ _id: worker._id }, { $inc: { 'stats.accepted': 1 } });
    if (job.filled >= job.positions) {
        await WorkJob.updateOne({ _id: job._id }, { $set: { status: 'Filled' } });
    } else {
        await dispatchJob(job._id);
    }
    await notifyPoster(job, 'Worker confirmed', `${worker.name} accepted "${job.title}" (${job.filled}/${job.positions} filled).`);
    return { assignment, job };
}

async function declineOffer(offerId, worker, reason = '') {
    const offer = await WorkOffer.findOneAndUpdate(
        { _id: offerId, workerId: worker._id, status: 'Pending' },
        { $set: { status: 'Declined', respondedAt: new Date(), declineReason: String(reason).slice(0, 200) } },
        { new: true }
    );
    if (!offer) throw new WorkError('This job offer has already ended.', 409);
    await WorkerProfile.updateOne({ _id: worker._id }, { $inc: { 'stats.declined': 1 } });
    await releaseAndContinue(offer);
    return offer;
}

async function activeOffersFor(worker) {
    const offers = await WorkOffer.find({ workerId: worker._id, status: 'Pending', expiresAt: { $gt: new Date() } }).lean();
    const jobs = await WorkJob.find({ _id: { $in: offers.map(o => o.jobId) } }).lean();
    const byId = new Map(jobs.map(j => [String(j._id), j]));
    return offers.filter(o => byId.has(String(o.jobId))).map(o => offerView(byId.get(String(o.jobId)), o));
}

/** Revoke a job's live offer (job edited or cancelled). */
async function revokeCurrentOffer(job) {
    if (!job.currentOfferId) return;
    await WorkOffer.updateOne({ _id: job.currentOfferId, status: 'Pending' }, { $set: { status: 'Revoked' } });
    await WorkJob.updateOne({ _id: job._id }, { $set: { currentOfferId: null } });
}

/** A worker marked no-show; repeated no-shows trigger a review before any further offers. */
async function recordNoShow(workerId) {
    const w = await WorkerProfile.findByIdAndUpdate(workerId, { $inc: { 'stats.noShows': 1 } }, { new: true });
    if (w && w.stats.noShows >= NO_SHOW_REVIEW_LIMIT && !w.underReview) {
        w.underReview = true;
        await w.save();
        await notifyWorker(w, 'Your job offers are paused', 'You missed several confirmed jobs. The Utsavo team will review your account before you receive new offers.');
    }
}

// ---------------------------------------------------------------------------------------------
// Sweeper
// ---------------------------------------------------------------------------------------------

async function sweep() {
    const now = new Date();
    const due = await WorkOffer.find({ status: 'Pending', expiresAt: { $lte: now } }).limit(50).lean();
    for (const o of due) {
        const offer = await WorkOffer.findOneAndUpdate({ _id: o._id, status: 'Pending' }, { $set: { status: 'Expired' } }, { new: true });
        if (!offer) continue;
        await WorkerProfile.updateOne({ _id: offer.workerId }, { $inc: { 'stats.missed': 1 } });
        await releaseAndContinue(offer).catch(err => console.error('workforce: next offer failed:', err.message));
    }
    // Jobs stuck between steps (e.g. restart) and open jobs waiting for quiet hours to end
    const idle = await WorkJob.find({ status: 'Open', currentOfferId: null, $expr: { $lt: ['$filled', '$positions'] } }).select('_id').limit(50).lean();
    for (const j of idle) await dispatchJob(j._id).catch(() => {});
    // Jobs whose offer slot points at a finished offer
    const stuck = await WorkJob.find({ status: 'Open', currentOfferId: { $ne: null }, updatedAt: { $lte: new Date(now.getTime() - 5 * 60000) } }).select('_id currentOfferId').limit(50).lean();
    for (const j of stuck) {
        const o = await WorkOffer.findById(j.currentOfferId).select('status').lean();
        if (!o || o.status !== 'Pending') {
            await WorkJob.updateOne({ _id: j._id, currentOfferId: j.currentOfferId }, { $set: { currentOfferId: null } });
            await dispatchJob(j._id).catch(() => {});
        }
    }
}

let sweeping = false;
let timer = null;
function startWorkforceJob() {
    if (timer) return timer;
    timer = setInterval(async () => {
        if (sweeping) return;
        sweeping = true;
        try { await sweep(); } catch (err) { console.error('Workforce sweep failed:', err.message); } finally { sweeping = false; }
    }, 5000);
    return timer;
}

// ---------------------------------------------------------------------------------------------
// DigiLocker (OAuth 2.0 with PKCE). Needs a DigiLocker / API Setu partner account:
// DIGILOCKER_CLIENT_ID, DIGILOCKER_CLIENT_SECRET, DIGILOCKER_REDIRECT_URI. Endpoints can be overridden.
// ---------------------------------------------------------------------------------------------

const DIGILOCKER = {
    authorizeUrl: process.env.DIGILOCKER_AUTHORIZE_URL || 'https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize',
    tokenUrl: process.env.DIGILOCKER_TOKEN_URL || 'https://digilocker.meripehchaan.gov.in/public/oauth2/1/token',
    userUrl: process.env.DIGILOCKER_USER_URL || 'https://digilocker.meripehchaan.gov.in/public/oauth2/1/user'
};
const digilockerConfigured = () => Boolean(process.env.DIGILOCKER_CLIENT_ID && process.env.DIGILOCKER_CLIENT_SECRET && process.env.DIGILOCKER_REDIRECT_URI);

const base64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Starts verification: returns the DigiLocker URL the worker opens. */
async function startDigilocker(worker) {
    if (!digilockerConfigured()) throw new WorkError('DigiLocker verification is not set up yet. Upload an ID photo for the Utsavo team to verify instead.', 501);
    const state = base64url(crypto.randomBytes(24));
    const verifier = base64url(crypto.randomBytes(32));
    const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
    await WorkerProfile.updateOne({ _id: worker._id }, { $set: { 'verification.digilockerState': state, 'verification.digilockerVerifier': verifier } });
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.DIGILOCKER_CLIENT_ID,
        redirect_uri: process.env.DIGILOCKER_REDIRECT_URI,
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256'
    });
    return `${DIGILOCKER.authorizeUrl}?${params.toString()}`;
}

const normaliseName = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean);
/** At least one name word in common, ignoring initials: DigiLocker names often differ in order or spelling. */
const namesMatch = (a, b) => {
    const A = normaliseName(a).filter(w => w.length > 1);
    const B = new Set(normaliseName(b).filter(w => w.length > 1));
    return A.some(w => B.has(w));
};

/** DigiLocker redirects back here with a code: exchange it and verify name and age. */
async function completeDigilocker({ code, state }) {
    if (!digilockerConfigured()) throw new WorkError('DigiLocker is not configured', 501);
    if (!code || !state) throw new WorkError('Verification was cancelled');
    const worker = await WorkerProfile.findOne({ 'verification.digilockerState': state }).select('+verification.digilockerVerifier +verification.digilockerState');
    if (!worker) throw new WorkError('Verification link expired. Please start again.');

    const tokenRes = await fetch(DIGILOCKER.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code', code,
            client_id: process.env.DIGILOCKER_CLIENT_ID, client_secret: process.env.DIGILOCKER_CLIENT_SECRET,
            redirect_uri: process.env.DIGILOCKER_REDIRECT_URI, code_verifier: worker.verification.digilockerVerifier
        })
    });
    const token = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !token.access_token) throw new WorkError('DigiLocker did not confirm the verification. Please try again.', 502);

    // The token response usually carries name and dob; the user endpoint is the fallback
    let profile = token;
    if (!profile.name || !profile.dob) {
        const userRes = await fetch(DIGILOCKER.userUrl, { headers: { Authorization: `Bearer ${token.access_token}` } });
        profile = { ...profile, ...(await userRes.json().catch(() => ({}))) };
    }
    const dob = parseDob(profile.dob);
    worker.verification.digilockerState = '';
    worker.verification.digilockerVerifier = '';
    worker.verification.method = 'DigiLocker';
    worker.verification.verifiedName = String(profile.name || '');
    worker.verification.verifiedDob = dob;
    worker.verification.documentType = profile.eaadhaar === 'Y' ? 'Aadhaar (DigiLocker)' : 'DigiLocker';
    worker.verification.reviewedBy = 'DigiLocker';
    worker.verification.reviewedAt = new Date();

    if (!dob || ageOn(dob) < 18) {
        worker.verification.status = 'Rejected';
        worker.verification.rejectionReason = 'Workers must be 18 or older';
    } else if (!namesMatch(profile.name, worker.name)) {
        // Different name: a person from the Utsavo team checks it
        worker.verification.status = 'Pending';
        worker.verification.rejectionReason = '';
    } else {
        worker.verification.status = 'Verified';
        worker.dateOfBirth = dob;
    }
    await worker.save();
    return worker;
}

/** DigiLocker sends dates as DDMMYYYY or DD-MM-YYYY. */
function parseDob(raw) {
    const s = String(raw || '').replace(/[^0-9]/g, '');
    if (s.length !== 8) return null;
    const d = new Date(Date.UTC(Number(s.slice(4)), Number(s.slice(2, 4)) - 1, Number(s.slice(0, 2))));
    return isNaN(d) ? null : d;
}

module.exports = {
    WorkError,
    NO_SHOW_REVIEW_LIMIT,
    setSocketServer,
    jobHours,
    jobStart,
    jobEnd,
    ageOn,
    offerView,
    dispatchJob,
    acceptOffer,
    declineOffer,
    activeOffersFor,
    revokeCurrentOffer,
    recordNoShow,
    notifyWorker,
    notifyPoster,
    emitToUser,
    sweep,
    startWorkforceJob,
    digilockerConfigured,
    startDigilocker,
    completeDigilocker,
    namesMatch,
    parseDob
};
