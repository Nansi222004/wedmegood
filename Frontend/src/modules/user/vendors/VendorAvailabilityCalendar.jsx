import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import { userApi } from '../../../services/userApi';

const VendorAvailabilityCalendar = ({ vendorId, vendorName, vendorCity, onSelectDate, initialDate }) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedDateStr, setSelectedDateStr] = useState(initialDate || '');
  const [bookedDates, setBookedDates] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [weatherMap, setWeatherMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const yearMonthStr = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    if (!vendorId) return;

    let isMounted = true;
    const fetchMonthAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await userApi.getVendorAvailability(vendorId, { month: yearMonthStr });
        if (isMounted && res.success) {
          setBookedDates(res.bookedDates || []);
          setBlockedDates(res.blockedDates || []);
          setWeatherMap(res.weatherForecasts || {});
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load availability with weather:', err.message);
          setError('Could not refresh calendar data.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMonthAvailability();
    return () => { isMounted = false; };
  }, [vendorId, yearMonthStr]);

  const handlePrevMonth = () => {
    const today = new Date();
    const current = new Date(currentMonthDate);
    // Don't go to past months
    if (current.getFullYear() === today.getFullYear() && current.getMonth() <= today.getMonth()) {
      return;
    }
    setCurrentMonthDate(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const current = new Date(currentMonthDate);
    // Limit to next 12 months
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 12);
    if (current < maxDate) {
      setCurrentMonthDate(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    }
  };

  // Calendar matrix calculation
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  // Empty padding cells before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const getDateStr = (day) => {
    if (!day) return null;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const selectedWeather = selectedDateStr ? weatherMap[selectedDateStr] : null;
  const isSelectedDateBooked = bookedDates.includes(selectedDateStr) || blockedDates.includes(selectedDateStr);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Icon name="calendar" size="sm" className="text-[#E91E63]" />
            <span>Availability & Weather Forecast</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time vendor schedule & meteorological forecast for {vendorCity || 'event venue'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            title="Previous Month"
          >
            ‹
          </button>
          <span className="text-xs sm:text-sm font-bold text-slate-800 min-w-[110px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            title="Next Month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-2 px-3 mb-4 bg-slate-50 rounded-xl text-[11px] font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Booked / Busy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">Rain Alert</span>
          <span>Rainfall Alert</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full border border-slate-300"></span>
          <span>Forecast Available (≤14 days)</span>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="h-14 sm:h-16 rounded-xl bg-slate-50/50" />;
          }

          const dateStr = getDateStr(day);
          const isPast = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDateStr;
          const isBooked = bookedDates.includes(dateStr);
          const isBlocked = blockedDates.includes(dateStr);
          const isUnavailable = isBooked || isBlocked;
          const weather = weatherMap[dateStr];
          const hasRainAlert = weather?.rainfallAlert;

          return (
            <button
              key={`day-${day}`}
              type="button"
              disabled={isPast}
              onClick={() => {
                setSelectedDateStr(dateStr);
                if (onSelectDate) onSelectDate(dateStr, !isUnavailable, weather);
              }}
              className={`h-14 sm:h-16 p-1 rounded-xl flex flex-col justify-between text-left transition-all relative border ${
                isPast
                  ? 'bg-slate-50 border-transparent text-slate-300 cursor-not-allowed'
                  : isSelected
                  ? 'ring-2 ring-[#E91E63] border-[#E91E63] bg-rose-50/40 shadow-sm'
                  : isUnavailable
                  ? 'bg-rose-50/50 border-rose-100 text-slate-700 hover:bg-rose-100/50'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {/* Day Number and status pill */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold ${
                  isPast ? 'text-slate-300' : isToday ? 'text-[#E91E63]' : 'text-slate-700'
                }`}>
                  {day}
                </span>

                {!isPast && (
                  <span className={`w-2 h-2 rounded-full ${
                    isUnavailable ? 'bg-rose-500' : 'bg-emerald-500'
                  }`} />
                )}
              </div>

              {/* Weather Info Badge */}
              {!isPast && weather?.forecastAvailable && (
                <div className="mt-auto">
                  {hasRainAlert ? (
                    <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-100/90 text-amber-900 text-[8.5px] font-black truncate" title={weather.alertMessage}>
                      <span>🌧️</span>
                      <span className="hidden sm:inline">Rain</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium px-0.5">
                      <span>{weather.tempMax ? `${weather.tempMax}°` : ''}</span>
                      <span className="text-[10px]">{weather.weatherCode === 0 ? '☀️' : '⛅'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Today Badge */}
              {isToday && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E91E63]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Summary & Rainfall Advisory Panel */}
      {selectedDateStr && (
        <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Date:</span>
                <span className="text-sm font-bold text-slate-900">
                  {new Date(selectedDateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelectedDateBooked
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isSelectedDateBooked ? 'Booked / Unavailable' : 'Available for Booking'}
                </span>
              </div>

              {/* Weather Forecast Details */}
              {selectedWeather?.forecastAvailable ? (
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
                  <span>Forecast: <strong>{selectedWeather.condition}</strong></span>
                  {selectedWeather.tempMax && (
                    <span>Temp: <strong>{selectedWeather.tempMin}°C - {selectedWeather.tempMax}°C</strong></span>
                  )}
                  {selectedWeather.precipitationProbability !== undefined && (
                    <span>Rain Risk: <strong>{selectedWeather.precipitationProbability}%</strong></span>
                  )}
                  {selectedWeather.precipitation > 0 && (
                    <span>Precipitation: <strong>{selectedWeather.precipitation} mm</strong></span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1 italic">
                  Live meteorological forecast unavailable for this date (forecasts are published within 14 days of the event).
                </p>
              )}
            </div>

            {onSelectDate && !isSelectedDateBooked && (
              <Button
                size="sm"
                className="self-start sm:self-auto rounded-xl px-4 text-xs font-bold"
                onClick={() => onSelectDate(selectedDateStr, true, selectedWeather)}
              >
                Inquire for This Date
              </Button>
            )}
          </div>

          {/* Rainfall Warning Alert Box */}
          {selectedWeather?.rainfallAlert && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900">
              <span className="text-base shrink-0">⚠️</span>
              <div className="text-xs">
                <strong className="font-bold">Weather Advisory:</strong> {selectedWeather.alertMessage || 'Rainfall alert: Consider an indoor alternative for your outdoor event.'}
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Precipitation probability is {selectedWeather.precipitationProbability}%. Vendor outdoor setups (open lawns, flower mandaps) may require rainproofing.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorAvailabilityCalendar;
