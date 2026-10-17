const mongoose = require('mongoose');
const Enquiry = require('./Enquiry');
const Lead = require('../vendor/Lead');
const Quote = require('../vendor/Quote');
const Booking = require('../vendor/Booking');
const Vendor = require('../vendor/Vendor');
const Category = require('../admin/Category');
const dispatch = require('../../services/leadDispatch.service');
const { lookupPincode, isPincode, distanceKm } = require('../../services/pincode.service');
const { getDispatchSettings } = require('../../services/platformSettings.service');
const { ownedPhotoIds } = require('../../services/referencePhoto.service');
const { photoUrlFor } = require('./referencePhoto.controller');

const MAX_SERVICES = 15;
const OPEN_FOR_DUPLICATES = { $nin: ['Closed', 'Cancelled', 'Rejected'] };

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
};
const cleanText = (v, max) => String(v || '').trim().slice(0, max);

const sendError = (res, err, next) => {
    if (err instanceof dispatch.DispatchError) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    return next(err);
};

async function findOwnedLead(req) {
    const { id, leadId } = req.params;
    if (!isId(id) || !isId(leadId)) return null;
    return Lead.findOne({ _id: leadId, enquiryId: id, userId: req.user._id });
}

// @desc    City, district and state for a PIN code
// @route   GET /api/user/pincode/:pincode
// @access  Private (User)
exports.lookupPincode = async (req, res, next) => {
    try {
        if (!isPincode(req.params.pincode)) {
            return res.status(400).json({ success: false, message: 'Enter a valid 6-digit PIN code' });
        }
        const place = await lookupPincode(req.params.pincode);
        if (!place) {
            return res.status(404).json({ success: false, message: 'PIN code not found. Please check it or type the city and district.' });
        }
        res.status(200).json({
            success: true,
            data: { pincode: place.pincode, city: place.city, district: place.district, state: place.state, places: place.places || [] }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Form options: event types, services and the decline reasons
// @route   GET /api/user/enquiries/options
// @access  Private (User)
exports.getEnquiryOptions = async (req, res, next) => {
    try {
        const [categories, settings] = await Promise.all([
            Category.find({ isActive: true }).select('name slug image').sort({ order: 1, name: 1 }).lean(),
            getDispatchSettings()
        ]);
        res.status(200).json({
            success: true,
            data: {
                eventTypes: Enquiry.EVENT_TYPES,
                services: categories.map(c => ({ name: c.name, slug: c.slug, image: c.image || null })),
                customerDeclineReasons: Object.entries(dispatch.CUSTOMER_DECLINE_REASONS).map(([value, label]) => ({ value, label })),
                reassignLimit: settings.leadCustomerReassignLimit,
                offerWindowSeconds: settings.leadOfferWindowSeconds
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Submit an event requirement. Each service becomes its own lead and is offered to vendors.
// @route   POST /api/user/enquiries
// @access  Private (User)
exports.createEnquiry = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user.isPhoneVerified) {
            return res.status(403).json({ success: false, message: 'Please verify your mobile number before posting a requirement.' });
        }

        const body = req.body || {};
        const eventType = String(body.eventType || '').trim();
        if (!Enquiry.EVENT_TYPES.includes(eventType)) {
            return res.status(400).json({ success: false, message: 'Please choose the type of event' });
        }

        const eventDate = new Date(body.eventDate);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (!body.eventDate || isNaN(eventDate.getTime()) || eventDate < today) {
            return res.status(400).json({ success: false, message: 'Please choose an event date from today onwards' });
        }

        const pincode = String(body.pincode || '').trim();
        if (!isPincode(pincode)) {
            return res.status(400).json({ success: false, message: 'Please enter the 6-digit PIN code of the event venue' });
        }

        // Services: one lead per service, validated against the approved categories
        const requested = Array.isArray(body.services) ? body.services : [];
        if (requested.length === 0) {
            return res.status(400).json({ success: false, message: 'Please choose at least one service you need' });
        }
        if (requested.length > MAX_SERVICES) {
            return res.status(400).json({ success: false, message: `You can request up to ${MAX_SERVICES} services in one requirement` });
        }
        const categories = await Category.find({ isActive: true }).select('name slug').lean();
        const services = [];
        const seen = new Set();
        for (const s of requested) {
            const key = String(s?.category || '').trim().toLowerCase();
            const cat = categories.find(c => c.name.toLowerCase() === key || c.slug === key);
            if (!cat) {
                return res.status(400).json({ success: false, message: `"${s?.category || ''}" is not a service offered on Utsavo` });
            }
            if (seen.has(cat.name)) continue;
            seen.add(cat.name);
            services.push({
                category: cat.name,
                budget: toNumber(s.budget),
                requirements: cleanText(s.requirements, 2000),
                // Only private photos this customer uploaded; public links are not accepted
                referencePhotoIds: await ownedPhotoIds(user._id, s.referencePhotoIds)
            });
        }

        // Abuse control: daily limit and duplicate requirements
        const settings = await getDispatchSettings();
        const recent = await Enquiry.countDocuments({ userId: user._id, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
        if (recent >= settings.enquiryDailyLimit) {
            return res.status(429).json({ success: false, message: 'You have posted the maximum number of requirements for today. Please try again tomorrow or update an existing requirement.' });
        }

        const dayStart = new Date(eventDate);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const duplicates = await Lead.find({
            userId: user._id,
            category: { $in: services.map(s => new RegExp(`^${escapeRegex(s.category)}$`, 'i')) },
            eventDate: { $gte: dayStart, $lt: dayEnd },
            status: OPEN_FOR_DUPLICATES
        }).select('category enquiryId').lean();
        if (duplicates.length > 0) {
            const names = [...new Set(duplicates.map(d => d.category))].join(', ');
            return res.status(409).json({
                success: false,
                code: 'DUPLICATE_ENQUIRY',
                message: `You already have an open requirement for ${names} on this date. Open it from My Requirements instead of posting it again.`,
                data: { enquiryIds: [...new Set(duplicates.map(d => String(d.enquiryId)).filter(id => id !== 'null'))] }
            });
        }

        // Location: PIN code lookup fills in what the customer did not type
        const place = await lookupPincode(pincode);
        const city = cleanText(body.city, 80) || place?.city || place?.district || '';
        if (!city) {
            return res.status(400).json({ success: false, message: 'Please enter the city of the event' });
        }
        const district = cleanText(body.district, 80) || place?.district || '';
        const lat = Number(body.location?.lat);
        const lng = Number(body.location?.lng);
        const location = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0
            ? { lat, lng }
            : { lat: place?.lat ?? null, lng: place?.lng ?? null };

        const contactName = cleanText(body.contactName, 120) || user.name || 'Customer';
        const enquiry = await Enquiry.create({
            userId: user._id,
            eventType,
            eventTypeOther: eventType === 'Other' ? cleanText(body.eventTypeOther, 80) : '',
            eventDate,
            eventTime: cleanText(body.eventTime, 20),
            venueName: cleanText(body.venueName, 160),
            venueAddress: cleanText(body.venueAddress, 400),
            pincode,
            city,
            district,
            state: place?.state || '',
            location,
            guestCount: toNumber(body.guestCount),
            totalBudget: toNumber(body.totalBudget),
            // The verified number on the account, never a typed one
            contactName,
            contactPhone: user.phone,
            notes: cleanText(body.notes, 2000),
            allowExpandedSearch: Boolean(body.allowExpandedSearch)
        });

        const eventLabel = eventType === 'Other' && enquiry.eventTypeOther ? enquiry.eventTypeOther : eventType;
        const venueTypes = ['Outdoor', 'Indoor', 'Both'];
        const now = new Date();
        const leads = await Lead.insertMany(services.map(s => ({
            vendorId: null,
            userId: user._id,
            enquiryId: enquiry._id,
            customerName: contactName,
            phone: user.phone,
            eventType: eventLabel,
            eventDate,
            eventLocation: [enquiry.venueName, city].filter(Boolean).join(', '),
            pincode,
            city,
            district,
            location,
            message: s.requirements || `${s.category} for ${eventLabel}`,
            category: s.category,
            guestCount: enquiry.guestCount,
            budget: s.budget,
            requirements: [s.requirements, enquiry.notes].filter(Boolean).join('\n\n'),
            venueType: venueTypes.includes(body.venueType) ? body.venueType : 'Not Specified',
            referencePhotoIds: s.referencePhotoIds,
            assignedType: 'System',
            status: 'Awaiting Response',
            dispatch: { allowExpandedSearch: enquiry.allowExpandedSearch },
            statusHistory: [{ status: 'New', note: 'Requirement submitted', by: 'customer', at: now }]
        })));

        enquiry.leadIds = leads.map(l => l._id);
        await enquiry.save();

        // Offer each service to vendors in the background; the sweeper retries anything that fails
        setImmediate(async () => {
            for (const lead of leads) {
                await dispatch.dispatchLead(lead._id).catch(err => console.error('Enquiry dispatch failed:', err.message));
            }
        });

        res.status(201).json({
            success: true,
            message: `Requirement posted. We are finding ${services.length > 1 ? 'vendors for each service' : 'a vendor'} for you.`,
            data: { _id: enquiry._id, services: leads.map(l => ({ _id: l._id, category: l.category })) }
        });
    } catch (err) {
        next(err);
    }
};

const VENDOR_PREVIEW_FIELDS = 'businessName city profileImage portfolio rating reviewCount businessDetails.years pricing.range isVerified serviceArea.travelPolicy serviceArea.baseLocation';

function vendorPreview(vendor, lead) {
    if (!vendor) return null;
    return {
        _id: vendor._id,
        businessName: vendor.businessName,
        city: vendor.city,
        profileImage: vendor.profileImage || vendor.portfolio?.[0]?.url || null,
        portfolio: (vendor.portfolio || []).slice(0, 6).map(p => p.url).filter(Boolean),
        rating: vendor.rating || 0,
        reviewCount: vendor.reviewCount || 0,
        experienceYears: vendor.businessDetails?.years || null,
        priceRange: vendor.pricing?.range || '',
        isVerified: Boolean(vendor.isVerified),
        travelPolicy: vendor.serviceArea?.travelPolicy || 'Depends',
        distanceKm: distanceKm(vendor.serviceArea?.baseLocation, lead.location)
    };
}

/** One service of an enquiry as the customer sees it. */
async function describeServices(leads, settings) {
    const vendorIds = leads.map(l => l.vendorId).filter(Boolean);
    const leadIds = leads.map(l => l._id);
    const [vendors, quotes, bookings] = await Promise.all([
        Vendor.find({ _id: { $in: vendorIds } }).select(VENDOR_PREVIEW_FIELDS).lean(),
        Quote.find({ leadId: { $in: leadIds }, status: { $nin: ['Draft'] } })
            .select('leadId vendorId quotationNumber totalAmount status validUntil sentAt version').sort('-createdAt').lean(),
        Booking.find({ leadId: { $in: leadIds } }).select('leadId status eventDate').lean().catch(() => [])
    ]);
    const vendorById = new Map(vendors.map(v => [String(v._id), v]));

    return leads.map(l => {
        const declines = (l.customerDeclines || []).length;
        const vendor = l.vendorId ? vendorById.get(String(l.vendorId)) : null;
        return {
            _id: l._id,
            category: l.category,
            status: l.status,
            budget: l.budget || 0,
            requirements: l.message && l.message !== `${l.category} for ${l.eventType}` ? l.message : '',
            referencePhotos: [
                ...(l.referencePhotoIds || []).map(id => ({ _id: String(id), url: photoUrlFor(id), private: true })),
                ...(l.referencePhotos || []).map(url => ({ _id: url, url, private: false }))
            ],
            guestCount: l.guestCount || 0,
            venueType: l.venueType,
            assignedType: l.assignedType,
            attempts: l.dispatch?.attempts || 0,
            searchWidened: Boolean(l.dispatch?.allowExpandedSearch),
            acceptedAt: l.dispatch?.acceptedAt || null,
            contactDeadline: l.dispatch?.contactDeadline || null,
            contacted: Boolean(l.dispatch?.firstContactAt) || ['Contacted', 'Quote Sent', 'Booked'].includes(l.status),
            detailsRequest: l.status === 'Details Requested'
                ? { note: l.dispatch?.detailsRequest?.note || '', requestedAt: l.dispatch?.detailsRequest?.requestedAt || null }
                : null,
            customerDeclines: declines,
            canAutoReassign: declines < settings.leadCustomerReassignLimit,
            vendor: vendorPreview(vendor, l),
            quotes: quotes
                .filter(q => String(q.leadId) === String(l._id) && (!l.vendorId || String(q.vendorId) === String(l.vendorId)))
                .map(q => ({ _id: q._id, quotationNumber: q.quotationNumber, totalAmount: q.totalAmount, status: q.status, validUntil: q.validUntil, version: q.version })),
            booking: (bookings || []).find(b => String(b.leadId) === String(l._id)) || null,
            history: (l.statusHistory || []).map(h => ({ status: h.status, note: h.by === 'vendor' && h.status === 'Details Requested' ? h.note : '', at: h.at }))
        };
    });
}

function summarise(services) {
    const count = (fn) => services.filter(fn).length;
    return {
        total: services.length,
        booked: count(s => s.status === 'Booked'),
        withVendor: count(s => Boolean(s.vendor)),
        searching: count(s => s.status === 'Awaiting Response'),
        needsAction: count(s => ['Details Requested', 'Unassigned', 'Exploring'].includes(s.status) || s.quotes.some(q => q.status === 'Sent'))
    };
}

// @desc    The customer's requirements with a per-service summary
// @route   GET /api/user/enquiries
// @access  Private (User)
exports.getMyEnquiries = async (req, res, next) => {
    try {
        const [enquiries, settings] = await Promise.all([
            Enquiry.find({ userId: req.user._id }).sort('-createdAt').limit(100).lean(),
            getDispatchSettings()
        ]);
        const leads = await Lead.find({ enquiryId: { $in: enquiries.map(e => e._id) } }).lean();
        const services = await describeServices(leads, settings);
        const byEnquiry = new Map();
        leads.forEach((l, i) => {
            const key = String(l.enquiryId);
            if (!byEnquiry.has(key)) byEnquiry.set(key, []);
            byEnquiry.get(key).push(services[i]);
        });

        res.status(200).json({
            success: true,
            data: enquiries.map(e => {
                const list = byEnquiry.get(String(e._id)) || [];
                return {
                    _id: e._id,
                    eventType: e.eventType === 'Other' && e.eventTypeOther ? e.eventTypeOther : e.eventType,
                    eventDate: e.eventDate,
                    city: e.city,
                    pincode: e.pincode,
                    status: e.status,
                    createdAt: e.createdAt,
                    services: list.map(s => ({ _id: s._id, category: s.category, status: s.status, vendorName: s.vendor?.businessName || null })),
                    summary: summarise(list)
                };
            })
        });
    } catch (err) {
        next(err);
    }
};

// @desc    One requirement: the unified event dashboard
// @route   GET /api/user/enquiries/:id
// @access  Private (User)
exports.getEnquiry = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid requirement' });
        const enquiry = await Enquiry.findOne({ _id: req.params.id, userId: req.user._id }).lean();
        if (!enquiry) return res.status(404).json({ success: false, message: 'Requirement not found' });

        const [leads, settings] = await Promise.all([
            Lead.find({ enquiryId: enquiry._id }).sort('createdAt').lean(),
            getDispatchSettings()
        ]);
        const services = await describeServices(leads, settings);

        res.status(200).json({
            success: true,
            data: {
                ...enquiry,
                leadIds: undefined,
                services,
                summary: summarise(services),
                reassignLimit: settings.leadCustomerReassignLimit
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a service's details. If a vendor asked for them, the lead goes back to that vendor.
// @route   PUT /api/user/enquiries/:id/services/:leadId
// @access  Private (User)
exports.updateServiceDetails = async (req, res, next) => {
    try {
        const lead = await findOwnedLead(req);
        if (!lead) return res.status(404).json({ success: false, message: 'Service not found' });
        if (dispatch.TERMINAL_STATUSES.includes(lead.status)) {
            return res.status(400).json({ success: false, message: `This service is already ${lead.status.toLowerCase()}` });
        }

        const { requirements, budget, guestCount, referencePhotoIds, venueType } = req.body || {};
        const set = {};
        if (requirements !== undefined) {
            set.message = cleanText(requirements, 2000) || lead.message;
            set.requirements = cleanText(requirements, 2000);
        }
        if (budget !== undefined) set.budget = toNumber(budget);
        if (guestCount !== undefined) set.guestCount = toNumber(guestCount);
        if (referencePhotoIds !== undefined) set.referencePhotoIds = await ownedPhotoIds(req.user._id, referencePhotoIds);
        if (venueType !== undefined && ['Outdoor', 'Indoor', 'Both', 'Not Specified'].includes(venueType)) set.venueType = venueType;
        if (Object.keys(set).length === 0) {
            return res.status(400).json({ success: false, message: 'Nothing to update' });
        }

        const updated = await Lead.findOneAndUpdate(
            { _id: lead._id },
            { $set: set, $push: { statusHistory: { status: lead.status, note: 'Customer updated the details', by: 'customer' } } },
            { new: true }
        );
        if (updated.status === 'Details Requested') {
            await dispatch.resubmitDetails(updated);
        } else if (updated.vendorId) {
            const Notification = require('../vendor/Notification');
            await Notification.create({
                vendorId: updated.vendorId,
                message: `The customer updated the details of the ${updated.category} requirement for ${new Date(updated.eventDate).toLocaleDateString('en-IN')}.`,
                type: 'Lead'
            }).catch(() => {});
        }

        res.status(200).json({ success: true, message: 'Details updated', data: { _id: updated._id, status: (await Lead.findById(updated._id).select('status').lean()).status } });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    Decline the assigned vendor with a reason; Utsavo finds another or the customer explores
// @route   POST /api/user/enquiries/:id/services/:leadId/decline
// @access  Private (User)
exports.declineVendor = async (req, res, next) => {
    try {
        const lead = await findOwnedLead(req);
        if (!lead) return res.status(404).json({ success: false, message: 'Service not found' });
        const { reason, note, next: nextStep } = req.body || {};
        const result = await dispatch.customerDeclineVendor(lead, { reason, note, next: nextStep === 'explore' ? 'explore' : 'auto' });
        res.status(200).json({
            success: true,
            message: result.reassigned
                ? 'Thanks. We are finding another vendor for you.'
                : 'Thanks. Choose a vendor from the list.',
            data: { status: result.lead.status, reassigned: result.reassigned, reassignLimitReached: result.reassignLimitReached }
        });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    Explore other vendors for a service (excludes the assigned vendor, enforced here)
// @route   GET /api/user/enquiries/:id/services/:leadId/alternatives
// @access  Private (User)
exports.getAlternatives = async (req, res, next) => {
    try {
        const lead = await findOwnedLead(req);
        if (!lead) return res.status(404).json({ success: false, message: 'Service not found' });
        const vendors = await dispatch.listAlternativeVendors(lead);
        res.status(200).json({ success: true, data: vendors });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    Choose a vendor from the alternatives
// @route   POST /api/user/enquiries/:id/services/:leadId/select
// @access  Private (User)
exports.selectVendor = async (req, res, next) => {
    try {
        const lead = await findOwnedLead(req);
        if (!lead) return res.status(404).json({ success: false, message: 'Service not found' });
        if (!isId(req.body?.vendorId)) return res.status(400).json({ success: false, message: 'Please choose a vendor' });
        await dispatch.customerSelectVendor(lead, req.body.vendorId);
        res.status(200).json({ success: true, message: 'Vendor selected. They have been notified and will contact you.' });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    Allow vendors from further away / search again
// @route   POST /api/user/enquiries/:id/services/:leadId/widen
// @access  Private (User)
exports.widenSearch = async (req, res, next) => {
    try {
        const lead = await findOwnedLead(req);
        if (!lead) return res.status(404).json({ success: false, message: 'Service not found' });
        await dispatch.widenSearch(lead);
        const fresh = await Lead.findById(lead._id).select('status').lean();
        res.status(200).json({
            success: true,
            message: fresh.status === 'Awaiting Response' ? 'Searching a wider area for you.' : 'No vendor is available in the wider area yet. You can choose one yourself.',
            data: { status: fresh.status }
        });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    Withdraw one service
// @route   POST /api/user/enquiries/:id/services/:leadId/cancel
// @access  Private (User)
exports.cancelService = async (req, res, next) => {
    try {
        const lead = await findOwnedLead(req);
        if (!lead) return res.status(404).json({ success: false, message: 'Service not found' });
        await dispatch.cancelLead(lead);
        res.status(200).json({ success: true, message: 'Service removed from your requirement' });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    Cancel the whole requirement (booked services stay booked)
// @route   POST /api/user/enquiries/:id/cancel
// @access  Private (User)
exports.cancelEnquiry = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid requirement' });
        const enquiry = await Enquiry.findOne({ _id: req.params.id, userId: req.user._id });
        if (!enquiry) return res.status(404).json({ success: false, message: 'Requirement not found' });

        const leads = await Lead.find({ enquiryId: enquiry._id, status: { $nin: dispatch.TERMINAL_STATUSES } });
        for (const lead of leads) await dispatch.cancelLead(lead);
        const booked = await Lead.countDocuments({ enquiryId: enquiry._id, status: 'Booked' });
        enquiry.status = booked > 0 ? 'Closed' : 'Cancelled';
        await enquiry.save();

        res.status(200).json({
            success: true,
            message: booked > 0 ? 'Open services cancelled. Your booked services are not affected.' : 'Requirement cancelled'
        });
    } catch (err) {
        sendError(res, err, next);
    }
};
