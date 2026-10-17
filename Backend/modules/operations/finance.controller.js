const mongoose = require('mongoose');
const OpsExpense = require('./OpsExpense');
const EventWorkspace = require('./EventWorkspace');
const PurchaseRequest = require('./PurchaseRequest');
const ShortageRecord = require('./ShortageRecord');
const SubVendorPackage = require('./SubVendorPackage');
const CrewShift = require('./CrewShift');
const GatePass = require('./GatePass');
const { can } = require('./opsAuth');
const { loadWorkspace } = require('./events.controller');
const ops = require('../../services/operations.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const METHODS = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque', 'Credit (unpaid)'];

const pick = (b) => {
    const out = {};
    if (b.date !== undefined) out.date = b.date ? new Date(b.date) : new Date();
    if (b.category !== undefined) out.category = String(b.category);
    if (b.description !== undefined) out.description = String(b.description).trim().slice(0, 500);
    if (b.quantity !== undefined) out.quantity = Math.max(0, Number(b.quantity) || 0);
    if (b.amount !== undefined) out.amount = Math.max(0, Math.round(Number(b.amount) || 0));
    if (b.paymentMethod !== undefined) out.paymentMethod = METHODS.includes(b.paymentMethod) ? b.paymentMethod : 'Cash';
    if (b.paidBy !== undefined) out.paidBy = String(b.paidBy).slice(0, 80);
    if (b.payee !== undefined) out.payee = String(b.payee).trim().slice(0, 120);
    if (b.receiptNumber !== undefined) out.receiptNumber = String(b.receiptNumber).trim().slice(0, 60);
    if (b.receiptPhoto !== undefined) out.receiptPhoto = /^https?:\/\//.test(b.receiptPhoto || '') ? b.receiptPhoto : '';
    if (b.workers !== undefined) out.workers = Math.max(0, Math.round(Number(b.workers) || 0));
    if (b.hours !== undefined) out.hours = Math.max(0, Number(b.hours) || 0);
    if (b.vehicle !== undefined) out.vehicle = String(b.vehicle).slice(0, 40).toUpperCase();
    if (b.trips !== undefined) out.trips = Math.max(0, Math.round(Number(b.trips) || 0));
    if (b.paymentStatus !== undefined) out.paymentStatus = b.paymentStatus === 'Unpaid' ? 'Unpaid' : 'Paid';
    return out;
};

// @desc    Ledger. Owner/accountant see everything; crew see their own claims.
// @route   GET /api/ops/expenses?scope=Event|Overhead&eventId=&status=&from=&to=
exports.listExpenses = async (req, res, next) => {
    try {
        const q = { vendorId: req.vendor._id, deletedAt: null };
        if (['Event', 'Overhead'].includes(req.query.scope)) q.scope = req.query.scope;
        if (isId(req.query.eventId)) q.workspaceId = req.query.eventId;
        if (['Pending', 'Approved', 'Rejected'].includes(req.query.status)) q.approvalStatus = req.query.status;
        if (req.query.from || req.query.to) {
            q.date = {};
            if (req.query.from) q.date.$gte = ops.dayStart(req.query.from);
            if (req.query.to) q.date.$lte = ops.dayEnd(req.query.to);
        }
        const finance = can(req.actor, 'finance.view') || can(req.actor, 'expense.manage');
        if (!finance) q.claimedByMemberId = req.member?._id;
        const list = await OpsExpense.find(q).populate('workspaceId', 'title eventDate').sort('-date -createdAt').limit(500).lean();
        res.status(200).json({
            success: true,
            data: list,
            categories: { Event: OpsExpense.EVENT_CATEGORIES, Overhead: OpsExpense.OVERHEAD_CATEGORIES }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add an expense. Crew/drivers submit claims (pending owner approval) on events only.
// @route   POST /api/ops/expenses
exports.createExpense = async (req, res, next) => {
    try {
        const b = req.body || {};
        const finance = can(req.actor, 'finance.view') || can(req.actor, 'expense.manage');
        if (!finance && !can(req.actor, 'expense.claim')) return bad(res, 'Your role cannot add expenses', 403);
        const scope = finance && b.scope === 'Overhead' ? 'Overhead' : 'Event';
        const data = pick(b);
        const categories = scope === 'Event' ? OpsExpense.EVENT_CATEGORIES : OpsExpense.OVERHEAD_CATEGORIES;
        if (!categories.includes(data.category)) return bad(res, 'Choose a category');
        if (!data.amount) return bad(res, 'Enter the amount');

        let workspaceId = null;
        if (scope === 'Event') {
            const ws = await loadWorkspace(req, b.eventId);
            if (!ws) return bad(res, 'Choose the event this expense belongs to');
            if (ws.financeStatus === 'Closed') return bad(res, 'This event\'s accounts are closed');
            workspaceId = ws._id;
        }

        const dup = await ops.findDuplicateExpense(req.vendor._id, { amount: data.amount, payee: data.payee, receiptNumber: data.receiptNumber, date: data.date });
        if (dup && !b.confirmDuplicate) {
            return res.status(409).json({
                success: false, code: 'POSSIBLE_DUPLICATE',
                message: `Possible duplicate of "${dup.description || 'an expense'}" ₹${dup.amount.toLocaleString('en-IN')} on ${ops.formatDate(dup.date)}. Send again to add anyway.`
            });
        }

        const expense = await OpsExpense.create({
            ...data,
            vendorId: req.vendor._id,
            scope,
            workspaceId,
            paidBy: data.paidBy || req.actor.name,
            approvalStatus: finance ? 'Approved' : 'Pending',
            source: finance ? 'manual' : 'claim',
            claimedByMemberId: finance ? null : req.member?._id || null,
            possibleDuplicateOf: dup?._id || null,
            audit: [{ action: finance ? 'Created' : 'Claim submitted', by: req.actor.name }]
        });
        if (!finance) {
            await ops.notifyVendor(req.vendor._id, `Expense claim from ${req.actor.name}: ₹${expense.amount.toLocaleString('en-IN')} (${expense.category}) waiting for approval.`);
        }
        res.status(201).json({ success: true, data: expense });
    } catch (err) {
        next(err);
    }
};

// @desc    Edit an expense (every change is kept in the audit history)
// @route   PUT /api/ops/expenses/:eid
exports.updateExpense = async (req, res, next) => {
    try {
        if (!isId(req.params.eid)) return bad(res, 'Invalid expense');
        const expense = await OpsExpense.findOne({ _id: req.params.eid, vendorId: req.vendor._id, deletedAt: null });
        if (!expense) return bad(res, 'Expense not found', 404);
        if (expense.workspaceId) {
            const ws = await EventWorkspace.findById(expense.workspaceId).select('financeStatus').lean();
            if (ws?.financeStatus === 'Closed') return bad(res, 'This event\'s accounts are closed');
        }
        const changes = pick(req.body || {});
        const before = {};
        for (const k of Object.keys(changes)) before[k] = expense[k];
        Object.assign(expense, changes);
        expense.audit.push({ action: 'Edited', by: req.actor.name, changes: { before, after: changes } });
        await expense.save();
        res.status(200).json({ success: true, data: expense });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/ops/expenses/:eid/approve   body: { approve, reason }
exports.approveExpense = async (req, res, next) => {
    try {
        if (!isId(req.params.eid)) return bad(res, 'Invalid expense');
        const approve = Boolean(req.body?.approve);
        const expense = await OpsExpense.findOneAndUpdate(
            { _id: req.params.eid, vendorId: req.vendor._id, approvalStatus: 'Pending', deletedAt: null },
            {
                $set: { approvalStatus: approve ? 'Approved' : 'Rejected' },
                $push: { audit: { action: approve ? 'Approved' : `Rejected${req.body?.reason ? `: ${String(req.body.reason).slice(0, 200)}` : ''}`, by: req.actor.name } }
            },
            { new: true }
        );
        if (!expense) return bad(res, 'Claim not found or already decided', 404);
        res.status(200).json({ success: true, data: expense });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete (kept for audit, hidden from the ledger)
// @route   DELETE /api/ops/expenses/:eid   body: { reason }
exports.deleteExpense = async (req, res, next) => {
    try {
        if (!isId(req.params.eid)) return bad(res, 'Invalid expense');
        const reason = String(req.body?.reason || req.query.reason || '').trim();
        if (!reason) return bad(res, 'Give a reason for deleting');
        const expense = await OpsExpense.findOneAndUpdate(
            { _id: req.params.eid, vendorId: req.vendor._id, deletedAt: null, source: { $in: ['manual', 'claim'] } },
            { $set: { deletedAt: new Date() }, $push: { audit: { action: `Deleted: ${reason.slice(0, 200)}`, by: req.actor.name } } },
            { new: true }
        );
        if (!expense) return bad(res, 'Expense not found, or it comes from a purchase / shift and must be corrected there', 404);
        res.status(200).json({ success: true, message: 'Expense deleted' });
    } catch (err) {
        next(err);
    }
};

// @desc    Profit and loss of one event
// @route   GET /api/ops/events/:id/pnl
exports.eventPnl = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return bad(res, 'Event not found', 404);
        res.status(200).json({ success: true, data: await ops.eventProfitAndLoss(ws) });
    } catch (err) {
        next(err);
    }
};

/** Everything still unsettled on an event: closing the accounts is blocked until it is cleared. */
async function unsettledItems(ws) {
    const [claims, unpaid, purchases, shortages, packages, shifts, passes] = await Promise.all([
        OpsExpense.countDocuments({ workspaceId: ws._id, deletedAt: null, approvalStatus: 'Pending' }),
        OpsExpense.aggregate([{ $match: { workspaceId: ws._id, deletedAt: null, approvalStatus: 'Approved', paymentStatus: 'Unpaid' } }, { $group: { _id: null, n: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
        PurchaseRequest.countDocuments({ workspaceId: ws._id, status: { $in: ['Requested', 'Approved'] } }),
        ShortageRecord.countDocuments({ workspaceId: ws._id, status: 'Open' }),
        SubVendorPackage.countDocuments({ workspaceId: ws._id, status: { $nin: ['Cancelled', 'Declined', 'Expired'] }, $or: [{ status: { $ne: 'Approved' } }, { settlementStatus: 'Unsettled' }] }),
        CrewShift.countDocuments({ workspaceId: ws._id, status: 'Open' }),
        GatePass.countDocuments({ workspaceId: ws._id, status: { $in: ['Dispatched', 'Received'] } })
    ]);
    const pnl = await ops.eventProfitAndLoss(ws);
    const items = [];
    if (claims) items.push(`${claims} expense claim(s) waiting for approval`);
    if (unpaid[0]?.n) items.push(`${unpaid[0].n} unpaid cost(s), ₹${unpaid[0].amount.toLocaleString('en-IN')}`);
    if (purchases) items.push(`${purchases} purchase request(s) not completed`);
    if (shortages) items.push(`${shortages} open shortage record(s)`);
    if (packages) items.push(`${packages} sub-vendor package(s) not approved or settled`);
    if (shifts) items.push(`${shifts} crew shift(s) not confirmed`);
    if (passes) items.push(`${passes} gate pass(es) not returned`);
    if (pnl.outstandingFromCustomer > 0) items.push(`Customer balance ₹${pnl.outstandingFromCustomer.toLocaleString('en-IN')} not received`);
    return { items, pnl };
}

// @desc    Financial closure, separate from finishing the event. Lists what is unsettled; the owner
//          can still close with a written reason (kept in the event history).
// @route   POST /api/ops/events/:id/close-accounts   body: { force, reason }
exports.closeAccounts = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return bad(res, 'Event not found', 404);
        if (ws.financeStatus === 'Closed') return bad(res, 'Accounts are already closed');
        if (ws.opsStatus !== 'Completed') return bad(res, 'Mark the event completed before closing its accounts');
        const { items, pnl } = await unsettledItems(ws);
        const reason = String(req.body?.reason || '').trim();
        if (items.length && !(req.body?.force && reason && req.actor.kind === 'owner')) {
            return res.status(409).json({
                success: false,
                code: 'UNSETTLED',
                message: 'Settle these before closing the accounts, or close anyway with a reason',
                data: { unsettled: items }
            });
        }
        await EventWorkspace.updateOne({ _id: ws._id }, {
            $set: { financeStatus: 'Closed', financeClosedAt: new Date() },
            $push: { history: { action: `Accounts closed${items.length ? ` with unsettled items (${reason.slice(0, 200)})` : ''}. Profit after overheads ₹${pnl.profitAfterOverhead.toLocaleString('en-IN')}`, by: req.actor.name } }
        });
        res.status(200).json({ success: true, message: 'Accounts closed', data: { pnl } });
    } catch (err) {
        next(err);
    }
};

// @desc    Unsettled list without closing
// @route   GET /api/ops/events/:id/unsettled
exports.getUnsettled = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return bad(res, 'Event not found', 404);
        const { items } = await unsettledItems(ws);
        res.status(200).json({ success: true, data: items });
    } catch (err) {
        next(err);
    }
};

// @desc    Accounts for a month: every event's P&L, overheads by category, pending claims, cash out
// @route   GET /api/ops/accounts?month=2026-11
exports.accountsSummary = async (req, res, next) => {
    try {
        const [y, m] = String(req.query.month || '').split('-').map(Number);
        const now = new Date();
        const year = y || now.getUTCFullYear();
        const month = (m || now.getUTCMonth() + 1) - 1;
        const start = new Date(Date.UTC(year, month, 1));
        const end = new Date(Date.UTC(year, month + 1, 1));

        const [events, overheads, pending, cashByMethod] = await Promise.all([
            EventWorkspace.find({ vendorId: req.vendor._id, opsStatus: { $ne: 'Cancelled' }, eventDate: { $gte: start, $lt: end } }).sort('eventDate').lean(),
            OpsExpense.aggregate([
                { $match: { vendorId: req.vendor._id, scope: 'Overhead', deletedAt: null, approvalStatus: 'Approved', date: { $gte: start, $lt: end } } },
                { $group: { _id: '$category', amount: { $sum: '$amount' } } }, { $sort: { amount: -1 } }
            ]),
            OpsExpense.countDocuments({ vendorId: req.vendor._id, deletedAt: null, approvalStatus: 'Pending' }),
            OpsExpense.aggregate([
                { $match: { vendorId: req.vendor._id, deletedAt: null, approvalStatus: 'Approved', date: { $gte: start, $lt: end } } },
                { $group: { _id: '$paymentMethod', amount: { $sum: '$amount' } } }
            ])
        ]);
        const rows = [];
        for (const ws of events) {
            const p = await ops.eventProfitAndLoss(ws);
            rows.push({
                _id: ws._id, title: ws.title, eventDate: ws.eventDate, opsStatus: ws.opsStatus, financeStatus: ws.financeStatus,
                contract: p.contract, received: p.received, directCost: p.directCost, allocatedOverhead: p.allocatedOverhead,
                contribution: p.contribution, profitAfterOverhead: p.profitAfterOverhead
            });
        }
        const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
        const overheadTotal = overheads.reduce((s, o) => s + o.amount, 0);
        res.status(200).json({
            success: true,
            data: {
                month: `${year}-${String(month + 1).padStart(2, '0')}`,
                events: rows,
                totals: {
                    contract: sum('contract'), received: sum('received'), directCost: sum('directCost'),
                    overhead: overheadTotal, contribution: sum('contribution'), profit: sum('contribution') - overheadTotal
                },
                overheads: overheads.map(o => ({ category: o._id, amount: o.amount })),
                pendingClaims: pending,
                spendByMethod: cashByMethod.map(c => ({ method: c._id, amount: c.amount }))
            }
        });
    } catch (err) {
        next(err);
    }
};
