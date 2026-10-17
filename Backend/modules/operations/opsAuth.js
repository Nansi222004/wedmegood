const jwt = require('jsonwebtoken');
const Vendor = require('../vendor/Vendor');
const TeamMember = require('./TeamMember');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// What each role may do. The owner may do everything. Money (amounts, wages, P&L, customer
// contact) is 'finance.view' / 'customer.contact' and stays with the owner and the accountant.
const PERMISSIONS = {
    Owner: ['*'],
    Supervisor: ['events.view', 'tasks.manage', 'tasks.verify', 'tasks.own', 'attendance.manage', 'stock.view',
        'gatepass.manage', 'gatepass.receive', 'purchase.request', 'expense.claim', 'packages.view', 'customer.contact'],
    Warehouse: ['events.view', 'stock.view', 'stock.manage', 'gatepass.manage', 'purchase.request', 'purchase.record',
        'expense.claim', 'tasks.own'],
    Crew: ['tasks.own', 'stock.view', 'purchase.request', 'expense.claim'],
    Driver: ['tasks.own', 'gatepass.receive', 'expense.claim'],
    Accountant: ['events.view', 'finance.view', 'expense.manage', 'purchase.record', 'stock.view'],
    SubVendor: ['packages.own']
};

const can = (actor, permission) => {
    const list = PERMISSIONS[actor?.role] || [];
    return list.includes('*') || list.includes(permission);
};

const signTeamToken = (member) => jwt.sign(
    { id: member._id, kind: 'team', vendorId: member.vendorId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
);

const subscriptionLapsed = (vendor) => {
    const sub = vendor.subscription;
    return !sub || sub.status !== 'Active' || (sub.endDate && new Date(sub.endDate) < new Date());
};

/**
 * Lets the vendor owner OR one of the vendor's team members in. Sets req.vendor (the business),
 * req.member (null for the owner) and req.actor ({ kind, id, name, role }).
 * The business must be approved and subscribed for its team to work in the app.
 */
const protectOps = async (req, res, next) => {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token) return res.status(401).json({ success: false, message: 'Please log in' });

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }

        let vendor;
        if (decoded.kind === 'team') {
            const member = await TeamMember.findById(decoded.id).lean();
            if (!member || !member.isActive) {
                return res.status(401).json({ success: false, message: 'This team account is not active. Contact your employer.' });
            }
            vendor = await Vendor.findById(member.vendorId).select('businessName status isActive subscription city').lean();
            if (!vendor) return res.status(401).json({ success: false, message: 'Business not found' });
            req.member = member;
            req.actor = { kind: 'member', id: member._id, name: member.name, role: member.role };
        } else {
            vendor = await Vendor.findById(decoded.id).select('businessName status isActive subscription city').lean();
            if (!vendor) return res.status(401).json({ success: false, message: 'Please log in' });
            req.member = null;
            req.actor = { kind: 'owner', id: vendor._id, name: vendor.businessName, role: 'Owner' };
        }

        if (vendor.isActive === false || vendor.status === 'Suspended') {
            return res.status(403).json({ success: false, message: 'This business account is suspended' });
        }
        if (vendor.status !== 'Approved' || subscriptionLapsed(vendor)) {
            return res.status(403).json({
                success: false,
                subscriptionRequired: true,
                message: 'Event operations need an approved account with an active subscription.'
            });
        }
        vendor.id = String(vendor._id);
        req.vendor = vendor;
        next();
    } catch (err) {
        next(err);
    }
};

/** Route guard: the actor needs at least one of the permissions. */
const allow = (...permissions) => (req, res, next) => {
    if (permissions.some(p => can(req.actor, p))) return next();
    return res.status(403).json({ success: false, message: 'Your role does not have access to this' });
};

const ownerOnly = (req, res, next) => (req.actor?.kind === 'owner'
    ? next()
    : res.status(403).json({ success: false, message: 'Only the business owner can do this' }));

module.exports = { PERMISSIONS, can, allow, ownerOnly, protectOps, signTeamToken };
