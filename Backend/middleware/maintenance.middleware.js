// Backend/middleware/maintenance.middleware.js
const PlatformSettings = require('../modules/admin/PlatformSettings');

// In-memory cache for maintenance mode to prevent database bottlenecks on every request
let cachedMaintenanceMode = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 10000; // 10 seconds TTL

const invalidateMaintenanceCache = () => {
    cachedMaintenanceMode = null;
    cacheExpiresAt = 0;
};

const setCachedMaintenanceMode = (status) => {
    cachedMaintenanceMode = Boolean(status);
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
};

const getMaintenanceStatus = async () => {
    const now = Date.now();
    if (cachedMaintenanceMode !== null && now < cacheExpiresAt) {
        return cachedMaintenanceMode;
    }

    try {
        const settings = await PlatformSettings.findOne({}, 'maintenanceMode').lean();
        cachedMaintenanceMode = Boolean(settings?.maintenanceMode);
        cacheExpiresAt = now + CACHE_TTL_MS;
        return cachedMaintenanceMode;
    } catch (err) {
        console.error('Error reading maintenance mode from PlatformSettings:', err.message);
        // Fail-open for safety so database read errors don't cause an unrecoverable outage
        return false;
    }
};

/**
 * Maintenance Mode Middleware
 * Returns HTTP 503 for non-exempt requests when maintenanceMode is true.
 * Exemptions:
 *  - /health and /api/health
 *  - /api/admin/* and /admin/* (allowing admin login and settings toggle)
 *  - /uploads/* (static assets)
 */
const maintenanceMiddleware = async (req, res, next) => {
    const path = req.path || req.originalUrl || '';

    // Whitelist check
    if (
        path === '/health' ||
        path === '/api/health' ||
        path.startsWith('/api/admin') ||
        path.startsWith('/admin') ||
        path.startsWith('/uploads')
    ) {
        return next();
    }

    try {
        const inMaintenance = await getMaintenanceStatus();

        if (inMaintenance) {
            return res.status(503).json({
                success: false,
                maintenance: true,
                message: 'Platform is currently undergoing scheduled maintenance. Please check back shortly.'
            });
        }

        return next();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    maintenanceMiddleware,
    invalidateMaintenanceCache,
    setCachedMaintenanceMode,
    getMaintenanceStatus
};
