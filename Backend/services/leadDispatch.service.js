const mongoose = require('mongoose');
const Lead = require('../modules/vendor/Lead');
const LeadOffer = require('../modules/vendor/LeadOffer');
const Vendor = require('../modules/vendor/Vendor');
const { getFakeVendorIds } = require('../utils/fakeVendorCache');
const { resolveCategory, takeNextVendor, sortKeyOf } = require('./vendorAllocation.service');
const { getDispatchSettings } = require('./platformSettings.service');
const { distanceKm } = require('./pincode.service');

/*
 * Lead dispatch: the hybrid assignment model.
 *
 * A lead is offered to ONE eligible vendor at a time. The vendor has a short window (30 s by
 * default) from the moment the offer reaches their device to accept or decline. A server-side
 * sweeper expires unanswered offers and moves the lead to the next vendor, so nothing depends on
 * the vendor's phone. Vendors are taken in subscription rotation order, nearest service ring
 * first, so every subscribed vendor gets leads in turn. When nobody accepts, the lead is marked
 * Unassigned, the admins are alerted and the customer can widen the search or pick a vendor.
 *
 * All state changes are conditional updates, so two vendors can never take the same lead and two
 * dispatchers (sweeper + a decline) can never offer it twice.
 */

const TERMINAL_STATUSES = ['Booked', 'Closed', 'Cancelled'];
const DAY_MS = 24 * 60 * 60 * 1000;

let io = null;
const setSocketServer = (server) => { io = server; };

const emitTo = (room, event, payload) => {
    try {
        if (io) io.to(room).emit(event, payload);
    } catch (_) { /* realtime is best effort */ }
};
const emitToVendor = (vendorId, event, payload) => emitTo(`vendor:${vendorId}`, event, payload);
const emitToUser = (userId, event, payload) => emitTo(`user:${userId}`, event, payload);
const emitToAdmins = (event, payload) => emitTo('admins', event, payload);

const lower = (v) => String(v || '').trim().toLowerCase();
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ---------------------------------------------------------------------------------------------
// Notifications (all best effort: a failed notification never blocks dispatch)
// ---------------------------------------------------------------------------------------------

async function notifyVendor(vendorId, message, type = 'Lead') {
    try {
        const Notification = require('../modules/vendor/Notification');
        await Notification.create({ vendorId, message, type });
    } catch (_) { /* best effort */ }
}

async function notifyCustomer(lead, title, message) {
    if (!lead.userId) return;
    try {
        const { createNotification } = require('./notification.service');
        await createNotification({
            userId: lead.userId,
            title,
            message,
            type: 'enquiry',
            entityType: 'Enquiry',
            entityId: lead.enquiryId || lead._id,
            customLink: lead.enquiryId ? `/user/enquiries/${lead.enquiryId}` : '/user/enquiries'
        });
    } catch (_) { /* best effort */ }
    emitToUser(lead.userId, 'enquiry:update', { enquiryId: lead.enquiryId, leadId: lead._id });
}

async function openConversation(lead, vendorId) {
    if (!lead.userId) return;
    try {
        const chatService = require('../modules/chat/chat.service');
        await chatService.getOrCreateConversation({
            userId: lead.userId,
            vendorId,
            leadId: lead._id,
            initialMessage: lead.message || lead.requirements || null
        });
    } catch (err) {
        console.warn('leadDispatch: conversation not created:', err.message);
    }
}

// ---------------------------------------------------------------------------------------------
// Eligibility and matching
// ---------------------------------------------------------------------------------------------

const VENDOR_MATCH_FIELDS = '_id businessName fullName city serviceCities businessDetails.serviceCities businessDetails.years ' +
    'subscription.firstPaidAt subscription.startDate createdAt serviceArea leadPreferences blockedDates isVerified ' +
    'rating reviewCount profileImage portfolio pricing selectedCategories.categoryName';

/** Approved, active, subscribed vendors of the lead's category who are not listed as fake, in rotation order. */
async function getCategoryVendors(category) {
    const { filter, categoryKey } = await resolveCategory(category);
    const fakeIds = [...await getFakeVendorIds()];
    const vendors = await Vendor.find({
        status: 'Approved',
        isActive: true,
        'subscription.status': 'Active',
        _id: { $nin: fakeIds },
        ...filter
    }).select(VENDOR_MATCH_FIELDS).lean();
    vendors.sort((a, b) => (sortKeyOf(a) < sortKeyOf(b) ? -1 : sortKeyOf(a) > sortKeyOf(b) ? 1 : 0));
    return { vendors, categoryKey };
}

const isPaused = (vendor, now = new Date()) => {
    const prefs = vendor.leadPreferences || {};
    if (!prefs.paused) return false;
    return !prefs.pausedUntil || new Date(prefs.pausedUntil) > now;
};

const isAvailableOn = (vendor, date) => {
    const key = dayKey(date);
    return !(vendor.blockedDates || []).some(b => dayKey(b) === key);
};

const fitsBudget = (vendor, budget) => {
    const min = Number(vendor.leadPreferences?.minBudget) || 0;
    return !(budget > 0 && min > 0 && budget < min);
};

/**
 * Which service ring a lead falls in for a vendor.
 *   1 = inside the vendor's declared area (PIN code, radius or service district)
 *   2 = within their maximum travel range or the same district
 *   3 = outside both (used only when the customer agreed to a wider search)
 */
function coverageFor(vendor, lead) {
    const area = vendor.serviceArea || {};
    const coverage = area.coverage || 'combined';
    const pins = (area.pincodes || []).map(String);
    const districts = (area.districts || []).map(lower);
    const hasLocation = Number.isFinite(area.baseLocation?.lat) && Number.isFinite(area.baseLocation?.lng);
    const configured = pins.length > 0 || districts.length > 0 || hasLocation || Boolean(area.basePincode);
    const dist = distanceKm(area.baseLocation, lead.location);
    const leadCity = lower(lead.city || lead.eventLocation);
    const leadDistrict = lower(lead.district);
    const vendorCities = [vendor.city, ...(vendor.serviceCities || []), ...(vendor.businessDetails?.serviceCities || [])].map(lower).filter(Boolean);

    const usePins = coverage === 'pincodes' || coverage === 'combined';
    const useRadius = coverage === 'radius' || coverage === 'combined';
    const useDistricts = coverage === 'districts' || coverage === 'combined';

    if (lead.pincode) {
        if (usePins && (pins.includes(lead.pincode) || area.basePincode === lead.pincode)) {
            return { stage: 1, coverage: 'pincode', distanceKm: dist };
        }
    }
    if (useRadius && dist !== null && dist <= (Number(area.radiusKm) || 0)) {
        return { stage: 1, coverage: 'radius', distanceKm: dist };
    }
    if (useDistricts && leadDistrict && districts.includes(leadDistrict)) {
        return { stage: 1, coverage: 'district', distanceKm: dist };
    }
    // Vendors who have not set up a service area yet are matched on the cities they listed
    if (!configured && leadCity && vendorCities.includes(leadCity)) {
        return { stage: 1, coverage: 'city', distanceKm: dist };
    }

    if (dist !== null && dist <= (Number(area.maxTravelKm) || 0)) {
        return { stage: 2, coverage: 'travel', distanceKm: dist };
    }
    if (leadDistrict && (lower(area.baseDistrict) === leadDistrict || districts.includes(leadDistrict))) {
        return { stage: 2, coverage: 'district', distanceKm: dist };
    }
    if (leadCity && vendorCities.includes(leadCity)) {
        return { stage: 2, coverage: 'city', distanceKm: dist };
    }
    return { stage: 3, coverage: 'expanded', distanceKm: dist };
}

/** Full assessment of one vendor for one lead. */
function assessVendor(vendor, lead, now = new Date()) {
    const cov = coverageFor(vendor, lead);
    const available = isAvailableOn(vendor, lead.eventDate);
    const budgetOk = fitsBudget(vendor, Number(lead.budget) || 0);
    const paused = isPaused(vendor, now);
    return { ...cov, available, budgetOk, paused, eligible: available && budgetOk && !paused };
}

const rotationKeyFor = (categoryKey, lead, stage) => {
    if (stage === 1) return `${categoryKey}@${lower(lead.city || lead.eventLocation)}`;
    if (stage === 2) return `${categoryKey}@d:${lower(lead.district || lead.city)}`;
    return categoryKey;
};

async function vendorsAlreadyTried(lead) {
    const offered = await LeadOffer.distinct('vendorId', { leadId: lead._id });
    const declinedByCustomer = (lead.customerDeclines || []).map(d => d.vendorId);
    return new Set([...offered, ...declinedByCustomer].map(String));
}

/** Next vendor to offer the lead to, nearest ring first, rotating within the ring. */
async function pickNextVendor(lead) {
    const tried = await vendorsAlreadyTried(lead);
    const { vendors, categoryKey } = await getCategoryVendors(lead.category);
    const now = new Date();
    const assessed = vendors
        .filter(v => !tried.has(String(v._id)))
        .map(v => ({ vendor: v, assessment: assessVendor(v, lead, now) }))
        .filter(x => x.assessment.eligible);

    const maxStage = lead.dispatch?.allowExpandedSearch ? 3 : 2;
    for (let stage = 1; stage <= maxStage; stage++) {
        const ring = assessed.filter(x => x.assessment.stage === stage);
        if (ring.length === 0) continue;
        const rotationKey = rotationKeyFor(categoryKey, lead, stage);
        const next = await takeNextVendor(rotationKey, ring.map(x => x.vendor));
        const chosen = ring.find(x => String(x.vendor._id) === String(next._id)) || ring[0];
        return {
            vendorId: chosen.vendor._id,
            stage,
            coverage: chosen.assessment.coverage,
            distanceKm: chosen.assessment.distanceKm,
            rotationKey
        };
    }
    return null;
}

// ---------------------------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------------------------

/** What a vendor sees in the buzzer: the requirement, never the customer's identity or contact. */
function offerSummary(offer, lead, settings) {
    return {
        offerId: offer._id,
        leadId: lead._id,
        attempt: offer.attempt,
        status: offer.status,
        offeredAt: offer.offeredAt,
        deliveredAt: offer.deliveredAt,
        expiresAt: offer.expiresAt,
        windowSeconds: settings?.leadOfferWindowSeconds || 30,
        service: lead.category,
        eventType: lead.eventType || 'Event',
        eventDate: lead.eventDate,
        city: lead.city || lead.eventLocation,
        district: lead.district || '',
        pincode: lead.pincode || '',
        guestCount: lead.guestCount || 0,
        budget: lead.budget || 0,
        venueType: lead.venueType,
        requirements: String(lead.requirements || '').slice(0, 280),
        referencePhotoCount: (lead.referencePhotos || []).length + (lead.referencePhotoIds || []).length,
        distanceKm: offer.match?.distanceKm ?? null,
        coverage: offer.match?.coverage || ''
    };
}

async function announceOffer(offer, lead, settings) {
    const summary = offerSummary(offer, lead, settings);
    emitToVendor(offer.vendorId, 'lead:offer', summary);
    try {
        const { sendPushToVendor } = require('./push.service');
        await sendPushToVendor(offer.vendorId, {
            title: `New ${lead.category} lead - respond in ${summary.windowSeconds}s`,
            body: `${summary.eventType} on ${formatDate(lead.eventDate)} in ${summary.city}${lead.budget ? ` · Budget ₹${Number(lead.budget).toLocaleString('en-IN')}` : ''}`,
            link: '/vendor/leads?offer=' + offer._id,
            data: { type: 'lead_offer', offerId: String(offer._id), expiresAt: offer.expiresAt.toISOString() }
        });
    } catch (_) { /* best effort */ }
}

async function markUnassigned(lead, claimId) {
    const now = new Date();
    const updated = await Lead.findOneAndUpdate(
        { _id: lead._id, 'dispatch.currentOfferId': claimId },
        {
            $set: { 'dispatch.currentOfferId': null, status: 'Unassigned', 'dispatch.unassignedAt': now },
            $push: { statusHistory: { status: 'Unassigned', note: 'No eligible vendor accepted', at: now } }
        },
        { new: true }
    );
    if (!updated) return;
    const widen = updated.dispatch?.allowExpandedSearch
        ? 'You can pick a vendor yourself from the list.'
        : 'You can widen the search area or pick a vendor yourself.';
    await notifyCustomer(updated, 'We are still looking for a vendor',
        `No ${updated.category} vendor near ${updated.city || updated.eventLocation} has accepted your requirement for ${formatDate(updated.eventDate)} yet. ${widen} Our team has been alerted.`);
    emitToAdmins('lead:unassigned', { leadId: updated._id, enquiryId: updated.enquiryId, category: updated.category, city: updated.city });
}

/**
 * Offer a lead to the next eligible vendor. Safe to call from anywhere and any number of times:
 * only one caller can claim the lead, and nothing happens if it already has a vendor or offer.
 * @param {string|ObjectId} leadId
 * @param {{ vendorId?: string|ObjectId }} [options] offer to this vendor instead of the next in rotation
 * @returns {Promise<object|null>} the new offer, or null
 */
async function dispatchLead(leadId, options = {}) {
    const claimId = new mongoose.Types.ObjectId();
    const lead = await Lead.findOneAndUpdate(
        { _id: leadId, vendorId: null, 'dispatch.currentOfferId': null, status: { $nin: TERMINAL_STATUSES } },
        { $set: { 'dispatch.currentOfferId': claimId } },
        { new: true }
    );
    if (!lead) return null;

    try {
        const settings = await getDispatchSettings();
        let pick = null;
        if (options.vendorId) {
            pick = { vendorId: options.vendorId, stage: lead.dispatch?.stage || 1, coverage: 'details-updated', distanceKm: null, rotationKey: '' };
        } else {
            pick = await pickNextVendor(lead);
        }

        if (!pick) {
            await markUnassigned(lead, claimId);
            return null;
        }

        const now = new Date();
        const waitSeconds = (settings.leadOfferDeliveryGraceSeconds || 0) + settings.leadOfferWindowSeconds;
        const offer = await LeadOffer.create({
            _id: claimId,
            leadId: lead._id,
            vendorId: pick.vendorId,
            attempt: (lead.dispatch?.attempts || 0) + 1,
            offeredAt: now,
            expiresAt: new Date(now.getTime() + waitSeconds * 1000),
            match: { stage: pick.stage, coverage: pick.coverage, distanceKm: pick.distanceKm, rotationKey: pick.rotationKey }
        });

        const attempts = (lead.dispatch?.attempts || 0) + 1;
        await Lead.updateOne(
            { _id: lead._id, 'dispatch.currentOfferId': claimId },
            {
                $set: { status: 'Awaiting Response', 'dispatch.stage': pick.stage, 'dispatch.attempts': attempts },
                $push: { statusHistory: { status: 'Awaiting Response', note: attempts > 1 ? `Reassigned (attempt ${attempts})` : 'Offered to vendor', at: now } }
            }
        );

        await announceOffer(offer, lead, settings);
        return offer;
    } catch (err) {
        await Lead.updateOne({ _id: lead._id, 'dispatch.currentOfferId': claimId }, { $set: { 'dispatch.currentOfferId': null } }).catch(() => {});
        throw err;
    }
}

/** Frees the lead from an offer that ended, then offers it to the next vendor. */
async function moveOn(offer) {
    await Lead.updateOne(
        { _id: offer.leadId, 'dispatch.currentOfferId': offer._id },
        { $set: { 'dispatch.currentOfferId': null } }
    );
    return dispatchLead(offer.leadId);
}

/** The vendor's device is showing the offer: the response window starts now. */
async function acknowledgeOffer(offerId, vendorId) {
    const settings = await getDispatchSettings();
    const now = new Date();
    const updated = await LeadOffer.findOneAndUpdate(
        { _id: offerId, vendorId, status: 'Pending', deliveredAt: null, expiresAt: { $gt: now } },
        { $set: { deliveredAt: now, expiresAt: new Date(now.getTime() + settings.leadOfferWindowSeconds * 1000) } },
        { new: true }
    ).lean();
    return updated || LeadOffer.findOne({ _id: offerId, vendorId }).lean();
}

/** Pending offers for a vendor (the buzzer polls this as a fallback to the socket). */
async function getActiveOffers(vendorId) {
    const settings = await getDispatchSettings();
    const offers = await LeadOffer.find({ vendorId, status: 'Pending', expiresAt: { $gt: new Date() } }).sort('offeredAt').lean();
    if (offers.length === 0) return [];
    const leads = await Lead.find({ _id: { $in: offers.map(o => o.leadId) } }).lean();
    const byId = new Map(leads.map(l => [String(l._id), l]));
    return offers.filter(o => byId.has(String(o.leadId))).map(o => offerSummary(o, byId.get(String(o.leadId)), settings));
}

class DispatchError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

/**
 * Vendor accepts an offer. Only one vendor can win a lead: the offer must still be pending and
 * unexpired, and the lead must still point at this offer.
 */
async function acceptOffer(offerId, vendorId) {
    const now = new Date();
    const offer = await LeadOffer.findOneAndUpdate(
        { _id: offerId, vendorId, status: 'Pending', expiresAt: { $gt: now } },
        { $set: { status: 'Accepted', respondedAt: now } },
        { new: true }
    );
    if (!offer) throw new DispatchError('This lead is no longer available. The response time ended or it was withdrawn.', 409);
    if (!offer.deliveredAt) await LeadOffer.updateOne({ _id: offer._id }, { $set: { deliveredAt: now } });

    const settings = await getDispatchSettings();
    const contactDeadline = new Date(now.getTime() + settings.leadContactDeadlineHours * 60 * 60 * 1000);
    const lead = await Lead.findOneAndUpdate(
        { _id: offer.leadId, 'dispatch.currentOfferId': offer._id, vendorId: null },
        {
            $set: {
                vendorId,
                status: 'Accepted',
                assignedType: 'System',
                'dispatch.currentOfferId': null,
                'dispatch.acceptedAt': now,
                'dispatch.contactDeadline': contactDeadline,
                'dispatch.firstContactAt': null
            },
            $push: { statusHistory: { status: 'Accepted', note: 'Vendor accepted the offer', by: 'vendor', at: now } }
        },
        { new: true }
    );
    if (!lead) {
        await LeadOffer.updateOne({ _id: offer._id }, { $set: { status: 'Revoked' } });
        throw new DispatchError('This lead is no longer available.', 409);
    }

    await openConversation(lead, vendorId);
    const vendor = await Vendor.findById(vendorId).select('businessName').lean();
    await notifyCustomer(lead, 'A vendor accepted your requirement',
        `${vendor?.businessName || 'A verified vendor'} accepted your ${lead.category} requirement for ${formatDate(lead.eventDate)} and will contact you shortly.`);
    return lead;
}

/** Vendor declines an offer with a reason. Missing details go back to the customer; anything else moves on. */
async function declineOffer(offerId, vendorId, reason, note = '') {
    if (!Object.prototype.hasOwnProperty.call(LeadOffer.DECLINE_REASONS, reason)) {
        throw new DispatchError('Please choose a reason for declining');
    }
    const cleanNote = String(note || '').trim().slice(0, 500);
    if (reason === 'insufficient_details' && !cleanNote) {
        throw new DispatchError('Tell the customer which details you need');
    }
    const now = new Date();
    const offer = await LeadOffer.findOneAndUpdate(
        { _id: offerId, vendorId, status: 'Pending' },
        { $set: { status: 'Declined', respondedAt: now, declineReason: reason, declineNote: cleanNote } },
        { new: true }
    );
    if (!offer) throw new DispatchError('This offer has already ended.', 409);

    if (reason === 'insufficient_details') {
        const lead = await Lead.findOneAndUpdate(
            { _id: offer.leadId, 'dispatch.currentOfferId': offer._id },
            {
                $set: {
                    'dispatch.currentOfferId': null,
                    status: 'Details Requested',
                    'dispatch.detailsRequest': { vendorId, note: cleanNote, requestedAt: now, resolvedAt: null }
                },
                $push: { statusHistory: { status: 'Details Requested', note: cleanNote, by: 'vendor', at: now } }
            },
            { new: true }
        );
        if (lead) {
            await notifyCustomer(lead, 'A vendor needs more details',
                `To quote for your ${lead.category} requirement, a vendor asked: "${cleanNote}". Add the details and we will send it straight back to them.`);
        }
        return offer;
    }

    await moveOn(offer);
    return offer;
}

// ---------------------------------------------------------------------------------------------
// After acceptance
// ---------------------------------------------------------------------------------------------

/** The assigned vendor got in touch (status update, quote or chat). Stops the contact deadline. */
async function markVendorContacted({ leadId = null, vendorId, userId = null }) {
    if (!vendorId || (!leadId && !userId)) return;
    const now = new Date();
    const scope = leadId ? { _id: leadId, vendorId } : { userId, vendorId };
    await Lead.updateMany(
        { ...scope, 'dispatch.acceptedAt': { $ne: null }, 'dispatch.firstContactAt': null },
        { $set: { 'dispatch.firstContactAt': now } }
    );
    await Lead.updateMany(
        { ...scope, status: 'Accepted' },
        { $set: { status: 'Contacted' }, $push: { statusHistory: { status: 'Contacted', by: 'vendor', at: now } } }
    );
}

/**
 * Takes the lead away from its current vendor (lapsed contact deadline, vendor gave it back,
 * or the customer declined them). Open quotes from that vendor for this lead are cancelled.
 */
async function releaseFromVendor(lead, offerStatus, note) {
    const vendorId = lead.vendorId;
    if (!vendorId) return null;
    const now = new Date();
    const released = await Lead.findOneAndUpdate(
        { _id: lead._id, vendorId, status: { $nin: TERMINAL_STATUSES } },
        {
            $set: {
                vendorId: null,
                'dispatch.acceptedAt': null,
                'dispatch.contactDeadline': null,
                'dispatch.firstContactAt': null
            },
            $push: { statusHistory: { status: lead.status, note, at: now } }
        },
        { new: true }
    );
    if (!released) return null;

    await LeadOffer.updateMany({ leadId: lead._id, vendorId, status: 'Accepted' }, { $set: { status: offerStatus } });
    const Quote = require('../modules/vendor/Quote');
    await Quote.updateMany(
        { leadId: lead._id, vendorId, status: { $in: ['Draft', 'Pending', 'Sent'] } },
        { $set: { status: 'Cancelled' } }
    );
    return released;
}

/**
 * Vendor gives back a requirement lead (marked Rejected from the leads page). A system-assigned
 * lead goes to the next vendor; one the customer picked goes back to the customer to choose again.
 */
async function withdrawByVendor(leadId, vendorId) {
    const lead = await Lead.findOne({ _id: leadId, vendorId });
    if (!lead || !lead.enquiryId) return null;
    const released = await releaseFromVendor(lead, 'Withdrawn', 'Vendor gave the lead back');
    if (!released) return null;
    if (lead.assignedType === 'System') {
        await dispatchLead(released._id);
    } else {
        await Lead.updateOne({ _id: released._id, vendorId: null }, { $set: { status: 'Exploring' } });
        await notifyCustomer(released, 'Please choose another vendor',
            `The ${lead.category} vendor you chose cannot take your requirement for ${formatDate(lead.eventDate)}. Please choose another vendor.`);
    }
    return released;
}

// ---------------------------------------------------------------------------------------------
// Customer actions
// ---------------------------------------------------------------------------------------------

const CUSTOMER_DECLINE_REASONS = {
    price_high: 'Price is too high',
    style_mismatch: "Portfolio or style doesn't match",
    no_response: "Vendor didn't respond on time",
    unavailable: 'Vendor is unavailable on my date',
    not_comfortable: "I don't feel comfortable with this vendor",
    other: 'Other reason',
    skipped: 'Prefer not to say'
};

/**
 * Customer turns down the assigned vendor. With next = 'auto' Utsavo finds another vendor, up to
 * the reassignment limit; after that (or with next = 'explore') the customer picks one themselves.
 */
async function customerDeclineVendor(lead, { reason = 'skipped', note = '', next = 'auto' }) {
    if (!lead.vendorId) throw new DispatchError('No vendor is assigned to this service yet');
    if (TERMINAL_STATUSES.includes(lead.status)) throw new DispatchError(`This service is already ${lead.status.toLowerCase()}`);
    const key = Object.prototype.hasOwnProperty.call(CUSTOMER_DECLINE_REASONS, reason) ? reason : 'skipped';
    const settings = await getDispatchSettings();
    const vendorId = lead.vendorId;
    const now = new Date();

    const released = await releaseFromVendor(lead, 'CustomerDeclined', 'Customer declined the vendor');
    if (!released) throw new DispatchError('This service changed. Please refresh and try again.', 409);

    const declinesSoFar = (released.customerDeclines || []).length + 1;
    const canAuto = declinesSoFar <= settings.leadCustomerReassignLimit;
    const auto = next === 'auto' && canAuto;
    const updated = await Lead.findOneAndUpdate(
        { _id: released._id },
        {
            $push: {
                customerDeclines: { vendorId, reason: key, note: String(note || '').trim().slice(0, 500), at: now },
                statusHistory: { status: auto ? 'Awaiting Response' : 'Exploring', note: `Customer declined vendor (${CUSTOMER_DECLINE_REASONS[key]})`, by: 'customer', at: now }
            },
            $set: { status: auto ? 'Awaiting Response' : 'Exploring' }
        },
        { new: true }
    );

    // The reason stays private: the vendor is only told the customer went another way
    await notifyVendor(vendorId, `The customer chose to go with another vendor for the ${lead.category} requirement on ${formatDate(lead.eventDate)}.`);

    if (auto) await dispatchLead(updated._id);
    return { lead: await Lead.findById(updated._id).lean(), reassigned: auto, reassignLimitReached: !canAuto };
}

/**
 * Vendors the customer can choose from for a lead: eligible onboarded vendors of the service in
 * the event's area, minus the assigned vendor and vendors the customer already declined.
 * The exclusion is enforced here, not only in the app.
 */
async function listAlternativeVendors(lead) {
    const { vendors } = await getCategoryVendors(lead.category);
    const excluded = new Set([
        ...(lead.vendorId ? [String(lead.vendorId)] : []),
        ...(lead.customerDeclines || []).map(d => String(d.vendorId))
    ]);
    const maxStage = lead.dispatch?.allowExpandedSearch ? 3 : 2;
    const now = new Date();

    return vendors
        .filter(v => !excluded.has(String(v._id)))
        .map(v => ({ v, a: assessVendor(v, lead, now) }))
        .filter(({ a }) => a.stage <= maxStage)
        .map(({ v, a }) => ({
            _id: v._id,
            businessName: v.businessName,
            city: v.city,
            profileImage: v.profileImage || v.portfolio?.[0]?.url || null,
            portfolio: (v.portfolio || []).slice(0, 4).map(p => p.url).filter(Boolean),
            rating: v.rating || 0,
            reviewCount: v.reviewCount || 0,
            experienceYears: v.businessDetails?.years || null,
            priceRange: v.pricing?.range || '',
            isVerified: Boolean(v.isVerified),
            travelPolicy: v.serviceArea?.travelPolicy || 'Depends',
            distanceKm: a.distanceKm,
            coverage: a.coverage,
            nearby: a.stage === 1,
            availableOnDate: a.available,
            takingLeads: !a.paused,
            withinBudget: a.budgetOk,
            selectable: a.available && !a.paused
        }))
        .sort((x, y) => (Number(y.selectable) - Number(x.selectable))
            || (Number(y.nearby) - Number(x.nearby))
            || ((x.distanceKm ?? 9999) - (y.distanceKm ?? 9999))
            || (y.rating - x.rating));
}

/** Hand a lead straight to a chosen vendor (customer choice or admin). The rotation is not touched. */
async function assignDirectly(lead, vendorId, { assignedType, by, note }) {
    const now = new Date();
    if (lead.dispatch?.currentOfferId) {
        await LeadOffer.updateOne({ _id: lead.dispatch.currentOfferId, status: 'Pending' }, { $set: { status: 'Revoked' } });
    }
    const settings = await getDispatchSettings();
    const updated = await Lead.findOneAndUpdate(
        { _id: lead._id, status: { $nin: TERMINAL_STATUSES }, vendorId: lead.vendorId || null },
        {
            $set: {
                vendorId,
                status: 'New',
                assignedType,
                customerSelectedVendorId: assignedType === 'CustomerSelected' ? vendorId : lead.customerSelectedVendorId || null,
                'dispatch.currentOfferId': null,
                'dispatch.acceptedAt': now,
                'dispatch.contactDeadline': new Date(now.getTime() + settings.leadContactDeadlineHours * 60 * 60 * 1000),
                'dispatch.firstContactAt': null
            },
            $push: { statusHistory: { status: 'New', note, by, at: now } }
        },
        { new: true }
    );
    if (!updated) throw new DispatchError('This service changed. Please refresh and try again.', 409);

    const who = assignedType === 'Manual' ? 'Utsavo assigned you' : 'A customer chose you for';
    await notifyVendor(vendorId, `${who} a ${lead.category} requirement on ${formatDate(lead.eventDate)} in ${lead.city || lead.eventLocation}. Contact the customer from your leads.`);
    await openConversation(updated, vendorId);
    return updated;
}

/** Customer picks a vendor from the alternatives list. */
async function customerSelectVendor(lead, vendorId) {
    if (TERMINAL_STATUSES.includes(lead.status)) throw new DispatchError(`This service is already ${lead.status.toLowerCase()}`);
    if (lead.vendorId && String(lead.vendorId) === String(vendorId)) {
        throw new DispatchError('This vendor is already assigned to this service');
    }
    const options = await listAlternativeVendors(lead);
    const choice = options.find(o => String(o._id) === String(vendorId));
    if (!choice) throw new DispatchError('This vendor is not available for this service', 404);
    if (!choice.selectable) throw new DispatchError('This vendor is not available on your event date');

    // Choosing someone else replaces the assigned vendor
    let current = lead;
    if (lead.vendorId) {
        const released = await releaseFromVendor(lead, 'CustomerDeclined', 'Customer chose another vendor');
        if (!released) throw new DispatchError('This service changed. Please refresh and try again.', 409);
        await Lead.updateOne({ _id: lead._id }, { $push: { customerDeclines: { vendorId: lead.vendorId, reason: 'skipped', note: 'Chose another vendor' } } });
        await notifyVendor(lead.vendorId, `The customer chose to go with another vendor for the ${lead.category} requirement on ${formatDate(lead.eventDate)}.`);
        current = released;
    }
    return assignDirectly(current, vendorId, { assignedType: 'CustomerSelected', by: 'customer', note: 'Customer selected this vendor' });
}

/** Customer added the details a vendor asked for: offer the lead back to that same vendor. */
async function resubmitDetails(lead) {
    if (lead.status !== 'Details Requested') return null;
    const vendorId = lead.dispatch?.detailsRequest?.vendorId;
    await Lead.updateOne(
        { _id: lead._id, status: 'Details Requested' },
        { $set: { 'dispatch.detailsRequest.resolvedAt': new Date() } }
    );
    if (vendorId) {
        const vendor = await Vendor.findOne({ _id: vendorId, status: 'Approved', isActive: true, 'subscription.status': 'Active' })
            .select('leadPreferences').lean();
        if (vendor && !isPaused(vendor)) return dispatchLead(lead._id, { vendorId });
    }
    return dispatchLead(lead._id);
}

/** Customer allows vendors from further away (or retries after nobody accepted). */
async function widenSearch(lead) {
    if (TERMINAL_STATUSES.includes(lead.status) || lead.vendorId) {
        throw new DispatchError('A vendor is already assigned to this service');
    }
    await Lead.updateOne({ _id: lead._id }, { $set: { 'dispatch.allowExpandedSearch': true } });
    return dispatchLead(lead._id);
}

/** Customer withdraws one service from the enquiry. */
async function cancelLead(lead, by = 'customer') {
    if (lead.status === 'Booked') throw new DispatchError('This service is booked. Cancel the booking instead.');
    if (TERMINAL_STATUSES.includes(lead.status)) return lead;
    const now = new Date();
    if (lead.dispatch?.currentOfferId) {
        await LeadOffer.updateOne({ _id: lead.dispatch.currentOfferId, status: 'Pending' }, { $set: { status: 'Revoked' } });
    }
    if (lead.vendorId) {
        await notifyVendor(lead.vendorId, `The customer cancelled the ${lead.category} requirement on ${formatDate(lead.eventDate)}.`);
        const Quote = require('../modules/vendor/Quote');
        await Quote.updateMany(
            { leadId: lead._id, status: { $in: ['Draft', 'Pending', 'Sent'] } },
            { $set: { status: 'Cancelled' } }
        );
    }
    return Lead.findOneAndUpdate(
        { _id: lead._id, status: { $ne: 'Booked' } },
        {
            $set: { status: 'Cancelled', 'dispatch.currentOfferId': null },
            $push: { statusHistory: { status: 'Cancelled', by, at: now } }
        },
        { new: true }
    );
}

// ---------------------------------------------------------------------------------------------
// Vendor insights
// ---------------------------------------------------------------------------------------------

/** Honest lead stats for a vendor: offered, accepted, declined, missed, response time. */
async function getVendorLeadInsights(vendorId, days = 90) {
    const since = new Date(Date.now() - days * DAY_MS);
    const vid = new mongoose.Types.ObjectId(String(vendorId));
    const [byStatus, byReason, response, booked] = await Promise.all([
        LeadOffer.aggregate([
            { $match: { vendorId: vid, offeredAt: { $gte: since } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        LeadOffer.aggregate([
            { $match: { vendorId: vid, offeredAt: { $gte: since }, status: 'Declined' } },
            { $group: { _id: '$declineReason', count: { $sum: 1 } } }
        ]),
        LeadOffer.aggregate([
            { $match: { vendorId: vid, offeredAt: { $gte: since }, respondedAt: { $ne: null } } },
            { $project: { secs: { $divide: [{ $subtract: ['$respondedAt', { $ifNull: ['$deliveredAt', '$offeredAt'] }] }, 1000] } } },
            { $group: { _id: null, avg: { $avg: '$secs' } } }
        ]),
        Lead.countDocuments({ vendorId: vid, status: 'Booked', assignedType: { $in: ['System', 'CustomerSelected', 'Manual'] }, updatedAt: { $gte: since } })
    ]);

    const count = (s) => byStatus.find(x => x._id === s)?.count || 0;
    const accepted = count('Accepted') + count('Lapsed') + count('Withdrawn') + count('CustomerDeclined');
    const declined = count('Declined');
    const missed = count('Expired');
    const answerable = accepted + declined + missed;
    return {
        periodDays: days,
        offered: byStatus.reduce((s, x) => s + x.count, 0),
        pending: count('Pending'),
        accepted,
        declined,
        missed,
        lapsed: count('Lapsed'),
        customerDeclined: count('CustomerDeclined'),
        booked,
        acceptanceRate: answerable ? Math.round((accepted / answerable) * 100) : null,
        responseRate: answerable ? Math.round(((accepted + declined) / answerable) * 100) : null,
        avgResponseSeconds: response[0]?.avg ? Math.round(response[0].avg) : null,
        declineReasons: byReason.map(r => ({ reason: r._id, label: LeadOffer.DECLINE_REASONS[r._id] || r._id, count: r.count }))
    };
}

// ---------------------------------------------------------------------------------------------
// Background sweeper (server-side timers: nothing depends on the vendor's phone)
// ---------------------------------------------------------------------------------------------

async function expireDueOffers() {
    const now = new Date();
    const due = await LeadOffer.find({ status: 'Pending', expiresAt: { $lte: now } }).select('_id').limit(50).lean();
    for (const { _id } of due) {
        const offer = await LeadOffer.findOneAndUpdate(
            { _id, status: 'Pending', expiresAt: { $lte: now } },
            { $set: { status: 'Expired' } },
            { new: true }
        );
        if (!offer) continue;
        emitToVendor(offer.vendorId, 'lead:offer:closed', { offerId: offer._id, status: 'Expired' });
        const lead = await Lead.findById(offer.leadId).select('category eventDate city eventLocation').lean();
        if (lead) {
            await notifyVendor(offer.vendorId, `You missed a ${lead.category} lead for ${formatDate(lead.eventDate)} in ${lead.city || lead.eventLocation}. Pause leads in Lead Settings when you are busy so leads are not missed.`);
        }
        await moveOn(offer).catch(err => console.error('leadDispatch: reassign after expiry failed:', err.message));
    }
}

async function reassignLapsedLeads() {
    const now = new Date();
    const lapsed = await Lead.find({
        status: 'Accepted',
        assignedType: 'System',
        'dispatch.firstContactAt': null,
        'dispatch.contactDeadline': { $lte: now }
    }).limit(50);
    for (const lead of lapsed) {
        const vendorId = lead.vendorId;
        const released = await releaseFromVendor(lead, 'Lapsed', 'Vendor did not contact the customer in time');
        if (!released) continue;
        await notifyVendor(vendorId, `The ${lead.category} lead for ${formatDate(lead.eventDate)} was reassigned because the customer was not contacted in time.`);
        await dispatchLead(released._id).catch(err => console.error('leadDispatch: reassign after lapse failed:', err.message));
    }
}

async function moveOnFromUnansweredDetailRequests() {
    const settings = await getDispatchSettings();
    const cutoff = new Date(Date.now() - settings.leadDetailsRequestHours * 60 * 60 * 1000);
    const stale = await Lead.find({
        status: 'Details Requested',
        'dispatch.detailsRequest.requestedAt': { $lte: cutoff }
    }).select('_id').limit(50).lean();
    for (const { _id } of stale) {
        const moved = await Lead.findOneAndUpdate(
            { _id, status: 'Details Requested' },
            {
                $set: { status: 'Awaiting Response', 'dispatch.detailsRequest.resolvedAt': new Date() },
                $push: { statusHistory: { status: 'Awaiting Response', note: 'Details not added in time; offered to other vendors' } }
            }
        );
        if (moved) await dispatchLead(_id).catch(() => {});
    }
}

/** Leads whose event date has passed without a vendor or booking are closed. */
async function closePastLeads() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const open = await Lead.find({
        eventDate: { $lt: today },
        status: { $in: ['Awaiting Response', 'Unassigned', 'Details Requested', 'Exploring'] }
    }).select('_id dispatch.currentOfferId').limit(200).lean();
    for (const l of open) {
        if (l.dispatch?.currentOfferId) {
            await LeadOffer.updateOne({ _id: l.dispatch.currentOfferId, status: 'Pending' }, { $set: { status: 'Revoked' } });
        }
        await Lead.updateOne(
            { _id: l._id, status: { $in: ['Awaiting Response', 'Unassigned', 'Details Requested', 'Exploring'] } },
            {
                $set: { status: 'Closed', 'dispatch.currentOfferId': null },
                $push: { statusHistory: { status: 'Closed', note: 'Event date passed' } }
            }
        );
    }
}

/** Leads stuck between steps (e.g. the server restarted mid-dispatch) are picked up again. */
async function repairStuckLeads() {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const stuck = await Lead.find({
        status: 'Awaiting Response',
        vendorId: null,
        updatedAt: { $lte: twoMinutesAgo }
    }).select('_id dispatch.currentOfferId').limit(50).lean();
    for (const l of stuck) {
        const offerId = l.dispatch?.currentOfferId;
        if (offerId) {
            const offer = await LeadOffer.findById(offerId).select('status').lean();
            if (offer && offer.status === 'Pending') continue;
            await Lead.updateOne({ _id: l._id, 'dispatch.currentOfferId': offerId }, { $set: { 'dispatch.currentOfferId': null } });
        }
        await dispatchLead(l._id).catch(() => {});
    }
}

/** Quotations past their validity are marked Expired so both sides see that a new one is needed. */
async function expireOverdueQuotes() {
    const Quote = require('../modules/vendor/Quote');
    await Quote.updateMany(
        { status: { $in: ['Sent', 'Pending', 'Revision Requested'] }, validUntil: { $lt: new Date() } },
        { $set: { status: 'Expired' } }
    );
}

let sweeping = false;
let slowSweepAt = 0;

async function sweep() {
    if (sweeping) return;
    sweeping = true;
    try {
        await expireDueOffers();
        if (Date.now() - slowSweepAt > 60 * 1000) {
            slowSweepAt = Date.now();
            await reassignLapsedLeads();
            await moveOnFromUnansweredDetailRequests();
            await closePastLeads();
            await repairStuckLeads();
            await expireOverdueQuotes();
        }
    } catch (err) {
        console.error('leadDispatch sweep failed:', err.message);
    } finally {
        sweeping = false;
    }
}

/** Checks for expired offers every few seconds and for other deadlines every minute. */
function startLeadDispatchJob() {
    return setInterval(sweep, 3000);
}

module.exports = {
    TERMINAL_STATUSES,
    CUSTOMER_DECLINE_REASONS,
    DispatchError,
    setSocketServer,
    emitToAdmins,
    coverageFor,
    assessVendor,
    dispatchLead,
    acknowledgeOffer,
    getActiveOffers,
    acceptOffer,
    declineOffer,
    markVendorContacted,
    withdrawByVendor,
    customerDeclineVendor,
    listAlternativeVendors,
    customerSelectVendor,
    assignDirectly,
    resubmitDetails,
    widenSearch,
    cancelLead,
    getVendorLeadInsights,
    sweep,
    startLeadDispatchJob,
    // Individual sweeper steps (also used by tests)
    sweeper: {
        expireDueOffers,
        reassignLapsedLeads,
        moveOnFromUnansweredDetailRequests,
        closePastLeads,
        repairStuckLeads,
        expireOverdueQuotes
    }
};
