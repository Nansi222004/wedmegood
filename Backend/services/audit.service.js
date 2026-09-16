const AdminLog = require('../modules/admin/AdminLog');

// Sensitive keys to redact recursively
const SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'otp',
    'emailotp',
    'phoneotp',
    'resetpasswordtoken',
    'passwordresettoken',
    'passwordresetexpires',
    'token',
    'accesstoken',
    'refreshtoken',
    'authorization',
    'bankaccountnumber',
    'accountnumber',
    'ifsc',
    'razorpaysecret',
    'apikey',
    'secret'
]);

/**
 * Recursively sanitize an object by stripping sensitive fields.
 * Prevents password/token/credential archiving in audit logs.
 */
function sanitizeForAudit(obj, depth = 0) {
    if (!obj || depth > 6) return obj;
    if (typeof obj !== 'object') return obj;

    // Handle mongoose document or lean object
    const plain = typeof obj.toObject === 'function' ? obj.toObject() : obj;

    if (Array.isArray(plain)) {
        return plain.map(item => sanitizeForAudit(item, depth + 1));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(plain)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.has(lowerKey)) {
            // Strip out completely
            continue;
        }

        if (lowerKey === 'bank' && value && typeof value === 'object') {
            // Keep safe summary without raw account number or secret
            sanitized[key] = {
                accountName: value.accountName || undefined,
                upiId: value.upiId || undefined,
                hasAccount: Boolean(value.accountNumber)
            };
            continue;
        }

        if (value && typeof value === 'object') {
            sanitized[key] = sanitizeForAudit(value, depth + 1);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Record an append-only audit event in AdminLog.
 */
async function logAdminAction({
    admin,
    action,
    entityType = 'System',
    entityId = null,
    before = null,
    after = null,
    reason = '',
    target = 'System',
    level = 'Info',
    req = null,
    metadata = null
}) {
    try {
        const adminId = admin?._id || admin?.id || null;
        const adminName = admin?.name || admin?.fullName || 'Admin';
        const adminEmail = admin?.email || null;

        const ip = req?.ip || req?.headers?.['x-forwarded-for'] || 'Local';
        const userAgent = req?.headers?.['user-agent'] || '';

        await AdminLog.create({
            user: adminName,
            adminId,
            adminEmail,
            action,
            entityType,
            entityId: entityId ? entityId.toString() : null,
            targetId: entityId ? entityId.toString() : null,
            before: sanitizeForAudit(before),
            after: sanitizeForAudit(after),
            reason,
            target: target || entityType,
            level,
            ip,
            userAgent,
            metadata: sanitizeForAudit(metadata)
        });
    } catch (err) {
        console.error('Failed to write admin audit log:', err);
    }
}

module.exports = {
    sanitizeForAudit,
    logAdminAction
};
