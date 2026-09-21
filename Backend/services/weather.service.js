const https = require('https');

// 1-hour TTL Cache for weather and geocoding
const weatherCache = new Map();
const geoCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

// Curated fallbacks for top Indian wedding destinations
const KNOWN_DESTINATIONS = {
    'indore': { lat: 22.7196, lon: 75.8577 },
    'bhopal': { lat: 23.2599, lon: 77.4126 },
    'mumbai': { lat: 19.0760, lon: 72.8777 },
    'delhi': { lat: 28.6139, lon: 77.2090 },
    'new delhi': { lat: 28.6139, lon: 77.2090 },
    'jaipur': { lat: 26.9124, lon: 75.7873 },
    'udaipur': { lat: 24.5854, lon: 73.7125 },
    'goa': { lat: 15.2993, lon: 74.1240 },
    'bengaluru': { lat: 12.9716, lon: 77.5946 },
    'bangalore': { lat: 12.9716, lon: 77.5946 },
    'hyderabad': { lat: 17.3850, lon: 78.4867 },
    'ahmedabad': { lat: 23.0225, lon: 72.5714 },
    'pune': { lat: 18.5204, lon: 73.8567 },
    'kolkata': { lat: 22.5726, lon: 88.3639 }
};

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 8000 }, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`HTTP error status ${res.statusCode}`));
            }
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Weather API request timed out'));
        });
    });
}

/**
 * Resolve city name to lat/lon coordinates
 */
async function geocodeCity(city) {
    if (!city || typeof city !== 'string') return null;
    const cleanCity = city.trim().toLowerCase();
    
    if (KNOWN_DESTINATIONS[cleanCity]) {
        return KNOWN_DESTINATIONS[cleanCity];
    }

    const cached = geoCache.get(cleanCity);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS * 24)) {
        return cached.coords;
    }

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=en&format=json`;
        const data = await fetchJson(geoUrl);
        if (data && data.results && data.results.length > 0) {
            const coords = {
                lat: data.results[0].latitude,
                lon: data.results[0].longitude
            };
            geoCache.set(cleanCity, { coords, timestamp: Date.now() });
            return coords;
        }
    } catch (err) {
        console.warn(`Geocoding warning for "${city}":`, err.message);
    }

    // Return null if location cannot be resolved genuinely
    return null;
}

/**
 * Maps WMO weather code to readable description and severity
 */
function parseWmoCode(code) {
    if (code === 0) return { condition: 'Clear Sky', icon: 'sun', isRain: false };
    if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', icon: 'cloud', isRain: false };
    if (code >= 45 && code <= 48) return { condition: 'Foggy', icon: 'fog', isRain: false };
    if (code >= 51 && code <= 55) return { condition: 'Light Drizzle', icon: 'rain', isRain: true };
    if (code >= 61 && code <= 65) return { condition: 'Rain', icon: 'rain', isRain: true };
    if (code >= 71 && code <= 77) return { condition: 'Snowfall', icon: 'snow', isRain: true };
    if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: 'rain', isRain: true };
    if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', icon: 'storm', isRain: true };
    return { condition: 'Overcast', icon: 'cloud', isRain: false };
}

/**
 * Fetch forecast for coordinates (supports Open-Meteo zero-config, OpenWeatherMap if configured)
 */
async function fetchForecastData(lat, lon) {
    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return cached.data;
    }

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=14`;
        const data = await fetchJson(url);
        if (data && data.daily && Array.isArray(data.daily.time)) {
            weatherCache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
        }
    } catch (err) {
        console.warn('Weather service fetch warning:', err.message);
    }

    return null;
}

/**
 * Get weather forecast for a specific city and date (or array of dates)
 */
async function getWeatherForDate(city, targetDateStr, venueType = 'Not Specified') {
    if (!targetDateStr) {
        return {
            forecastAvailable: false,
            status: 'INVALID_DATE',
            reason: 'Event date not specified',
            rainfallAlert: false
        };
    }

    const targetDate = new Date(targetDateStr);
    if (isNaN(targetDate.getTime())) {
        return {
            forecastAvailable: false,
            status: 'INVALID_DATE_FORMAT',
            reason: 'Invalid event date format',
            rainfallAlert: false
        };
    }

    const targetDateFormatted = targetDate.toISOString().split('T')[0];
    const coords = await geocodeCity(city);
    if (!coords) {
        return {
            forecastAvailable: false,
            status: 'INVALID_LOCATION',
            reason: `Location coordinates could not be determined for "${city || 'unspecified'}"`,
            rainfallAlert: false
        };
    }

    const forecastData = await fetchForecastData(coords.lat, coords.lon);
    if (!forecastData || !forecastData.daily || !forecastData.daily.time) {
        return {
            forecastAvailable: false,
            status: 'API_UNAVAILABLE',
            reason: 'Weather service temporarily unavailable',
            rainfallAlert: false
        };
    }

    const times = forecastData.daily.time;
    const dateIdx = times.indexOf(targetDateFormatted);

    if (dateIdx === -1) {
        return {
            forecastAvailable: false,
            status: 'FORECAST_UNAVAILABLE_HORIZON',
            reason: 'Forecast not available yet. Weather forecasts become available within 14 days of the event date. Please check back closer to the event.',
            rainfallAlert: false,
            providerRangeMax: times[times.length - 1] || null
        };
    }

    const code = forecastData.daily.weathercode ? forecastData.daily.weathercode[dateIdx] : 0;
    const tempMax = forecastData.daily.temperature_2m_max ? Math.round(forecastData.daily.temperature_2m_max[dateIdx]) : null;
    const tempMin = forecastData.daily.temperature_2m_min ? Math.round(forecastData.daily.temperature_2m_min[dateIdx]) : null;
    const precipitationSum = forecastData.daily.precipitation_sum ? Math.round(forecastData.daily.precipitation_sum[dateIdx] * 10) / 10 : 0;
    const precipitationProb = forecastData.daily.precipitation_probability_max ? forecastData.daily.precipitation_probability_max[dateIdx] : 0;

    const wmo = parseWmoCode(code);
    const rainfallAlert = (precipitationProb >= 40 || precipitationSum >= 1.0 || wmo.isRain);

    const vType = String(venueType || 'Not Specified').toLowerCase();
    const isOutdoor = vType.includes('outdoor');
    const isIndoor = vType.includes('indoor');
    const isBoth = vType.includes('both') || vType.includes('hybrid');

    let alertMessage;
    if (rainfallAlert) {
        if (isOutdoor) {
            alertMessage = `⚠️ Outdoor Weather Advisory: Rain probability is ${precipitationProb}% (est. ${precipitationSum} mm). Consider arranging rainproof canopies or preparing an indoor backup area.`;
        } else if (isIndoor) {
            alertMessage = `ℹ️ Weather Notice: Rain forecast on event date (${precipitationProb}% chance). As your event is scheduled indoors, venue setups remain protected.`;
        } else if (isBoth) {
            alertMessage = `⚠️ Weather Notice: Rain probability is ${precipitationProb}%. Ensure waterproof coverings for outdoor lawn segments.`;
        } else {
            alertMessage = `⚠️ Weather Advisory: Rain probability is ${precipitationProb}% (est. ${precipitationSum} mm). Outdoor activities may require weather protection.`;
        }
    } else {
        alertMessage = `☀️ Favorable Weather: Forecast indicates ${wmo.condition} with minimal rain probability (${precipitationProb}%).`;
    }

    return {
        forecastAvailable: true,
        status: rainfallAlert ? 'RAIN_ALERT' : 'NO_RAIN',
        date: targetDateFormatted,
        location: city,
        coordinates: coords,
        condition: wmo.condition,
        icon: wmo.icon,
        weatherCode: code,
        tempMax,
        tempMin,
        precipitation: precipitationSum,
        precipitationProbability: precipitationProb,
        rainfallAlert,
        alertMessage,
        venueType,
        isInformationalOnly: true,
        updatedAt: new Date().toISOString()
    };
}

/**
 * Get weather dictionary for an entire month
 */
async function getWeatherForMonth(city, yearMonth) {
    const coords = await geocodeCity(city);
    if (!coords) return {};

    const forecastData = await fetchForecastData(coords.lat, coords.lon);
    if (!forecastData || !forecastData.daily || !forecastData.daily.time) {
        return {};
    }

    const weatherMap = {};
    const times = forecastData.daily.time;

    times.forEach((dateStr, idx) => {
        if (!yearMonth || dateStr.startsWith(yearMonth)) {
            const code = forecastData.daily.weathercode ? forecastData.daily.weathercode[idx] : 0;
            const tempMax = forecastData.daily.temperature_2m_max ? Math.round(forecastData.daily.temperature_2m_max[idx]) : null;
            const tempMin = forecastData.daily.temperature_2m_min ? Math.round(forecastData.daily.temperature_2m_min[idx]) : null;
            const precipitationSum = forecastData.daily.precipitation_sum ? Math.round(forecastData.daily.precipitation_sum[idx] * 10) / 10 : 0;
            const precipitationProb = forecastData.daily.precipitation_probability_max ? forecastData.daily.precipitation_probability_max[idx] : 0;
            const wmo = parseWmoCode(code);
            const rainfallAlert = (precipitationProb >= 40 || precipitationSum >= 1.0 || wmo.isRain);

            weatherMap[dateStr] = {
                forecastAvailable: true,
                date: dateStr,
                condition: wmo.condition,
                icon: wmo.icon,
                weatherCode: code,
                tempMax,
                tempMin,
                precipitation: precipitationSum,
                precipitationProbability: precipitationProb,
                rainfallAlert,
                alertMessage: rainfallAlert
                    ? 'Rainfall alert: Consider an indoor alternative for your outdoor event.'
                    : null,
                updatedAt: new Date().toISOString()
            };
        }
    });

    return weatherMap;
}

module.exports = {
    geocodeCity,
    getWeatherForDate,
    getWeatherForMonth
};
