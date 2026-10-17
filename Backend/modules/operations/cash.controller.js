const mongoose = require('mongoose');
const CashDay = require('./CashDay');
const OpsExpense = require('./OpsExpense');
const WalletEntry = require('./WalletEntry');
const EventWorkspace = require('./EventWorkspace');
const Booking = require('../vendor/Booking');
const ops = require('../../services/operations.service');

const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const IST_OFFSET = 330 * 60 * 1000;

const todayIst = () => new Date(Date.now() + IST_OFFSET).toISOString().slice(0, 10);
const validDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) && !isNaN(new Date(d));
// An Indian calendar day as UTC bounds. Expense dates saved as plain dates (UTC midnight) fall inside it.
const dayBounds = (day) => {
    const start = new Date(new Date(`${day}T00:00:00Z`).getTime() - IST_OFFSET);
    return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
};
const normaliseMethod = (m) => (/bank/i.test(m) ? 'Bank transfer' : m || 'Other');

async function dayMovements(vendorId, day) {
    const { start, end } = dayBounds(day);
    const [bookings, expenses, wallet] = await Promise.all([
        Booking.find({ vendorId, 'paymentEntries.paidOn': { $gte: start, $lt: end } })
            .select('customerName paymentEntries').lean(),
        OpsExpense.find({ vendorId, deletedAt: null, approvalStatus: 'Approved', paymentStatus: 'Paid', date: { $gte: start, $lt: end } })
            .populate('workspaceId', 'title').select('category description payee amount paymentMethod workspaceId').lean(),
        WalletEntry.find({ vendorId, type: { $in: ['Advance', 'Payment'] }, date: { $gte: start, $lt: end } })
            .populate('memberId', 'name').select('type amount method memberId note').lean()
    ]);

    const moneyIn = [];
    for (const b of bookings) {
        for (const e of b.paymentEntries || []) {
            if (e.paidOn >= start && e.paidOn < end) {
                moneyIn.push({ source: 'Customer payment', name: b.customerName || 'Customer', amount: e.amount, method: normaliseMethod(e.mode), note: e.note || '', bookingId: b._id });
            }
        }
    }
    const moneyOut = [
        ...expenses.map(e => ({
            source: 'Expense', name: e.payee || e.category, detail: [e.category, e.workspaceId?.title].filter(Boolean).join(' · '),
            amount: e.amount, method: normaliseMethod(e.paymentMethod), expenseId: e._id
        })),
        ...wallet.map(w => ({
            source: `Crew ${w.type.toLowerCase()}`, name: w.memberId?.name || 'Team member', detail: w.note || '',
            amount: w.amount, method: normaliseMethod(w.method || 'Cash')
        }))
    ];

    const byMethod = {};
    for (const m of moneyIn) (byMethod[m.method] = byMethod[m.method] || { in: 0, out: 0 }).in += m.amount;
    for (const m of moneyOut) (byMethod[m.method] = byMethod[m.method] || { in: 0, out: 0 }).out += m.amount;
    const cashIn = byMethod.Cash?.in || 0;
    const cashOut = byMethod.Cash?.out || 0;
    return { moneyIn, moneyOut, byMethod: Object.entries(byMethod).map(([method, v]) => ({ method, ...v })), cashIn, cashOut };
}

// Opening cash = the last counted figure before this day
async function openingFor(vendorId, day) {
    const prev = await CashDay.findOne({ vendorId, day: { $lt: day }, closedAt: { $ne: null } }).sort('-day').lean();
    return { openingCash: prev ? prev.countedCash : 0, previousDay: prev?.day || null };
}

// @desc    A day's money in and out by payment method, and the cash count
// @route   GET /api/ops/cash?day=YYYY-MM-DD
exports.getCashDay = async (req, res, next) => {
    try {
        const day = validDay(req.query.day) ? req.query.day : todayIst();
        const [moves, saved, opening, recent] = await Promise.all([
            dayMovements(req.vendor._id, day),
            CashDay.findOne({ vendorId: req.vendor._id, day }).lean(),
            openingFor(req.vendor._id, day),
            CashDay.find({ vendorId: req.vendor._id, closedAt: { $ne: null } }).sort('-day').limit(10)
                .select('day expectedCash countedCash difference closedBy').lean()
        ]);
        const openingCash = saved?.closedAt ? saved.openingCash : opening.openingCash;
        res.status(200).json({
            success: true,
            data: {
                day,
                openingCash,
                previousDay: opening.previousDay,
                ...moves,
                expectedCash: openingCash + moves.cashIn - moves.cashOut,
                count: saved?.closedAt ? {
                    countedCash: saved.countedCash, expectedCash: saved.expectedCash, difference: saved.difference,
                    note: saved.note, closedBy: saved.closedBy, closedAt: saved.closedAt
                } : null,
                recent
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Record the cash counted at the end of a day. Recounting keeps the earlier count in history.
// @route   POST /api/ops/cash/close   body: { day, countedCash, openingCash?, note }
exports.closeCashDay = async (req, res, next) => {
    try {
        const b = req.body || {};
        const day = validDay(b.day) ? b.day : todayIst();
        if (day > todayIst()) return bad(res, 'You cannot count cash for a future day');
        const counted = Number(b.countedCash);
        if (!Number.isFinite(counted) || counted < 0) return bad(res, 'Enter the cash you counted');

        const moves = await dayMovements(req.vendor._id, day);
        const opening = b.openingCash !== undefined && b.openingCash !== '' && Number(b.openingCash) >= 0
            ? Math.round(Number(b.openingCash))
            : (await openingFor(req.vendor._id, day)).openingCash;
        const expected = opening + moves.cashIn - moves.cashOut;
        const note = String(b.note || '').trim().slice(0, 1000);
        const difference = Math.round(counted) - expected;
        if (difference !== 0 && note.length < 3) {
            return bad(res, `Counted cash is ${difference > 0 ? 'more' : 'less'} than expected by ₹${Math.abs(difference).toLocaleString('en-IN')}. Add a note explaining it.`);
        }

        const existing = await CashDay.findOne({ vendorId: req.vendor._id, day });
        const doc = existing || new CashDay({ vendorId: req.vendor._id, day });
        if (existing?.closedAt) {
            doc.history.push({ countedCash: existing.countedCash, expectedCash: existing.expectedCash, by: existing.closedBy, at: existing.closedAt, note: existing.note });
        }
        Object.assign(doc, {
            openingCash: opening, cashIn: moves.cashIn, cashOut: moves.cashOut, expectedCash: expected,
            countedCash: Math.round(counted), difference, note, closedBy: req.actor.name, closedAt: new Date()
        });
        await doc.save();
        if (difference !== 0 && req.actor.role !== 'Owner') {
            await ops.notifyVendor(req.vendor._id, `Cash count for ${day} is off by ₹${Math.abs(difference).toLocaleString('en-IN')} (${req.actor.name}): ${note}`);
        }
        res.status(200).json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
};

// @desc    Split one shared cost (a driver or vehicle used for several events) across those events
//          in proportion to the hours or kilometres each event used.
// @route   POST /api/ops/expenses/split
//          body: { amount, category, description, payee, vehicle, paymentMethod, paymentStatus, date,
//                  basis: 'hours'|'km', parts: [{ eventId, value }] }
exports.splitExpense = async (req, res, next) => {
    try {
        const b = req.body || {};
        const amount = Math.round(Number(b.amount) || 0);
        if (amount <= 0) return bad(res, 'Enter the total amount');
        const basis = b.basis === 'km' ? 'km' : 'hours';
        const category = OpsExpense.EVENT_CATEGORIES.includes(b.category) ? b.category : 'Transport';
        const parts = (Array.isArray(b.parts) ? b.parts : [])
            .map(p => ({ eventId: String(p.eventId || ''), value: Number(p.value) || 0 }))
            .filter(p => isId(p.eventId) && p.value > 0);
        if (parts.length < 2) return bad(res, `Add at least two events with their ${basis}`);
        if (new Set(parts.map(p => p.eventId)).size !== parts.length) return bad(res, 'Each event can appear only once');

        const events = await EventWorkspace.find({ _id: { $in: parts.map(p => p.eventId) }, vendorId: req.vendor._id })
            .select('title financeStatus').lean();
        if (events.length !== parts.length) return bad(res, 'One of the events was not found');
        const closed = events.find(e => e.financeStatus === 'Closed');
        if (closed) return bad(res, `${closed.title}: accounts are closed`);

        const totalValue = parts.reduce((s, p) => s + p.value, 0);
        const METHODS = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque', 'Credit (unpaid)'];
        const method = METHODS.includes(b.paymentMethod) ? b.paymentMethod : 'Cash';
        const unpaid = b.paymentStatus === 'Unpaid' || method === 'Credit (unpaid)';
        const splitRef = `split:${new mongoose.Types.ObjectId()}`;
        const unit = basis === 'km' ? 'km' : 'hrs';
        const description = String(b.description || '').trim().slice(0, 300) || `Shared ${category.toLowerCase()}`;

        // Round each share; the last event takes the rounding remainder so shares add up exactly
        let allocated = 0;
        const docs = parts.map((p, i) => {
            const share = i === parts.length - 1 ? amount - allocated : Math.round((amount * p.value) / totalValue);
            allocated += share;
            return {
                vendorId: req.vendor._id, scope: 'Event', workspaceId: p.eventId, category,
                date: b.date ? new Date(b.date) : new Date(),
                description: `${description} (${p.value} of ${totalValue} ${unit})`.slice(0, 500),
                amount: share, payee: String(b.payee || '').trim().slice(0, 120),
                vehicle: String(b.vehicle || '').slice(0, 40).toUpperCase(),
                hours: basis === 'hours' ? p.value : 0,
                paymentMethod: method, paymentStatus: unpaid ? 'Unpaid' : 'Paid', paidBy: req.actor.name,
                approvalStatus: 'Approved', source: 'manual', sourceRef: splitRef,
                audit: [{ action: `Split by ${basis} across ${parts.length} events (total ₹${amount.toLocaleString('en-IN')})`, by: req.actor.name }]
            };
        });
        const created = await OpsExpense.insertMany(docs);
        res.status(201).json({ success: true, data: created, splitRef });
    } catch (err) {
        next(err);
    }
};
