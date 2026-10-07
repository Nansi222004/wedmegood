const Vendor = require('../modules/vendor/Vendor');
const Category = require('../modules/admin/Category');
const RoundRobinSequence = require('../modules/vendor/RoundRobinSequence');
const VendorAllocation = require('../modules/user/VendorAllocation');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Resolve a category name or slug to its category document, the vendor query for it,
 * and a stable key for the rotation.
 */
async function resolveCategory(category = '') {
    const raw = String(category || '').trim();
    const catDoc = raw
        ? await Category.findOne({
            $or: [
                { slug: raw.toLowerCase() },
                { name: new RegExp(`^${escapeRegex(raw)}$`, 'i') },
                { name: new RegExp(`^${escapeRegex(raw.replace(/-/g, ' '))}$`, 'i') }
            ]
        })
        : null;

    const filter = catDoc
        ? {
            $or: [
                { 'selectedCategories.categoryId': catDoc._id },
                { 'selectedCategories.categoryName': new RegExp(`^${escapeRegex(catDoc.name)}$`, 'i') },
                { 'services.category': new RegExp(`^${escapeRegex(catDoc.name)}$`, 'i') },
                { 'services.name': new RegExp(escapeRegex(raw), 'i') }
            ]
        }
        : {
            $or: [
                { 'selectedCategories.categoryName': new RegExp(escapeRegex(raw.replace(/-/g, ' ')), 'i') },
                { 'services.category': new RegExp(escapeRegex(raw.replace(/-/g, ' ')), 'i') },
                { 'services.name': new RegExp(escapeRegex(raw.replace(/-/g, ' ')), 'i') }
            ]
        };

    const categoryKey = (catDoc ? catDoc.slug || catDoc.name : raw || 'general').toLowerCase();
    return { catDoc, filter, categoryKey };
}

// Rotation order: the vendor who paid for a subscription first comes first.
const paidAt = (vendor) => new Date(
    vendor.subscription?.firstPaidAt || vendor.subscription?.startDate || vendor.createdAt || 0
).getTime();

const sortKeyOf = (vendor) => `${String(paidAt(vendor)).padStart(15, '0')}_${vendor._id.toString()}`;

/**
 * Approved, active, subscribed vendors of a category, in rotation order.
 * When a city is given and some vendors serve it, only those are returned.
 */
async function getEligibleVendors(category, city) {
    const { filter, categoryKey } = await resolveCategory(category);
    const vendors = await Vendor.find({
        status: 'Approved',
        isActive: true,
        'subscription.status': 'Active',
        ...filter
    })
        .select('_id businessName city serviceCities businessDetails.serviceCities subscription.firstPaidAt subscription.startDate createdAt')
        .lean();

    vendors.sort((a, b) => (sortKeyOf(a) < sortKeyOf(b) ? -1 : sortKeyOf(a) > sortKeyOf(b) ? 1 : 0));

    const cityName = String(city || '').trim().toLowerCase();
    if (cityName) {
        const serves = (v) => [v.city, ...(v.serviceCities || []), ...(v.businessDetails?.serviceCities || [])]
            .some(c => String(c || '').trim().toLowerCase() === cityName);
        const local = vendors.filter(serves);
        if (local.length > 0) {
            return { vendors: local, categoryKey, rotationKey: `${categoryKey}@${cityName}` };
        }
    }

    return { vendors, categoryKey, rotationKey: categoryKey };
}

// The vendor after the last one assigned; wraps around to the start of the list.
function nextInRotation(vendors, sequence) {
    const lastId = sequence?.lastAssignedVendorId?.toString();
    const lastIndex = lastId ? vendors.findIndex(v => v._id.toString() === lastId) : -1;
    if (lastIndex >= 0) return vendors[(lastIndex + 1) % vendors.length];

    // The last vendor is no longer eligible: continue from where it sat in the order
    if (sequence?.lastAssignedSortKey) {
        const after = vendors.find(v => sortKeyOf(v) > sequence.lastAssignedSortKey);
        if (after) return after;
    }
    return vendors[0];
}

/**
 * Take the next vendor from a rotation and record it. Safe under concurrent requests:
 * the pointer only moves if nobody else moved it since we read it.
 */
async function takeNextVendor(rotationKey, vendors) {
    if (!vendors || vendors.length === 0) return null;

    for (let attempt = 0; attempt < 5; attempt++) {
        const sequence = await RoundRobinSequence.findOneAndUpdate(
            { categoryKey: rotationKey },
            { $setOnInsert: { categoryKey: rotationKey } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        const next = nextInRotation(vendors, sequence);
        const moved = await RoundRobinSequence.findOneAndUpdate(
            { _id: sequence._id, lastAssignedVendorId: sequence.lastAssignedVendorId || null },
            {
                $set: {
                    lastAssignedVendorId: next._id,
                    lastAssignedSortKey: sortKeyOf(next),
                    lastAssignedAt: new Date()
                },
                $inc: { currentIndex: 1 }
            },
            { new: true }
        );
        if (moved) return next;
    }

    // Heavy contention: still give the user a vendor rather than failing the request
    const sequence = await RoundRobinSequence.findOne({ categoryKey: rotationKey }).lean();
    return nextInRotation(vendors, sequence);
}

/**
 * The vendor assigned to this user for a category. Assigns the next vendor in the
 * rotation the first time, or when the previously assigned vendor is no longer eligible.
 * @returns {Promise<{ vendorId: any, categoryKey: string, isNew: boolean } | null>}
 */
async function getOrAssignVendorForUser(userId, category, city) {
    const { vendors, categoryKey, rotationKey } = await getEligibleVendors(category, city);
    if (vendors.length === 0) return null;

    const existing = await VendorAllocation.findOne({ userId, categoryKey }).lean();
    if (existing && vendors.some(v => v._id.toString() === existing.vendorId.toString())) {
        return { vendorId: existing.vendorId, categoryKey, isNew: false };
    }

    const next = await takeNextVendor(rotationKey, vendors);
    try {
        await VendorAllocation.findOneAndUpdate(
            { userId, categoryKey },
            { $set: { vendorId: next._id, rotationKey } },
            { upsert: true }
        );
    } catch (err) {
        // Two first visits at once: keep whichever allocation was saved first
        if (err.code === 11000) {
            const saved = await VendorAllocation.findOne({ userId, categoryKey }).lean();
            if (saved) return { vendorId: saved.vendorId, categoryKey, isNew: false };
        }
        throw err;
    }
    return { vendorId: next._id, categoryKey, isNew: true };
}

module.exports = {
    resolveCategory,
    getEligibleVendors,
    takeNextVendor,
    getOrAssignVendorForUser
};
