const crypto = require('crypto');
const Razorpay = require('razorpay');
const FakeVendorListing = require('../admin/FakeVendorListing');
const FakeVendorAccess = require('./FakeVendorAccess');
const { getPublicSettings } = require('../../services/platformSettings.service');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// How long one free view stays open, so reloading the page does not use another view
const FREE_VIEW_WINDOW_MS = 30 * 60 * 1000;

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function describeAccess(access, settings, now = new Date()) {
    const freeViewsUsed = access?.freeViewsUsed || 0;
    const paidUntil = access?.paidUntil || null;
    const viewWindowUntil = access?.viewWindowUntil || null;
    return {
        hasPaidAccess: Boolean(paidUntil && paidUntil > now),
        paidUntil,
        inFreeView: Boolean(viewWindowUntil && viewWindowUntil > now),
        viewWindowUntil,
        freeViewsTotal: settings.fakeVendorFreeViews,
        freeViewsUsed,
        freeViewsLeft: Math.max(0, settings.fakeVendorFreeViews - freeViewsUsed),
        price: settings.fakeVendorAccessPrice,
        accessDays: settings.fakeVendorAccessDays
    };
}

async function findListings(search) {
    const query = { isPublished: true };
    const term = String(search || '').trim();
    if (term) {
        const rx = new RegExp(escapeRegex(term), 'i');
        query.$or = [{ name: rx }, { businessName: rx }, { phone: rx }, { city: rx }, { category: rx }];
    }
    const listings = await FakeVendorListing.find(query)
        .select('name businessName phone city category reason complaintIds createdAt')
        .sort('-createdAt')
        .limit(200)
        .lean();
    return listings.map(({ complaintIds, ...l }) => ({ ...l, complaintCount: (complaintIds || []).length }));
}

// @desc    Access status for the Fake Vendors page
// @route   GET /api/user/fake-vendors/access
// @access  Private (User)
exports.getFakeVendorAccess = async (req, res, next) => {
    try {
        const [settings, access] = await Promise.all([
            getPublicSettings(),
            FakeVendorAccess.findOne({ userId: req.user._id }).lean()
        ]);
        res.status(200).json({ success: true, data: describeAccess(access, settings) });
    } catch (err) {
        next(err);
    }
};

// @desc    Fake vendors list. Uses a free view if the user has no paid access.
// @route   GET /api/user/fake-vendors?search=
// @access  Private (User)
exports.getFakeVendors = async (req, res, next) => {
    try {
        const settings = await getPublicSettings();
        const now = new Date();
        let access = await FakeVendorAccess.findOneAndUpdate(
            { userId: req.user._id },
            { $setOnInsert: { userId: req.user._id } },
            { upsert: true, new: true }
        ).lean();

        let status = describeAccess(access, settings, now);
        if (!status.hasPaidAccess && !status.inFreeView) {
            // Use one free view, only if one is left (checked atomically)
            const used = await FakeVendorAccess.findOneAndUpdate(
                { userId: req.user._id, freeViewsUsed: { $lt: settings.fakeVendorFreeViews } },
                {
                    $inc: { freeViewsUsed: 1 },
                    $set: { viewWindowUntil: new Date(now.getTime() + FREE_VIEW_WINDOW_MS) }
                },
                { new: true }
            ).lean();

            if (!used) {
                return res.status(402).json({
                    success: false,
                    code: 'FAKE_VENDORS_PAYMENT_REQUIRED',
                    message: `You have used your free view. Pay ₹${settings.fakeVendorAccessPrice} to view the fake vendors list for ${settings.fakeVendorAccessDays} days.`,
                    data: { access: status }
                });
            }
            access = used;
            status = describeAccess(access, settings, now);
        }

        const listings = await findListings(req.query.search);
        res.status(200).json({ success: true, data: { listings, access: status } });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a Razorpay order for paid access to the Fake Vendors page
// @route   POST /api/user/fake-vendors/access/order
// @access  Private (User)
exports.createFakeVendorAccessOrder = async (req, res, next) => {
    try {
        const settings = await getPublicSettings();
        const amount = settings.fakeVendorAccessPrice;
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `fva_${req.user._id.toString().slice(-10)}_${Date.now().toString().slice(-8)}`,
            notes: { userId: req.user._id.toString(), purpose: 'fake_vendor_access' }
        });

        await FakeVendorAccess.findOneAndUpdate(
            { userId: req.user._id },
            {
                $set: {
                    pendingOrder: { orderId: order.id, amount, days: settings.fakeVendorAccessDays, createdAt: new Date() }
                }
            },
            { upsert: true }
        );

        res.status(200).json({
            success: true,
            data: { order, key: process.env.RAZORPAY_KEY_ID, amount, days: settings.fakeVendorAccessDays }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Verify the Razorpay payment and grant paid access
// @route   POST /api/user/fake-vendors/access/verify
// @access  Private (User)
exports.verifyFakeVendorAccessPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed: missing payment details' });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return res.status(500).json({ success: false, message: 'Payment gateway configuration error' });
        }
        const expected = crypto.createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
        if (expected !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        const settings = await getPublicSettings();
        const access = await FakeVendorAccess.findOne({ userId: req.user._id });
        if (!access) {
            return res.status(404).json({ success: false, message: 'No pending payment found' });
        }

        // Same payment verified twice (retry or double click): return the current access
        if (access.purchases.some(p => p.paymentId === razorpay_payment_id)) {
            return res.status(200).json({ success: true, message: 'Payment already verified', data: describeAccess(access, settings) });
        }

        if (!access.pendingOrder?.orderId || access.pendingOrder.orderId !== razorpay_order_id) {
            return res.status(400).json({ success: false, message: 'Payment verification failed: order mismatch' });
        }

        const now = new Date();
        const days = access.pendingOrder.days || settings.fakeVendorAccessDays;
        const startFrom = access.paidUntil && access.paidUntil > now ? access.paidUntil : now;
        access.paidUntil = new Date(startFrom.getTime() + days * 24 * 60 * 60 * 1000);
        access.purchases.push({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amount: access.pendingOrder.amount,
            days,
            paidAt: now
        });
        access.pendingOrder = undefined;
        await access.save();

        res.status(200).json({
            success: true,
            message: `Access unlocked until ${access.paidUntil.toLocaleDateString('en-IN')}`,
            data: describeAccess(access, settings, now)
        });
    } catch (err) {
        next(err);
    }
};
