const PlatformSettings = require('../modules/admin/PlatformSettings');

// Proposed complaint turnaround targets (hours / days). Operational goals, not statutory deadlines:
// consumer-protection and other legal obligations take precedence.
const TAT_DEFAULTS = {
    complaintAckHours: 24,
    complaintVendorResponseHours: 48,
    complaintResolveDays: 7,
    complaintSafetyResolveDays: 2
};
const APPEAL_WINDOW_DAYS = 7;
const HOUR = 60 * 60 * 1000;

async function getTatSettings() {
    const s = await PlatformSettings.findOne().lean();
    const out = {};
    for (const [k, v] of Object.entries(TAT_DEFAULTS)) out[k] = s?.[k] ?? v;
    return out;
}

/** Targets for a new complaint; safety complaints are handled faster. */
async function targetsFor(category, from = new Date()) {
    const s = await getTatSettings();
    const start = new Date(from).getTime();
    const resolveDays = category === 'Safety' ? s.complaintSafetyResolveDays : s.complaintResolveDays;
    return {
        acknowledgeBy: new Date(start + s.complaintAckHours * HOUR),
        vendorResponseBy: new Date(start + s.complaintVendorResponseHours * HOUR),
        resolveBy: new Date(start + resolveDays * 24 * HOUR)
    };
}

/** Which targets a complaint has missed right now. */
function overdueFlags(c, now = new Date()) {
    const t = c.tat || {};
    const open = ['Pending', 'In-Review', 'Appealed'].includes(c.status);
    return {
        acknowledge: Boolean(t.acknowledgeBy && !c.acknowledgedAt && c.status === 'Pending' && new Date(t.acknowledgeBy) < now),
        vendorResponse: Boolean(c.vendorId && t.vendorResponseBy && !c.vendorResponse?.respondedAt && open && new Date(t.vendorResponseBy) < now),
        resolve: Boolean(t.resolveBy && open && new Date(t.resolveBy) < now)
    };
}

/** An appeal is possible once, within a week of the decision. */
function canAppeal(c, now = new Date()) {
    if (!['Resolved', 'Dismissed'].includes(c.status) || c.appeal?.by) return false;
    const decided = c.resolvedAt ? new Date(c.resolvedAt).getTime() : 0;
    return Boolean(decided) && now.getTime() - decided <= APPEAL_WINDOW_DAYS * 24 * HOUR;
}

async function notifyVendor(vendorId, message) {
    if (!vendorId) return;
    try {
        const Notification = require('../modules/vendor/Notification');
        await Notification.create({ vendorId, message, type: 'System' });
    } catch (_) { /* best effort */ }
}

async function notifyUser(userId, title, message) {
    if (!userId) return;
    try {
        const { createNotification } = require('./notification.service');
        await createNotification({ userId, title, message, type: 'complaint', entityType: 'Complaint', customLink: '/user/complaints' });
    } catch (_) { /* best effort */ }
}

module.exports = { TAT_DEFAULTS, APPEAL_WINDOW_DAYS, getTatSettings, targetsFor, overdueFlags, canAppeal, notifyVendor, notifyUser };
