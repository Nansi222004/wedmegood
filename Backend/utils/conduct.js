// How a person behaved, used when customers report vendors and vendors report customers
const CONDUCT_LEVELS = ['Good', 'Acceptable', 'Poor', 'Very poor'];

// Picks the given aspects from the body; every aspect must have a valid level
function cleanConduct(raw, aspects) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const out = {};
    for (const key of aspects) {
        if (!CONDUCT_LEVELS.includes(src[key])) return null;
        out[key] = src[key];
    }
    return out;
}

module.exports = { CONDUCT_LEVELS, cleanConduct };
