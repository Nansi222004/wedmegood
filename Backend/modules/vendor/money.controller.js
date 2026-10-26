const mongoose = require('mongoose');
const VendorMoneyEntry = require('./VendorMoneyEntry');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const vendorOf = (req) => req.vendor._id || req.vendor.id;
const TYPES = ['Expense', 'Payment'];

const parseDate = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
};

// Month bounds for "YYYY-MM" (Indian time); defaults to the current month
const IST_OFFSET = 330 * 60 * 1000;
function monthBounds(month) {
    const now = new Date(Date.now() + IST_OFFSET);
    const [y, m] = /^\d{4}-\d{2}$/.test(String(month || '')) ? month.split('-').map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
    const start = new Date(Date.UTC(y, m - 1, 1) - IST_OFFSET);
    const end = new Date(Date.UTC(y, m, 1) - IST_OFFSET);
    return { start, end, label: `${y}-${String(m).padStart(2, '0')}` };
}

/** Validates the fields for a new entry or an edit. Returns { data } or { error }. */
function clean(body, type, existing = null) {
    const b = body || {};
    const out = {};
    if (b.title !== undefined || !existing) {
        out.title = String(b.title || '').trim().slice(0, 120);
        if (!out.title) return { error: type === 'Expense' ? 'What is the expense for?' : 'What is the payment for?' };
    }
    if (b.amount !== undefined || !existing) {
        const amount = Math.round(Number(b.amount));
        if (!Number.isFinite(amount) || amount < 1) return { error: 'Enter an amount of at least ₹1' };
        if (amount > 100000000) return { error: 'That amount is too large' };
        out.amount = amount;
    }
    if (b.method !== undefined) {
        if (!VendorMoneyEntry.METHODS.includes(b.method)) return { error: 'Choose how it was paid' };
        out.method = b.method;
    }
    if (b.note !== undefined) out.note = String(b.note || '').trim().slice(0, 500);
    if (b.date !== undefined) {
        const d = parseDate(b.date);
        if (d === undefined) return { error: 'Invalid date' };
        out.date = d || new Date();
    }

    if (type === 'Expense') {
        if (b.category !== undefined) {
            if (b.category && !VendorMoneyEntry.EXPENSE_CATEGORIES.includes(b.category)) return { error: 'Choose a category' };
            out.category = b.category || '';
        }
        if (b.status !== undefined) {
            if (!['Planned', 'Spent'].includes(b.status)) return { error: 'Invalid status' };
            out.status = b.status;
        }
        if (b.dueDate !== undefined) {
            const d = parseDate(b.dueDate);
            if (d === undefined) return { error: 'Invalid due date' };
            out.dueDate = d;
        }
    } else {
        if (b.direction !== undefined || !existing) {
            if (!['Paid', 'Received'].includes(b.direction)) return { error: 'Choose paid or received' };
            out.direction = b.direction;
        }
        if (b.party !== undefined) out.party = String(b.party || '').trim().slice(0, 120);
    }
    return { data: out };
}

// @desc    Entries of one kind for a month, plus to-do (planned) expenses whenever they are due, and totals
// @route   GET /api/vendor/money?type=Expense|Payment&month=YYYY-MM
exports.listEntries = async (req, res, next) => {
    try {
        const type = req.query.type;
        if (!TYPES.includes(type)) return bad(res, 'Choose Expense or Payment');
        const vendorId = vendorOf(req);
        const { start, end, label } = monthBounds(req.query.month);

        if (type === 'Expense') {
            const [spent, planned] = await Promise.all([
                VendorMoneyEntry.find({ vendorId, type, status: 'Spent', date: { $gte: start, $lt: end } }).sort('-date -createdAt').lean(),
                // A to-do stays on the list until it is done, whatever month it was planned in
                VendorMoneyEntry.find({ vendorId, type, status: 'Planned' }).sort({ dueDate: 1, createdAt: 1 }).lean()
            ]);
            const byCategory = {};
            for (const e of spent) byCategory[e.category || 'Other'] = (byCategory[e.category || 'Other'] || 0) + e.amount;
            return res.status(200).json({
                success: true,
                data: {
                    month: label,
                    planned,
                    spent,
                    totals: {
                        spent: spent.reduce((s, e) => s + e.amount, 0),
                        planned: planned.reduce((s, e) => s + e.amount, 0),
                        byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount }))
                    }
                },
                options: { methods: VendorMoneyEntry.METHODS, categories: VendorMoneyEntry.EXPENSE_CATEGORIES }
            });
        }

        const entries = await VendorMoneyEntry.find({ vendorId, type, date: { $gte: start, $lt: end } }).sort('-date -createdAt').lean();
        const paid = entries.filter(e => e.direction === 'Paid').reduce((s, e) => s + e.amount, 0);
        const received = entries.filter(e => e.direction === 'Received').reduce((s, e) => s + e.amount, 0);
        res.status(200).json({
            success: true,
            data: { month: label, entries, totals: { paid, received, net: received - paid } },
            options: { methods: VendorMoneyEntry.METHODS }
        });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/vendor/money   body: { type, title, amount, ... }
exports.createEntry = async (req, res, next) => {
    try {
        const type = req.body?.type;
        if (!TYPES.includes(type)) return bad(res, 'Choose Expense or Payment');
        const { data, error } = clean(req.body, type);
        if (error) return bad(res, error);
        if (type === 'Expense') {
            data.status = data.status || 'Spent';
            if (data.status === 'Spent') data.dueDate = null;
        }
        const entry = await VendorMoneyEntry.create({ ...data, vendorId: vendorOf(req), type });
        res.status(201).json({ success: true, data: entry });
    } catch (err) {
        next(err);
    }
};

// @desc    Edit an entry. Marking a planned expense as Spent records it as spent today unless a date is given.
// @route   PUT /api/vendor/money/:id
exports.updateEntry = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Entry not found', 404);
        const entry = await VendorMoneyEntry.findOne({ _id: req.params.id, vendorId: vendorOf(req) });
        if (!entry) return bad(res, 'Entry not found', 404);
        const { data, error } = clean(req.body, entry.type, entry);
        if (error) return bad(res, error);
        if (entry.type === 'Expense' && data.status === 'Spent' && entry.status === 'Planned' && data.date === undefined) {
            data.date = new Date();
        }
        Object.assign(entry, data);
        await entry.save();
        res.status(200).json({ success: true, data: entry });
    } catch (err) {
        next(err);
    }
};

// @route   DELETE /api/vendor/money/:id
exports.deleteEntry = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Entry not found', 404);
        const r = await VendorMoneyEntry.deleteOne({ _id: req.params.id, vendorId: vendorOf(req) });
        if (!r.deletedCount) return bad(res, 'Entry not found', 404);
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
};
