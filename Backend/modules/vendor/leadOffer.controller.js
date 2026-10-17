const mongoose = require('mongoose');
const Lead = require('./Lead');
const LeadOffer = require('./LeadOffer');
const LeadReport = require('./LeadReport');
const Vendor = require('./Vendor');
const dispatch = require('../../services/leadDispatch.service');
const { lookupPincode, isPincode } = require('../../services/pincode.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));

const sendError = (res, err, next) => {
    if (err instanceof dispatch.DispatchError) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    return next(err);
};

// @desc    Lead offers waiting for this vendor (the buzzer also gets them over the socket)
// @route   GET /api/vendor/lead-offers/active
// @access  Private (Vendor)
exports.getActiveOffers = async (req, res, next) => {
    try {
        const offers = await dispatch.getActiveOffers(req.vendor.id);
        res.status(200).json({ success: true, data: offers, serverTime: new Date() });
    } catch (err) {
        next(err);
    }
};

// @desc    The offer is on screen: start the response window
// @route   POST /api/vendor/lead-offers/:id/ack
// @access  Private (Vendor)
exports.acknowledgeOffer = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid offer' });
        const offer = await dispatch.acknowledgeOffer(req.params.id, req.vendor.id);
        if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
        res.status(200).json({
            success: true,
            data: { offerId: offer._id, status: offer.status, deliveredAt: offer.deliveredAt, expiresAt: offer.expiresAt },
            serverTime: new Date()
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Accept a lead offer (first valid acceptance wins; enforced on the server)
// @route   POST /api/vendor/lead-offers/:id/accept
// @access  Private (Vendor)
exports.acceptOffer = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid offer' });
        const lead = await dispatch.acceptOffer(req.params.id, req.vendor.id);
        res.status(200).json({
            success: true,
            message: 'Lead accepted. Contact the customer before the deadline or the lead moves to another vendor.',
            data: { leadId: lead._id, contactDeadline: lead.dispatch?.contactDeadline }
        });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    Decline a lead offer with a reason
// @route   POST /api/vendor/lead-offers/:id/decline
// @access  Private (Vendor)
exports.declineOffer = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid offer' });
        const { reason, note } = req.body || {};
        await dispatch.declineOffer(req.params.id, req.vendor.id, reason, note);
        res.status(200).json({
            success: true,
            message: reason === 'insufficient_details'
                ? 'We asked the customer for the details. The lead will come back to you once they add them.'
                : 'Lead declined. Utsavo will offer it to another eligible vendor.'
        });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    Decline reasons and how matching works
// @route   GET /api/vendor/lead-offers/reasons
// @access  Private (Vendor)
exports.getDeclineReasons = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            declineReasons: Object.entries(LeadOffer.DECLINE_REASONS).map(([value, label]) => ({ value, label })),
            reportReasons: Object.entries(LeadReport.REASONS).map(([value, label]) => ({ value, label }))
        }
    });
};

// @desc    Acceptance rate, missed leads and decline reasons for the vendor
// @route   GET /api/vendor/lead-insights?days=90
// @access  Private (Vendor)
exports.getLeadInsights = async (req, res, next) => {
    try {
        const days = Math.min(365, Math.max(7, Number(req.query.days) || 90));
        const insights = await dispatch.getVendorLeadInsights(req.vendor.id, days);
        res.status(200).json({ success: true, data: insights });
    } catch (err) {
        next(err);
    }
};

const SETTINGS_FIELDS = 'serviceArea leadPreferences city serviceCities businessDetails.serviceCities';

// @desc    Service area and lead preferences
// @route   GET /api/vendor/lead-settings
// @access  Private (Vendor)
exports.getLeadSettings = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id).select(SETTINGS_FIELDS).lean();
        if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
        res.status(200).json({
            success: true,
            data: {
                serviceArea: {
                    coverage: 'combined',
                    basePincode: '',
                    baseDistrict: '',
                    pincodes: [],
                    districts: [],
                    radiusKm: 25,
                    maxTravelKm: 75,
                    travelPolicy: 'Depends',
                    ...(vendor.serviceArea || {}),
                    hasLocation: Number.isFinite(vendor.serviceArea?.baseLocation?.lat)
                },
                leadPreferences: { paused: false, pausedUntil: null, minBudget: 0, maxBudget: 0, ...(vendor.leadPreferences || {}) },
                city: vendor.city,
                serviceCities: [...new Set([...(vendor.serviceCities || []), ...(vendor.businessDetails?.serviceCities || [])])]
            }
        });
    } catch (err) {
        next(err);
    }
};

const cleanNumber = (v, { min = 0, max = Infinity } = {}) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.min(max, Math.max(min, Math.round(n)));
};

/**
 * Validated update for a vendor's service area and lead preferences. Used by the settings page and
 * by registration, so both accept exactly the same input.
 * @returns {Promise<{ set: object } | { error: string }>} dotted $set paths, or the first error
 */
async function buildLeadSettingsUpdate({ serviceArea = {}, leadPreferences = {} } = {}) {
    const set = {};

    if (serviceArea.coverage !== undefined) {
        if (!['pincodes', 'radius', 'districts', 'combined'].includes(serviceArea.coverage)) return { error: 'Choose how you cover your service area' };
        set['serviceArea.coverage'] = serviceArea.coverage;
    }
    if (serviceArea.pincodes !== undefined) {
        const pins = (Array.isArray(serviceArea.pincodes) ? serviceArea.pincodes : String(serviceArea.pincodes).split(/[\s,]+/))
            .map(p => String(p).trim()).filter(Boolean);
        const invalid = pins.filter(p => !isPincode(p));
        if (invalid.length > 0) return { error: `These are not valid PIN codes: ${invalid.slice(0, 5).join(', ')}` };
        const unique = [...new Set(pins)];
        if (unique.length > 300) return { error: 'You can add up to 300 PIN codes' };
        set['serviceArea.pincodes'] = unique;
    }
    if (serviceArea.districts !== undefined) {
        const districts = (Array.isArray(serviceArea.districts) ? serviceArea.districts : String(serviceArea.districts).split(','))
            .map(d => String(d).trim().slice(0, 80)).filter(Boolean);
        set['serviceArea.districts'] = [...new Set(districts.map(d => d.toLowerCase()))]
            .map(lower => districts.find(d => d.toLowerCase() === lower)).slice(0, 60);
    }
    if (serviceArea.radiusKm !== undefined) {
        const radius = cleanNumber(serviceArea.radiusKm, { min: 0, max: 500 });
        if (radius === null) return { error: 'Enter the service radius in km' };
        set['serviceArea.radiusKm'] = radius;
    }
    if (serviceArea.maxTravelKm !== undefined) {
        const travel = cleanNumber(serviceArea.maxTravelKm, { min: 0, max: 2000 });
        if (travel === null) return { error: 'Enter the maximum travel distance in km' };
        set['serviceArea.maxTravelKm'] = travel;
    }
    if (set['serviceArea.radiusKm'] !== undefined && set['serviceArea.maxTravelKm'] !== undefined
        && set['serviceArea.maxTravelKm'] < set['serviceArea.radiusKm']) {
        return { error: 'Maximum travel distance cannot be less than your service radius' };
    }
    if (serviceArea.travelPolicy !== undefined) {
        if (!['Included', 'Separate', 'Depends'].includes(serviceArea.travelPolicy)) return { error: 'Choose how travel is charged' };
        set['serviceArea.travelPolicy'] = serviceArea.travelPolicy;
    }
    if (serviceArea.basePincode !== undefined) {
        const base = String(serviceArea.basePincode || '').trim();
        if (base && !isPincode(base)) return { error: 'Business PIN code must be 6 digits' };
        set['serviceArea.basePincode'] = base;
        if (base) {
            const place = await lookupPincode(base);
            set['serviceArea.baseDistrict'] = place?.district || '';
            set['serviceArea.baseLocation'] = { lat: place?.lat ?? null, lng: place?.lng ?? null };
        } else {
            set['serviceArea.baseDistrict'] = '';
            set['serviceArea.baseLocation'] = { lat: null, lng: null };
        }
    }

    if (leadPreferences.paused !== undefined) set['leadPreferences.paused'] = Boolean(leadPreferences.paused);
    if (leadPreferences.pausedUntil !== undefined) {
        if (leadPreferences.pausedUntil === null || leadPreferences.pausedUntil === '') {
            set['leadPreferences.pausedUntil'] = null;
        } else {
            const until = new Date(leadPreferences.pausedUntil);
            if (isNaN(until.getTime()) || until <= new Date()) return { error: 'Pause end date must be in the future' };
            set['leadPreferences.pausedUntil'] = until;
        }
    }
    if (leadPreferences.minBudget !== undefined) set['leadPreferences.minBudget'] = cleanNumber(leadPreferences.minBudget) ?? 0;
    if (leadPreferences.maxBudget !== undefined) set['leadPreferences.maxBudget'] = cleanNumber(leadPreferences.maxBudget) ?? 0;
    const minB = set['leadPreferences.minBudget'];
    const maxB = set['leadPreferences.maxBudget'];
    if (minB !== undefined && maxB !== undefined && maxB > 0 && maxB < minB) {
        return { error: 'Maximum budget cannot be less than the minimum budget' };
    }
    return { set };
}
exports.buildLeadSettingsUpdate = buildLeadSettingsUpdate;

// @desc    Update service area and lead preferences
// @route   PUT /api/vendor/lead-settings
// @access  Private (Vendor)
exports.updateLeadSettings = async (req, res, next) => {
    try {
        const result = await buildLeadSettingsUpdate(req.body || {});
        if (result.error) return res.status(400).json({ success: false, message: result.error });
        if (Object.keys(result.set).length === 0) {
            return res.status(400).json({ success: false, message: 'Nothing to update' });
        }
        await Vendor.updateOne({ _id: req.vendor.id }, { $set: result.set }, { runValidators: true });
        return exports.getLeadSettings(req, res, next);
    } catch (err) {
        next(err);
    }
};

// @desc    A customer's private reference photo, watermarked for this vendor. Only the vendor
//          currently assigned to the lead can open it; every view is logged.
// @route   GET /api/vendor/leads/:id/photos/:photoId
// @access  Private (Vendor)
exports.getLeadPhoto = async (req, res, next) => {
    try {
        const { id, photoId } = req.params;
        if (!isId(id) || !isId(photoId)) return res.status(400).json({ success: false, message: 'Invalid photo' });
        const { vendorCanViewPhotos, streamPhoto, watermarkText } = require('../../services/referencePhoto.service');
        const lead = await Lead.findOne({ _id: id, referencePhotoIds: photoId }).select('vendorId status eventDate').lean();
        if (!lead || !vendorCanViewPhotos(lead, req.vendor.id)) {
            return res.status(403).json({ success: false, message: 'You no longer have access to this photo' });
        }
        const ReferencePhoto = require('../user/ReferencePhoto');
        const photo = await ReferencePhoto.findById(photoId).lean();
        if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

        const ReferencePhotoAccess = require('../user/ReferencePhotoAccess');
        ReferencePhotoAccess.create({ photoId, leadId: id, vendorId: req.vendor.id, ip: req.ip || '' }).catch(() => {});

        await streamPhoto(res, photo, { width: 1200, watermark: watermarkText(req.vendor.businessName) });
    } catch (err) {
        next(err);
    }
};

// @desc    Flag a lead as suspicious (reviewed by the admin; never penalises the customer automatically)
// @route   POST /api/vendor/leads/:id/report
// @access  Private (Vendor)
exports.reportLead = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid lead' });
        const { reason, note } = req.body || {};
        if (!Object.prototype.hasOwnProperty.call(LeadReport.REASONS, reason)) {
            return res.status(400).json({ success: false, message: 'Please choose a reason' });
        }
        // The vendor must hold the lead now or have been offered it
        const lead = await Lead.findById(req.params.id).select('vendorId userId').lean();
        const wasOffered = lead && await LeadOffer.exists({ leadId: lead._id, vendorId: req.vendor.id });
        if (!lead || (String(lead.vendorId) !== String(req.vendor.id) && !wasOffered)) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        try {
            await LeadReport.create({
                leadId: lead._id,
                vendorId: req.vendor.id,
                userId: lead.userId || null,
                reason,
                note: String(note || '').trim().slice(0, 1000)
            });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).json({ success: false, message: 'You have already reported this lead' });
            }
            throw err;
        }
        dispatch.emitToAdmins('lead:reported', { leadId: lead._id });
        res.status(201).json({ success: true, message: 'Thanks. The Utsavo team will review this lead.' });
    } catch (err) {
        next(err);
    }
};
