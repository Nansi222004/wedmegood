import React, { useState, useEffect } from 'react';
import userApi from '../../services/userApi';
import Icon from '../../components/ui/Icon';

/**
 * WeatherForecastCard
 * Displays real-time Open-Meteo weather forecast for wedding event date, location, and venue type.
 * Purely informational - clearly marked as advisory only.
 */
export default function WeatherForecastCard({ eventDate, location, venueType = 'Not Specified' }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!eventDate) return;

    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userApi.getWeatherForecast({
          date: eventDate,
          location: location || '',
          venueType: venueType || 'Not Specified'
        });
        if (isMounted) {
          if (res?.success && res.data) {
            setForecast(res.data);
          } else {
            setError(res?.message || 'Unable to retrieve weather forecast');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Weather forecast service unavailable');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchForecast();
    return () => { isMounted = false; };
  }, [eventDate, location, venueType]);

  if (!eventDate) return null;

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 my-3 flex items-center gap-2.5 text-xs text-slate-500 animate-pulse">
        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent animate-spin rounded-full" />
        <span>Checking event weather forecast for {location || 'event location'}...</span>
      </div>
    );
  }

  if (error || !forecast) {
    return null; // Fail gracefully without cluttering the UI
  }

  // Handle beyond 14-day horizon
  if (!forecast.forecastAvailable && forecast.status === 'FORECAST_UNAVAILABLE_HORIZON') {
    return (
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3 my-3 text-xs text-blue-800 flex items-start gap-2.5">
        <span className="text-base leading-none">🌤️</span>
        <div>
          <div className="font-bold flex items-center gap-2">
            <span>Event Weather Tracking</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Within 14 Days</span>
          </div>
          <p className="text-blue-600 mt-0.5 text-[11px] leading-relaxed">
            Live Open-Meteo forecasts unlock 14 days prior to your event ({new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}).
          </p>
        </div>
      </div>
    );
  }

  if (!forecast.forecastAvailable) {
    return null;
  }

  const isRain = forecast.rainfallAlert;
  const venueLabel = venueType && venueType !== 'Not Specified' ? venueType : null;

  return (
    <div
      className={`rounded-2xl p-3.5 my-3 border transition-all ${
        isRain
          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none" role="img" aria-label="weather">
            {isRain ? '🌧️' : '☀️'}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs uppercase tracking-wider">
                {forecast.condition || (isRain ? 'Rain Predicted' : 'Clear / Favorable')}
              </span>
              {forecast.tempMax !== null && forecast.tempMin !== null && (
                <span className="text-[11px] font-bold bg-white/80 px-2 py-0.5 rounded-md border border-black/5">
                  {forecast.tempMin}°C – {forecast.tempMax}°C
                </span>
              )}
              {forecast.precipitationProbability !== undefined && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isRain
                      ? 'bg-amber-200/80 text-amber-950'
                      : 'bg-emerald-200/80 text-emerald-950'
                  }`}
                >
                  {forecast.precipitationProbability}% Rain Chance
                </span>
              )}
              {venueLabel && (
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                  {venueLabel} Venue
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium mt-1 leading-relaxed opacity-90">
              {forecast.alertMessage}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-500">
        <span>📍 {forecast.location} • {forecast.date}</span>
        <span className="italic font-medium">Informational advisory only</span>
      </div>
    </div>
  );
}
