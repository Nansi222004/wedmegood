const mongoose = require('mongoose');
const VendorTodo = require('./VendorTodo');

const IST_OFFSET = 330 * 60 * 1000;
const todayIst = () => new Date(Date.now() + IST_OFFSET).toISOString().slice(0, 10);
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const vendorOf = (req) => req.vendor._id || req.vendor.id;
const MAX_OPEN = 100;

// @desc    Today's tasks, plus anything from earlier days that was not finished (so nothing is forgotten)
// @route   GET /api/vendor/todos
exports.listTodos = async (req, res, next) => {
    try {
        const vendorId = vendorOf(req);
        const today = todayIst();
        const [todays, carried] = await Promise.all([
            VendorTodo.find({ vendorId, day: today }).sort('done createdAt').lean(),
            VendorTodo.find({ vendorId, day: { $lt: today }, done: false }).sort('day createdAt').limit(50).lean()
        ]);
        // Finished tasks of earlier days are not shown again
        res.status(200).json({ success: true, data: { today, tasks: [...carried.map(t => ({ ...t, carriedOver: true })), ...todays] } });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a task for today
// @route   POST /api/vendor/todos   body: { text }
exports.createTodo = async (req, res, next) => {
    try {
        const vendorId = vendorOf(req);
        const text = String(req.body?.text || '').trim().slice(0, 200);
        if (!text) return bad(res, 'Write the task');
        if (await VendorTodo.countDocuments({ vendorId, done: false }) >= MAX_OPEN) {
            return bad(res, `You already have ${MAX_OPEN} open tasks. Finish or delete some first.`);
        }
        const todo = await VendorTodo.create({ vendorId, text, day: todayIst() });
        res.status(201).json({ success: true, data: todo });
    } catch (err) {
        next(err);
    }
};

// @desc    Tick or untick a task, or edit its text
// @route   PUT /api/vendor/todos/:id   body: { done?, text? }
exports.updateTodo = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Task not found', 404);
        const set = {};
        if (req.body?.done !== undefined) {
            set.done = Boolean(req.body.done);
            set.doneAt = set.done ? new Date() : null;
        }
        if (req.body?.text !== undefined) {
            const text = String(req.body.text).trim().slice(0, 200);
            if (!text) return bad(res, 'Write the task');
            set.text = text;
        }
        const todo = await VendorTodo.findOneAndUpdate({ _id: req.params.id, vendorId: vendorOf(req) }, { $set: set }, { new: true });
        if (!todo) return bad(res, 'Task not found', 404);
        res.status(200).json({ success: true, data: todo });
    } catch (err) {
        next(err);
    }
};

// @route   DELETE /api/vendor/todos/:id
exports.deleteTodo = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return bad(res, 'Task not found', 404);
        const r = await VendorTodo.deleteOne({ _id: req.params.id, vendorId: vendorOf(req) });
        if (!r.deletedCount) return bad(res, 'Task not found', 404);
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
};
