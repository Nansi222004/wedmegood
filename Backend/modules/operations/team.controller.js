const mongoose = require('mongoose');
const TeamMember = require('./TeamMember');
const CrewShift = require('./CrewShift');
const WalletEntry = require('./WalletEntry');
const SubVendorPackage = require('./SubVendorPackage');
const OpsExpense = require('./OpsExpense');
const EventWorkspace = require('./EventWorkspace');
const { PERMISSIONS, can, signTeamToken } = require('./opsAuth');
const { loadWorkspace } = require('./events.controller');
const ops = require('../../services/operations.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

const publicMember = (m, finance) => ({
    _id: m._id,
    name: m.name,
    phone: m.phone,
    role: m.role,
    skills: m.skills || [],
    isActive: m.isActive,
    subVendor: m.role === 'SubVendor' ? m.subVendor : undefined,
    ...(finance ? { wage: m.wage } : {}),
    lastLoginAt: m.lastLoginAt
});

// ---------------------------------------------------------------------------------------------
// Login and identity
// ---------------------------------------------------------------------------------------------

// @desc    Team member login (phone + password set by the employer)
// @route   POST /api/ops/team/login
exports.teamLogin = async (req, res, next) => {
    try {
        const phone = String(req.body?.phone || '').replace(/\D/g, '').slice(-10);
        const password = String(req.body?.password || '');
        if (!phone || !password) return bad(res, 'Enter your mobile number and password');
        const member = await TeamMember.findOne({ phone }).select('+password');
        if (!member || !(await member.matchPassword(password))) return bad(res, 'Incorrect mobile number or password', 401);
        if (!member.isActive) return bad(res, 'Your account is deactivated. Contact your employer.', 403);
        member.lastLoginAt = new Date();
        await member.save();
        res.status(200).json({ success: true, token: signTeamToken(member), data: publicMember(member, false) });
    } catch (err) {
        next(err);
    }
};

// @desc    Who is logged in, their business and what they may do
// @route   GET /api/ops/me
exports.me = async (req, res) => {
    const perms = PERMISSIONS[req.actor.role] || [];
    res.status(200).json({
        success: true,
        data: {
            kind: req.actor.kind,
            id: req.actor.id,
            name: req.actor.name,
            role: req.actor.role,
            permissions: perms,
            business: { _id: req.vendor._id, name: req.vendor.businessName, city: req.vendor.city }
        }
    });
};

// @desc    Change own password (team member)
// @route   PUT /api/ops/me/password
exports.changeMyPassword = async (req, res, next) => {
    try {
        if (!req.member) return bad(res, 'Owners change their password in Settings');
        const { currentPassword, newPassword } = req.body || {};
        if (String(newPassword || '').length < 6) return bad(res, 'New password must be at least 6 characters');
        const member = await TeamMember.findById(req.member._id).select('+password');
        if (!(await member.matchPassword(String(currentPassword || '')))) return bad(res, 'Current password is incorrect');
        member.password = newPassword;
        await member.save();
        res.status(200).json({ success: true, message: 'Password changed' });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Team (owner)
// ---------------------------------------------------------------------------------------------

// @route   GET /api/ops/team
exports.listTeam = async (req, res, next) => {
    try {
        const members = await TeamMember.find({ vendorId: req.vendor._id }).sort('role name').lean();
        const finance = can(req.actor, 'finance.view');
        let balances = new Map();
        if (finance) {
            const agg = await WalletEntry.aggregate([
                { $match: { vendorId: req.vendor._id } },
                { $group: { _id: '$memberId', earned: { $sum: { $cond: [{ $eq: ['$type', 'Earning'] }, '$amount', 0] } }, advanced: { $sum: { $cond: [{ $eq: ['$type', 'Advance'] }, '$amount', 0] } }, paid: { $sum: { $cond: [{ $eq: ['$type', 'Payment'] }, '$amount', 0] } } } }
            ]);
            balances = new Map(agg.map(a => [String(a._id), a.earned - a.advanced - a.paid]));
        }
        res.status(200).json({
            success: true,
            data: members.map(m => ({ ...publicMember(m, finance), ...(finance ? { balance: balances.get(String(m._id)) || 0 } : {}) })),
            roles: TeamMember.ROLES
        });
    } catch (err) {
        next(err);
    }
};

const memberFields = (b) => {
    const out = {};
    if (b.name !== undefined) out.name = String(b.name).trim().slice(0, 120);
    if (b.role !== undefined) out.role = b.role;
    if (Array.isArray(b.skills)) out.skills = b.skills.map(s => String(s).trim()).filter(Boolean).slice(0, 20);
    if (b.wage) {
        out.wage = {
            basis: ['Per day', 'Per shift', 'Per hour', 'Per job'].includes(b.wage.basis) ? b.wage.basis : 'Per day',
            amount: Math.max(0, Math.round(Number(b.wage.amount) || 0))
        };
    }
    if (b.subVendor) {
        out.subVendor = {
            businessName: String(b.subVendor.businessName || '').slice(0, 120),
            services: (b.subVendor.services || []).map(s => String(s).trim()).filter(Boolean).slice(0, 20),
            verified: Boolean(b.subVendor.verified)
        };
    }
    return out;
};

// @desc    Add a team member with their own login
// @route   POST /api/ops/team   body: { name, phone, password, role, skills, wage, subVendor }
exports.addMember = async (req, res, next) => {
    try {
        const b = req.body || {};
        const data = memberFields(b);
        if (!data.name) return bad(res, 'Enter the name');
        if (!TeamMember.ROLES.includes(data.role)) return bad(res, 'Choose a role');
        const phone = String(b.phone || '').replace(/\D/g, '').slice(-10);
        if (!/^[6-9]\d{9}$/.test(phone)) return bad(res, 'Enter a valid 10-digit mobile number');
        if (String(b.password || '').length < 6) return bad(res, 'Set a password of at least 6 characters');
        try {
            const member = await TeamMember.create({ ...data, phone, password: b.password, vendorId: req.vendor._id });
            res.status(201).json({ success: true, data: publicMember(member, true), message: `${member.name} can now log in at /team with ${phone}` });
        } catch (err) {
            if (err.code === 11000) return bad(res, 'This mobile number already has a team login');
            throw err;
        }
    } catch (err) {
        next(err);
    }
};

// @route   PUT /api/ops/team/:memberId   body: fields, { password } to reset, { isActive }
exports.updateMember = async (req, res, next) => {
    try {
        if (!isId(req.params.memberId)) return bad(res, 'Invalid member');
        const member = await TeamMember.findOne({ _id: req.params.memberId, vendorId: req.vendor._id }).select('+password');
        if (!member) return bad(res, 'Member not found', 404);
        const data = memberFields(req.body || {});
        if (data.role && !TeamMember.ROLES.includes(data.role)) return bad(res, 'Choose a role');
        Object.assign(member, data);
        if (req.body?.isActive !== undefined) member.isActive = Boolean(req.body.isActive);
        if (req.body?.password) {
            if (String(req.body.password).length < 6) return bad(res, 'Password must be at least 6 characters');
            member.password = req.body.password;
        }
        await member.save();
        res.status(200).json({ success: true, data: publicMember(member, true) });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Attendance and wallet
// ---------------------------------------------------------------------------------------------

/** Wage for a shift from the agreed wage: per day / shift / job as is, per hour by hours worked. */
function shiftAmount(member, shift) {
    const wage = member.wage || {};
    const amount = Number(wage.amount) || 0;
    const hours = shift.checkInAt && shift.checkOutAt
        ? Math.max(0, (new Date(shift.checkOutAt) - new Date(shift.checkInAt)) / 3600000 - (shift.breakMinutes || 0) / 60)
        : 8;
    const hourly = wage.basis === 'Per hour' ? amount : amount / 8;
    const base = wage.basis === 'Per hour' ? Math.round(hours * amount) : amount;
    return Math.round(base + (shift.overtimeHours || 0) * hourly);
}

// @desc    Check in / check out / mark absent. Members can check themselves in and out;
//          supervisors and the owner record anyone.
// @route   POST /api/ops/events/:id/attendance   body: { memberId, action: 'checkin'|'checkout'|'absent', breakMinutes, overtimeHours, note }
exports.recordAttendance = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return bad(res, 'Event not found', 404);
        const { action } = req.body || {};
        if (!['checkin', 'checkout', 'absent'].includes(action)) return bad(res, 'Invalid action');
        const manage = can(req.actor, 'attendance.manage');
        const memberId = manage && isId(req.body.memberId) ? req.body.memberId : req.member?._id;
        if (!memberId) return bad(res, 'Choose a team member');
        if (!manage && action === 'absent') return bad(res, 'Only a supervisor can mark someone absent', 403);
        const member = await TeamMember.findOne({ _id: memberId, vendorId: req.vendor._id }).lean();
        if (!member) return bad(res, 'Member not found', 404);

        const date = ops.dayStart(new Date());
        const now = new Date();
        const shift = await CrewShift.findOneAndUpdate(
            { memberId, workspaceId: ws._id, date },
            { $setOnInsert: { vendorId: req.vendor._id, memberId, workspaceId: ws._id, date, recordedBy: req.actor.name } },
            { upsert: true, new: true }
        );
        if (shift.status === 'Confirmed') return bad(res, 'This shift is already confirmed');
        if (action === 'checkin') {
            if (shift.checkInAt) return bad(res, 'Already checked in');
            shift.checkInAt = now;
            shift.status = 'Open';
        } else if (action === 'checkout') {
            if (!shift.checkInAt) return bad(res, 'Check in first');
            shift.checkOutAt = now;
        } else {
            shift.status = 'Absent';
        }
        if (manage && req.body.breakMinutes !== undefined) shift.breakMinutes = Math.max(0, Math.round(Number(req.body.breakMinutes) || 0));
        if (manage && req.body.overtimeHours !== undefined) shift.overtimeHours = Math.max(0, Number(req.body.overtimeHours) || 0);
        if (req.body.note) shift.note = String(req.body.note).slice(0, 300);
        await shift.save();
        res.status(200).json({ success: true, data: shift });
    } catch (err) {
        next(err);
    }
};

// @desc    Confirm a shift: the wage becomes an earning in the member's wallet and a labour cost
//          on the event, the same amount in both
// @route   POST /api/ops/shifts/:sid/confirm   body: { amount? (owner override), overtimeHours?, breakMinutes? }
exports.confirmShift = async (req, res, next) => {
    try {
        if (!isId(req.params.sid)) return bad(res, 'Invalid shift');
        const shift = await CrewShift.findOne({ _id: req.params.sid, vendorId: req.vendor._id });
        if (!shift) return bad(res, 'Shift not found', 404);
        if (shift.status !== 'Open') return bad(res, `This shift is ${shift.status.toLowerCase()}`);
        if (!shift.checkInAt) return bad(res, 'The member has not checked in');
        if (!shift.checkOutAt) shift.checkOutAt = new Date();
        if (req.body?.overtimeHours !== undefined) shift.overtimeHours = Math.max(0, Number(req.body.overtimeHours) || 0);
        if (req.body?.breakMinutes !== undefined) shift.breakMinutes = Math.max(0, Math.round(Number(req.body.breakMinutes) || 0));
        const member = await TeamMember.findById(shift.memberId).lean();
        const override = can(req.actor, 'finance.view') && req.body?.amount !== undefined ? Math.max(0, Math.round(Number(req.body.amount) || 0)) : null;
        shift.amount = override ?? shiftAmount(member, shift);
        shift.status = 'Confirmed';
        shift.confirmedBy = req.actor.name;
        shift.confirmedAt = new Date();
        await shift.save();

        if (shift.amount > 0) {
            await WalletEntry.create({
                vendorId: req.vendor._id, memberId: shift.memberId, type: 'Earning', amount: shift.amount,
                workspaceId: shift.workspaceId, shiftId: shift._id, note: 'Shift confirmed', by: req.actor.name, date: shift.date
            }).catch(err => { if (err.code !== 11000) throw err; });
            await OpsExpense.create({
                vendorId: req.vendor._id, scope: 'Event', workspaceId: shift.workspaceId, date: shift.date, category: 'Labour',
                description: `${member.name} (${member.role})${shift.overtimeHours ? ` + ${shift.overtimeHours}h overtime` : ''}`,
                amount: shift.amount, workers: 1,
                hours: shift.checkInAt && shift.checkOutAt ? Math.round(((shift.checkOutAt - shift.checkInAt) / 3600000 - shift.breakMinutes / 60) * 10) / 10 : 0,
                payee: member.name, paymentMethod: 'Credit (unpaid)', paymentStatus: 'Unpaid',
                source: 'crew-shift', sourceRef: String(shift._id),
                audit: [{ action: 'Created from confirmed shift', by: req.actor.name }]
            });
        }
        res.status(200).json({ success: true, data: { ...shift.toObject(), amount: can(req.actor, 'finance.view') ? shift.amount : undefined } });
    } catch (err) {
        next(err);
    }
};

// @desc    A member's wallet (their own, or any member for the owner)
// @route   GET /api/ops/team/:memberId/wallet   |   GET /api/ops/me/wallet
exports.getWallet = async (req, res, next) => {
    try {
        const memberId = req.params.memberId || req.member?._id;
        if (!isId(memberId)) return bad(res, 'Invalid member');
        if (req.params.memberId && !can(req.actor, 'finance.view')) return bad(res, 'Not allowed', 403);
        const member = await TeamMember.findOne({ _id: memberId, vendorId: req.vendor._id }).lean();
        if (!member) return bad(res, 'Member not found', 404);
        const [entries, shifts] = await Promise.all([
            WalletEntry.find({ memberId }).populate('workspaceId', 'title eventDate').sort('-date').limit(300).lean(),
            CrewShift.find({ memberId }).populate('workspaceId', 'title eventDate').sort('-date').limit(100).lean()
        ]);
        const sum = (t) => entries.filter(e => e.type === t).reduce((s, e) => s + e.amount, 0);
        res.status(200).json({
            success: true,
            data: {
                member: publicMember(member, can(req.actor, 'finance.view') || String(req.member?._id) === String(memberId)),
                earned: sum('Earning'), advances: sum('Advance'), paid: sum('Payment'),
                balance: sum('Earning') - sum('Advance') - sum('Payment'),
                entries, shifts
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Record an advance or a payment to a member
// @route   POST /api/ops/team/:memberId/wallet   body: { type: 'Advance'|'Payment', amount, method, note }
exports.addWalletEntry = async (req, res, next) => {
    try {
        if (!isId(req.params.memberId)) return bad(res, 'Invalid member');
        const { type, method = 'Cash', note = '' } = req.body || {};
        const amount = Math.max(0, Math.round(Number(req.body?.amount) || 0));
        if (!['Advance', 'Payment'].includes(type)) return bad(res, 'Choose advance or payment');
        if (!amount) return bad(res, 'Enter the amount');
        const member = await TeamMember.findOne({ _id: req.params.memberId, vendorId: req.vendor._id }).lean();
        if (!member) return bad(res, 'Member not found', 404);
        const entry = await WalletEntry.create({ vendorId: req.vendor._id, memberId: member._id, type, amount, method: String(method).slice(0, 30), note: String(note).slice(0, 300), by: req.actor.name });

        // Paying a member settles their unpaid shift costs, oldest first
        if (type === 'Payment') {
            let left = amount;
            const shiftIds = (await CrewShift.find({ memberId: member._id, status: 'Confirmed' }).select('_id').lean()).map(s => String(s._id));
            const unpaid = await OpsExpense.find({ vendorId: req.vendor._id, source: 'crew-shift', sourceRef: { $in: shiftIds }, paymentStatus: 'Unpaid', deletedAt: null }).sort('date');
            for (const e of unpaid) {
                if (left < e.amount) break;
                left -= e.amount;
                e.paymentStatus = 'Paid';
                e.paymentMethod = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque'].includes(method) ? method : 'Cash';
                e.audit.push({ action: 'Paid through crew wallet', by: req.actor.name });
                await e.save();
            }
        }
        res.status(201).json({ success: true, data: entry });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Sub-vendor work packages
// ---------------------------------------------------------------------------------------------

// @route   POST /api/ops/events/:id/packages
exports.createPackage = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return bad(res, 'Event not found', 404);
        const b = req.body || {};
        const sub = isId(b.subVendorId) && await TeamMember.findOne({ _id: b.subVendorId, vendorId: req.vendor._id, role: 'SubVendor', isActive: true }).lean();
        if (!sub) return bad(res, 'Choose one of your sub-vendors');
        if (!sub.subVendor?.verified) return bad(res, 'Mark this sub-vendor as verified before giving them work');
        const fallback = isId(b.fallbackSubVendorId) && String(b.fallbackSubVendorId) !== String(sub._id)
            ? await TeamMember.findOne({ _id: b.fallbackSubVendorId, vendorId: req.vendor._id, role: 'SubVendor' }).select('_id').lean()
            : null;
        const title = String(b.title || '').trim();
        if (!title) return bad(res, 'Describe the work package');
        const hours = Math.min(168, Math.max(1, Number(b.acceptWithinHours) || 12));
        const pkg = await SubVendorPackage.create({
            vendorId: req.vendor._id, workspaceId: ws._id, subVendorId: sub._id, fallbackSubVendorId: fallback?._id || null,
            title: title.slice(0, 200), instructions: String(b.instructions || '').slice(0, 3000), quantity: String(b.quantity || '').slice(0, 80),
            requiredAt: b.requiredAt ? new Date(b.requiredAt) : ws.eventDate, location: String(b.location || ws.venue || '').slice(0, 300),
            referenceMedia: (b.referenceMedia || []).filter(u => /^https?:\/\//.test(u)).slice(0, 10),
            agreedAmount: Math.max(0, Math.round(Number(b.agreedAmount) || 0)),
            advancePaid: Math.max(0, Math.round(Number(b.advancePaid) || 0)),
            acceptBy: new Date(Date.now() + hours * 3600000)
        });
        res.status(201).json({ success: true, data: pkg, message: `Offered to ${sub.subVendor?.businessName || sub.name}. They have ${hours} h to accept.` });
    } catch (err) {
        next(err);
    }
};

// @desc    The logged-in sub-vendor's packages
// @route   GET /api/ops/my/packages
exports.myPackages = async (req, res, next) => {
    try {
        if (!req.member) return res.status(200).json({ success: true, data: [] });
        const list = await SubVendorPackage.find({ subVendorId: req.member._id, status: { $ne: 'Cancelled' } })
            .populate('workspaceId', 'title eventDate venue reportingTime').sort('-createdAt').limit(100).lean();
        // The agreed price is shown to the sub-vendor (it is their price) but not the owner's advance notes
        res.status(200).json({ success: true, data: list.map(p => ({ ...p, advancePaid: p.advancePaid })) });
    } catch (err) {
        next(err);
    }
};

async function ownPackage(req) {
    if (!isId(req.params.pid)) return null;
    const query = { _id: req.params.pid, vendorId: req.vendor._id };
    if (req.actor.role === 'SubVendor') query.subVendorId = req.member._id;
    return SubVendorPackage.findOne(query);
}

// @route   POST /api/ops/packages/:pid/respond   body: { accept, reason }   (sub-vendor)
exports.respondPackage = async (req, res, next) => {
    try {
        const pkg = await ownPackage(req);
        if (!pkg || req.actor.role !== 'SubVendor') return bad(res, 'Package not found', 404);
        if (pkg.status !== 'Offered') return bad(res, `This package is ${pkg.status.toLowerCase()}`);
        if (pkg.acceptBy < new Date()) return bad(res, 'The time to accept has passed');
        pkg.status = req.body?.accept ? 'Accepted' : 'Declined';
        if (!req.body?.accept) pkg.declineReason = String(req.body?.reason || '').slice(0, 300);
        await pkg.save();
        await ops.notifyVendor(req.vendor._id, `${req.actor.name} ${pkg.status.toLowerCase()} the package "${pkg.title}"${pkg.declineReason ? `: ${pkg.declineReason}` : ''}.`);
        res.status(200).json({ success: true, data: pkg });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/ops/packages/:pid/progress   body: { note, photo, status: 'In progress'|'Completed' }
exports.packageProgress = async (req, res, next) => {
    try {
        const pkg = await ownPackage(req);
        if (!pkg) return bad(res, 'Package not found', 404);
        if (!['Accepted', 'In progress'].includes(pkg.status)) return bad(res, 'Accept the package first');
        const { note = '', photo = '', status } = req.body || {};
        if (status && !['In progress', 'Completed'].includes(status)) return bad(res, 'Invalid status');
        if (status === 'Completed' && !photo && !pkg.completionPhotos.length) return bad(res, 'Add a completion photo');
        pkg.progress.push({ note: String(note).slice(0, 500), photo: /^https?:\/\//.test(photo) ? photo : '', by: req.actor.name });
        if (status) pkg.status = status;
        if (status === 'Completed' && /^https?:\/\//.test(photo)) pkg.completionPhotos.push(photo);
        await pkg.save();
        if (status === 'Completed') await ops.notifyVendor(req.vendor._id, `"${pkg.title}" marked complete by ${req.actor.name}. Check and approve it.`);
        res.status(200).json({ success: true, data: pkg });
    } catch (err) {
        next(err);
    }
};

// @desc    Owner approves the quality; the agreed amount (less advance) becomes a sub-vendor cost
// @route   POST /api/ops/packages/:pid/approve   body: { settled }
exports.approvePackage = async (req, res, next) => {
    try {
        const pkg = await ownPackage(req);
        if (!pkg) return bad(res, 'Package not found', 404);
        if (pkg.status !== 'Completed') return bad(res, 'Only completed work can be approved');
        const sub = await TeamMember.findById(pkg.subVendorId).lean();
        pkg.status = 'Approved';
        pkg.approvedBy = req.actor.name;
        pkg.approvedAt = new Date();
        pkg.settlementStatus = req.body?.settled ? 'Settled' : 'Unsettled';
        if (pkg.agreedAmount > 0 && !pkg.expenseId) {
            const e = await OpsExpense.create({
                vendorId: req.vendor._id, scope: 'Event', workspaceId: pkg.workspaceId, category: 'Sub-vendor',
                description: `${pkg.title} (advance ₹${pkg.advancePaid.toLocaleString('en-IN')})`,
                amount: pkg.agreedAmount, payee: sub?.subVendor?.businessName || sub?.name || 'Sub-vendor',
                paymentMethod: req.body?.settled ? 'Bank transfer' : 'Credit (unpaid)', paymentStatus: req.body?.settled ? 'Paid' : 'Unpaid',
                source: 'subvendor', sourceRef: String(pkg._id), audit: [{ action: 'Created from approved sub-vendor package', by: req.actor.name }]
            });
            pkg.expenseId = e._id;
        }
        await pkg.save();
        res.status(200).json({ success: true, data: pkg });
    } catch (err) {
        next(err);
    }
};

// @desc    Mark settled (balance paid)
// @route   POST /api/ops/packages/:pid/settle
exports.settlePackage = async (req, res, next) => {
    try {
        const pkg = await ownPackage(req);
        if (!pkg || pkg.status !== 'Approved') return bad(res, 'Approve the package first');
        pkg.settlementStatus = 'Settled';
        await pkg.save();
        if (pkg.expenseId) {
            await OpsExpense.updateOne({ _id: pkg.expenseId }, { $set: { paymentStatus: 'Paid', paymentMethod: 'Bank transfer' }, $push: { audit: { action: 'Settled', by: req.actor.name } } });
        }
        res.status(200).json({ success: true, data: pkg });
    } catch (err) {
        next(err);
    }
};

// @desc    Give an expired/declined package to another sub-vendor. Never done automatically.
// @route   POST /api/ops/packages/:pid/reassign   body: { subVendorId, acceptWithinHours }
exports.reassignPackage = async (req, res, next) => {
    try {
        const pkg = await ownPackage(req);
        if (!pkg) return bad(res, 'Package not found', 404);
        if (!['Expired', 'Declined', 'Offered'].includes(pkg.status)) return bad(res, 'This package is already accepted');
        const sub = isId(req.body?.subVendorId) && await TeamMember.findOne({ _id: req.body.subVendorId, vendorId: req.vendor._id, role: 'SubVendor', isActive: true }).lean();
        if (!sub || !sub.subVendor?.verified) return bad(res, 'Choose a verified sub-vendor');
        pkg.subVendorId = sub._id;
        pkg.status = 'Offered';
        pkg.declineReason = '';
        pkg.ownerAlertedAt = null;
        pkg.acceptBy = new Date(Date.now() + Math.min(168, Math.max(1, Number(req.body?.acceptWithinHours) || 12)) * 3600000);
        await pkg.save();
        res.status(200).json({ success: true, data: pkg });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Background checks (run every minute)
// ---------------------------------------------------------------------------------------------

/** Missed task deadlines and sub-vendor packages not accepted in time: alert the owner once. */
async function opsSweep() {
    const now = new Date();
    const WorkspaceTask = require('./WorkspaceTask');
    const overdue = await WorkspaceTask.find({
        deadline: { $lt: now }, escalatedAt: null, status: { $in: ['Not started', 'Assigned', 'Accepted', 'In progress', 'Blocked'] }
    }).limit(100);
    for (const t of overdue) {
        const ws = await EventWorkspace.findById(t.workspaceId).select('title opsStatus').lean();
        t.escalatedAt = now;
        await t.save();
        if (ws && !['Cancelled', 'Completed'].includes(ws.opsStatus)) {
            await ops.notifyVendor(t.vendorId, `Deadline missed: "${t.title}" (${ws.title}) is still ${t.status.toLowerCase()}.`);
        }
    }

    const expired = await SubVendorPackage.find({ status: 'Offered', acceptBy: { $lt: now }, ownerAlertedAt: null }).limit(100);
    for (const p of expired) {
        p.status = 'Expired';
        p.ownerAlertedAt = now;
        await p.save();
        const fallback = p.fallbackSubVendorId ? await TeamMember.findById(p.fallbackSubVendorId).select('name subVendor.businessName').lean() : null;
        await ops.notifyVendor(p.vendorId, `Sub-vendor did not accept "${p.title}" in time.${fallback ? ` Suggested fallback: ${fallback.subVendor?.businessName || fallback.name}.` : ''} Reassign it from the event.`);
    }
}

let opsTimer = null;
function startOpsJob() {
    if (opsTimer) return opsTimer;
    opsTimer = setInterval(() => opsSweep().catch(err => console.error('Operations sweep failed:', err.message)), 60 * 1000);
    return opsTimer;
}

exports.opsSweep = opsSweep;
exports.startOpsJob = startOpsJob;
exports.shiftAmount = shiftAmount;
