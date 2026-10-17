const mongoose = require('mongoose');
const Booking = require('../modules/vendor/Booking');
const Inventory = require('../modules/vendor/Inventory');
const EventWorkspace = require('../modules/operations/EventWorkspace');
const WorkspaceTask = require('../modules/operations/WorkspaceTask');
const StockReservation = require('../modules/operations/StockReservation');
const ShortageRecord = require('../modules/operations/ShortageRecord');
const OpsExpense = require('../modules/operations/OpsExpense');

const DAY_MS = 24 * 60 * 60 * 1000;
const dayStart = (d) => { const x = new Date(d); x.setUTCHours(0, 0, 0, 0); return x; };
const dayEnd = (d) => { const x = new Date(d); x.setUTCHours(23, 59, 59, 999); return x; };
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ---------------------------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------------------------

/** Every booking gets its control room. Cancelled bookings mark theirs cancelled. */
async function syncWorkspaces(vendorId) {
    const bookings = await Booking.find({ vendorId })
        .select('_id userId customerName eventDate location eventType status services')
        .lean();
    if (bookings.length === 0) return;
    const existing = await EventWorkspace.find({ vendorId }).select('bookingId opsStatus eventDate').lean();
    const byBooking = new Map(existing.map(w => [String(w.bookingId), w]));

    const toCreate = [];
    for (const b of bookings) {
        const ws = byBooking.get(String(b._id));
        if (!ws) {
            if (b.status === 'Cancelled') continue;
            toCreate.push({
                vendorId,
                bookingId: b._id,
                userId: b.userId || null,
                title: `${b.eventType || 'Event'} · ${b.customerName || 'Customer'}`,
                eventType: b.eventType || 'Event',
                eventDate: b.eventDate,
                venue: b.location || '',
                history: [{ action: 'Workspace created from booking', by: 'system' }]
            });
        } else if (b.status === 'Cancelled' && ws.opsStatus !== 'Cancelled') {
            await EventWorkspace.updateOne({ _id: ws._id }, {
                $set: { opsStatus: 'Cancelled' },
                $push: { history: { action: 'Booking cancelled', by: 'system' } }
            });
            await StockReservation.updateMany({ workspaceId: ws._id, status: 'Reserved' }, { $set: { status: 'Released' } });
        } else if (String(new Date(ws.eventDate)) !== String(new Date(b.eventDate))) {
            await EventWorkspace.updateOne({ _id: ws._id }, { $set: { eventDate: b.eventDate } });
        }
    }
    if (toCreate.length) {
        await EventWorkspace.insertMany(toCreate, { ordered: false }).catch(err => {
            if (err.code !== 11000 && !String(err.message).includes('E11000')) throw err;
        });
    }
}

const PHASES = [
    { key: 'materials', title: (s) => `Check stock and materials for ${s}`, offsetDays: -3 },
    { key: 'prepare', title: (s) => `Prepare / fabricate ${s}`, offsetDays: -1 },
    { key: 'load', title: (s) => `Pack and load ${s} for transport`, offsetDays: 0, hours: -4 },
    { key: 'install', title: (s) => `Install ${s} at the venue`, offsetDays: 0, hours: -1 }
];

/**
 * Draft preparation checklist from the confirmed quotation: for every quoted item its material,
 * preparation, transport and installation tasks, plus the event-wide tasks. The owner reviews and
 * assigns them. Never runs twice for the same workspace.
 */
async function generateChecklist(workspace, by) {
    if (workspace.checklistGeneratedAt) return { created: 0, alreadyGenerated: true };
    const booking = await Booking.findById(workspace.bookingId).select('quoteSnapshot services').lean();
    const items = (booking?.quoteSnapshot?.items || []).map(i => ({ name: i.service || i.description, quantity: i.quantity || 1 }))
        .filter(i => i.name);
    const fallback = (booking?.services || []).map(s => ({ name: s, quantity: 1 }));
    const lines = items.length ? items : fallback;

    const eventAt = new Date(workspace.eventDate);
    const at = (offsetDays, hours = 0) => new Date(eventAt.getTime() + offsetDays * DAY_MS + hours * 60 * 60 * 1000);
    const tasks = [];
    let order = 0;
    for (const line of lines) {
        for (const phase of PHASES) {
            tasks.push({
                workspaceId: workspace._id,
                vendorId: workspace.vendorId,
                title: phase.title(line.name),
                quantity: line.quantity,
                deadline: at(phase.offsetDays, phase.hours || 0),
                mandatory: true,
                source: 'quote',
                order: order++,
                history: [{ status: 'Not started', note: 'Generated from the quotation', by }]
            });
        }
    }
    for (const t of [
        { title: 'Prepare gate pass and load the vehicle', days: 0, hours: -5 },
        { title: 'Final walk-through with the customer', days: 0, hours: 0 },
        { title: 'Dismantle, pack and return stock to the godown', days: 1, hours: 0 }
    ]) {
        tasks.push({
            workspaceId: workspace._id, vendorId: workspace.vendorId, title: t.title,
            deadline: at(t.days, t.hours), mandatory: true, source: 'quote', order: order++,
            history: [{ status: 'Not started', note: 'Generated from the quotation', by }]
        });
    }
    await WorkspaceTask.insertMany(tasks);
    await EventWorkspace.updateOne({ _id: workspace._id }, {
        $set: { checklistGeneratedAt: new Date() },
        $push: { history: { action: `Checklist generated (${tasks.length} tasks)`, by } }
    });
    return { created: tasks.length };
}

/** Event memory: copy the plan (tasks, quantities, stock needs) of an earlier event. */
async function copyPlan(fromWorkspace, toWorkspace, by) {
    const source = await WorkspaceTask.find({ workspaceId: fromWorkspace._id }).sort('order').lean();
    const shift = new Date(toWorkspace.eventDate) - new Date(fromWorkspace.eventDate);
    const copies = source.map((t, i) => ({
        workspaceId: toWorkspace._id,
        vendorId: toWorkspace.vendorId,
        title: t.title,
        description: t.description,
        quantity: t.quantity,
        unit: t.unit,
        deadline: t.deadline ? new Date(new Date(t.deadline).getTime() + shift) : null,
        mandatory: t.mandatory,
        requiredStock: t.requiredStock,
        purchaseNeeded: t.purchaseNeeded,
        source: 'copied',
        order: i,
        history: [{ status: 'Not started', note: `Copied from ${fromWorkspace.title}`, by }]
    }));
    if (copies.length) await WorkspaceTask.insertMany(copies);
    return copies.length;
}

// Progress a task contributes to readiness
const TASK_WEIGHT = { 'Not started': 0, Assigned: 0.1, Accepted: 0.15, 'In progress': 0.5, Blocked: 0.3, Completed: 0.8, Verified: 1 };

/** Preparation completion % from the mandatory tasks (all tasks when none is mandatory). */
function readinessOf(tasks) {
    const relevant = tasks.filter(t => t.mandatory).length ? tasks.filter(t => t.mandatory) : tasks;
    if (relevant.length === 0) return 0;
    const sum = relevant.reduce((s, t) => s + (TASK_WEIGHT[t.status] || 0), 0);
    return Math.round((sum / relevant.length) * 100);
}

const allMandatoryVerified = (tasks) => {
    const mandatory = tasks.filter(t => t.mandatory);
    return mandatory.length > 0 && mandatory.every(t => t.status === 'Verified');
};

async function notifyCustomer(workspace, title, message) {
    if (!workspace.userId) return;
    try {
        const { createNotification } = require('./notification.service');
        await createNotification({
            userId: workspace.userId, title, message, type: 'booking', entityType: 'Booking',
            entityId: workspace.bookingId, customLink: `/user/events/${workspace.bookingId}`
        });
    } catch (_) { /* best effort */ }
}

async function notifyVendor(vendorId, message, type = 'Booking') {
    try {
        const Notification = require('../modules/vendor/Notification');
        await Notification.create({ vendorId, message, type });
    } catch (_) { /* best effort */ }
}

/**
 * Sends an update to the customer, or holds it for the owner when the vendor reviews updates first.
 * The owner's own updates always go straight out. Returns 'Sent' or 'Pending'.
 */
async function sendOrQueueCustomerUpdate(workspace, { kind = 'custom', title, message, actor = null }) {
    const Vendor = require('../modules/vendor/Vendor');
    const vendor = await Vendor.findById(workspace.vendorId).select('opsSettings').lean();
    const review = Boolean(vendor?.opsSettings?.reviewCustomerUpdates) && actor?.role !== 'Owner';
    const entry = { kind, title, message, status: review ? 'Pending' : 'Sent', createdBy: actor?.name || 'system' };
    if (!review) Object.assign(entry, { decidedBy: actor?.name || 'system', decidedAt: new Date() });
    await EventWorkspace.updateOne({ _id: workspace._id }, { $push: { customerUpdates: entry } });
    if (review) {
        await notifyVendor(workspace.vendorId, `Customer update waiting for your review: "${title}" for ${workspace.title || 'an event'}.`);
        return 'Pending';
    }
    await notifyCustomer(workspace, title, message);
    return 'Sent';
}

/** Sends the one-time "about 80% ready" update to the customer when preparation reaches it. */
async function maybeSendReadinessUpdate(workspaceId) {
    const ws = await EventWorkspace.findById(workspaceId).lean();
    if (!ws || ws.readiness?.updateSentAt || ['Cancelled', 'Completed'].includes(ws.opsStatus)) return;
    const tasks = await WorkspaceTask.find({ workspaceId }).select('status mandatory').lean();
    if (readinessOf(tasks) < 80) return;
    const claimed = await EventWorkspace.findOneAndUpdate(
        { _id: workspaceId, 'readiness.updateSentAt': null },
        { $set: { 'readiness.updateSentAt': new Date() } }
    );
    if (claimed) {
        await sendOrQueueCustomerUpdate(ws, {
            kind: 'readiness',
            title: 'Your event preparation is on track',
            message: `Preparation for your ${ws.eventType} on ${formatDate(ws.eventDate)} is about 80% complete. We will confirm once everything is checked and ready.`
        });
    }
}

// ---------------------------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------------------------

/** Window an event holds its stock: the day before (loading) to the day after (return). */
function reservationWindow(workspace) {
    const from = dayStart(new Date(new Date(workspace.eventDate).getTime() - DAY_MS));
    const to = dayEnd(new Date(new Date(workspace.eventEndDate || workspace.eventDate).getTime() + DAY_MS));
    return { from, to };
}

/**
 * Free quantity of items for a date range: owned - reserved by overlapping events - out of the
 * godown because missing or damaged (open shortages).
 * @returns {Promise<Map<string, {owned:number, reserved:number, unavailable:number, available:number}>>}
 */
async function availabilityFor(inventoryIds, from, to, excludeWorkspaceId = null) {
    const ids = inventoryIds.map(id => new mongoose.Types.ObjectId(String(id)));
    const [items, reserved, shortages] = await Promise.all([
        Inventory.find({ _id: { $in: ids } }).select('totalQuantity').lean(),
        StockReservation.aggregate([
            {
                $match: {
                    inventoryId: { $in: ids }, status: 'Reserved', fromDate: { $lte: to }, toDate: { $gte: from },
                    ...(excludeWorkspaceId ? { workspaceId: { $ne: new mongoose.Types.ObjectId(String(excludeWorkspaceId)) } } : {})
                }
            },
            { $group: { _id: '$inventoryId', qty: { $sum: '$quantity' } } }
        ]),
        ShortageRecord.aggregate([
            { $match: { inventoryId: { $in: ids }, status: 'Open' } },
            { $group: { _id: '$inventoryId', qty: { $sum: '$quantity' } } }
        ])
    ]);
    const r = new Map(reserved.map(x => [String(x._id), x.qty]));
    const s = new Map(shortages.map(x => [String(x._id), x.qty]));
    const out = new Map();
    for (const item of items) {
        const key = String(item._id);
        const owned = item.totalQuantity || 0;
        const res = r.get(key) || 0;
        const un = s.get(key) || 0;
        out.set(key, { owned, reserved: res, unavailable: un, available: Math.max(0, owned - res - un) });
    }
    return out;
}

async function recordMovement(data) {
    const StockMovement = require('../modules/operations/StockMovement');
    return StockMovement.create(data);
}

// ---------------------------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------------------------

const eventDays = (ws) => Math.max(1, Math.round((dayStart(ws.eventEndDate || ws.eventDate) - dayStart(ws.eventDate)) / DAY_MS) + 1);

/**
 * Profit and loss of one event: contract value and money received, direct costs by category,
 * and overheads allocated by event-days in the event's month (godown rent etc.).
 */
async function eventProfitAndLoss(workspace) {
    const booking = await Booking.findById(workspace.bookingId).select('totalPrice paidAmount paymentEntries status').lean();
    const ChangeRequest = require('../modules/operations/ChangeRequest');
    const approvedChanges = await ChangeRequest.aggregate([
        { $match: { workspaceId: workspace._id, status: 'Approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const changeRequestValue = approvedChanges[0]?.total || 0;
    // Contract = the booking amount plus extra work the customer approved
    const contract = (Number(booking?.totalPrice) || 0) + changeRequestValue;
    const entriesTotal = (booking?.paymentEntries || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const received = Math.max(Number(booking?.paidAmount) || 0, entriesTotal);

    const expenses = await OpsExpense.find({ workspaceId: workspace._id, scope: 'Event', deletedAt: null }).lean();
    const approved = expenses.filter(e => e.approvalStatus === 'Approved');
    const byCategory = {};
    for (const e of approved) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    const directCost = approved.reduce((s, e) => s + e.amount, 0);
    const pendingClaims = expenses.filter(e => e.approvalStatus === 'Pending').reduce((s, e) => s + e.amount, 0);
    const unpaidCosts = approved.filter(e => e.paymentStatus === 'Unpaid').reduce((s, e) => s + e.amount, 0);

    // Overheads of the event's month spread over all event-days of that month
    const d = new Date(workspace.eventDate);
    const monthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    const [overheads, monthEvents] = await Promise.all([
        OpsExpense.aggregate([
            { $match: { vendorId: workspace.vendorId, scope: 'Overhead', deletedAt: null, approvalStatus: 'Approved', date: { $gte: monthStart, $lt: monthEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        EventWorkspace.find({ vendorId: workspace.vendorId, opsStatus: { $ne: 'Cancelled' }, eventDate: { $gte: monthStart, $lt: monthEnd } })
            .select('eventDate eventEndDate').lean()
    ]);
    const monthOverhead = overheads[0]?.total || 0;
    const monthEventDays = monthEvents.reduce((s, w) => s + eventDays(w), 0) || 1;
    const allocatedOverhead = Math.round((monthOverhead * eventDays(workspace)) / monthEventDays);

    const contribution = contract - directCost;
    return {
        contract,
        bookingValue: Number(booking?.totalPrice) || 0,
        changeRequestValue,
        received,
        outstandingFromCustomer: Math.max(0, contract - received),
        directCost,
        costByCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
        pendingClaims,
        unpaidCosts,
        contribution,
        contributionMargin: contract ? Math.round((contribution / contract) * 100) : null,
        allocatedOverhead,
        overheadRule: `Month overheads ₹${monthOverhead.toLocaleString('en-IN')} ÷ ${monthEventDays} event-day(s) × ${eventDays(workspace)}`,
        profitAfterOverhead: contribution - allocatedOverhead
    };
}

/** Possible duplicate: same amount to the same payee (or same receipt number) within 3 days. */
async function findDuplicateExpense(vendorId, { amount, payee, receiptNumber, date }, excludeId = null) {
    const when = new Date(date || Date.now());
    const or = [];
    if (receiptNumber) or.push({ receiptNumber });
    if (payee) or.push({ payee: new RegExp(`^${String(payee).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), amount });
    if (or.length === 0) return null;
    return OpsExpense.findOne({
        vendorId, deletedAt: null,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        date: { $gte: new Date(when.getTime() - 3 * DAY_MS), $lte: new Date(when.getTime() + 3 * DAY_MS) },
        $or: or
    }).select('_id description amount date').lean();
}

module.exports = {
    DAY_MS,
    dayStart,
    dayEnd,
    formatDate,
    syncWorkspaces,
    generateChecklist,
    copyPlan,
    readinessOf,
    allMandatoryVerified,
    maybeSendReadinessUpdate,
    notifyCustomer,
    sendOrQueueCustomerUpdate,
    notifyVendor,
    reservationWindow,
    availabilityFor,
    recordMovement,
    eventProfitAndLoss,
    findDuplicateExpense
};
