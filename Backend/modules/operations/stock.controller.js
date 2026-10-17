const mongoose = require('mongoose');
const Inventory = require('../vendor/Inventory');
const StockReservation = require('./StockReservation');
const StockMovement = require('./StockMovement');
const GatePass = require('./GatePass');
const ShortageRecord = require('./ShortageRecord');
const PurchaseRequest = require('./PurchaseRequest');
const OpsExpense = require('./OpsExpense');
const EventWorkspace = require('./EventWorkspace');
const { can } = require('./opsAuth');
const { loadWorkspace } = require('./events.controller');
const ops = require('../../services/operations.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const int = (v, min = 0) => Math.max(min, Math.round(Number(v) || 0));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

/** GP-202611-4821 style numbers, unique per vendor. */
async function nextNumber(Model, vendorId, prefix) {
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    for (let i = 0; i < 6; i++) {
        const number = `${prefix}-${ym}-${Math.floor(1000 + Math.random() * 9000)}`;
        if (!(await Model.exists({ vendorId, number }))) return number;
    }
    return `${prefix}-${ym}-${Date.now().toString().slice(-6)}`;
}

// ---------------------------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------------------------

// @desc    Stock items with owned / reserved / missing / available for a date range
// @route   GET /api/ops/stock?from=&to=
exports.listStock = async (req, res, next) => {
    try {
        const items = await Inventory.find({ vendor: req.vendor._id }).sort('itemName').lean();
        const from = req.query.from ? ops.dayStart(req.query.from) : ops.dayStart(new Date());
        const to = req.query.to ? ops.dayEnd(req.query.to) : ops.dayEnd(from);
        const avail = await ops.availabilityFor(items.map(i => i._id), from, to);
        const finance = can(req.actor, 'finance.view');
        const openShortages = await ShortageRecord.countDocuments({ vendorId: req.vendor._id, status: 'Open' });
        res.status(200).json({
            success: true,
            data: items.map(i => ({
                _id: i._id,
                itemName: i.itemName,
                itemCode: i.itemCode,
                unit: i.unit || 'pcs',
                stockType: i.stockType || 'Reusable',
                storageLocation: i.storageLocation,
                condition: i.condition || 'Good',
                reorderLevel: i.reorderLevel || 0,
                image: i.images?.[0] || null,
                ...(finance ? { unitCost: i.unitCost || 0 } : {}),
                ...(avail.get(String(i._id)) || { owned: i.totalQuantity || 0, reserved: 0, unavailable: 0, available: i.totalQuantity || 0 }),
                lowStock: (i.reorderLevel || 0) > 0 && (i.totalQuantity || 0) <= i.reorderLevel
            })),
            meta: { from, to, openShortages }
        });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/ops/stock
// Item codes are what the packing scanner reads, so each code belongs to one item per vendor
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const byCode = (vendorId, code) => ({ vendor: vendorId, itemCode: new RegExp(`^${escapeRegex(code)}$`, 'i') });
const codeTaken = async (vendorId, code, exceptId = null) => Boolean(code) && Boolean(await Inventory.exists({
    ...byCode(vendorId, code),
    ...(exceptId ? { _id: { $ne: exceptId } } : {})
}));

exports.createStockItem = async (req, res, next) => {
    try {
        const b = req.body || {};
        const name = String(b.itemName || '').trim();
        if (!name) return bad(res, 'Item name is required');
        const code = String(b.itemCode || '').trim().slice(0, 40);
        if (await codeTaken(req.vendor._id, code)) return bad(res, `Item code ${code} is already used by another item`);
        const qty = int(b.totalQuantity);
        const item = await Inventory.create({
            vendor: req.vendor._id,
            itemName: name.slice(0, 120),
            itemCode: String(b.itemCode || '').trim().slice(0, 40),
            unit: String(b.unit || 'pcs').slice(0, 20),
            stockType: b.stockType === 'Consumable' ? 'Consumable' : 'Reusable',
            storageLocation: String(b.storageLocation || '').slice(0, 80),
            condition: ['Good', 'Needs repair', 'Damaged'].includes(b.condition) ? b.condition : 'Good',
            reorderLevel: int(b.reorderLevel),
            unitCost: int(b.unitCost),
            totalQuantity: qty,
            availableQuantity: qty,
            pricePerUnit: 0,
            description: String(b.description || '').slice(0, 500)
        });
        if (qty) await ops.recordMovement({ vendorId: req.vendor._id, inventoryId: item._id, type: 'Opening', ownedChange: qty, quantity: qty, by: req.actor.name });
        res.status(201).json({ success: true, data: item });
    } catch (err) {
        next(err);
    }
};

// @desc    Edit item details (quantity changes go through /adjust so they are recorded)
// @route   PUT /api/ops/stock/:itemId
exports.updateStockItem = async (req, res, next) => {
    try {
        if (!isId(req.params.itemId)) return bad(res, 'Invalid item');
        const b = req.body || {};
        const set = {};
        if (b.itemName !== undefined) set.itemName = String(b.itemName).trim().slice(0, 120);
        if (b.itemCode !== undefined) set.itemCode = String(b.itemCode).trim().slice(0, 40);
        if (b.unit !== undefined) set.unit = String(b.unit).slice(0, 20);
        if (b.stockType !== undefined) set.stockType = b.stockType === 'Consumable' ? 'Consumable' : 'Reusable';
        if (b.storageLocation !== undefined) set.storageLocation = String(b.storageLocation).slice(0, 80);
        if (b.condition !== undefined && ['Good', 'Needs repair', 'Damaged'].includes(b.condition)) set.condition = b.condition;
        if (b.reorderLevel !== undefined) set.reorderLevel = int(b.reorderLevel);
        if (b.unitCost !== undefined && can(req.actor, 'finance.view')) set.unitCost = int(b.unitCost);
        if (set.itemName === '') return bad(res, 'Item name is required');
        if (set.itemCode && await codeTaken(req.vendor._id, set.itemCode, req.params.itemId)) return bad(res, `Item code ${set.itemCode} is already used by another item`);
        const item = await Inventory.findOneAndUpdate({ _id: req.params.itemId, vendor: req.vendor._id }, { $set: set }, { new: true });
        if (!item) return bad(res, 'Item not found', 404);
        res.status(200).json({ success: true, data: item });
    } catch (err) {
        next(err);
    }
};

// @desc    Correct the owned quantity (stock count, found items) with a reason
// @route   POST /api/ops/stock/:itemId/adjust   body: { change, note }
exports.adjustStock = async (req, res, next) => {
    try {
        if (!isId(req.params.itemId)) return bad(res, 'Invalid item');
        const change = Math.round(Number(req.body?.change) || 0);
        const note = String(req.body?.note || '').trim();
        if (!change) return bad(res, 'Enter how many to add or remove');
        if (!note) return bad(res, 'Give a reason for the adjustment');
        const item = await Inventory.findOneAndUpdate(
            { _id: req.params.itemId, vendor: req.vendor._id, totalQuantity: { $gte: change < 0 ? -change : 0 } },
            { $inc: { totalQuantity: change, availableQuantity: change } },
            { new: true }
        );
        if (!item) return bad(res, 'Item not found or not enough stock to remove');
        if (item.availableQuantity < 0) await Inventory.updateOne({ _id: item._id }, { $set: { availableQuantity: 0 } });
        await ops.recordMovement({ vendorId: req.vendor._id, inventoryId: item._id, type: 'Adjustment', ownedChange: change, quantity: Math.abs(change), note, by: req.actor.name });
        res.status(200).json({ success: true, data: item });
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/ops/stock/:itemId/movements
exports.stockMovements = async (req, res, next) => {
    try {
        if (!isId(req.params.itemId)) return bad(res, 'Invalid item');
        const item = await Inventory.findOne({ _id: req.params.itemId, vendor: req.vendor._id }).select('itemName unit totalQuantity').lean();
        if (!item) return bad(res, 'Item not found', 404);
        const [movements, reservations] = await Promise.all([
            StockMovement.find({ inventoryId: item._id }).sort('-at').limit(200).populate('workspaceId', 'title eventDate').lean(),
            StockReservation.find({ inventoryId: item._id, status: 'Reserved', toDate: { $gte: new Date() } }).populate('workspaceId', 'title eventDate').sort('fromDate').lean()
        ]);
        res.status(200).json({ success: true, data: { item, movements, reservations } });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Reservations: stock is reserved before it is promised to an event
// ---------------------------------------------------------------------------------------------

// @route   POST /api/ops/events/:id/reservations   body: { inventoryId, quantity }
exports.reserveStock = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return bad(res, 'Event not found', 404);
        if (ws.opsStatus === 'Cancelled') return bad(res, 'This event is cancelled');
        const { inventoryId } = req.body || {};
        const quantity = int(req.body?.quantity, 0);
        if (!isId(inventoryId) || quantity < 1) return bad(res, 'Choose an item and a quantity');
        const item = await Inventory.findOne({ _id: inventoryId, vendor: req.vendor._id }).select('itemName unit').lean();
        if (!item) return bad(res, 'Item not found', 404);
        const { from, to } = ops.reservationWindow(ws);
        const avail = (await ops.availabilityFor([inventoryId], from, to)).get(String(inventoryId));
        if (!avail || avail.available < quantity) {
            return res.status(409).json({
                success: false,
                message: `Only ${avail?.available || 0} ${item.unit || ''} of ${item.itemName} are free for these dates (${avail?.reserved || 0} reserved for other events, ${avail?.unavailable || 0} missing/damaged). Raise a purchase request for the rest.`,
                data: avail
            });
        }
        const reservation = await StockReservation.create({
            vendorId: req.vendor._id, inventoryId, workspaceId: ws._id, quantity, fromDate: from, toDate: to, createdBy: req.actor.name
        });
        res.status(201).json({ success: true, data: reservation });
    } catch (err) {
        next(err);
    }
};

// @route   DELETE /api/ops/reservations/:rid
exports.releaseReservation = async (req, res, next) => {
    try {
        if (!isId(req.params.rid)) return bad(res, 'Invalid reservation');
        const r = await StockReservation.findOneAndUpdate(
            { _id: req.params.rid, vendorId: req.vendor._id, status: 'Reserved' },
            { $set: { status: 'Released' } },
            { new: true }
        );
        if (!r) return bad(res, 'Reservation not found', 404);
        res.status(200).json({ success: true, message: 'Released' });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Gate passes
// ---------------------------------------------------------------------------------------------

// @route   POST /api/ops/events/:id/gatepasses
exports.createGatePass = async (req, res, next) => {
    try {
        const ws = await loadWorkspace(req, req.params.id);
        if (!ws) return bad(res, 'Event not found', 404);
        const b = req.body || {};
        const lines = (Array.isArray(b.items) ? b.items : []).filter(l => isId(l.inventoryId) && int(l.qtyOut) > 0);
        if (lines.length === 0) return bad(res, 'Add at least one item and quantity');
        const items = await Inventory.find({ _id: { $in: lines.map(l => l.inventoryId) }, vendor: req.vendor._id }).select('itemName stockType').lean();
        const byId = new Map(items.map(i => [String(i._id), i]));
        if (byId.size !== new Set(lines.map(l => String(l.inventoryId))).size) return bad(res, 'Some items were not found');

        const pass = await GatePass.create({
            vendorId: req.vendor._id,
            workspaceId: ws._id,
            number: await nextNumber(GatePass, req.vendor._id, 'GP'),
            destination: String(b.destination || ws.venue || '').slice(0, 300),
            vehicleNumber: String(b.vehicleNumber || '').slice(0, 20),
            driverName: String(b.driverName || '').slice(0, 80),
            driverMemberId: isId(b.driverMemberId) ? b.driverMemberId : null,
            trip: int(b.trip, 1) || 1,
            returnDueDate: b.returnDueDate ? new Date(b.returnDueDate) : new Date(new Date(ws.eventEndDate || ws.eventDate).getTime() + ops.DAY_MS),
            notes: String(b.notes || '').slice(0, 1000),
            items: lines.map(l => {
                const i = byId.get(String(l.inventoryId));
                return { inventoryId: i._id, name: i.itemName, stockType: i.stockType || 'Reusable', qtyOut: int(l.qtyOut) };
            })
        });
        res.status(201).json({ success: true, data: pass });
    } catch (err) {
        next(err);
    }
};

async function ownedPass(req) {
    if (!isId(req.params.gid)) return null;
    return GatePass.findOne({ _id: req.params.gid, vendorId: req.vendor._id });
}

// @desc    Packing checklist (scan or tick each line)
// @route   POST /api/ops/gatepasses/:gid/pack   body: { index, packed }  or  { code } (item code scanned)
exports.packGatePass = async (req, res, next) => {
    try {
        const pass = await ownedPass(req);
        if (!pass) return bad(res, 'Gate pass not found', 404);
        if (pass.status !== 'Draft') return bad(res, 'This gate pass has already left');
        let index = Number(req.body?.index);
        if (req.body?.code) {
            const code = String(req.body.code).trim().slice(0, 40);
            const item = await Inventory.findOne(byCode(req.vendor._id, code)).select('_id itemName').lean();
            if (!item) return bad(res, `No stock item has the code ${code}`);
            index = pass.items.findIndex(l => String(l.inventoryId) === String(item._id));
            if (index < 0) return bad(res, `${item.itemName} is not on this gate pass`);
            if (pass.items[index].packed && req.body?.packed !== false) {
                return res.status(200).json({ success: true, data: pass, message: `${pass.items[index].name} was already packed` });
            }
        }
        if (!pass.items[index]) return bad(res, 'Invalid line');
        pass.items[index].packed = req.body?.packed !== false;
        await pass.save();
        const done = pass.items.filter(l => l.packed).length;
        res.status(200).json({
            success: true,
            data: pass,
            message: `${pass.items[index].name} ${pass.items[index].packed ? 'packed' : 'unpacked'} (${done}/${pass.items.length})`
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Material leaves the godown. Reusable items need a reservation for this event.
// @route   POST /api/ops/gatepasses/:gid/dispatch
exports.dispatchGatePass = async (req, res, next) => {
    try {
        const pass = await ownedPass(req);
        if (!pass) return bad(res, 'Gate pass not found', 404);
        if (pass.status !== 'Draft') return bad(res, 'Already dispatched');
        if (pass.items.some(l => !l.packed)) return bad(res, 'Tick every line on the packing checklist first');
        if (!pass.vehicleNumber) return bad(res, 'Enter the vehicle number');

        // Reusable stock cannot leave beyond what is reserved for the event (minus what is already out)
        const reservations = await StockReservation.find({ workspaceId: pass.workspaceId, status: 'Reserved' }).lean();
        const outAlready = await GatePass.find({ workspaceId: pass.workspaceId, _id: { $ne: pass._id }, status: { $in: ['Dispatched', 'Received'] } }).lean();
        for (const l of pass.items.filter(x => x.stockType === 'Reusable')) {
            const reserved = reservations.filter(r => String(r.inventoryId) === String(l.inventoryId)).reduce((s, r) => s + r.quantity, 0);
            const out = outAlready.flatMap(p => p.items).filter(x => String(x.inventoryId) === String(l.inventoryId)).reduce((s, x) => s + x.qtyOut, 0);
            if (l.qtyOut > reserved - out) {
                return bad(res, `${l.name}: only ${Math.max(0, reserved - out)} reserved for this event. Reserve stock before dispatching.`);
            }
        }
        pass.status = 'Dispatched';
        pass.issuedBy = req.actor.name;
        pass.issuedAt = new Date();
        await pass.save();
        for (const l of pass.items) {
            await ops.recordMovement({ vendorId: req.vendor._id, inventoryId: l.inventoryId, type: 'Dispatch', quantity: l.qtyOut, workspaceId: pass.workspaceId, ref: pass.number, by: req.actor.name });
        }
        res.status(200).json({ success: true, data: pass, message: 'Dispatched' });
    } catch (err) {
        next(err);
    }
};

// @desc    Driver / supervisor confirms the material reached the venue
// @route   POST /api/ops/gatepasses/:gid/receive
exports.receiveGatePass = async (req, res, next) => {
    try {
        const pass = await ownedPass(req);
        if (!pass) return bad(res, 'Gate pass not found', 404);
        if (pass.status !== 'Dispatched') return bad(res, 'Only a dispatched gate pass can be received');
        pass.status = 'Received';
        pass.receivedBy = req.actor.name;
        pass.receivedAt = new Date();
        if (Array.isArray(req.body?.photos)) pass.photos.push(...req.body.photos.filter(u => /^https?:\/\//.test(u)).slice(0, 10));
        await pass.save();
        res.status(200).json({ success: true, data: pass });
    } catch (err) {
        next(err);
    }
};

// @desc    Stock comes back. Reusable items not returned open a shortage record (the balance is not
//          reduced silently); consumables used up are taken off the stock.
// @route   POST /api/ops/gatepasses/:gid/return   body: { items: [{ index, qtyReturned, qtyDamaged }], photos }
exports.returnGatePass = async (req, res, next) => {
    try {
        const pass = await ownedPass(req);
        if (!pass) return bad(res, 'Gate pass not found', 404);
        if (!['Dispatched', 'Received'].includes(pass.status)) return bad(res, 'This gate pass is not out');
        const lines = Array.isArray(req.body?.items) ? req.body.items : [];
        const shortages = [];

        for (let i = 0; i < pass.items.length; i++) {
            const l = pass.items[i];
            const input = lines.find(x => Number(x.index) === i) || {};
            const returned = Math.min(l.qtyOut, int(input.qtyReturned));
            const damaged = l.stockType === 'Reusable' ? Math.min(l.qtyOut - returned, int(input.qtyDamaged)) : 0;
            l.qtyReturned = returned;
            l.qtyDamaged = damaged;
            if (l.stockType === 'Reusable') {
                l.qtyMissing = l.qtyOut - returned - damaged;
                if (returned) await ops.recordMovement({ vendorId: req.vendor._id, inventoryId: l.inventoryId, type: 'Return', quantity: returned, workspaceId: pass.workspaceId, ref: pass.number, by: req.actor.name });
                for (const [kind, qty] of [['Missing', l.qtyMissing], ['Damaged', damaged]]) {
                    if (qty <= 0) continue;
                    shortages.push(await ShortageRecord.create({
                        vendorId: req.vendor._id, workspaceId: pass.workspaceId, gatePassId: pass._id,
                        inventoryId: l.inventoryId, itemName: l.name, kind, quantity: qty
                    }));
                    await ops.recordMovement({ vendorId: req.vendor._id, inventoryId: l.inventoryId, type: kind, quantity: qty, workspaceId: pass.workspaceId, ref: pass.number, note: 'Shortage record opened', by: req.actor.name });
                }
            } else {
                l.qtyConsumed = l.qtyOut - returned;
                if (l.qtyConsumed > 0) {
                    await Inventory.updateOne({ _id: l.inventoryId }, { $inc: { totalQuantity: -l.qtyConsumed, availableQuantity: -l.qtyConsumed } });
                    await Inventory.updateOne({ _id: l.inventoryId, totalQuantity: { $lt: 0 } }, { $set: { totalQuantity: 0 } });
                    await Inventory.updateOne({ _id: l.inventoryId, availableQuantity: { $lt: 0 } }, { $set: { availableQuantity: 0 } });
                    await ops.recordMovement({ vendorId: req.vendor._id, inventoryId: l.inventoryId, type: 'Consumed', ownedChange: -l.qtyConsumed, quantity: l.qtyConsumed, workspaceId: pass.workspaceId, ref: pass.number, by: req.actor.name });
                }
            }
        }
        pass.status = shortages.length ? 'Returned' : 'Closed';
        pass.returnedAt = new Date();
        pass.returnCheckedBy = req.actor.name;
        if (Array.isArray(req.body?.photos)) pass.photos.push(...req.body.photos.filter(u => /^https?:\/\//.test(u)).slice(0, 10));
        await pass.save();

        // Reservations for the returned items end once the stock is back, unless another trip
        // of this event still has the same item out
        const stillOut = await GatePass.find({ workspaceId: pass.workspaceId, _id: { $ne: pass._id }, status: { $in: ['Draft', 'Dispatched', 'Received'] } })
            .select('items.inventoryId').lean();
        const busy = new Set(stillOut.flatMap(p => p.items.map(i => String(i.inventoryId))));
        const done = pass.items.map(l => l.inventoryId).filter(id => !busy.has(String(id)));
        if (done.length) {
            await StockReservation.updateMany(
                { workspaceId: pass.workspaceId, inventoryId: { $in: done }, status: 'Reserved' },
                { $set: { status: 'Released' } }
            );
        }

        if (shortages.length) {
            const text = shortages.map(s => `${s.quantity} ${s.itemName} ${s.kind.toLowerCase()}`).join(', ');
            await ops.notifyVendor(req.vendor._id, `Missing return on gate pass ${pass.number}: ${text}. Shortage records opened.`, 'System');
        }
        res.status(200).json({
            success: true,
            data: pass,
            message: shortages.length ? `${shortages.length} shortage record(s) opened` : 'All stock returned'
        });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Shortages
// ---------------------------------------------------------------------------------------------

// @route   GET /api/ops/shortages?status=Open
exports.listShortages = async (req, res, next) => {
    try {
        const query = { vendorId: req.vendor._id };
        if (['Open', 'Recovered', 'WrittenOff'].includes(req.query.status)) query.status = req.query.status;
        const list = await ShortageRecord.find(query).populate('workspaceId', 'title eventDate').populate('gatePassId', 'number vehicleNumber').sort('-createdAt').limit(300).lean();
        res.status(200).json({ success: true, data: list });
    } catch (err) {
        next(err);
    }
};

// @desc    Recovered (stock is back), written off (owned quantity reduced), optionally charging
//          the loss to the event as a Damage expense
// @route   POST /api/ops/shortages/:sid/resolve   body: { action: 'recovered'|'writeoff', note, chargeAmount }
exports.resolveShortage = async (req, res, next) => {
    try {
        if (!isId(req.params.sid)) return bad(res, 'Invalid record');
        const { action, note = '' } = req.body || {};
        if (!['recovered', 'writeoff'].includes(action)) return bad(res, 'Choose recovered or write off');
        const rec = await ShortageRecord.findOneAndUpdate(
            { _id: req.params.sid, vendorId: req.vendor._id, status: 'Open' },
            { $set: { status: action === 'recovered' ? 'Recovered' : 'WrittenOff', resolutionNote: String(note).slice(0, 500), resolvedBy: req.actor.name, resolvedAt: new Date() } },
            { new: true }
        );
        if (!rec) return bad(res, 'Record not found or already resolved', 404);
        if (action === 'recovered') {
            await ops.recordMovement({ vendorId: req.vendor._id, inventoryId: rec.inventoryId, type: 'Recovered', quantity: rec.quantity, workspaceId: rec.workspaceId, note, by: req.actor.name });
        } else {
            await Inventory.updateOne({ _id: rec.inventoryId }, { $inc: { totalQuantity: -rec.quantity } });
            await Inventory.updateOne({ _id: rec.inventoryId, totalQuantity: { $lt: 0 } }, { $set: { totalQuantity: 0 } });
            await ops.recordMovement({ vendorId: req.vendor._id, inventoryId: rec.inventoryId, type: 'WriteOff', ownedChange: -rec.quantity, quantity: rec.quantity, workspaceId: rec.workspaceId, note, by: req.actor.name });
            const charge = int(req.body?.chargeAmount);
            if (charge > 0) {
                await OpsExpense.create({
                    vendorId: req.vendor._id, scope: 'Event', workspaceId: rec.workspaceId, category: 'Damage',
                    description: `${rec.quantity} ${rec.itemName} ${rec.kind.toLowerCase()} (written off)`, amount: charge,
                    paymentMethod: 'Cash', paymentStatus: 'Paid', source: 'shortage', sourceRef: String(rec._id),
                    audit: [{ action: 'Created from shortage write-off', by: req.actor.name }]
                });
            }
        }
        res.status(200).json({ success: true, data: rec });
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Purchase requests
// ---------------------------------------------------------------------------------------------

// @route   GET /api/ops/purchases?status=&eventId=
exports.listPurchases = async (req, res, next) => {
    try {
        const query = { vendorId: req.vendor._id };
        if (req.query.status) query.status = req.query.status;
        if (isId(req.query.eventId)) query.workspaceId = req.query.eventId;
        const seeAll = can(req.actor, 'purchase.record') || can(req.actor, 'events.view');
        if (!seeAll) query.requestedByMemberId = req.member?._id;
        const list = await PurchaseRequest.find(query).populate('workspaceId', 'title eventDate').sort('-createdAt').limit(300).lean();
        const finance = can(req.actor, 'finance.view') || can(req.actor, 'purchase.record');
        res.status(200).json({ success: true, data: finance ? list : list.map(p => ({ ...p, purchase: { ...p.purchase, amount: undefined } })) });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/ops/purchases   body: { eventId, items: [{ inventoryId?, name, quantity, unit, stockType }], reason, neededBy, referencePhoto }
exports.createPurchase = async (req, res, next) => {
    try {
        const b = req.body || {};
        let workspaceId = null;
        if (b.eventId) {
            const ws = await loadWorkspace(req, b.eventId);
            if (!ws) return bad(res, 'Event not found', 404);
            workspaceId = ws._id;
        }
        const items = [];
        for (const raw of Array.isArray(b.items) ? b.items.slice(0, 30) : []) {
            const quantity = int(raw.quantity);
            let name = String(raw.name || '').trim();
            let inventoryId = null;
            let stockType = raw.stockType === 'Reusable' ? 'Reusable' : 'Consumable';
            let unit = String(raw.unit || 'pcs').slice(0, 20);
            if (isId(raw.inventoryId)) {
                const item = await Inventory.findOne({ _id: raw.inventoryId, vendor: req.vendor._id }).select('itemName stockType unit').lean();
                if (item) { inventoryId = item._id; name = item.itemName; stockType = item.stockType || 'Reusable'; unit = item.unit || unit; }
            }
            if (name && quantity > 0) items.push({ inventoryId, name: name.slice(0, 120), quantity, unit, stockType });
        }
        if (items.length === 0) return bad(res, 'Add at least one item with a quantity');
        const pr = await PurchaseRequest.create({
            vendorId: req.vendor._id,
            workspaceId,
            number: await nextNumber(PurchaseRequest, req.vendor._id, 'PR'),
            items,
            reason: String(b.reason || '').slice(0, 1000),
            neededBy: b.neededBy ? new Date(b.neededBy) : null,
            referencePhoto: /^https?:\/\//.test(b.referencePhoto || '') ? b.referencePhoto : '',
            requestedBy: req.actor.name,
            requestedByMemberId: req.member?._id || null,
            // The owner's own purchases do not wait for approval
            status: req.actor.kind === 'owner' ? 'Approved' : 'Requested',
            ...(req.actor.kind === 'owner' ? { decidedBy: req.actor.name, decidedAt: new Date() } : {})
        });
        if (req.actor.kind !== 'owner') {
            await ops.notifyVendor(req.vendor._id, `Purchase request ${pr.number} from ${req.actor.name}: ${items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}`);
        }
        res.status(201).json({ success: true, data: pr });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/ops/purchases/:pid/decide   body: { approve, reason }   (owner)
exports.decidePurchase = async (req, res, next) => {
    try {
        if (!isId(req.params.pid)) return bad(res, 'Invalid request');
        const approve = Boolean(req.body?.approve);
        if (!approve && !String(req.body?.reason || '').trim()) return bad(res, 'Give a reason for rejecting');
        const pr = await PurchaseRequest.findOneAndUpdate(
            { _id: req.params.pid, vendorId: req.vendor._id, status: 'Requested' },
            { $set: { status: approve ? 'Approved' : 'Rejected', decidedBy: req.actor.name, decidedAt: new Date(), rejectionReason: approve ? '' : String(req.body.reason).slice(0, 500) } },
            { new: true }
        );
        if (!pr) return bad(res, 'Request not found or already decided', 404);
        res.status(200).json({ success: true, data: pr });
    } catch (err) {
        next(err);
    }
};

// @desc    Record the actual purchase: supplier, invoice, quantity received, amount.
//          Reusable items enter the stock; the cost is charged to the event (or overheads).
// @route   POST /api/ops/purchases/:pid/record
exports.recordPurchase = async (req, res, next) => {
    try {
        if (!isId(req.params.pid)) return bad(res, 'Invalid request');
        const b = req.body || {};
        const amount = int(b.amount);
        if (!amount) return bad(res, 'Enter the amount paid');
        if (!String(b.supplier || '').trim()) return bad(res, 'Enter the supplier');
        const pr = await PurchaseRequest.findOne({ _id: req.params.pid, vendorId: req.vendor._id, status: 'Approved' });
        if (!pr) return bad(res, 'Only an approved request can be recorded', 404);

        const dup = await ops.findDuplicateExpense(req.vendor._id, { amount, payee: b.supplier, receiptNumber: b.invoiceNumber, date: new Date() });
        if (dup && !b.confirmDuplicate) {
            return res.status(409).json({
                success: false, code: 'POSSIBLE_DUPLICATE',
                message: `This looks like an expense already recorded (${dup.description || 'expense'} ₹${dup.amount.toLocaleString('en-IN')} on ${ops.formatDate(dup.date)}). Send again to confirm.`
            });
        }

        const received = Array.isArray(b.items) ? b.items : [];
        for (let i = 0; i < pr.items.length; i++) {
            const line = pr.items[i];
            const r = received.find(x => Number(x.index) === i);
            line.quantityReceived = r ? int(r.quantityReceived) : line.quantity;
            if (line.quantityReceived <= 0) continue;
            // Purchased stock goes into the godown (both kinds); consumables leave it again when used
            let itemId = line.inventoryId;
            if (!itemId) {
                const created = await Inventory.create({
                    vendor: req.vendor._id, itemName: line.name, unit: line.unit, stockType: line.stockType,
                    totalQuantity: 0, availableQuantity: 0, pricePerUnit: 0, unitCost: Math.round(amount / Math.max(1, pr.items.length) / line.quantityReceived)
                });
                itemId = created._id;
                line.inventoryId = itemId;
            }
            await Inventory.updateOne({ _id: itemId }, { $inc: { totalQuantity: line.quantityReceived, availableQuantity: line.quantityReceived } });
            await ops.recordMovement({ vendorId: req.vendor._id, inventoryId: itemId, type: 'Purchase', ownedChange: line.quantityReceived, quantity: line.quantityReceived, workspaceId: pr.workspaceId, ref: pr.number, by: req.actor.name });
        }

        const expense = await OpsExpense.create({
            vendorId: req.vendor._id,
            scope: pr.workspaceId ? 'Event' : 'Overhead',
            workspaceId: pr.workspaceId,
            category: pr.workspaceId ? 'Materials' : 'Other overhead',
            description: `Purchase ${pr.number}: ${pr.items.map(i => `${i.quantityReceived} ${i.unit} ${i.name}`).join(', ')}`.slice(0, 500),
            amount,
            paymentMethod: ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque', 'Credit (unpaid)'].includes(b.paymentMethod) ? b.paymentMethod : 'Cash',
            paymentStatus: b.paymentMethod === 'Credit (unpaid)' ? 'Unpaid' : 'Paid',
            paidBy: req.actor.name,
            payee: String(b.supplier).trim().slice(0, 120),
            receiptNumber: String(b.invoiceNumber || '').trim().slice(0, 60),
            receiptPhoto: /^https?:\/\//.test(b.invoicePhoto || '') ? b.invoicePhoto : '',
            source: 'purchase',
            sourceRef: pr.number,
            possibleDuplicateOf: dup?._id || null,
            audit: [{ action: `Recorded from purchase ${pr.number}`, by: req.actor.name }]
        });
        pr.status = 'Purchased';
        pr.purchase = {
            supplier: expense.payee, invoiceNumber: expense.receiptNumber, invoicePhoto: expense.receiptPhoto, amount,
            paymentMethod: expense.paymentMethod, purchasedBy: req.actor.name, purchasedAt: new Date(), expenseId: expense._id
        };
        await pr.save();
        res.status(200).json({ success: true, data: pr, message: 'Purchase recorded, stock and event costs updated' });
    } catch (err) {
        next(err);
    }
};

// @desc    Give every item without a code one (ITM-0001, ITM-0002...) so labels can be printed
// @route   POST /api/ops/stock/assign-codes
exports.assignItemCodes = async (req, res, next) => {
    try {
        const all = await Inventory.find({ vendor: req.vendor._id }).select('itemCode').lean();
        const used = new Set(all.map(i => (i.itemCode || '').toUpperCase()).filter(Boolean));
        let n = 1;
        const nextCode = () => {
            let code;
            do { code = `ITM-${String(n++).padStart(4, '0')}`; } while (used.has(code));
            used.add(code);
            return code;
        };
        const writes = all.filter(i => !i.itemCode).map(i => ({
            updateOne: { filter: { _id: i._id, itemCode: { $in: ['', null] } }, update: { $set: { itemCode: nextCode() } } }
        }));
        if (writes.length) await Inventory.bulkWrite(writes);
        res.status(200).json({
            success: true,
            message: writes.length ? `${writes.length} item(s) given a code` : 'Every item already has a code',
            data: { assigned: writes.length }
        });
    } catch (err) {
        next(err);
    }
};

exports.nextNumber = nextNumber;
