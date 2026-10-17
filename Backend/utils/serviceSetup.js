// What a service needs on site, or offers, so customers can search by it ("outdoor", "needs power")
const SETUP_TAGS = [
    'Indoor',
    'Outdoor',
    'Rain backup',
    'Needs power supply',
    'Brings own generator',
    'Needs water supply',
    'Needs stage area',
    'Needs parking',
    'Quick setup (under 3 hours)',
    'Night setup possible'
];

// Accepts a JSON string or object from multipart forms. Returns undefined when the field was not sent.
const parseCapacity = (raw) => {
    if (raw === undefined) return undefined;
    let value = raw;
    if (typeof raw === 'string') {
        try { value = JSON.parse(raw); } catch { value = {}; }
    }
    const num = (v) => {
        const n = Math.round(Number(v));
        return Number.isFinite(n) && n > 0 ? Math.min(n, 100000) : null;
    };
    let minGuests = num(value?.minGuests);
    let maxGuests = num(value?.maxGuests);
    if (minGuests && maxGuests && minGuests > maxGuests) [minGuests, maxGuests] = [maxGuests, minGuests];
    return { minGuests, maxGuests };
};

const parseSetupTags = (raw) => {
    if (raw === undefined) return undefined;
    let value = raw;
    if (typeof raw === 'string') {
        try { value = JSON.parse(raw); } catch { value = raw.split(','); }
    }
    return [...new Set((Array.isArray(value) ? value : []).map(t => String(t).trim()))].filter(t => SETUP_TAGS.includes(t));
};

module.exports = { SETUP_TAGS, parseCapacity, parseSetupTags };
