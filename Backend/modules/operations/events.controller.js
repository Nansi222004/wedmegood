const mongoose = require('mongoose');
const Booking = require('../vendor/Booking');
const User = require('../user/user.model');
const EventWorkspace = require('./EventWorkspace');
const Vendor = require('../vendor/Vendor');
const WorkspaceTask = require('./WorkspaceTask');
const ChangeRequest = require('./ChangeRequest');
const StockReservation = require('./StockReservation');
const GatePass = require('./GatePass');
const PurchaseRequest = require('./PurchaseRequest');
const SubVendorPackage = require('./SubVendorPackage');
const CrewShift = require('./CrewShift');
const TeamMember = require('./TeamMember');
const { can } = require('./opsAuth');
const ops = require('../../services/operations.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const OPEN_TASK = ['Not started', 'Assigned', 'Accepted', 'In progress', 'Blocked'];

/** The workspace if this actor may see it (members with only their own work must be on it). */
async function loadWorkspace(req, id) {
    if (!isId(id)) return null;
    const ws = await EventWorkspace.findOne({ _id: id, vendorId: req.vendor._id }).lean();
    if (!ws) return null;
    if (can(req.actor, 'events.view')) return ws;
    const mine = req.member && (
        await WorkspaceTask.exists({ workspaceId: ws._id, assigneeMemberId: req.member._id })
        || await CrewShift.exists({ workspaceId: ws._id, memberId: req.member._id })
        || await SubVendorPackage.exists({ workspaceId: ws._id, subVendorId: req.member._id })
    );
    return mine ? ws : null;
}
exports.loadWorkspace = loadWorkspace;

const notFound = (res) => res.status(404).json({ success: false, message: 'Event not found' });

/** Risks the owner should act on now. */
function risksFor({ ws, tasks, reservations, needs, purchases, packages, shifts, changeRequests, pnl }) {
    const now = Date.now();
    const hoursToEvent = (new Date(ws.eventDate) - now) / 3600000;
    const risks = [];
    const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < now && OPEN_TASK.includes(t.status));
    if (overdue.length) risks.push({ level: 'high', text: `${overdue.length} task(s) past their deadline` });
    const blocked = tasks.filter(t => t.status === 'Blocked');
    if (blocked.length) risks.push({ level: 'high', text: `${blocked.length} blocked task(s): ${blocked.slice(0, 2).map(t => t.blockedReason || t.title).join('; ')}` });
    const unassigned = tasks.filter(t => !t.assigneeMemberId && OPEN_TASK.includes(t.status));
    if (unassigned.length && hoursToEvent < 72) risks.push({ level: 'medium', text: `${unassigned.length} task(s) not assigned to anyone` });
    const short = needs.filter(n => n.shortBy > 0);
    if (short.length) risks.push({ level: 'high', text: `Stock short: ${short.slice(0, 3).map(n => `${n.name} (${n.shortBy})`).join(', ')}` });
    const pendingBuys = purchases.filter(p => ['Requested', 'Approved'].includes(p.status));
    if (pendingBuys.length) risks.push({ level: hoursToEvent < 48 ? 'high' : 'medium', text: `${pendingBuys.length} purchase(s) not bought yet` });
    const waitingPackages = packages.filter(p => p.status === 'Offered' || p.status === 'Expired' || p.status === 'Declined');
    if (waitingPackages.length) risks.push({ level: 'high', text: `${waitingPackages.length} sub-vendor package(s) not confirmed` });
    const crewConfirmed = new Set([...tasks.map(t => t.assigneeMemberId).filter(Boolean), ...shifts.map(s => s.memberId)].map(String)).size;
    if (ws.crewRequired && crewConfirmed < ws.crewRequired) risks.push({ level: 'medium', text: `Crew ${crewConfirmed} of ${ws.crewRequired} confirmed` });
    if (hoursToEvent < 48 && hoursToEvent > -24 && !(ws.transport || []).length) risks.push({ level: 'medium', text: 'No vehicle planned' });
    if (changeRequests.some(c => c.status === 'Pending')) risks.push({ level: 'medium', text: 'Customer has not approved a change request yet' });
    if (pnl && pnl.outstandingFromCustomer > 0 && hoursToEvent < 24) risks.push({ level: 'medium', text: `Customer balance ₹${pnl.outstandingFromCustomer.toLocaleString('en-IN')} outstanding` });
    if (!reservations.length && tasks.some(t => (t.requiredStock || []).length)) risks.push({ level: 'medium', text: 'Stock needed by tasks is not reserved' });
    return risks;
}

// Reservations and tasks may arrive with inventoryId already populated into the item document
const itemKey = (ref) => String(ref?._id || ref);

/** Stock needed by the tasks vs reserved for this event vs free in the godown. */
async function stockNeeds(ws, tasks, reservations) {
    const need = new Map();
    for (const t of tasks) {
        for (const r of t.requiredStock || []) {
            if (!r.inventoryId) continue;
            const key = itemKey(r.inventoryId);
            need.set(key, (need.get(key) || 0) + (r.quantity || 0));
        }
    }
    for (const r of reservations) if (r.inventoryId && !need.has(itemKey(r.inventoryId))) need.set(itemKey(r.inventoryId), 0);
    if (need.size === 0) return [];
    const Inventory = require('../vendor/Inventory');
    const items = await Inventory.find({ _id: { $in: [...need.keys()] } }).select('itemName unit stockType').lean();
    const { from, to } = ops.reservationWindow(ws);
    const avail = await ops.availabilityFor([...need.keys()], from, to, ws._id);
    return items.map(i => {
        const key = String(i._id);
        const reserved = reservations.filter(r => itemKey(r.inventoryId) === key && r.status === 'Reserved').reduce((s, r) => s + r.quantity, 0);
        const required = need.get(key) || 0;
        const free = avail.get(key)?.available || 0;
        return {
            inventoryId: i._id, name: i.itemName, unit: i.unit, stockType: i.stockType,
            required, reserved, freeForThisEvent: free,
            shortBy: Math.max(0, required - reserved - free)
        };
    });
}

function eventSummary(ws, tasks, extra = {}) {
    return {
        _id: ws._id,
        bookingId: ws.bookingId,
        title: ws.title,
        eventType: ws.eventType,
        eventDate: ws.eventDate,
        eventEndDate: ws.eventEndDate,
        venue: ws.venue,
        opsStatus: ws.opsStatus,
        financeStatus: ws.financeStatus,
        readiness: ops.readinessOf(tasks),
        tasksTotal: tasks.length,
        tasksDone: tasks.filter(t => ['Completed', 'Verified'].includes(t.status)).length,
        overdue: tasks.filter(t => t.deadline && new Date(t.deadline) < Date.now() && OPEN_TASK.includes(t.status)).length,
        finalConfirmed: Boolean(ws.readiness?.finalConfirmedAt),
        ...extra
    };
}

// @desc    Events (one per booking). Members see the events they work on.
// @route   GET /api/ops/events?range=upcoming|past|all
exports.listEvents = async (req, res, next) => {
    try {
        await ops.syncWorkspaces(req.vendor._id);
        const range = req.query.range || 'upcoming';
        const today = ops.dayStart(new Date());
        const query = { vendorId: req.vendor._id };
        if (range === 'upcoming') query.eventDate = { $gte: today };
        if (range === 'past') query.eventDate = { $lt: today };

        if (!can(req.actor, 'events.view')) {
            const [t, s, p] = await Promise.all([
                WorkspaceTask.distinct('workspaceId', { assigneeMemberId: req.member._id }),
                CrewShift.distinct('workspaceId', { memberId: req.member._id }),
                SubVendorPackage.distinct('workspaceId', { subVendorId: req.member._id })
            ]);
            query._id = { $in: [...t, ...s, ...p] };
        }
        const list = await EventWorkspace.find(query).sort(range === 'past' ? '-eventDate' : 'eventDate').limit(200).lean();
        const tasks = await WorkspaceTask.find({ workspaceId: { $in: list.map(w => w._id) } }).select('workspaceId status mandatory deadline').lean();
        res.status(200).json({
            success: true,
            data: list.map(ws => eventSummary(ws, tasks.filter(t => String(t.workspaceId) === String(ws._id))))
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Readiness board for the next days: is the business actually ready to run each event?
// @route   GET /api/ops/events/board?days=2
exports.getBoard = async (req, res, next) => {
    try {
        await ops.syncWorkspaces(req.vendor._id);
        const days = Math.min(14, Math.max(1, Number(req.query.days) || 2));
        const from = ops.dayStart(new Date());
        const to = ops.dayEnd(new Date(Date.now() + days * ops.DAY_MS));
        const list = await EventWorkspace.find({ vendorId: req.vendor._id, opsStatus: { $ne: 'Cancelled' }, eventDate: { $gte: from, $lte: to } })
            .sort('eventDate').lean();
        const finance = can(req.actor, 'finance.view');
        const board = [];
        for (const ws of list) {
            const [tasks, reservations, purchases, packages, shifts, changeRequests] = await Promise.all([
                WorkspaceTask.find({ workspaceId: ws._id }).lean(),
                StockReservation.find({ workspaceId: ws._id, status: 'Reserved' }).lean(),
                PurchaseRequest.find({ workspaceId: ws._id }).select('status neededBy number').lean(),
                SubVendorPackage.find({ workspaceId: ws._id }).select('status title').lean(),
                CrewShift.find({ workspaceId: ws._id }).select('memberId status').lean(),
                ChangeRequest.find({ workspaceId: ws._id }).select('status').lean()
            ]);
            const needs = await stockNeeds(ws, tasks, reservations);
            const pnl = finance ? await ops.eventProfitAndLoss(ws) : null;
            const crewConfirmed = new Set([...tasks.map(t => t.assigneeMemberId).filter(Boolean), ...shifts.map(s => s.memberId)].map(String)).size;
            board.push(eventSummary(ws, tasks, {
                reportingTime: ws.reportingTime,
                crewRequired: ws.crewRequired,
                crewConfirmed,
                stockShort: needs.filter(n => n.shortBy > 0).map(n => ({ name: n.name, shortBy: n.shortBy })),
                pendingPurchases: purchases.filter(p => ['Requested', 'Approved'].includes(p.status)).map(p => ({ number: p.number, neededBy: p.neededBy })),
                subVendorsConfirmed: packages.filter(p => ['Accepted', 'In progress', 'Completed', 'Approved'].includes(p.status)).length,
                subVendorsTotal: packages.filter(p => p.status !== 'Cancelled').length,
                transport: ws.transport || [],
                pendingChangeRequests: changeRequests.filter(c => c.status === 'Pending').length,
                money: pnl ? { outstandingFromCustomer: pnl.outstandingFromCustomer, unpaidCosts: pnl.unpaidCosts } : null,
                risks: risksFor({ ws, tasks, reservations, needs, purchases, packages, shifts, changeRequests, pnl })
            }));
        }
        res.status(200).json({ success: true, data: board });
    } catch (err) {
        next(err);
    }
};

// @desc    The control room of one event
// @route   GET /api/ops/events/:id
exports.getEvent = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return notFound(res);
        const own = !can(req.actor, 'events.view');
        const taskQuery = { workspaceId: ws._id, ...(own ? { assigneeMemberId: req.member._id } : {}) };

        const [tasks, allTasks, reservations, gatePasses, purchases, packages, shifts, changeRequests, booking, members] = await Promise.all([
            WorkspaceTask.find(taskQuery).sort('order deadline').populate('requiredStock.inventoryId', 'itemName unit').lean(),
            WorkspaceTask.find({ workspaceId: ws._id }).select('status mandatory deadline assigneeMemberId requiredStock').lean(),
            StockReservation.find({ workspaceId: ws._id, status: 'Reserved' }).populate('inventoryId', 'itemName unit stockType').lean(),
            can(req.actor, 'gatepass.manage') || can(req.actor, 'gatepass.receive') ? GatePass.find({ workspaceId: ws._id }).sort('-createdAt').lean() : [],
            PurchaseRequest.find({ workspaceId: ws._id, ...(own ? { requestedByMemberId: req.member._id } : {}) }).sort('-createdAt').lean(),
            SubVendorPackage.find({ workspaceId: ws._id, ...(req.actor.role === 'SubVendor' ? { subVendorId: req.member._id } : {}) })
                .populate('subVendorId', 'name subVendor.businessName phone').populate('fallbackSubVendorId', 'name subVendor.businessName').lean(),
            CrewShift.find({ workspaceId: ws._id, ...(own ? { memberId: req.member._id } : {}) }).populate('memberId', 'name role').lean(),
            ChangeRequest.find({ workspaceId: ws._id }).sort('-createdAt').lean(),
            Booking.findById(ws.bookingId).select('customerName userId totalPrice guestCount notes quoteSnapshot status services').lean(),
            can(req.actor, 'tasks.manage') ? TeamMember.find({ vendorId: req.vendor._id, isActive: true }).select('name role skills subVendor').lean() : []
        ]);

        const finance = can(req.actor, 'finance.view');
        const needs = can(req.actor, 'stock.view') ? await stockNeeds(ws, allTasks, reservations) : [];
        const pnl = finance ? await ops.eventProfitAndLoss(ws) : null;
        let customer = { name: booking?.customerName || 'Customer' };
        if (can(req.actor, 'customer.contact') && booking?.userId) {
            const u = await User.findById(booking.userId).select('name phone').lean();
            customer = { name: u?.name || customer.name, phone: u?.phone || '' };
        }

        res.status(200).json({
            success: true,
            data: {
                ...eventSummary(ws, allTasks),
                reportingTime: ws.reportingTime,
                crewRequired: ws.crewRequired,
                transport: ws.transport,
                notes: ws.notes,
                financeClosedAt: ws.financeClosedAt,
                history: can(req.actor, 'events.view') ? ws.history : [],
                readinessUpdateSentAt: ws.readiness?.updateSentAt,
                finalConfirmedAt: ws.readiness?.finalConfirmedAt,
                finalConfirmedBy: ws.readiness?.finalConfirmedBy,
                canConfirmReady: ops.allMandatoryVerified(allTasks),
                customerUpdates: can(req.actor, 'events.view') ? (ws.customerUpdates || []).slice().reverse() : [],
                customer,
                guestCount: booking?.guestCount || 0,
                bookingNotes: booking?.notes || '',
                quoteItems: (booking?.quoteSnapshot?.items || []).map(i => ({ service: i.service, description: i.description, quantity: i.quantity, ...(finance ? { amount: i.amount } : {}) })),
                tasks,
                reservations,
                stockNeeds: needs,
                gatePasses,
                purchases,
                packages: packages.map(p => (finance ? p : { ...p, agreedAmount: undefined, advancePaid: undefined })),
                shifts: shifts.map(s => (finance ? s : { ...s, amount: undefined })),
                changeRequests: changeRequests.map(c => (finance ? c : { ...c, amount: undefined })),
                members,
                pnl,
                risks: can(req.actor, 'events.view')
                    ? risksFor({ ws, tasks: allTasks, reservations, needs, purchases, packages, shifts, changeRequests, pnl })
                    : [],
                permissions: {
                    manage: can(req.actor, 'tasks.manage'),
                    verify: can(req.actor, 'tasks.verify'),
                    finance,
                    stock: can(req.actor, 'stock.manage'),
                    gatepass: can(req.actor, 'gatepass.manage'),
                    attendance: can(req.actor, 'attendance.manage'),
                    owner: req.actor.kind === 'owner'
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update event plan: crew needed, end date, reporting time, transport, notes, operational status
// @route   PUT /api/ops/events/:id
exports.updateEvent = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return notFound(res);
        const { crewRequired, eventEndDate, reportingTime, transport, notes, opsStatus } = req.body || {};
        const set = {};
        if (crewRequired !== undefined) set.crewRequired = Math.max(0, Math.round(Number(crewRequired) || 0));
        if (eventEndDate !== undefined) {
            const end = eventEndDate ? new Date(eventEndDate) : null;
            if (end && (isNaN(end) || end < ops.dayStart(ws.eventDate))) return res.status(400).json({ success: false, message: 'End date must be on or after the event date' });
            set.eventEndDate = end;
        }
        if (reportingTime !== undefined) set.reportingTime = String(reportingTime).slice(0, 40);
        if (notes !== undefined) set.notes = String(notes).slice(0, 3000);
        if (Array.isArray(transport)) {
            set.transport = transport.slice(0, 20).map(t => ({
                vehicle: String(t.vehicle || '').slice(0, 60).toUpperCase(),
                driverMemberId: isId(t.driverMemberId) ? t.driverMemberId : null,
                loadingTime: String(t.loadingTime || '').slice(0, 40),
                notes: String(t.notes || '').slice(0, 300)
            }));
        }
        if (opsStatus !== undefined) {
            if (!['Planning', 'In Progress', 'Completed'].includes(opsStatus)) return res.status(400).json({ success: false, message: 'Invalid status' });
            set.opsStatus = opsStatus;
        }
        await EventWorkspace.updateOne({ _id: ws._id }, {
            $set: set,
            $push: { history: { action: `Updated ${Object.keys(set).join(', ')}`, by: req.actor.name } }
        });
        // Re-fit stock reservations to a changed date range
        if (set.eventEndDate !== undefined) {
            const { from, to } = ops.reservationWindow({ ...ws, ...set });
            await StockReservation.updateMany({ workspaceId: ws._id, status: 'Reserved' }, { $set: { fromDate: from, toDate: to } });
        }
        res.status(200).json({ success: true, message: 'Event updated' });
    } catch (err) {
        next(err);
    }
};

// @desc    Draft checklist from the confirmed quotation (owner reviews and assigns)
// @route   POST /api/ops/events/:id/generate-checklist
exports.generateChecklist = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return notFound(res);
        const result = await ops.generateChecklist(ws, req.actor.name);
        if (result.alreadyGenerated) return res.status(400).json({ success: false, message: 'The checklist was already generated for this event' });
        res.status(201).json({ success: true, message: `${result.created} tasks drafted from the quotation. Review and assign them.` });
    } catch (err) {
        next(err);
    }
};

// @desc    Event memory: copy tasks, quantities and stock needs from an earlier event
// @route   POST /api/ops/events/:id/copy-plan   body: { fromEventId }
exports.copyPlan = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        const from = await loadWorkspace(req, req.body?.fromEventId);
        if (!ws || !from) return notFound(res);
        if (String(ws._id) === String(from._id)) return res.status(400).json({ success: false, message: 'Choose a different event' });
        const n = await ops.copyPlan(from, ws, req.actor.name);
        await EventWorkspace.updateOne({ _id: ws._id }, { $push: { history: { action: `Copied ${n} tasks from ${from.title}`, by: req.actor.name } } });
        res.status(201).json({ success: true, message: `${n} tasks copied. Adjust them for this customer.` });
    } catch (err) {
        next(err);
    }
};

// @desc    Final confirmation to the customer: only when every mandatory task is verified
// @route   POST /api/ops/events/:id/confirm-ready
exports.confirmReady = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return notFound(res);
        if (ws.readiness?.finalConfirmedAt) return res.status(400).json({ success: false, message: 'Readiness was already confirmed' });
        const tasks = await WorkspaceTask.find({ workspaceId: ws._id }).select('status mandatory title').lean();
        if (!ops.allMandatoryVerified(tasks)) {
            const left = tasks.filter(t => t.mandatory && t.status !== 'Verified');
            return res.status(400).json({
                success: false,
                message: left.length ? `${left.length} mandatory task(s) are not verified yet` : 'Add and verify the event tasks first',
                data: { pending: left.slice(0, 10).map(t => t.title) }
            });
        }
        await EventWorkspace.updateOne({ _id: ws._id }, {
            $set: { 'readiness.finalConfirmedAt': new Date(), 'readiness.finalConfirmedBy': req.actor.name, opsStatus: 'Ready' },
            $push: { history: { action: 'Readiness confirmed to the customer', by: req.actor.name } }
        });
        const sent = await ops.sendOrQueueCustomerUpdate(ws, {
            kind: 'ready',
            title: 'Your event is ready',
            message: `Everything for your ${ws.eventType} on ${ops.formatDate(ws.eventDate)} has been checked and is ready. Confirmed by ${req.vendor.businessName}.`,
            actor: req.actor
        });
        res.status(200).json({ success: true, message: sent === 'Sent' ? 'Customer told the event is ready' : 'Ready. The update to the customer is waiting for the owner\'s review.' });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------------------------

const cleanTask = (body) => {
    const out = {};
    if (body.title !== undefined) out.title = String(body.title).trim().slice(0, 200);
    if (body.description !== undefined) out.description = String(body.description).slice(0, 2000);
    if (body.quantity !== undefined) out.quantity = Math.max(0, Number(body.quantity) || 0);
    if (body.unit !== undefined) out.unit = String(body.unit).slice(0, 20);
    if (body.deadline !== undefined) out.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.mandatory !== undefined) out.mandatory = Boolean(body.mandatory);
    if (body.purchaseNeeded !== undefined) out.purchaseNeeded = Boolean(body.purchaseNeeded);
    if (Array.isArray(body.referenceMedia)) out.referenceMedia = body.referenceMedia.filter(u => /^https?:\/\//.test(u)).slice(0, 10);
    if (Array.isArray(body.requiredStock)) {
        out.requiredStock = body.requiredStock.filter(r => isId(r.inventoryId))
            .map(r => ({ inventoryId: r.inventoryId, quantity: Math.max(0, Number(r.quantity) || 0) })).slice(0, 30);
    }
    return out;
};

async function checkAssignee(req, memberId) {
    if (memberId === null || memberId === '') return { ok: true, value: null };
    if (!isId(memberId)) return { ok: false };
    const m = await TeamMember.findOne({ _id: memberId, vendorId: req.vendor._id, isActive: true }).select('_id').lean();
    return m ? { ok: true, value: m._id } : { ok: false };
}

// @route   POST /api/ops/events/:id/tasks
exports.createTask = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return notFound(res);
        const data = cleanTask(req.body || {});
        if (!data.title) return res.status(400).json({ success: false, message: 'Task name is required' });
        const assignee = await checkAssignee(req, req.body.assigneeMemberId ?? null);
        if (!assignee.ok) return res.status(400).json({ success: false, message: 'Choose a member of your team' });
        const count = await WorkspaceTask.countDocuments({ workspaceId: ws._id });
        const task = await WorkspaceTask.create({
            ...data,
            workspaceId: ws._id,
            vendorId: req.vendor._id,
            assigneeMemberId: assignee.value,
            status: assignee.value ? 'Assigned' : 'Not started',
            order: count,
            history: [{ status: assignee.value ? 'Assigned' : 'Not started', by: req.actor.name }]
        });
        res.status(201).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
};

// @route   PUT /api/ops/tasks/:taskId   (details and assignment)
exports.updateTask = async (req, res, next) => {
    try {
        if (!isId(req.params.taskId)) return res.status(400).json({ success: false, message: 'Invalid task' });
        const task = await WorkspaceTask.findOne({ _id: req.params.taskId, vendorId: req.vendor._id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        Object.assign(task, cleanTask(req.body || {}));
        if (req.body.assigneeMemberId !== undefined) {
            const assignee = await checkAssignee(req, req.body.assigneeMemberId);
            if (!assignee.ok) return res.status(400).json({ success: false, message: 'Choose a member of your team' });
            const changed = String(task.assigneeMemberId || '') !== String(assignee.value || '');
            task.assigneeMemberId = assignee.value;
            // A new person must acknowledge the task again
            if (changed && !['Completed', 'Verified'].includes(task.status)) {
                task.status = assignee.value ? 'Assigned' : 'Not started';
                task.history.push({ status: task.status, note: 'Reassigned', by: req.actor.name });
            }
        }
        await task.save();
        res.status(200).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
};

// @route   DELETE /api/ops/tasks/:taskId
exports.deleteTask = async (req, res, next) => {
    try {
        if (!isId(req.params.taskId)) return res.status(400).json({ success: false, message: 'Invalid task' });
        const task = await WorkspaceTask.findOneAndDelete({ _id: req.params.taskId, vendorId: req.vendor._id, status: { $ne: 'Verified' } });
        if (!task) return res.status(400).json({ success: false, message: 'Task not found or already verified' });
        await EventWorkspace.updateOne({ _id: task.workspaceId }, { $push: { history: { action: `Deleted task "${task.title}"`, by: req.actor.name } } });
        res.status(200).json({ success: true, message: 'Task deleted' });
    } catch (err) {
        next(err);
    }
};

// Who may move a task to which status
const ASSIGNEE_MOVES = ['Accepted', 'In progress', 'Blocked', 'Completed'];

// @route   POST /api/ops/tasks/:taskId/status   body: { status, note, photos }
exports.setTaskStatus = async (req, res, next) => {
    try {
        if (!isId(req.params.taskId)) return res.status(400).json({ success: false, message: 'Invalid task' });
        const { status, note = '', photos = [] } = req.body || {};
        if (!WorkspaceTask.STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
        const task = await WorkspaceTask.findOne({ _id: req.params.taskId, vendorId: req.vendor._id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        const isAssignee = req.member && String(task.assigneeMemberId) === String(req.member._id);
        const manager = can(req.actor, 'tasks.manage');
        if (status === 'Verified') {
            if (!can(req.actor, 'tasks.verify')) return res.status(403).json({ success: false, message: 'Only a supervisor or the owner can verify' });
            if (task.status !== 'Completed') return res.status(400).json({ success: false, message: 'Only a completed task can be verified' });
            if (isAssignee && req.actor.kind !== 'owner') return res.status(400).json({ success: false, message: 'Someone else must verify your own task' });
        } else if (!manager && !(isAssignee && ASSIGNEE_MOVES.includes(status))) {
            return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you' });
        }
        if (status === 'Blocked' && !String(note).trim()) return res.status(400).json({ success: false, message: 'Say what is blocking the task' });

        const now = new Date();
        task.status = status;
        if (status === 'Blocked') task.blockedReason = String(note).slice(0, 500);
        if (status === 'Completed') {
            task.completedAt = now;
            task.completedBy = req.actor.name;
            task.completionPhotos = [...task.completionPhotos, ...(Array.isArray(photos) ? photos.filter(u => /^https?:\/\//.test(u)) : [])].slice(0, 10);
        }
        if (status === 'Verified') {
            task.verifiedAt = now;
            task.verifiedBy = req.actor.name;
        }
        task.history.push({ status, note: String(note).slice(0, 500), by: req.actor.name, at: now });
        await task.save();

        if (status === 'Blocked') {
            await ops.notifyVendor(req.vendor._id, `Task blocked: "${task.title}" - ${task.blockedReason}`);
        }
        await ops.maybeSendReadinessUpdate(task.workspaceId);
        res.status(200).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
};

// @desc    Tasks assigned to the logged-in team member, across events
// @route   GET /api/ops/my/tasks
exports.myTasks = async (req, res, next) => {
    try {
        if (!req.member) return res.status(200).json({ success: true, data: [] });
        const tasks = await WorkspaceTask.find({ assigneeMemberId: req.member._id, status: { $ne: 'Verified' } })
            .populate('workspaceId', 'title eventDate venue reportingTime opsStatus')
            .populate('requiredStock.inventoryId', 'itemName unit')
            .sort('deadline').limit(200).lean();
        res.status(200).json({ success: true, data: tasks.filter(t => t.workspaceId && t.workspaceId.opsStatus !== 'Cancelled') });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Change requests (extra work after confirmation)
// ---------------------------------------------------------------------------------------------

// @route   POST /api/ops/events/:id/change-requests   body: { title, description, amount }
exports.createChangeRequest = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return notFound(res);
        const title = String(req.body?.title || '').trim();
        if (!title) return res.status(400).json({ success: false, message: 'Describe the extra work' });
        const amount = Math.max(0, Math.round(Number(req.body?.amount) || 0));
        const cr = await ChangeRequest.create({
            workspaceId: ws._id, vendorId: req.vendor._id, bookingId: ws.bookingId, userId: ws.userId,
            title: title.slice(0, 200), description: String(req.body?.description || '').slice(0, 2000), amount, createdBy: req.actor.name
        });
        await ops.notifyCustomer(ws, 'Please approve a change to your event',
            `${req.vendor.businessName} proposed: "${cr.title}"${amount ? ` for ₹${amount.toLocaleString('en-IN')}` : ''}. Review it in your event page.`);
        res.status(201).json({ success: true, data: cr, message: 'Sent to the customer for approval' });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/ops/change-requests/:crId/withdraw
exports.withdrawChangeRequest = async (req, res, next) => {
    try {
        if (!isId(req.params.crId)) return res.status(400).json({ success: false, message: 'Invalid request' });
        const cr = await ChangeRequest.findOneAndUpdate(
            { _id: req.params.crId, vendorId: req.vendor._id, status: 'Pending' },
            { $set: { status: 'Withdrawn', respondedAt: new Date() } },
            { new: true }
        );
        if (!cr) return res.status(400).json({ success: false, message: 'Only a pending request can be withdrawn' });
        res.status(200).json({ success: true, data: cr });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Customer updates (owner review)
// ---------------------------------------------------------------------------------------------

// @desc    Operations preferences
// @route   GET /api/ops/settings  |  PUT /api/ops/settings  body: { reviewCustomerUpdates }
exports.getSettings = async (req, res, next) => {
    try {
        const v = await Vendor.findById(req.vendor._id).select('opsSettings').lean();
        res.status(200).json({ success: true, data: { reviewCustomerUpdates: Boolean(v?.opsSettings?.reviewCustomerUpdates) } });
    } catch (err) {
        next(err);
    }
};
exports.updateSettings = async (req, res, next) => {
    try {
        const review = Boolean(req.body?.reviewCustomerUpdates);
        await Vendor.updateOne({ _id: req.vendor._id }, { $set: { 'opsSettings.reviewCustomerUpdates': review } });
        res.status(200).json({ success: true, data: { reviewCustomerUpdates: review }, message: review ? 'Customer updates will wait for your review' : 'Customer updates go out straight away' });
    } catch (err) {
        next(err);
    }
};

// @desc    Owner sends their own update to the customer
// @route   POST /api/ops/events/:id/customer-updates   body: { title, message }
exports.sendCustomerUpdate = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return notFound(res);
        if (!ws.userId) return res.status(400).json({ success: false, message: 'This booking has no customer account to notify' });
        const title = String(req.body?.title || '').trim().slice(0, 120);
        const message = String(req.body?.message || '').trim().slice(0, 1000);
        if (!title || message.length < 5) return res.status(400).json({ success: false, message: 'Write a title and a message' });
        await ops.sendOrQueueCustomerUpdate(ws, { kind: 'custom', title, message, actor: req.actor });
        res.status(201).json({ success: true, message: 'Update sent to the customer' });
    } catch (err) {
        next(err);
    }
};

// @desc    Approve (optionally edited) or discard a held update
// @route   POST /api/ops/events/:id/customer-updates/:uid   body: { action: 'send'|'discard', title?, message? }
exports.decideCustomerUpdate = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return notFound(res);
        if (!isId(req.params.uid)) return notFound(res);
        const update = (ws.customerUpdates || []).find(u => String(u._id) === req.params.uid);
        if (!update) return res.status(404).json({ success: false, message: 'Update not found' });
        if (update.status !== 'Pending') return res.status(400).json({ success: false, message: `Already ${update.status.toLowerCase()}` });
        const action = req.body?.action === 'discard' ? 'discard' : 'send';
        const title = req.body?.title !== undefined ? String(req.body.title).trim().slice(0, 120) : update.title;
        const message = req.body?.message !== undefined ? String(req.body.message).trim().slice(0, 1000) : update.message;
        if (action === 'send' && (!title || message.length < 5)) return res.status(400).json({ success: false, message: 'Write a title and a message' });

        // Claim it atomically so a double click cannot send twice
        const claimed = await EventWorkspace.updateOne(
            { _id: ws._id, customerUpdates: { $elemMatch: { _id: update._id, status: 'Pending' } } },
            { $set: {
                'customerUpdates.$.status': action === 'send' ? 'Sent' : 'Discarded',
                'customerUpdates.$.title': title,
                'customerUpdates.$.message': message,
                'customerUpdates.$.decidedBy': req.actor.name,
                'customerUpdates.$.decidedAt': new Date()
            } }
        );
        if (!claimed.modifiedCount) return res.status(409).json({ success: false, message: 'Someone already handled this update' });
        if (action === 'send') await ops.notifyCustomer(ws, title, message);
        res.status(200).json({ success: true, message: action === 'send' ? 'Sent to the customer' : 'Discarded' });
    } catch (err) {
        next(err);
    }
};
