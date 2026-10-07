const mongoose = require('mongoose');
const FakeVendorListing = require('./FakeVendorListing');
const FakeVendorAccess = require('../user/FakeVendorAccess');
const Complaint = require('../user/Complaint');
const Vendor = require('../vendor/Vendor');
const { logAdminAction } = require('../../services/audit.service');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const EDITABLE_FIELDS = ['name', 'businessName', 'phone', 'city', 'category', 'reason', 'isPublished'];

function pickListingFields(body) {
    const data = {};
    for (const key of EDITABLE_FIELDS) {
        if (body[key] === undefined) continue;
        data[key] = key === 'isPublished' ? Boolean(body[key]) : String(body[key] ?? '').trim();
    }
    return data;
}

// @desc    Fake vendor listings with access sales stats
// @route   GET /api/admin/fake-vendors?search=&status=
// @access  Private/Admin
exports.getFakeVendorListings = async (req, res, next) => {
    try {
        const { search, status } = req.query;
        const query = {};
        if (status === 'published') query.isPublished = true;
        if (status === 'hidden') query.isPublished = false;
        if (search && String(search).trim()) {
            const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
            query.$or = [{ name: rx }, { businessName: rx }, { phone: rx }, { city: rx }, { category: rx }];
        }

        const [listings, totalListings, published, sales] = await Promise.all([
            FakeVendorListing.find(query).populate('vendorId', 'businessName status').sort('-createdAt').lean(),
            FakeVendorListing.countDocuments(),
            FakeVendorListing.countDocuments({ isPublished: true }),
            FakeVendorAccess.aggregate([
                { $unwind: '$purchases' },
                { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$purchases.amount' } } }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: listings,
            stats: {
                totalListings,
                published,
                accessPurchases: sales[0]?.count || 0,
                accessRevenue: sales[0]?.revenue || 0
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a fake vendor listing by hand
// @route   POST /api/admin/fake-vendors
// @access  Private/Admin
exports.createFakeVendorListing = async (req, res, next) => {
    try {
        const data = pickListingFields(req.body);
        if (!data.name || !data.reason) {
            return res.status(400).json({ success: false, message: 'Name and reason are required' });
        }
        const listing = await FakeVendorListing.create({ ...data, addedBy: req.user._id });

        await logAdminAction({
            admin: req.user,
            action: `Added fake vendor listing: ${listing.name}`,
            entityType: 'FakeVendor',
            entityId: listing._id,
            after: listing.toObject(),
            req
        });

        res.status(201).json({ success: true, data: listing, message: 'Fake vendor listed' });
    } catch (err) {
        next(err);
    }
};

// @desc    Edit, publish or hide a listing
// @route   PUT /api/admin/fake-vendors/:id
// @access  Private/Admin
exports.updateFakeVendorListing = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid listing ID' });
        }
        const listing = await FakeVendorListing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        const before = listing.toObject();
        Object.assign(listing, pickListingFields(req.body));
        await listing.save();

        await logAdminAction({
            admin: req.user,
            action: `Updated fake vendor listing: ${listing.name}`,
            entityType: 'FakeVendor',
            entityId: listing._id,
            before,
            after: listing.toObject(),
            req
        });

        res.status(200).json({ success: true, data: listing, message: 'Listing updated' });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a listing
// @route   DELETE /api/admin/fake-vendors/:id
// @access  Private/Admin
exports.deleteFakeVendorListing = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid listing ID' });
        }
        const listing = await FakeVendorListing.findByIdAndDelete(req.params.id);
        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        await logAdminAction({
            admin: req.user,
            action: `Deleted fake vendor listing: ${listing.name}`,
            entityType: 'FakeVendor',
            entityId: listing._id,
            before: listing.toObject(),
            req
        });

        res.status(200).json({ success: true, message: 'Listing deleted' });
    } catch (err) {
        next(err);
    }
};

// @desc    Confirm a complaint's vendor as fake: list it publicly, resolve the complaint,
//          and optionally suspend the vendor's account
// @route   POST /api/admin/complaints/:id/mark-fake
// @access  Private/Admin
exports.markComplaintVendorAsFake = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
        }
        const reason = String(req.body.reason || '').trim();
        if (!reason) {
            return res.status(400).json({ success: false, message: 'Please describe why this vendor is fake (shown to users)' });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        let identity;
        let vendor = null;
        if (complaint.vendorId) {
            vendor = await Vendor.findById(complaint.vendorId);
            if (!vendor) {
                return res.status(404).json({ success: false, message: 'Vendor on this complaint no longer exists' });
            }
            identity = {
                vendorId: vendor._id,
                name: vendor.fullName || vendor.businessName,
                businessName: vendor.businessName || '',
                phone: vendor.phone || '',
                city: vendor.city || '',
                category: vendor.selectedCategories?.[0]?.categoryName || ''
            };
        } else {
            const ext = complaint.externalVendor || {};
            identity = {
                vendorId: null,
                name: ext.name,
                businessName: ext.businessName || '',
                phone: ext.phone || '',
                city: ext.city || '',
                category: ext.category || ''
            };
        }

        // One listing per vendor: add this complaint to an existing listing when there is one
        const existingQuery = identity.vendorId
            ? { vendorId: identity.vendorId }
            : (identity.phone ? { vendorId: null, phone: identity.phone } : null);
        let listing = existingQuery ? await FakeVendorListing.findOne(existingQuery) : null;
        if (listing) {
            listing.reason = reason;
            listing.isPublished = true;
            if (!listing.complaintIds.some(id => id.equals(complaint._id))) listing.complaintIds.push(complaint._id);
            await listing.save();
        } else {
            listing = await FakeVendorListing.create({
                ...identity,
                reason,
                complaintIds: [complaint._id],
                addedBy: req.user._id
            });
        }

        complaint.status = 'Resolved';
        complaint.resolvedAt = new Date();
        complaint.adminNotes = complaint.adminNotes
            ? `${complaint.adminNotes}\nConfirmed as fake vendor and listed publicly.`
            : 'Confirmed as fake vendor and listed publicly.';
        await complaint.save();

        const suspend = Boolean(req.body.suspendVendor) && vendor;
        if (suspend) {
            vendor.status = 'Suspended';
            vendor.isActive = false;
            await vendor.save({ validateBeforeSave: false });
        }

        await logAdminAction({
            admin: req.user,
            action: `Marked vendor as fake from complaint${suspend ? ' and suspended the account' : ''}: ${listing.name}`,
            entityType: 'FakeVendor',
            entityId: listing._id,
            after: { listingId: listing._id, complaintId: complaint._id, suspended: Boolean(suspend) },
            reason,
            req
        });

        res.status(200).json({
            success: true,
            data: { listing, complaint },
            message: suspend ? 'Vendor listed as fake and suspended' : 'Vendor listed as fake'
        });
    } catch (err) {
        next(err);
    }
};
