const Vendor = require('../modules/vendor/Vendor');

/**
 * Marks every vendor subscription whose end date has passed as Expired and tells the vendor.
 * Without this a subscription stayed "Active" forever, so vendors kept leads, quotes, chat and
 * the auto-assignment rotation after their plan ended.
 * @returns {Promise<number>} number of subscriptions expired
 */
async function expireOverdueSubscriptions() {
    const now = new Date();
    const overdue = await Vendor.find({
        'subscription.status': 'Active',
        'subscription.endDate': { $lt: now }
    }).select('_id').lean();

    if (overdue.length === 0) return 0;

    const ids = overdue.map(v => v._id);
    await Vendor.updateMany(
        { _id: { $in: ids }, 'subscription.status': 'Active', 'subscription.endDate': { $lt: now } },
        { $set: { 'subscription.status': 'Expired' } }
    );

    // Required lazily: the Notification model pulls in the push service
    const Notification = require('../modules/vendor/Notification');
    for (const id of ids) {
        try {
            await Notification.create({
                vendorId: id,
                message: 'Your subscription has expired. Renew your plan to keep receiving leads and using bookings, chat and quotes.',
                type: 'System'
            });
        } catch (_) { /* notification is best effort */ }
    }

    console.log(`🔔 Expired ${ids.length} vendor subscription(s)`);
    return ids.length;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

/** Runs the expiry sweep now and then every hour. */
function startSubscriptionExpiryJob() {
    const run = () => expireOverdueSubscriptions().catch(err =>
        console.error('Subscription expiry sweep failed:', err.message));
    run();
    return setInterval(run, ONE_HOUR_MS);
}

module.exports = { expireOverdueSubscriptions, startSubscriptionExpiryJob };
