const PincodeLocation = require('../modules/user/PincodeLocation');

const TIMEOUT_MS = 6000;
// A PIN code that could not be resolved is retried after this long
const NOT_FOUND_RETRY_MS = 24 * 60 * 60 * 1000;

const isPincode = (value) => /^\d{6}$/.test(String(value || '').trim());

async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return null;
        return await res.json();
    } catch (_) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

// India Post: district, state and post office names for a PIN code
async function fetchPostOffices(pincode) {
    const data = await fetchJson(`https://api.postalpincode.in/pincode/${pincode}`);
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry || entry.Status !== 'Success' || !Array.isArray(entry.PostOffice) || entry.PostOffice.length === 0) {
        return null;
    }
    const offices = entry.PostOffice;
    const first = offices[0];
    return {
        city: first.Block && first.Block !== 'NA' ? first.Block : (first.Region || first.District || ''),
        district: first.District || '',
        state: first.State || '',
        places: offices.map(o => o.Name).filter(Boolean).slice(0, 30)
    };
}

// Open-Meteo geocoding: tries the PIN code itself, then the district
async function fetchCoordinates(pincode, place) {
    const tries = [pincode, place?.places?.[0] && `${place.places[0]}`, place?.district].filter(Boolean);
    for (const name of tries) {
        const data = await fetchJson(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json&countryCode=IN`
        );
        const results = data?.results || [];
        const state = String(place?.state || '').toLowerCase();
        const match = results.find(r => !state || String(r.admin1 || '').toLowerCase() === state) || results[0];
        if (match && Number.isFinite(match.latitude) && Number.isFinite(match.longitude)) {
            return { lat: match.latitude, lng: match.longitude };
        }
    }
    return { lat: null, lng: null };
}

/**
 * City, district, state and approximate coordinates of an Indian PIN code.
 * Looked up once and cached. Never throws; returns null when the PIN code is unknown.
 * @param {string} pincode
 * @returns {Promise<{pincode:string, city:string, district:string, state:string, places:string[], lat:number|null, lng:number|null}|null>}
 */
async function lookupPincode(pincode) {
    const code = String(pincode || '').trim();
    if (!isPincode(code)) return null;

    try {
        const cached = await PincodeLocation.findOne({ pincode: code }).lean();
        if (cached && cached.found) return cached;
        if (cached && !cached.found && Date.now() - new Date(cached.fetchedAt).getTime() < NOT_FOUND_RETRY_MS) {
            return null;
        }

        const place = await fetchPostOffices(code);
        if (!place) {
            await PincodeLocation.updateOne(
                { pincode: code },
                { $set: { found: false, fetchedAt: new Date() } },
                { upsert: true }
            );
            return null;
        }

        const coords = await fetchCoordinates(code, place);
        const saved = await PincodeLocation.findOneAndUpdate(
            { pincode: code },
            { $set: { ...place, ...coords, found: true, fetchedAt: new Date() } },
            { upsert: true, new: true }
        ).lean();
        return saved;
    } catch (err) {
        console.warn('pincode.service: lookup failed:', err.message);
        return null;
    }
}

/**
 * Straight-line distance in km between two points. Not a road distance: shown as an estimate.
 */
function distanceKm(a, b) {
    if (!a || !b || !Number.isFinite(a.lat) || !Number.isFinite(a.lng) || !Number.isFinite(b.lat) || !Number.isFinite(b.lng)) {
        return null;
    }
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

module.exports = { isPincode, lookupPincode, distanceKm };
