const EventWorkspace = require('./EventWorkspace');
const WorkspaceTask = require('./WorkspaceTask');
const GatePass = require('./GatePass');
const ShortageRecord = require('./ShortageRecord');
const PurchaseRequest = require('./PurchaseRequest');
const OpsExpense = require('./OpsExpense');
const ChangeRequest = require('./ChangeRequest');
const SubVendorPackage = require('./SubVendorPackage');
const WalletEntry = require('./WalletEntry');
const TeamMember = require('./TeamMember');
const Lead = require('../vendor/Lead');
const LeadOffer = require('../vendor/LeadOffer');
const Quote = require('../vendor/Quote');
const Booking = require('../vendor/Booking');
const Complaint = require('../user/Complaint');
const ops = require('../../services/operations.service');

const DAY = 24 * 60 * 60 * 1000;
// Dates are kept per Indian calendar day
const IST_OFFSET = 330 * 60 * 1000;
const istDayStart = (offsetDays = 0) => {
    const now = new Date(Date.now() + IST_OFFSET);
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays) - IST_OFFSET);
};

const received = (b) => Math.max(Number(b.paidAmount) || 0,
    (b.paymentEntries || []).reduce((s, e) => s + (Number(e.amount) || 0), 0));

const eventLine = (ws, tasks) => {
    const mine = tasks.filter(t => String(t.workspaceId) === String(ws._id));
    return {
        _id: ws._id,
        title: ws.title,
        eventDate: ws.eventDate,
        venue: ws.venue,
        reportingTime: ws.reportingTime,
        opsStatus: ws.opsStatus,
        readiness: ops.readinessOf(mine),
        openTasks: mine.filter(t => !['Done', 'Verified'].includes(t.status)).length,
        blockedTasks: mine.filter(t => t.status === 'Blocked').length
    };
};

// @desc    The owner's morning brief: today, tomorrow, leads that need a reply, money in and out, risks
// @route   GET /api/ops/brief
exports.getBrief = async (req, res, next) => {
    try {
        const vendorId = req.vendor._id;
        const today = istDayStart(0);
        const tomorrow = istDayStart(1);
        const dayAfter = istDayStart(2);
        const weekAhead = istDayStart(4);
        const now = new Date();

        const [upcoming, gatePassesDue, leadsNew, offers, revisionQuotes, expiringQuotes, bookings,
            unpaidCosts, pendingClaims, purchaseRequests, shortages, changeRequests, complaints, packagesToApprove, wallets] = await Promise.all([
            EventWorkspace.find({ vendorId, opsStatus: { $nin: ['Cancelled', 'Completed'] }, eventDate: { $gte: today, $lt: weekAhead } })
                .sort('eventDate').lean(),
            GatePass.find({ vendorId, status: 'Dispatched', returnDueDate: { $ne: null, $lt: tomorrow } })
                .select('number destination returnDueDate workspaceId').lean(),
            Lead.find({ vendorId, status: { $in: ['New', 'Accepted'] } })
                .select('customerName category eventDate status dispatch.contactDeadline createdAt').sort('createdAt').limit(20).lean(),
            LeadOffer.countDocuments({ vendorId, status: 'Pending' }),
            Quote.find({ vendorId, status: 'Revision Requested' }).select('quotationNumber revisionRequest leadId').lean(),
            Quote.find({ vendorId, status: { $in: ['Sent', 'Pending'] }, validUntil: { $gte: now, $lt: new Date(now.getTime() + DAY) } })
                .select('quotationNumber validUntil totalAmount').lean(),
            Booking.find({ vendorId, status: { $nin: ['Cancelled', 'Rejected'] } })
                .select('customerName eventDate totalPrice paidAmount paymentEntries status').lean(),
            OpsExpense.find({ vendorId, deletedAt: null, approvalStatus: 'Approved', paymentStatus: 'Unpaid' })
                .select('payee category amount date workspaceId').sort('date').lean(),
            OpsExpense.aggregate([
                { $match: { vendorId, deletedAt: null, approvalStatus: 'Pending' } },
                { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
            ]),
            PurchaseRequest.countDocuments({ vendorId, status: 'Requested' }),
            ShortageRecord.countDocuments({ vendorId, status: 'Open' }),
            ChangeRequest.countDocuments({ vendorId, status: 'Pending' }),
            Complaint.find({ vendorId, status: { $in: ['Pending', 'In-Review'] }, 'vendorResponse.respondedAt': null })
                .select('subject tat createdAt').lean(),
            SubVendorPackage.countDocuments({ vendorId, status: 'Completed' }),
            // Crew wallet balances: earnings not yet paid out
            WalletEntry.aggregate([
                { $match: { vendorId } },
                { $group: { _id: '$memberId', balance: { $sum: { $cond: [{ $eq: ['$type', 'Earning'] }, '$amount', { $multiply: ['$amount', -1] }] } } } },
                { $match: { balance: { $gt: 0 } } }
            ])
        ]);

        const tasks = upcoming.length
            ? await WorkspaceTask.find({ workspaceId: { $in: upcoming.map(w => w._id) } }).select('workspaceId status mandatory').lean()
            : [];
        const lines = upcoming.map(ws => eventLine(ws, tasks));
        const on = (from, to) => lines.filter(l => new Date(l.eventDate) >= from && new Date(l.eventDate) < to);

        // Who owes me: bookings with a balance, earliest event first
        const owed = bookings
            .map(b => ({ _id: b._id, customerName: b.customerName || 'Customer', eventDate: b.eventDate, balance: Math.max(0, (Number(b.totalPrice) || 0) - received(b)) }))
            .filter(b => b.balance > 0)
            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
        const pay = unpaidCosts.map(e => ({ _id: e._id, payee: e.payee || e.category, category: e.category, amount: e.amount, date: e.date }));
        const members = wallets.length
            ? await TeamMember.find({ _id: { $in: wallets.map(w => w._id) } }).select('name').lean()
            : [];
        const crewDue = wallets.map(w => ({ _id: w._id, payee: members.find(m => String(m._id) === String(w._id))?.name || 'Team member', category: 'Crew wallet', amount: w.balance }));

        // Risks: events in the next 3 days that are not ready, plus anything left open
        const risks = [];
        for (const l of on(today, weekAhead)) {
            const days = Math.floor((new Date(l.eventDate) - today) / DAY);
            if (l.blockedTasks > 0) risks.push({ level: 'high', text: `${l.title}: ${l.blockedTasks} blocked task(s)`, link: `/vendor/ops/events/${l._id}` });
            else if (l.readiness < (days <= 1 ? 80 : 50)) risks.push({ level: days <= 1 ? 'high' : 'medium', text: `${l.title} is ${l.readiness}% ready, ${days === 0 ? 'today' : `in ${days} day(s)`}`, link: `/vendor/ops/events/${l._id}` });
        }
        for (const g of gatePassesDue) risks.push({ level: 'medium', text: `Gate pass ${g.number} stock not returned yet`, link: `/vendor/ops/events/${g.workspaceId}` });
        if (shortages) risks.push({ level: 'medium', text: `${shortages} missing or damaged stock record(s) open`, link: '/vendor/ops/stock' });
        const overdueComplaints = complaints.filter(c => c.tat?.vendorResponseBy && new Date(c.tat.vendorResponseBy) < now);
        if (complaints.length) risks.push({ level: overdueComplaints.length ? 'high' : 'medium', text: `${complaints.length} complaint(s) waiting for your response${overdueComplaints.length ? `, ${overdueComplaints.length} overdue` : ''}`, link: '/vendor/complaints' });
        const withHeld = await EventWorkspace.find({ vendorId, 'customerUpdates.status': 'Pending' }).select('customerUpdates.status').lean();
        const heldUpdates = withHeld.reduce((n, w) => n + w.customerUpdates.filter(u => u.status === 'Pending').length, 0);
        if (heldUpdates) risks.push({ level: 'medium', text: `${heldUpdates} customer update(s) waiting for your review`, link: '/vendor/ops/events' });
        const lapsing = leadsNew.filter(l => l.status === 'Accepted' && l.dispatch?.contactDeadline && new Date(l.dispatch.contactDeadline) < new Date(now.getTime() + 2 * 60 * 60 * 1000));
        if (lapsing.length) risks.push({ level: 'high', text: `${lapsing.length} accepted lead(s) must be contacted soon or they lapse`, link: '/vendor/leads' });

        res.status(200).json({
            success: true,
            data: {
                today: { events: on(today, tomorrow) },
                tomorrow: { events: on(tomorrow, dayAfter), gatePassesDue: gatePassesDue.length },
                leads: {
                    pendingOffers: offers,
                    needReply: leadsNew.map(l => ({ _id: l._id, customerName: l.customerName, category: l.category, eventDate: l.eventDate, status: l.status, contactDeadline: l.dispatch?.contactDeadline || null })),
                    revisionRequests: revisionQuotes.map(q => ({ _id: q._id, quotationNumber: q.quotationNumber, note: q.revisionRequest?.note || '' })),
                    quotesExpiringToday: expiringQuotes.length
                },
                money: {
                    owedToMe: { total: owed.reduce((s, o) => s + o.balance, 0), items: owed.slice(0, 8) },
                    iOwe: { total: [...pay, ...crewDue].reduce((s, p) => s + p.amount, 0), items: [...pay, ...crewDue].slice(0, 8) },
                    pendingClaims: { count: pendingClaims[0]?.count || 0, amount: pendingClaims[0]?.amount || 0 },
                    purchaseRequests,
                    packagesToApprove
                },
                risks: risks.sort((a, b) => (a.level === 'high' ? 0 : 1) - (b.level === 'high' ? 0 : 1)),
                pendingChangeRequests: changeRequests
            }
        });
    } catch (err) {
        next(err);
    }
};
