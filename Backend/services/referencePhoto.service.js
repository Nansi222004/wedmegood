const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const mongoose = require('mongoose');
const ReferencePhoto = require('../modules/user/ReferencePhoto');
const { getPrivateImageFetchUrl, REFERENCE_PHOTO_DIR } = require('../utils/cloudinary');

const MAX_PHOTOS_PER_SERVICE = 10;
// A vendor can see the photos while working on the lead, and up to this long after the event
const VENDOR_ACCESS_AFTER_EVENT_DAYS = 30;
const VENDOR_CLOSED_STATUSES = ['Closed', 'Cancelled', 'Rejected'];

// Private media must never be cached by shared caches, embedded elsewhere or offered as a download
const PRIVATE_HEADERS = {
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'same-site'
};

/** Keeps only photo ids that belong to this customer (in the order given, at most 10). */
async function ownedPhotoIds(userId, ids) {
    const list = (Array.isArray(ids) ? ids : [])
        .map(String)
        .filter(id => mongoose.Types.ObjectId.isValid(id));
    const unique = [...new Set(list)].slice(0, MAX_PHOTOS_PER_SERVICE);
    if (unique.length === 0) return [];
    const owned = await ReferencePhoto.find({ _id: { $in: unique }, userId }).select('_id').lean();
    const ownedSet = new Set(owned.map(p => String(p._id)));
    return unique.filter(id => ownedSet.has(id)).map(id => new mongoose.Types.ObjectId(id));
}

/** Watermark text: letters, digits and spaces only (it goes into a Cloudinary text overlay). */
const watermarkText = (label) => `Utsavo  ${String(label || 'Vendor').replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 40)}  Private`;

/**
 * Sends the image bytes. The Cloudinary URL is fetched here on the server and never reaches the browser.
 * @param {import('express').Response} res
 * @param {object} photo ReferencePhoto document
 * @param {{ width?: number, watermark?: string }} [options]
 */
async function streamPhoto(res, photo, options = {}) {
    if (photo.publicId) {
        const url = getPrivateImageFetchUrl(photo.publicId, options);
        if (url) {
            const upstream = await fetch(url);
            if (!upstream.ok || !upstream.body) {
                return res.status(502).json({ success: false, message: 'Photo is temporarily unavailable' });
            }
            res.set({ ...PRIVATE_HEADERS, 'Content-Type': upstream.headers.get('content-type') || 'image/jpeg' });
            return Readable.fromWeb(upstream.body).pipe(res);
        }
    }
    if (photo.storagePath) {
        const resolved = path.resolve(photo.storagePath);
        if (resolved.startsWith(path.resolve(REFERENCE_PHOTO_DIR) + path.sep) && fs.existsSync(resolved)) {
            res.set({ ...PRIVATE_HEADERS, 'Content-Type': photo.mimeType || 'image/jpeg' });
            return res.sendFile(resolved);
        }
    }
    return res.status(404).json({ success: false, message: 'Photo not found' });
}

/** Whether the vendor may still open a lead's reference photos. */
function vendorCanViewPhotos(lead, vendorId) {
    if (!lead || !lead.vendorId || String(lead.vendorId) !== String(vendorId)) return false;
    if (VENDOR_CLOSED_STATUSES.includes(lead.status)) return false;
    const cutoff = new Date(lead.eventDate).getTime() + VENDOR_ACCESS_AFTER_EVENT_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() <= cutoff;
}

module.exports = {
    MAX_PHOTOS_PER_SERVICE,
    ownedPhotoIds,
    watermarkText,
    streamPhoto,
    vendorCanViewPhotos
};
