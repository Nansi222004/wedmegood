import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';
import Icon from '../../../components/ui/Icon';
import { useDragToScroll } from '../../../hooks/useDragToScroll';

/* ─── Config & Constants ────────────────────────────────────────── */
const EVENT_TYPES = [
  { id: 'Wedding',    label: 'Wedding',       color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { id: 'Reception',  label: 'Reception',     color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
  { id: 'Haldi',      label: 'Haldi / Mehndi',color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { id: 'Engagement', label: 'Engagement',    color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
  { id: 'Sangeet',    label: 'Sangeet',       color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  { id: 'Corporate',  label: 'Corporate',     color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  { id: 'Other',      label: 'Other Service', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
];

const STATUS_CONFIG = {
  Confirmed:  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: 'Confirmed' },
  Pending:    { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: 'Pending Advance' },
  Completed:  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', label: 'Completed' },
  Cancelled:  { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3', label: 'Cancelled' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const toDs = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const today = new Date();
const todayDs = toDs(today.getFullYear(), today.getMonth(), today.getDate());

const fmtEventDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtBudget = (n) => {
  if (!n || n === 0) return null;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2).replace(/\.?0+$/, '')}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
};

const getEventColor = (type) => EVENT_TYPES.find(e => e.id === type) || EVENT_TYPES[EVENT_TYPES.length - 1];

const VendorCalendar = () => {
  const { vendorState } = useVendorState();
  const vendorName = vendorState?.profile?.businessName || vendorState?.profile?.fullName || 'Your Business';
  const vendorId = vendorState?._id;
  const token = localStorage.getItem('vendorToken');

  const [currentDate, setCurrentDate]   = useState(new Date());
  const [bookings, setBookings]         = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [weatherMap, setWeatherMap]     = useState({});
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayDs);
  
  // Modals
  const [addModal, setAddModal]               = useState(false);
  const addModalScrollRef                     = useDragToScroll(addModal);
  const [blockModal, setBlockModal]           = useState(false);
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [toast, setToast]                     = useState(null);

  const [newEvent, setNewEvent] = useState({
    customerName: '',
    eventDate: todayDs,
    location: '',
    eventType: 'Wedding',
    guestCount: '',
    totalAmount: '',
    notes: ''
  });

  const [blockDateInput, setBlockDateInput] = useState(todayDs);

  // ── Fetch Bookings, Blocked Dates & Weather ─────────────────
  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;

      const [bookingsRes, blockedRes] = await Promise.allSettled([
        vendorApi.getBookings(token),
        vendorApi.getBlockedDates(token)
      ]);

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.success) {
        setBookings(bookingsRes.value.data || []);
      }
      if (blockedRes.status === 'fulfilled' && blockedRes.value?.success) {
        setBlockedDates((blockedRes.value.data || []).map(d => {
          const dt = new Date(d);
          return isNaN(dt.getTime()) ? d : toDs(dt.getFullYear(), dt.getMonth(), dt.getDate());
        }));
      }

      // Fetch Weather for this vendor's location and viewing month
      if (vendorId) {
        try {
          const availRes = await fetch(`/api/vendors/${vendorId}/availability?month=${monthStr}`);
          const availData = await availRes.json();
          if (availData.success && availData.weatherForecasts) {
            setWeatherMap(availData.weatherForecasts);
          }
        } catch (_) {}
      }
    } catch (err) {
      console.error('Error loading calendar:', err);
    } finally {
      setLoading(false);
    }
  }, [token, vendorId, currentDate]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Handle ESC key, body scroll locking, and Lenis smooth scroll for open modals
  const anyModalOpen = Boolean(addModal || blockModal || selectedEventModal);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (addModal) setAddModal(false);
        if (blockModal) setBlockModal(false);
        if (selectedEventModal) setSelectedEventModal(null);
      }
    };

    if (anyModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      if (window.lenis && typeof window.lenis.stop === 'function') {
        window.lenis.stop();
      }
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start();
      }
    };
  }, [anyModalOpen, addModal, blockModal, selectedEventModal]);

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Calendar Calculations ─────────────────────────────────
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow    = new Date(year, month, 1).getDay(); // 0 = Sun
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  // Group bookings by date
  const byDate = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (!b.eventDate) return;
      const dt = new Date(b.eventDate);
      if (isNaN(dt.getTime())) return;
      const key = toDs(dt.getFullYear(), dt.getMonth(), dt.getDate());
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [bookings]);

  // Selected date details
  const selectedEvents = selectedDate ? (byDate[selectedDate] || []) : [];
  const isSelectedDateBlocked = blockedDates.includes(selectedDate);
  const selectedWeather = selectedDate ? weatherMap[selectedDate] : null;

  // Stats
  const totalEvents = bookings.length;
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'Completed').length;
  const totalRevenue = bookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // ── Action Handlers ───────────────────────────────────────
  const handleAddEvent = async () => {
    if (!newEvent.customerName.trim()) {
      showToast('Please enter customer / event title', 'err');
      return;
    }
    if (!newEvent.eventDate) {
      showToast('Please choose an event date', 'err');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: newEvent.customerName.trim(),
        eventDate: new Date(newEvent.eventDate),
        location: newEvent.location.trim() || 'Venue to be confirmed',
        eventType: newEvent.eventType,
        services: [newEvent.eventType],
        guestCount: Number(newEvent.guestCount) || 0,
        totalPrice: Number(newEvent.totalAmount) || 0,
        notes: newEvent.notes.trim(),
        status: 'Confirmed'
      };

      const res = await vendorApi.createBooking(payload, token);
      if (res.success) {
        showToast('Event scheduled successfully!', 'ok');
        setAddModal(false);
        setNewEvent({
          customerName: '',
          eventDate: todayDs,
          location: '',
          eventType: 'Wedding',
          guestCount: '',
          totalAmount: '',
          notes: ''
        });
        await fetchCalendarData();
      } else {
        showToast(res.message || 'Failed to save event', 'err');
      }
    } catch (e) {
      showToast('Unable to schedule event', 'err');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlockDate = async (dateToToggle) => {
    const isBlocked = blockedDates.includes(dateToToggle);
    setIsSubmitting(true);
    try {
      let res;
      if (isBlocked) {
        res = await vendorApi.removeBlockedDate(dateToToggle, token);
      } else {
        res = await vendorApi.addBlockedDate(dateToToggle, token);
      }

      if (res.success) {
        showToast(isBlocked ? 'Date unblocked' : 'Date marked as blocked', 'ok');
        setBlockModal(false);
        await fetchCalendarData();
      } else {
        showToast(res.message || 'Failed to update date availability', 'err');
      }
    } catch (e) {
      showToast('Error updating date availability', 'err');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await vendorApi.updateBookingStatus(id, status, token);
      if (res.success) {
        showToast(`Marked as ${status}`, 'ok');
        setSelectedEventModal(null);
        await fetchCalendarData();
      } else {
        showToast(res.message || 'Status update failed', 'err');
      }
    } catch (_) {
      showToast('Status update failed', 'err');
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-[#7C3AED] border-t-transparent rounded-full" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Calendar & Schedules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Top Header Banner ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] p-6 sm:p-8 text-white shadow-md">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-purple-100 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Vendor Portal Schedule
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{vendorName}</h1>
            <p className="text-xs sm:text-sm font-medium text-purple-100 mt-1 max-w-xl">
              Real-time booking management, date availability lockouts, and live rainfall weather forecasts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => { setBlockDateInput(selectedDate || todayDs); setBlockModal(true); }}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all active:scale-95 flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Icon name="lock" size="xs" /> Block / Unblock Date
            </button>
            <button
              onClick={() => { setNewEvent(p => ({ ...p, eventDate: selectedDate || todayDs })); setAddModal(true); }}
              className="px-5 py-2.5 rounded-2xl bg-white text-[#7C3AED] hover:bg-purple-50 text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Icon name="plus" size="xs" /> Add New Event
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">Total Bookings</span>
            <span className="text-xl sm:text-2xl font-black text-white">{totalEvents}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">Confirmed Upcoming</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300">{confirmedCount}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">Completed Events</span>
            <span className="text-xl sm:text-2xl font-black text-white">{completedCount}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">Contracted Value</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300">{fmtBudget(totalRevenue) || '₹0'}</span>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Calendar & Inspector Layout ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left 8 Cols: Interactive Monthly Calendar Grid ── */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          {/* Calendar Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={() => {
                  const n = new Date();
                  setCurrentDate(new Date(n.getFullYear(), n.getMonth(), 1));
                  setSelectedDate(todayDs);
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Next / Prev Month Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-all cursor-pointer active:scale-95"
                title="Previous Month"
              >
                <Icon name="chevronLeft" size="xs" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-all cursor-pointer active:scale-95"
                title="Next Month"
              >
                <Icon name="chevronRight" size="xs" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center bg-slate-50 rounded-2xl py-2.5 border border-slate-100">
            {DAYS.map((day, idx) => (
              <span
                key={day}
                className={`text-xs font-bold uppercase tracking-wider ${
                  idx === 0 || idx === 6 ? 'text-[#7C3AED]' : 'text-slate-500'
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Monthly Calendar Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Prev month ghost cells */}
            {[...Array(startDow)].map((_, i) => {
              const dayNum = prevDaysInMonth - startDow + 1 + i;
              return (
                <div
                  key={`prev-${i}`}
                  className="min-h-[85px] sm:min-h-[100px] p-2 rounded-2xl bg-slate-50/40 border border-slate-100/50 opacity-40 select-none"
                >
                  <span className="text-xs font-semibold text-slate-400">{dayNum}</span>
                </div>
              );
            })}

            {/* Current month days */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const ds = toDs(year, month, day);
              const isToday = ds === todayDs;
              const isSelected = ds === selectedDate;
              const isBlocked = blockedDates.includes(ds);
              const dayEvents = byDate[ds] || [];
              const dayWeather = weatherMap[ds];

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(ds)}
                  className={`min-h-[85px] sm:min-h-[100px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 bg-purple-50/40 shadow-sm'
                      : isBlocked
                      ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                      : dayEvents.length > 0
                      ? 'border-purple-200 bg-purple-50/20 hover:border-[#7C3AED]/50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Cell Top Bar: Date Number & Weather/Status */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black leading-none ${
                        isToday
                          ? 'h-6 w-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-xs'
                          : isSelected
                          ? 'text-[#7C3AED] font-black'
                          : 'text-slate-800'
                      }`}
                    >
                      {day}
                    </span>

                    {/* Weather Badge if forecast available */}
                    {dayWeather && dayWeather.tempMax !== null && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                          dayWeather.rainfallAlert
                            ? 'bg-amber-100 text-amber-800 font-extrabold'
                            : 'text-slate-500 bg-slate-100'
                        }`}
                        title={dayWeather.alertMessage || dayWeather.condition}
                      >
                        {dayWeather.icon || '☀️'} {dayWeather.tempMax}°
                      </span>
                    )}
                  </div>

                  {/* Cell Body: Event Chips or Blocked Label */}
                  <div className="space-y-1 mt-1 flex-1">
                    {isBlocked && (
                      <div className="bg-rose-100/90 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate">
                        🚫 Blocked
                      </div>
                    )}

                    {dayEvents.slice(0, 2).map((ev, evIdx) => {
                      const col = getEventColor(ev.eventType || ev.services?.[0]);
                      return (
                        <div
                          key={evIdx}
                          style={{ backgroundColor: col.bg, color: col.color, borderColor: col.border }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border truncate leading-snug"
                        >
                          {ev.customerName || ev.eventType}
                        </div>
                      );
                    })}

                    {dayEvents.length > 2 && (
                      <span className="text-[9px] font-bold text-slate-400 block px-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}

                    {/* Rain warning chip */}
                    {dayWeather?.rainfallAlert && (
                      <div className="bg-rose-100 text-rose-700 text-[9px] font-extrabold px-1 rounded truncate">
                        🌧️ Rain Alert
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#7C3AED]" />
              <span>Confirmed Booking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              <span>Blocked Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span>Rainfall Alert ($\ge 40\%$)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span>Available Date</span>
            </div>
          </div>
        </div>

        {/* ── Right 4 Cols: Selected Date Inspector ─────────── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Date Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Date Inspector
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'Select a date'}
                </h3>
              </div>

              {/* Status Pill */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isSelectedDateBlocked
                    ? 'bg-rose-100 text-rose-800'
                    : selectedEvents.length > 0
                    ? 'bg-purple-100 text-[#7C3AED]'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isSelectedDateBlocked
                  ? 'Blocked'
                  : selectedEvents.length > 0
                  ? `${selectedEvents.length} Booked`
                  : 'Available'}
              </span>
            </div>

            {/* Weather Widget for Selected Date */}
            {selectedWeather && selectedWeather.forecastAvailable ? (
              <div
                className={`rounded-2xl p-4 border transition-all ${
                  selectedWeather.rainfallAlert
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedWeather.icon || '☀️'}</span>
                    <div>
                      <p className="text-xs font-bold capitalize">{selectedWeather.condition}</p>
                      <p className="text-[10px] text-slate-500">
                        High {selectedWeather.tempMax}°C · Low {selectedWeather.tempMin}°C
                      </p>
                    </div>
                  </div>
                  {selectedWeather.precipitationProbability !== null && (
                    <div className="text-right">
                      <span className="text-xs font-black block">{selectedWeather.precipitationProbability}%</span>
                      <span className="text-[9px] text-slate-500 uppercase">Rain Chance</span>
                    </div>
                  )}
                </div>

                {selectedWeather.rainfallAlert && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200 text-[11px] font-semibold text-amber-800 flex items-start gap-1.5">
                    <Icon name="warning" size="xs" className="shrink-0 mt-0.5 text-amber-600" />
                    <span>{selectedWeather.alertMessage || 'Rainfall alert: Outdoor setups should arrange rain covers.'}</span>
                  </div>
                )}
              </div>
            ) : selectedWeather && selectedWeather.reason ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <Icon name="info" size="xs" className="text-slate-400 shrink-0" />
                <span>{selectedWeather.reason}</span>
              </div>
            ) : null}

            {/* Date Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={() => handleToggleBlockDate(selectedDate)}
                disabled={isSubmitting}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelectedDateBlocked
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                <Icon name={isSelectedDateBlocked ? 'check' : 'lock'} size="xs" />
                {isSelectedDateBlocked ? 'Unblock Date' : 'Block Date'}
              </button>

              <button
                onClick={() => {
                  setNewEvent(p => ({ ...p, eventDate: selectedDate }));
                  setAddModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Icon name="plus" size="xs" />
                Add Booking
              </button>
            </div>
          </div>

          {/* Bookings on this Date */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Scheduled Events ({selectedEvents.length})
            </h4>

            {selectedEvents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                <Icon name="calendar" size="sm" className="text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-500">No bookings on this date</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Your calendar is open for new client inquiries.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedEvents.map((ev) => {
                  const st = STATUS_CONFIG[ev.status] || STATUS_CONFIG.Confirmed;
                  return (
                    <div
                      key={ev._id}
                      onClick={() => setSelectedEventModal(ev)}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-[#7C3AED] transition-all bg-slate-50/50 hover:bg-white shadow-xs cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-900">{ev.customerName}</h5>
                          <span className="text-[10px] text-slate-500">{ev.eventType || 'Wedding Service'}</span>
                        </div>
                        <span
                          style={{ backgroundColor: st.bg, color: st.text, borderColor: st.border }}
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0"
                        >
                          {ev.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1">
                        <p className="flex items-center gap-1.5 truncate">
                          <Icon name="location" size="xs" className="text-slate-400 shrink-0" />
                          {ev.location || 'Venue TBD'}
                        </p>
                        {ev.totalPrice > 0 && (
                          <p className="font-extrabold text-[#7C3AED]">
                            ₹{Number(ev.totalPrice).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Event Modal (Rendered in Portal) ───────────── */}
      {addModal && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          data-lenis-prevent="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setAddModal(false)}
          />

          <div 
            className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] my-auto border border-slate-100 animate-in zoom-in-95 overflow-hidden"
            data-lenis-prevent="true"
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between p-6 sm:p-7 pb-3.5 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Schedule New Event</h3>
                <p className="text-[11px] font-semibold text-slate-400">Add an offline or direct client booking to your schedule</p>
              </div>
              <button
                onClick={() => setAddModal(false)}
                className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              ref={addModalScrollRef}
              data-lenis-prevent="true"
              style={{ overscrollBehavior: 'contain' }}
              onSubmit={(e) => {
                e.preventDefault();
                handleAddEvent();
              }}
              className="flex-1 overflow-y-auto p-6 sm:p-7 pt-4 space-y-3.5 text-xs custom-scrollbar"
            >
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Customer / Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul & Sneha Wedding"
                  value={newEvent.customerName}
                  onChange={(e) => setNewEvent(p => ({ ...p, customerName: e.target.value }))}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent(p => ({ ...p, eventDate: e.target.value }))}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Event Type
                  </label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent(p => ({ ...p, eventType: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:bg-white"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Venue / Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sayaji Hotel, Indore"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(p => ({ ...p, location: e.target.value }))}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 350"
                    value={newEvent.guestCount}
                    onChange={(e) => setNewEvent(p => ({ ...p, guestCount: e.target.value }))}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Budget / Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 55000"
                    value={newEvent.totalAmount}
                    onChange={(e) => setNewEvent(p => ({ ...p, totalAmount: e.target.value }))}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Notes & Special Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Drone coverage requested, 2 photographer crew..."
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent(p => ({ ...p, notes: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      Saving Schedule...
                    </>
                  ) : (
                    'Confirm & Save Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Block Date Modal (Rendered in Portal) ──────────── */}
      {blockModal && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          data-lenis-prevent="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setBlockModal(false)}
          />

          <div 
            className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 space-y-4 text-xs"
            data-lenis-prevent="true"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Manage Date Block</h3>
              <button
                onClick={() => setBlockModal(false)}
                className="h-7 w-7 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Select Date to Block or Unblock
              </label>
              <input
                type="date"
                value={blockDateInput}
                onChange={(e) => setBlockDateInput(e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:bg-white"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Blocked dates are marked as unavailable across customer search, inquiry requests, and availability calendars.
            </p>

            <button
              onClick={() => handleToggleBlockDate(blockDateInput)}
              disabled={isSubmitting}
              className={`w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                blockedDates.includes(blockDateInput)
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {blockedDates.includes(blockDateInput) ? 'Unblock This Date' : 'Lock & Block Date'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ── Event Details Modal (Rendered in Portal) ────────── */}
      {selectedEventModal && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          data-lenis-prevent="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedEventModal(null)}
          />

          <div 
            className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 space-y-4 text-xs"
            data-lenis-prevent="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block">
                  Event Details
                </span>
                <h3 className="text-base font-black text-slate-900">{selectedEventModal.customerName}</h3>
              </div>
              <button
                onClick={() => setSelectedEventModal(null)}
                className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-800">{fmtEventDate(selectedEventModal.eventDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Event Type:</span>
                <span className="font-bold text-slate-800">{selectedEventModal.eventType || 'Wedding Service'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-800 text-right">{selectedEventModal.location || 'Venue TBD'}</span>
              </div>
              {selectedEventModal.guestCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Guest Count:</span>
                  <span className="font-bold text-slate-800">{selectedEventModal.guestCount} Guests</span>
                </div>
              )}
              {selectedEventModal.totalPrice > 0 && (
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Contracted Price:</span>
                  <span className="font-black text-[#7C3AED] text-sm">
                    ₹{Number(selectedEventModal.totalPrice).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {selectedEventModal.notes && (
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-[11px]">
                <span className="font-bold text-slate-700 block mb-0.5">Notes:</span>
                <p className="text-slate-600">{selectedEventModal.notes}</p>
              </div>
            )}

            {/* Status action buttons */}
            <div className="flex items-center gap-2 pt-2">
              {selectedEventModal.status !== 'Completed' && (
                <button
                  onClick={() => handleStatusChange(selectedEventModal._id, 'Completed')}
                  className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer"
                >
                  ✓ Mark Completed
                </button>
              )}
              {selectedEventModal.status !== 'Cancelled' && (
                <button
                  onClick={() => handleStatusChange(selectedEventModal._id, 'Cancelled')}
                  className="flex-1 h-10 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer"
                >
                  ✕ Cancel Event
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Toast Notification ─────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[999999] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold text-white flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'err' ? 'bg-rose-600' : 'bg-[#7C3AED]'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-white animate-ping" />
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default VendorCalendar;
