const mongoose = require('mongoose');
const Enquiry = require('../user/Enquiry');
const Lead = require('../vendor/Lead');
const LeadOffer = require('../vendor/LeadOffer');
const LeadReport = require('../vendor/LeadReport');
const Vendor = require('../vendor/Vendor');
const dispatch = require('../../services/leadDispatch.service');
const { logAdminAction } = require('../../services/audit.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DAY_MS = 24 * 60 * 60 * 1000;

const sendError = (res, err, next) => {
    if (err instanceof dispatch.DispatchError) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    return next(err);
};

// @desc    Requirements with their services; ?attention=1 shows only services that need the team
// @route   GET /api/admin/enquiries?search=&attention=&page=&limit=
// @access  Private/Admin
exports.getEnquiries = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const query = {};

        if (req.query.attention === '1') {
            const ids = await Lead.distinct('enquiryId', { enquiryId: { $ne: null }, status: { $in: ['Unassigned', 'Exploring', 'Details Requested'] } });
            query._id = { $in: ids };
        }
        const search = String(req.query.search || '').trim();
        if (search) {
            const rx = new RegExp(escapeRegex(search), 'i');
            query.$or = [{ contactName: rx }, { contactPhone: rx }, { city: rx }, { pincode: rx }, { district: rx }];
        }

        const [total, enquiries, attentionCount] = await Promise.all([
            Enquiry.countDocuments(query),
            Enquiry.find(query).sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
            Lead.countDocuments({ enquiryId: { $ne: null }, status: 'Unassigned' })
        ]);
        const leads = await Lead.find({ enquiryId: { $in: enquiries.map(e => e._id) } })
            .select('enquiryId category status vendorId assignedType budget dispatch.attempts dispatch.stage dispatch.allowExpandedSearch dispatch.unassignedAt customerDeclines')
            .populate('vendorId', 'businessName city')
            .lean();

        res.status(200).json({
            success: true,
            data: enquiries.map(e => ({
                ...e,
                leadIds: undefined,
                services: leads.filter(l => String(l.enquiryId) === String(e._id)).map(l => ({
                    _id: l._id,
                    category: l.category,
                    status: l.status,
                    budget: l.budget,
                    assignedType: l.assignedType,
                    vendor: l.vendorId ? { _id: l.vendorId._id, businessName: l.vendorId.businessName, city: l.vendorId.city } : null,
                    attempts: l.dispatch?.attempts || 0,
                    stage: l.dispatch?.stage || 1,
                    searchWidened: Boolean(l.dispatch?.allowExpandedSearch),
                    unassignedAt: l.dispatch?.unassignedAt || null,
                    customerDeclines: (l.customerDeclines || []).length
                }))
            })),
            unassignedCount: attentionCount,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Full assignment history of one service lead: every offer, response and reason
// @route   GET /api/admin/leads/:id/history
// @access  Private/Admin
exports.getLeadHistory = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid lead' });
        const lead = await Lead.findById(req.params.id)
            .populate('vendorId', 'businessName city phone')
            .populate('customerDeclines.vendorId', 'businessName')
            .lean();
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

        const [offers, reports] = await Promise.all([
            LeadOffer.find({ leadId: lead._id }).populate('vendorId', 'businessName city').sort('offeredAt').lean(),
            LeadReport.find({ leadId: lead._id }).populate('vendorId', 'businessName').lean()
        ]);

        res.status(200).json({
            success: true,
            data: {
                lead,
                offers: offers.map(o => ({
                    ...o,
                    declineReasonLabel: o.declineReason ? LeadOffer.DECLINE_REASONS[o.declineReason] : null,
                    responseSeconds: o.respondedAt ? Math.round((new Date(o.respondedAt) - new Date(o.deliveredAt || o.offeredAt)) / 1000) : null
                })),
                customerDeclines: (lead.customerDeclines || []).map(d => ({
                    ...d,
                    reasonLabel: dispatch.CUSTOMER_DECLINE_REASONS[d.reason] || d.reason
                })),
                reports
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Offer an unassigned service again (optionally to a wider area)
// @route   POST /api/admin/leads/:id/redispatch   body: { widen?: boolean }
// @access  Private/Admin
exports.redispatchLead = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid lead' });
        const lead = await Lead.findById(req.params.id);
        if (!lead || !lead.enquiryId) return res.status(404).json({ success: false, message: 'Lead not found' });
        if (lead.vendorId || dispatch.TERMINAL_STATUSES.includes(lead.status)) {
            return res.status(400).json({ success: false, message: 'This service already has a vendor or is closed' });
        }
        if (req.body?.widen) await Lead.updateOne({ _id: lead._id }, { $set: { 'dispatch.allowExpandedSearch': true } });
        const offer = await dispatch.dispatchLead(lead._id);

        await logAdminAction({
            admin: req.user,
            action: `Re-dispatched ${lead.category} lead${req.body?.widen ? ' with a wider search' : ''}`,
            entityType: 'Lead',
            entityId: lead._id,
            req
        });

        res.status(200).json({
            success: true,
            message: offer ? 'Offered to the next eligible vendor' : 'No eligible vendor left. Assign one manually.',
            data: { offered: Boolean(offer) }
        });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    Assign a vendor by hand (manual assistance)
// @route   POST /api/admin/leads/:id/assign   body: { vendorId, reason }
// @access  Private/Admin
exports.assignLeadManually = async (req, res, next) => {
    try {
        if (!isId(req.params.id) || !isId(req.body?.vendorId)) {
            return res.status(400).json({ success: false, message: 'Choose a vendor' });
        }
        const lead = await Lead.findById(req.params.id);
        if (!lead || !lead.enquiryId) return res.status(404).json({ success: false, message: 'Lead not found' });
        if (dispatch.TERMINAL_STATUSES.includes(lead.status)) {
            return res.status(400).json({ success: false, message: `This service is already ${lead.status.toLowerCase()}` });
        }
        if (lead.vendorId) {
            return res.status(400).json({ success: false, message: 'This service already has a vendor' });
        }
        const vendor = await Vendor.findOne({ _id: req.body.vendorId, status: 'Approved', isActive: true }).select('businessName').lean();
        if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found or not approved' });

        await dispatch.assignDirectly(lead, vendor._id, { assignedType: 'Manual', by: 'admin', note: String(req.body.reason || 'Assigned by Utsavo team').slice(0, 300) });

        await logAdminAction({
            admin: req.user,
            action: `Manually assigned ${lead.category} lead to ${vendor.businessName}`,
            entityType: 'Lead',
            entityId: lead._id,
            reason: req.body.reason,
            req
        });

        res.status(200).json({ success: true, message: `Assigned to ${vendor.businessName}` });
    } catch (err) {
        sendError(res, err, next);
    }
};

// @desc    Vendors that can be assigned to a lead (same service, area flags shown)
// @route   GET /api/admin/leads/:id/candidates
// @access  Private/Admin
exports.getLeadCandidates = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid lead' });
        const lead = await Lead.findById(req.params.id).lean();
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        // Admin sees every ring, including vendors far away
        const vendors = await dispatch.listAlternativeVendors({ ...lead, dispatch: { ...(lead.dispatch || {}), allowExpandedSearch: true } });
        res.status(200).json({ success: true, data: vendors });
    } catch (err) {
        next(err);
    }
};

// @desc    Fair lead distribution and reason analytics
// @route   GET /api/admin/lead-distribution?days=30
// @access  Private/Admin
exports.getLeadDistribution = async (req, res, next) => {
    try {
        const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
        const since = new Date(Date.now() - days * DAY_MS);

        const [perVendor, declineReasons, customerReasons, leadStatuses, subscribed] = await Promise.all([
            LeadOffer.aggregate([
                { $match: { offeredAt: { $gte: since } } },
                {
                    $group: {
                        _id: '$vendorId',
                        offered: { $sum: 1 },
                        accepted: { $sum: { $cond: [{ $in: ['$status', ['Accepted', 'Lapsed', 'Withdrawn', 'CustomerDeclined']] }, 1, 0] } },
                        declined: { $sum: { $cond: [{ $eq: ['$status', 'Declined'] }, 1, 0] } },
                        missed: { $sum: { $cond: [{ $eq: ['$status', 'Expired'] }, 1, 0] } },
                        lapsed: { $sum: { $cond: [{ $eq: ['$status', 'Lapsed'] }, 1, 0] } },
                        lastOfferedAt: { $max: '$offeredAt' }
                    }
                }
            ]),
            LeadOffer.aggregate([
                { $match: { offeredAt: { $gte: since }, status: 'Declined' } },
                { $group: { _id: '$declineReason', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Lead.aggregate([
                { $match: { 'customerDeclines.at': { $gte: since } } },
                { $unwind: '$customerDeclines' },
                { $match: { 'customerDeclines.at': { $gte: since } } },
                { $group: { _id: '$customerDeclines.reason', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Lead.aggregate([
                { $match: { enquiryId: { $ne: null }, createdAt: { $gte: since } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Vendor.find({ status: 'Approved', isActive: true, 'subscription.status': 'Active' })
                .select('businessName city selectedCategories.categoryName leadPreferences createdAt').lean()
        ]);

        const statsById = new Map(perVendor.map(v => [String(v._id), v]));
        const bookedByVendor = await Lead.aggregate([
            { $match: { vendorId: { $in: subscribed.map(v => v._id) }, status: 'Booked', enquiryId: { $ne: null }, updatedAt: { $gte: since } } },
            { $group: { _id: '$vendorId', count: { $sum: 1 } } }
        ]);
        const bookedById = new Map(bookedByVendor.map(b => [String(b._id), b.count]));
        const now = new Date();

        const vendors = subscribed.map(v => {
            const s = statsById.get(String(v._id)) || {};
            const answerable = (s.accepted || 0) + (s.declined || 0) + (s.missed || 0);
            const prefs = v.leadPreferences || {};
            return {
                _id: v._id,
                businessName: v.businessName,
                city: v.city,
                categories: (v.selectedCategories || []).map(c => c.categoryName).filter(Boolean),
                isNew: now - new Date(v.createdAt) < 60 * DAY_MS,
                paused: Boolean(prefs.paused && (!prefs.pausedUntil || new Date(prefs.pausedUntil) > now)),
                offered: s.offered || 0,
                accepted: s.accepted || 0,
                declined: s.declined || 0,
                missed: s.missed || 0,
                lapsed: s.lapsed || 0,
                booked: bookedById.get(String(v._id)) || 0,
                acceptanceRate: answerable ? Math.round(((s.accepted || 0) / answerable) * 100) : null,
                lastOfferedAt: s.lastOfferedAt || null
            };
        }).sort((a, b) => b.offered - a.offered);

        const offeredCounts = vendors.map(v => v.offered);
        res.status(200).json({
            success: true,
            data: {
                periodDays: days,
                vendors,
                fairness: {
                    subscribedVendors: vendors.length,
                    vendorsWithNoOffers: vendors.filter(v => v.offered === 0).length,
                    maxOffers: offeredCounts.length ? Math.max(...offeredCounts) : 0,
                    avgOffers: offeredCounts.length ? Math.round((offeredCounts.reduce((a, b) => a + b, 0) / offeredCounts.length) * 10) / 10 : 0
                },
                vendorDeclineReasons: declineReasons.map(r => ({ reason: r._id, label: LeadOffer.DECLINE_REASONS[r._id] || r._id, count: r.count })),
                customerDeclineReasons: customerReasons.map(r => ({ reason: r._id, label: dispatch.CUSTOMER_DECLINE_REASONS[r._id] || r._id, count: r.count })),
                leadStatuses: leadStatuses.map(s => ({ status: s._id, count: s.count }))
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Leads vendors flagged as suspicious
// @route   GET /api/admin/lead-reports?status=
// @access  Private/Admin
exports.getLeadReports = async (req, res, next) => {
    try {
        const query = {};
        if (['Pending', 'Reviewed', 'Dismissed'].includes(req.query.status)) query.status = req.query.status;
        const reports = await LeadReport.find(query)
            .populate('vendorId', 'businessName phone')
            .populate('userId', 'name email phone')
            .populate('leadId', 'category eventDate city eventType status')
            .sort('-createdAt')
            .limit(200)
            .lean();
        const pending = await LeadReport.countDocuments({ status: 'Pending' });
        res.status(200).json({
            success: true,
            data: reports.map(r => ({ ...r, reasonLabel: LeadReport.REASONS[r.reason] || r.reason })),
            pendingCount: pending
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Review a lead report
// @route   PUT /api/admin/lead-reports/:id   body: { status, adminNotes }
// @access  Private/Admin
exports.updateLeadReport = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid report' });
        const { status, adminNotes } = req.body || {};
        if (!['Reviewed', 'Dismissed', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const report = await LeadReport.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status,
                    adminNotes: String(adminNotes || '').trim().slice(0, 2000),
                    reviewedAt: status === 'Pending' ? null : new Date()
                }
            },
            { new: true }
        );
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        await logAdminAction({
            admin: req.user,
            action: `Marked lead report as ${status}`,
            entityType: 'Lead',
            entityId: report.leadId,
            reason: adminNotes,
            req
        });
        res.status(200).json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
};
