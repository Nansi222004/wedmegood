const Booking = require('./Booking');
const Payment = require('../user/Payment');

// The dashboard "Earnings Overview" chart: money actually received from customers, by day or month.
// Booking payments happen outside the app and the vendor records them on the booking (paymentEntries);
// older bookings may also have online payments.

const IST_OFFSET = 330 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const RANGES = ['week', 'month', 'year'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ONLINE_PAID = ['Completed', 'Paid', 'PartiallyRefunded'];
const ACTIVE = ['Confirmed', 'In Progress', 'Completed'];

// Midnight of an Indian calendar day as a UTC instant (Date.UTC handles day/month overflow)
const istMidnight = (y, m, d) => new Date(Date.UTC(y, m, d) - IST_OFFSET);
const minDate = (a, b) => (a < b ? a : b);

/**
 * Buckets for the range, the period shown, and the same stretch of the previous period
 * (so "this month so far" is compared with the same days of last month).
 */
function buildRange(range, nowMs = Date.now()) {
    const ist = new Date(nowMs + IST_OFFSET);
    const y = ist.getUTCFullYear();
    const m = ist.getUTCMonth();
    const d = ist.getUTCDate();
    const tomorrow = istMidnight(y, m, d + 1);
    const buckets = [];

    if (range === 'week') {
        // The last 7 days, today included
        for (let i = 6; i >= 0; i--) {
            const start = istMidnight(y, m, d - i);
            const day = new Date(start.getTime() + IST_OFFSET);
            buckets.push({ start, end: new Date(start.getTime() + DAY), label: `${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]}` });
        }
        const start = buckets[0].start;
        return { buckets, start, end: tomorrow, prevStart: new Date(start.getTime() - 7 * DAY), prevEnd: start, compareLabel: 'previous 7 days' };
    }

    if (range === 'year') {
        for (let i = 0; i < 12; i++) buckets.push({ start: istMidnight(y, i, 1), end: istMidnight(y, i + 1, 1), label: MONTHS[i], future: i > m });
        const start = istMidnight(y, 0, 1);
        return { buckets, start, end: tomorrow, prevStart: istMidnight(y - 1, 0, 1), prevEnd: minDate(istMidnight(y - 1, m, d + 1), start), compareLabel: 'same time last year' };
    }

    // month
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    for (let i = 1; i <= daysInMonth; i++) buckets.push({ start: istMidnight(y, m, i), end: istMidnight(y, m, i + 1), label: `${i} ${MONTHS[m]}`, future: i > d });
    const start = istMidnight(y, m, 1);
    return { buckets, start, end: tomorrow, prevStart: istMidnight(y, m - 1, 1), prevEnd: minDate(istMidnight(y, m - 1, d + 1), start), compareLabel: 'same days last month' };
}

// @desc    Money received per day/month, what customers still owe, and new bookings
// @route   GET /api/vendor/earnings/chart?range=week|month|year
// @access  Private (vendor)
exports.getEarningsChart = async (req, res, next) => {
    try {
        const vendorId = req.vendor._id || req.vendor.id;
        const range = RANGES.includes(req.query.range) ? req.query.range : 'month';
        const r = buildRange(range);

        const [withEntries, online, active, created] = await Promise.all([
            Booking.find({ vendorId, 'paymentEntries.paidOn': { $gte: r.prevStart, $lt: r.end } }).select('paymentEntries').lean(),
            Payment.find({ vendorId, status: { $in: ONLINE_PAID }, createdAt: { $gte: r.prevStart, $lt: r.end } }).select('amount refundAmount createdAt').lean(),
            Booking.find({ vendorId, status: { $in: ACTIVE } }).select('totalPrice paymentEntries').lean(),
            Booking.find({ vendorId, status: { $in: ACTIVE }, createdAt: { $gte: r.start, $lt: r.end } }).select('totalPrice').lean()
        ]);

        // Every receipt in the period and the comparison period, as { at, amount }
        const receipts = [];
        for (const b of withEntries) {
            for (const e of b.paymentEntries || []) receipts.push({ at: new Date(e.paidOn), amount: Number(e.amount) || 0 });
        }
        for (const p of online) {
            receipts.push({ at: new Date(p.createdAt), amount: Math.max(0, (Number(p.amount) || 0) - (Number(p.refundAmount) || 0)) });
        }

        const buckets = r.buckets.map(bk => ({ label: bk.label, received: 0, future: !!bk.future }));
        let received = 0;
        let payments = 0;
        let previousReceived = 0;
        for (const rc of receipts) {
            if (rc.at >= r.start && rc.at < r.end) {
                const i = r.buckets.findIndex(bk => rc.at >= bk.start && rc.at < bk.end);
                if (i === -1) continue;
                buckets[i].received += rc.amount;
                received += rc.amount;
                payments += 1;
            } else if (rc.at >= r.prevStart && rc.at < r.prevEnd) {
                previousReceived += rc.amount;
            }
        }

        // What customers still owe on confirmed, ongoing and completed bookings
        const onlineByBooking = {};
        if (active.length) {
            const paidOnline = await Payment.find({ vendorId, bookingId: { $in: active.map(b => b._id) }, status: { $in: ONLINE_PAID } })
                .select('bookingId amount refundAmount').lean();
            for (const p of paidOnline) {
                const k = String(p.bookingId);
                onlineByBooking[k] = (onlineByBooking[k] || 0) + Math.max(0, (Number(p.amount) || 0) - (Number(p.refundAmount) || 0));
            }
        }
        let due = 0;
        let dueBookings = 0;
        for (const b of active) {
            const paid = (b.paymentEntries || []).reduce((s, e) => s + (Number(e.amount) || 0), 0) + (onlineByBooking[String(b._id)] || 0);
            const left = Math.max(0, (Number(b.totalPrice) || 0) - paid);
            if (left > 0) { due += left; dueBookings += 1; }
        }

        const round = (n) => Math.round(n);
        res.status(200).json({
            success: true,
            data: {
                range,
                buckets: buckets.map(b => ({ ...b, received: round(b.received) })),
                totals: {
                    received: round(received),
                    payments,
                    previousReceived: round(previousReceived),
                    // No percentage when there is nothing to compare with
                    changePercent: previousReceived > 0 ? Math.round(((received - previousReceived) / previousReceived) * 100) : null,
                    compareLabel: r.compareLabel,
                    due: round(due),
                    dueBookings,
                    newBookingsValue: round(created.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0)),
                    newBookings: created.length
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.buildRange = buildRange;
