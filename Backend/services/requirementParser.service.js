/**
 * Reads a plain-language requirement such as
 *   "outdoor decorator in Jaipur for 300 guests under 2 lakh on 12 Dec"
 * and turns it into search filters: category, city, guests, budget, date and setup needs.
 * Rule based (no external service): anything it cannot place is returned as leftover keywords.
 */
const Category = require('../modules/admin/Category');
const Vendor = require('../modules/vendor/Vendor');
const { SETUP_TAGS } = require('../utils/serviceSetup');

// Everyday words customers use, mapped to words that appear in category names
const CATEGORY_SYNONYMS = [
    [/\b(photo(graph(er|y|ers))?|photographers?|shoot|candid|album)\b/i, /photo/i],
    [/\b(video(graph(er|y))?|cinematograph(er|y)|films?)\b/i, /video|cinema|film/i],
    [/\b(make ?up|makeup artists?|mua|bridal look|hair ?stylist)\b/i, /make ?up|beauty|styl/i],
    [/\b(mehe?n?d[ih]|henna)\b/i, /meh/i],
    [/\b(cater(er|ers|ing)?|food|buffet|chef|cook|halwai)\b/i, /cater|food/i],
    [/\b(decor(ator|ators|ation)?s?|flowers?|floral|mandap|stage decor)\b/i, /decor|flor/i],
    [/\b(venues?|halls?|banquets?|lawns?|resorts?|farm ?house|marriage garden|palace)\b/i, /venue|hall|banquet|lawn/i],
    [/\b(dj|music|band|dhol|sound|singer|live music)\b/i, /dj|music|band|enterta/i],
    [/\b(tent|shamiana|canopy)\b/i, /tent/i],
    [/\b(light(ing|s)?|illumination)\b/i, /light/i],
    [/\b(planner|planning|organi[sz]er|coordinator|management)\b/i, /plan|manag/i],
    [/\b(invit(e|ation)s?|cards?)\b/i, /invit|card/i],
    [/\b(pandit|priest|purohit)\b/i, /pandit|priest|ritual/i],
    [/\b(cars?|transport|vintage car|baraat car|horse|ghodi)\b/i, /car|transport|horse/i],
    [/\b(cake|bakers?|dessert)\b/i, /cake|bak|dessert/i],
    [/\b(choreograph(er|y)|dance)\b/i, /choreo|dance/i]
];

const SETUP_WORDS = [
    [/\b(indoor|inside|ac hall|air.?conditioned)\b/i, 'Indoor'],
    [/\b(outdoor|open.?air|lawn|garden|beach|poolside)\b/i, 'Outdoor'],
    [/\b(rain ?(backup|cover|proof)|monsoon)\b/i, 'Rain backup'],
    [/\b(no power|without (power|electricity)|own generator|generator|genset|dg set)\b/i, 'Brings own generator'],
    [/\b(power (supply|point)|electricity)\b/i, 'Needs power supply'],
    [/\b(stage)\b/i, 'Needs stage area'],
    [/\b(quick setup|fast setup|short setup|setup in \d+ ?h)/i, 'Quick setup (under 3 hours)'],
    [/\b(night setup|overnight setup)\b/i, 'Night setup possible']
];

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MULTIPLIER = { k: 1e3, thousand: 1e3, l: 1e5, lac: 1e5, lacs: 1e5, lakh: 1e5, lakhs: 1e5, cr: 1e7, crore: 1e7, crores: 1e7 };
const STOPWORDS = new Set('i im i\'m we need want looking look for a an the in at on of to and with my our some good best near nearby who can do please wedding event function ceremony around about under below within upto up budget less than max maximum rs inr guests guest people pax persons person members log someone vendor vendors service services available'.split(' '));

let cityCache = { at: 0, cities: [] };
async function knownCities() {
    if (Date.now() - cityCache.at < 10 * 60 * 1000) return cityCache.cities;
    const cities = (await Vendor.distinct('city', { status: 'Approved' }))
        .map(c => String(c || '').trim()).filter(c => c.length >= 3);
    cityCache = { at: Date.now(), cities: [...new Set(cities.map(c => c.toLowerCase()))].map(c => cities.find(x => x.toLowerCase() === c)) };
    return cityCache.cities;
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parseDate(text, now = new Date()) {
    const year = now.getFullYear();
    const build = (y, m, d) => {
        const date = new Date(Date.UTC(y, m, d));
        if (date.getUTCMonth() !== m) return null;
        // A date without a year that has already passed means next year
        if (date < new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))) date.setUTCFullYear(date.getUTCFullYear() + 1);
        return date;
    };
    let m = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
    if (m) {
        const y = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : year;
        const date = m[3] ? new Date(Date.UTC(y, Number(m[2]) - 1, Number(m[1]))) : build(y, Number(m[2]) - 1, Number(m[1]));
        if (date && !isNaN(date)) return { date, match: m[0] };
    }
    const mon = '(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*';
    m = text.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${mon}(?:,?\\s+(\\d{4}))?\\b`, 'i'));
    if (m) {
        const mi = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
        const date = m[3] ? new Date(Date.UTC(Number(m[3]), mi, Number(m[1]))) : build(year, mi, Number(m[1]));
        if (date) return { date, match: m[0] };
    }
    m = text.match(new RegExp(`\\b${mon}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, 'i'));
    if (m) {
        const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
        const date = m[3] ? new Date(Date.UTC(Number(m[3]), mi, Number(m[2]))) : build(year, mi, Number(m[2]));
        if (date) return { date, match: m[0] };
    }
    return null;
}

const toAmount = (num, unit) => {
    const n = Number(String(num).replace(/,/g, ''));
    if (!Number.isFinite(n)) return null;
    return Math.round(n * (MULTIPLIER[String(unit || '').toLowerCase()] || 1));
};

/**
 * @returns {{ category, categoryName, city, guests, minBudget, maxBudget, date, setup: string[], keywords, understood: string[] }}
 */
async function parseRequirement(raw, { now = new Date() } = {}) {
    let text = ` ${String(raw || '').slice(0, 300)} `;
    const out = { category: null, categoryName: null, city: null, guests: null, minBudget: null, maxBudget: null, date: null, setup: [], keywords: '', understood: [] };
    const consume = (fragment) => { text = text.replace(fragment, ' '); };

    // Budget: "under 2 lakh", "budget 50k", "₹80,000", "between 1 and 2 lakh"
    const unit = '(k|thousand|l|lacs?|lakhs?|cr|crores?)?';
    let m = text.match(new RegExp(`\\b(?:between|from)\\s*(?:rs\\.?|₹|inr)?\\s*([\\d.,]+)\\s*${unit}\\s*(?:and|to|-)\\s*(?:rs\\.?|₹|inr)?\\s*([\\d.,]+)\\s*${unit}\\b`, 'i'));
    if (m) {
        out.maxBudget = toAmount(m[3], m[4]);
        out.minBudget = toAmount(m[1], m[2] || m[4]);
        consume(m[0]);
    } else {
        m = text.match(new RegExp(`(?:\\b(?:under|below|within|upto|up to|max(?:imum)?|budget(?: of| is)?|less than|not more than)\\s*(?:rs\\.?|₹|inr)?|₹|\\brs\\.?)\\s*([\\d.,]+)\\s*${unit}(?![a-z])`, 'i'));
        if (m) {
            out.maxBudget = toAmount(m[1], m[2]);
            consume(m[0]);
        }
    }

    // Guests: "300 guests", "for 250 people", "200-300 pax"
    m = text.match(/\b(\d{1,3}(?:,\d{3})*|\d+)\s*(?:-|to)?\s*(\d{1,3}(?:,\d{3})*|\d+)?\s*(guests?|people|pax|persons?|members|log|heads)\b/i);
    if (m) {
        out.guests = Number(String(m[2] || m[1]).replace(/,/g, ''));
        consume(m[0]);
    }

    const parsedDate = parseDate(text, now);
    if (parsedDate) {
        out.date = parsedDate.date.toISOString().slice(0, 10);
        consume(parsedDate.match);
    }

    for (const [re, tag] of SETUP_WORDS) {
        const sm = text.match(re);
        if (sm && !out.setup.includes(tag)) {
            out.setup.push(tag);
            // "lawn" also hints at a venue, so leave it for the category step
            if (!/lawn|garden/i.test(sm[0])) consume(sm[0]);
        }
    }

    // Category: try the real category names first, then everyday synonyms
    const categories = await Category.find({ isActive: { $ne: false } }).select('name slug').lean().catch(() => []);
    const byName = categories
        .filter(c => c.name && new RegExp(`\\b${escapeRegex(c.name.toLowerCase().replace(/s$/, ''))}`, 'i').test(text))
        .sort((a, b) => b.name.length - a.name.length)[0];
    if (byName) {
        out.category = byName.slug || byName.name;
        out.categoryName = byName.name;
        consume(new RegExp(escapeRegex(byName.name.replace(/s$/i, '')) + '[a-z]*', 'i'));
    } else {
        for (const [wordRe, nameRe] of CATEGORY_SYNONYMS) {
            const wm = text.match(wordRe);
            if (!wm) continue;
            const cat = categories.find(c => nameRe.test(c.name));
            if (cat) {
                out.category = cat.slug || cat.name;
                out.categoryName = cat.name;
                consume(wm[0]);
                break;
            }
        }
    }

    const cities = await knownCities().catch(() => []);
    const city = cities
        .filter(c => new RegExp(`\\b${escapeRegex(c)}\\b`, 'i').test(text))
        .sort((a, b) => b.length - a.length)[0];
    if (city) {
        out.city = city;
        consume(new RegExp(`\\b${escapeRegex(city)}\\b`, 'i'));
    }

    out.keywords = text.toLowerCase()
        .replace(/[^a-z0-9\s&-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
        .slice(0, 6)
        .join(' ');

    if (out.categoryName) out.understood.push(out.categoryName);
    if (out.city) out.understood.push(`in ${out.city}`);
    if (out.guests) out.understood.push(`${out.guests} guests`);
    if (out.maxBudget) out.understood.push(`${out.minBudget ? `₹${out.minBudget.toLocaleString('en-IN')}–` : 'up to ₹'}${out.maxBudget.toLocaleString('en-IN')}`);
    if (out.date) out.understood.push(`free on ${out.date}`);
    out.understood.push(...out.setup);
    return out;
}

module.exports = { parseRequirement, SETUP_TAGS };
