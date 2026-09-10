import { useState, useEffect, useCallback } from 'react';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';
import Icon from '../../../components/ui/Icon';

/* ─── Config ─────────────────────────────────────────────── */
const EVENT_TYPES = [
  { id: 'Wedding',    label: 'Wedding',       color: '#7C3AED' },
  { id: 'Reception',  label: 'Reception',     color: '#EC4899' },
  { id: 'Haldi',      label: 'Haldi',         color: '#F59E0B' },
  { id: 'Engagement', label: 'Engagement',    color: '#06B6D4' },
  { id: 'Corporate',  label: 'Corporate',     color: '#10B981' },
  { id: 'Other',      label: 'Other',         color: '#94A3B8' },
];

const STATUS_CONFIG = {
  Confirmed:  { bg: '#F0EEFF', text: '#7C3AED', label: 'Upcoming' },
  Completed:  { bg: '#ECFDF5', text: '#059669', label: 'Completed' },
  Cancelled:  { bg: '#FFF1F2', text: '#E11D48', label: 'Cancelled' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

const toDs = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const today = new Date();
const todayDs = toDs(today.getFullYear(), today.getMonth(), today.getDate());

const fmtEventDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
};
const fmtTime = (d) => {
  if (!d) return '7:00 PM Onwards';
  return new Date(d).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) + ' Onwards';
};
const fmtBudget = (n) => {
  if (!n || n === 0) return null;
  if (n >= 100000) return `₹${(n/100000).toFixed(2).replace(/\.?0+$/,'')}L`;
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n}`;
};
const getColor = (type) => EVENT_TYPES.find(e => e.id === type)?.color || '#94A3B8';

/* ─── Main Component ────────────────────────────────────── */
const VendorCalendar = () => {
  const { vendorState } = useVendorState();
  const vendorName = vendorState?.profile?.businessName || vendorState?.profile?.fullName || 'Your Business';

  const [currentDate, setCurrentDate]   = useState(new Date());
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayDs);
  const [calView, setCalView]           = useState('Month'); // Month|Week|Day
  const [addModal, setAddModal] = useState(false);
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast]               = useState(null);

  const [newEvent, setNewEvent] = useState({
    customerName:'', eventDate:'', location:'',
    eventType:'Wedding', guestCount:'', totalAmount:'', notes:''
  });

  // ── Fetch ─────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.getBookings(token);
      if (res.success) setBookings(res.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // ── Calendar data ─────────────────────────────────────────
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow    = new Date(year, month, 1).getDay(); // 0=Sun
  // Prev month tail days shown
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  // Group bookings by date
  const byDate = {};
  bookings.forEach(b => {
    const dt = new Date(b.eventDate);
    const key = toDs(dt.getFullYear(), dt.getMonth(), dt.getDate());
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(b);
  });

  // Selected day's events
  const selectedEvents = selectedDate ? (byDate[selectedDate] || []) : [];
  const selectedEvent  = selectedEvents[0] || null; // show first

  // Upcoming events sorted
  const upcomingEvents = [...bookings]
    .filter(b => new Date(b.eventDate) >= today && b.status !== 'Cancelled')
    .sort((a,b) => new Date(a.eventDate) - new Date(b.eventDate));

  // Stats
  const totalEvents = bookings.length;
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'Completed').length;
  const totalRevenue = bookings.filter(b => b.status !== 'Cancelled').reduce((s,b) => s+(b.totalPrice||0),0);

  // ── Actions ───────────────────────────────────────────────
  const handleDayClick = (ds) => {
    setSelectedDate(ds);
    if (!byDate[ds]) {
      setNewEvent(p => ({ ...p, eventDate: ds }));
      setAddModal(true);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.customerName || !newEvent.eventDate || !newEvent.location) {
      showToast('Please fill required fields', 'err');
      return;
    }
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.createBooking({
        customerName: newEvent.customerName,
        eventDate: newEvent.eventDate,
        location: newEvent.location,
        services: [newEvent.eventType],
        eventType: newEvent.eventType,
        guestCount: parseInt(newEvent.guestCount) || 0,
        totalAmount: parseFloat(newEvent.totalAmount) || 0,
        notes: newEvent.notes,
        status: 'Confirmed'
      }, token);
      if (res.success) {
        await fetchBookings();
        setAddModal(false);
        setSelectedDate(newEvent.eventDate);
        setNewEvent({ customerName:'', eventDate:'', location:'', eventType:'Wedding', guestCount:'', totalAmount:'', notes:'' });
        showToast('Event added!');
      } else {
        showToast(res.message || 'Failed', 'err');
      }
    } catch (_) { showToast('Network error', 'err'); }
    finally { setIsSubmitting(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.updateBookingStatus(id, status, token);
      if (res.success) { await fetchBookings(); showToast(`Marked ${status}`); }
    } catch (_) { showToast('Update failed', 'err'); }
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <div className="animate-spin h-8 w-8 border-4 border-[#7C3AED] border-t-transparent rounded-full" />
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loading Calendar...</p>
    </div>
  );

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="pb-24 space-y-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .cal { font-family: 'Inter', system-ui, sans-serif; }
        @keyframes calUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .cal-in { animation: calUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes modalUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        .modal-in { animation: modalUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both; }
        .day-btn { transition: all 0.15s; }
        .day-btn:active { transform: scale(0.88); }
        .no-scroll::-webkit-scrollbar{display:none}
        .no-scroll{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* ── Purple Gradient Hero Header ──────────────────── */}
      <div className="cal cal-in relative overflow-hidden rounded-2xl px-4 py-4"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 55%, #6D28D9 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 bg-white" />
        <div className="absolute bottom-0 left-8 w-14 h-14 rounded-full opacity-10 bg-white" />
        <div className="absolute top-2 right-16 w-8 h-8 rounded-full opacity-15 bg-white" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="cal text-[8px] font-black uppercase tracking-[0.22em] text-purple-200 mb-0.5">Vendor Portal</p>
            <h1 className="cal text-[17px] font-black text-white tracking-tight leading-tight">Event Schedule</h1>
            <p className="cal text-[9px] font-semibold text-purple-200 mt-0.5">
              {vendorName} · {MONTHS[month]} {year}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-xl p-0.5 gap-0.5">
              {['Month','Week','Day'].map(v => (
                <button key={v} onClick={() => setCalView(v)}
                  className="px-2 py-1 rounded-lg text-[8px] font-bold transition-all"
                  style={{
                    background: calView === v ? 'rgba(255,255,255,0.95)' : 'transparent',
                    color: calView === v ? '#7C3AED' : 'rgba(255,255,255,0.85)'
                  }}>
                  {v}
                </button>
              ))}
            </div>
            {/* Add Event pill */}
            <button
              onClick={() => { setNewEvent(p => ({...p, eventDate: todayDs})); setAddModal(true); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-[#7C3AED] text-[8px] font-black uppercase tracking-wide shadow-lg active:scale-95 transition-all">
              <Icon name="plus" size="xs" className="w-2.5 h-2.5" /> Add Event
            </button>
          </div>
        </div>
        {/* Mini KPI strip */}
        <div className="relative z-10 flex items-center gap-2 mt-3 pt-3 border-t border-white/15">
          {[
            { label: 'Total', value: totalEvents },
            { label: 'Upcoming', value: confirmedCount },
            { label: 'Done', value: completedCount },
            { label: 'Revenue', value: fmtBudget(totalRevenue) || '₹0' },
          ].map((s,i) => (
            <div key={i} className="flex-1 text-center">
              <p className="cal text-[13px] font-black text-white leading-none">{s.value}</p>
              <p className="cal text-[7px] font-semibold text-purple-200 mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Calendar + Details Card ─────────────────── */}
      <div className="cal-in bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ animationDelay: '60ms' }}>

        {/* Split Layout */}
        <div className="flex flex-col">

          {/* ── Calendar Panel ───────────────────────────── */}
          <div className="p-1">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800 hover:text-[#7C3AED] transition-colors"
                onClick={() => {}}>
                {MONTHS[month]} {year}
                <Icon name="chevronDown" size="xs" className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentDate(new Date(year, month-1, 1))}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all active:scale-90">
                  <Icon name="chevronLeft" size="xs" className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button onClick={() => setCurrentDate(new Date(year, month+1, 1))}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all active:scale-90">
                  <Icon name="chevronRight" size="xs" className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Day headers — colourful */}
            <div className="grid grid-cols-7 mb-2 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(90deg,#F0EEFF,#FAF5FF)' }}>
              {DAYS.map((d,di) => (
                <div key={d} className="flex items-center justify-center h-7">
                  <span className="cal text-[8px] font-extrabold" style={{ color: di === 0 || di === 6 ? '#7C3AED' : '#64748B' }}>{d}</span>
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-y-0.5">

              {/* Prev month fade cells */}
              {[...Array(startDow)].map((_, i) => {
                const dayNum = prevDaysInMonth - startDow + 1 + i;
                return (
                  <div key={`prev-${i}`} className="h-9 flex flex-col items-center justify-start pt-1.5">
                    <span className="cal text-[10px] font-medium text-slate-200">{dayNum}</span>
                  </div>
                );
              })}

              {/* Current month cells */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const ds  = toDs(year, month, day);
                const events = byDate[ds] || [];
                const isToday    = ds === todayDs;
                const isSelected = ds === selectedDate;
                const hasEvents  = events.length > 0;

                return (
                  <div key={day} className="h-9 flex flex-col items-center justify-start pt-1">
                    <button
                      className="day-btn h-7 w-7 rounded-full flex flex-col items-center justify-center relative"
                      onClick={() => handleDayClick(ds)}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg,#7C3AED,#9333EA)'
                          : isToday
                          ? '#F0EEFF'
                          : hasEvents ? 'rgba(124,58,237,0.06)' : 'transparent',
                        boxShadow: isSelected ? '0 2px 8px rgba(124,58,237,0.35)' : 'none',
                      }}>
                      <span className="cal text-[10px] font-extrabold leading-none" style={{ color: isSelected ? '#fff' : isToday ? '#7C3AED' : hasEvents ? '#6D28D9' : '#000' }}>
                        {day}
                      </span>
                    </button>
                    {/* Event dots row */}
                    {hasEvents && (
                      <div className="flex items-center gap-px mt-0.5">
                        {events.slice(0, 3).map((ev, ei) => (
                          <div key={ei} className="h-1.5 w-1.5 rounded-full"
                            style={{ background: isSelected ? 'rgba(255,255,255,0.9)' : getColor(ev.eventType || ev.services?.[0]),
                              boxShadow: `0 0 3px ${getColor(ev.eventType || ev.services?.[0])}88` }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Next month fade cells */}
              {(() => {
                const total = startDow + daysInMonth;
                const remainder = total % 7 === 0 ? 0 : 7 - (total % 7);
                return [...Array(remainder)].map((_, i) => (
                  <div key={`next-${i}`} className="h-9 flex flex-col items-center justify-start pt-1.5">
                    <span className="cal text-[10px] font-medium text-slate-200">{i + 1}</span>
                  </div>
                ));
              })()}
            </div>

            {/* Legend */}
            <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-x-3 gap-y-1.5">
              {EVENT_TYPES.map(et => (
                <div key={et.id} className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ background: et.color }} />
                  <span className="cal text-[8px] font-semibold text-black">{et.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Selected Event Details ────────────────────── */}
          <div className="border-t-2 p-4" style={{ borderColor: selectedEvent ? getColor(selectedEvent.eventType || selectedEvent.services?.[0]) : '#F1F5F9' }}>
            {/* Details header accent */}
            {selectedEvent && (
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
                <div className="h-1 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${getColor(selectedEvent.eventType || selectedEvent.services?.[0])}, transparent)` }} />
                <span className="cal text-[7.5px] font-black uppercase tracking-widest" style={{ color: getColor(selectedEvent.eventType || selectedEvent.services?.[0]) }}>
                  {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'}) : ''}
                </span>
                <div className="h-1 flex-1 rounded-full" style={{ background: `linear-gradient(270deg, ${getColor(selectedEvent.eventType || selectedEvent.services?.[0])}, transparent)` }} />
              </div>
            )}
            {selectedEvent ? (
              <div className="cal-in space-y-3">
                {/* Status badge + Title */}
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide mb-2"
                    style={{
                      background: STATUS_CONFIG[selectedEvent.status]?.bg || '#F0EEFF',
                      color: STATUS_CONFIG[selectedEvent.status]?.text || '#7C3AED'
                    }}>
                    {STATUS_CONFIG[selectedEvent.status]?.label || selectedEvent.status}
                  </span>
                  <h3 className="cal text-[14px] font-extrabold text-slate-900 leading-tight">
                    {selectedEvent.customerName}
                    {selectedEvents.length > 1 && (
                      <span className="ml-1.5 text-[9px] font-bold text-slate-400">+{selectedEvents.length - 1} more</span>
                    )}
                  </h3>
                </div>

                {/* Detail rows */}
                <div className="space-y-2">
                  <DetailRow icon="calendar" text={fmtEventDate(selectedEvent.eventDate)} />
                  <DetailRow icon="clock"    text={fmtTime(selectedEvent.eventDate)} />
                  <DetailRow icon="location" text={selectedEvent.location || 'Venue TBD'} />
                  {selectedEvent.guestCount > 0 && (
                    <DetailRow icon="users"  text={`${selectedEvent.guestCount} – ${Math.round(selectedEvent.guestCount * 1.1)} Guests`} />
                  )}
                  {selectedEvent.totalPrice > 0 && (
                    <DetailRow icon="money"  text={fmtBudget(selectedEvent.totalPrice)} />
                  )}
                  {selectedEvent.eventType && (
                    <div className="flex items-center gap-2.5">
                      <div className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: getColor(selectedEvent.eventType) + '20' }}>
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: getColor(selectedEvent.eventType) }} />
                      </div>
                      <span className="cal text-[11px] font-semibold text-slate-700">{selectedEvent.eventType} Event</span>
                    </div>
                  )}
                  {selectedEvent.notes && (
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      <p className="cal text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                      <p className="cal text-[10px] font-medium text-slate-600 leading-relaxed">{selectedEvent.notes}</p>
                    </div>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
                    onClick={() => { setViewDetailsModal(true); }}>
                    View Details
                    <Icon name="arrow" size="xs" className="w-3 h-3" />
                  </button>
                  {selectedEvent.status === 'Confirmed' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleStatusChange(selectedEvent._id, 'Completed')}
                        className="h-8 rounded-xl bg-emerald-50 text-emerald-600 text-[8.5px] font-bold border border-emerald-100 active:scale-95 transition-all">
                        ✓ Done
                      </button>
                      <button onClick={() => handleStatusChange(selectedEvent._id, 'Cancelled')}
                        className="h-8 rounded-xl bg-rose-50 text-rose-500 text-[8.5px] font-bold border border-rose-100 active:scale-95 transition-all">
                        ✕ Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* No event on selected date */
              <div className="py-4 flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Icon name="calendar" size="sm" className="text-slate-300" />
                </div>
                <div>
                  <p className="cal text-[10px] font-bold text-slate-500">
                    {selectedDate
                      ? `No events on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short' })}`
                      : 'Select a date'}
                  </p>
                  <p className="cal text-[8.5px] text-slate-400 mt-0.5">Tap any date to view or add events</p>
                </div>
                <button
                  onClick={() => { setNewEvent(p => ({...p, eventDate: selectedDate || todayDs})); setAddModal(true); }}
                  className="mt-1 px-4 py-1.5 rounded-full text-[8.5px] font-bold text-white active:scale-95 transition-all"
                  style={{ background: '#7C3AED' }}>
                  + Add Event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────── */}
      <div className="cal-in grid grid-cols-4 gap-2" style={{ animationDelay: '80ms' }}>
        {[
          { label: 'Total', value: totalEvents, color: '#7C3AED', bg: '#F0EEFF' },
          { label: 'Upcoming', value: confirmedCount, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Done', value: completedCount, color: '#059669', bg: '#ECFDF5' },
          { label: 'Revenue', value: fmtBudget(totalRevenue) || '₹0', color: '#F59E0B', bg: '#FFFBEB', small: true },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-2.5 flex flex-col gap-1 shadow-sm"
            style={{ borderLeftWidth: 3, borderLeftColor: s.color }}>
            <p className="cal text-[13px] font-extrabold leading-none" style={{ color: s.color, fontSize: s.small ? '10px' : undefined }}>{s.value}</p>
            <p className="cal text-[7px] font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Upcoming Events Section ─────────────────────── */}
      {upcomingEvents.length > 0 && (
        <div className="cal-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between px-0.5 mb-2">
            <h2 className="cal text-[12px] font-extrabold text-black">Upcoming Events</h2>
            <span className="cal text-[8.5px] font-bold text-[#7C3AED]">View All</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scroll pb-1 px-2">
            {upcomingEvents.slice(0, 6).map((b, i) => {
              const evColor = getColor(b.eventType || b.services?.[0]);
              return (
                <div key={b._id || i}
                  className="cal-in shrink-0 w-[96px] bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all active:scale-95 mx-1"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => {
                    const dt = new Date(b.eventDate);
                    setSelectedDate(toDs(dt.getFullYear(), dt.getMonth(), dt.getDate()));
                  }}>
                  {/* Image placeholder / color bar */}
                                      <div className="h-[60px] relative overflow-hidden rounded-t-md"
                    style={{ background: `linear-gradient(135deg, ${evColor}22, ${evColor}44)` }}>
                    {/* decorative circles */}
                    <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full opacity-30"
                      style={{ background: evColor }} />
                    <div className="absolute bottom-1 left-2">
                      <div className="h-5 w-5 rounded-full border-2 border-white bg-slate-200 overflow-hidden" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: evColor }}>
                        {b.eventType || 'Event'}
                      </span>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <h4 className="cal text-[9px] font-extrabold text-black truncate leading-tight">{b.customerName}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: evColor }} />
                      <span className="cal text-[7.5px] font-semibold text-black">{b.eventType || 'Event'}</span>
                    </div>
                    <p className="cal text-[7.5px] font-semibold text-slate-400 mt-1">
                      {new Date(b.eventDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── All Events Schedule List ─────────────────────── */}
      <div className="cal-in" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between px-0.5 mb-2">
          <h2 className="cal text-[12px] font-extrabold text-black">All Events</h2>
          <button onClick={() => { setNewEvent(p=>({...p, eventDate: todayDs})); setAddModal(true); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-[8px] font-bold active:scale-95 transition-all"
            style={{ background: '#7C3AED' }}>
            <Icon name="plus" size="xs" className="w-2.5 h-2.5" /> Add
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="py-8 flex flex-col items-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Icon name="calendar" size="md" className="text-slate-200 mb-2" />
            <p className="cal text-[9px] font-bold text-slate-400 uppercase tracking-widest">No Events Yet</p>
            <button onClick={() => setAddModal(true)}
              className="mt-3 px-4 py-1.5 rounded-full text-white text-[8.5px] font-bold"
              style={{ background: '#7C3AED' }}>
              + Add First Event
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {[...bookings].sort((a,b) => new Date(a.eventDate) - new Date(b.eventDate)).map((b, i) => {
              const evColor = getColor(b.eventType || b.services?.[0]);
              const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.Confirmed;
              const dt = new Date(b.eventDate);
              const dsKey = toDs(dt.getFullYear(), dt.getMonth(), dt.getDate());
              return (
                <div key={b._id || i}
                  className="cal-in bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 p-3 cursor-pointer hover:border-violet-200 transition-all active:scale-[0.99]"
                  style={{ animationDelay: `${i * 35}ms` }}
                  onClick={() => { setSelectedDate(dsKey); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  {/* Color accent */}
                  <div className="shrink-0 w-1 h-10 rounded-full" style={{ background: evColor }} />

                  {/* Date block */}
                  <div className="shrink-0 w-10 text-center">
                    <p className="cal text-[16px] font-extrabold leading-none" style={{ color: evColor }}>
                      {dt.getDate()}
                    </p>
                    <p className="cal text-[8px] font-semibold text-slate-400">
                      {MONTHS[dt.getMonth()].slice(0,3)}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="cal text-[8px] font-extrabold text-black truncate leading-tight">{b.customerName}</h4>
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase"
                        style={{ background: st.bg, color: st.text }}>
                        {b.status}
                      </span>
                    </div>
                    <p className="cal text-[8px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <Icon name="location" size="xs" className="w-2 h-2 text-slate-300 shrink-0" />
                      {b.location || 'Venue TBD'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold"
                        style={{ background: evColor + '18', color: evColor }}>
                        {b.eventType || b.services?.[0] || 'Event'}
                      </span>
                      {b.guestCount > 0 && (
                        <span className="cal text-[7px] font-semibold text-black">👥 {b.guestCount}</span>
                      )}
                      {b.totalPrice > 0 && (
                        <span className="cal text-[7.5px] font-bold text-[#7C3AED]">{fmtBudget(b.totalPrice)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Event Modal ──────────────────────────────── */}
      {addModal && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={() => setAddModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl modal-in max-h-[92vh] flex flex-col z-[140] overflow-hidden">

            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="cal text-[14px] font-extrabold text-slate-900">Add New Event</h3>
                <p className="cal text-[8.5px] font-medium text-slate-400 mt-0.5">Schedule an event in your calendar</p>
              </div>
              <button onClick={() => setAddModal(false)}
                className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-all">
                <Icon name="close" size="xs" className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-y-auto no-scroll flex-1 p-5">
              <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleAddEvent(); }}>

                <MField label="Customer / Client Name" required>
                  <input type="text" required placeholder="e.g. Rahul & Sneha Wedding"
                    value={newEvent.customerName}
                    onChange={e => setNewEvent(p => ({...p, customerName: e.target.value}))}
                    className="field" />
                </MField>

                <div className="grid grid-cols-2 gap-2">
                  <MField label="Event Date" required>
                    <input type="date"
                      value={newEvent.eventDate}
                      onChange={e => setNewEvent(p => ({...p, eventDate: e.target.value}))}
                      className="field" />
                  </MField>
                  <MField label="Event Type">
                    <select value={newEvent.eventType}
                      onChange={e => setNewEvent(p => ({...p, eventType: e.target.value}))}
                      className="field appearance-none">
                      {EVENT_TYPES.map(et => <option key={et.id} value={et.id}>{et.label}</option>)}
                    </select>
                  </MField>
                </div>

                <MField label="Venue / Location" required>
                  <input type="text" required placeholder="e.g. The Leela Palace, Delhi"
                    value={newEvent.location}
                    onChange={e => setNewEvent(p => ({...p, location: e.target.value}))}
                    className="field" />
                </MField>

                <div className="grid grid-cols-2 gap-2">
                  <MField label="Guest Count">
                    <input type="number" placeholder="e.g. 300"
                      value={newEvent.guestCount}
                      onChange={e => setNewEvent(p => ({...p, guestCount: e.target.value}))}
                      className="field" />
                  </MField>
                  <MField label="Budget (₹)">
                    <input type="number" placeholder="e.g. 450000"
                      value={newEvent.totalAmount}
                      onChange={e => setNewEvent(p => ({...p, totalAmount: e.target.value}))}
                      className="field" />
                  </MField>
                </div>

                <MField label="Notes (optional)">
                  <textarea placeholder="Royal Floral Theme, special requests..."
                    value={newEvent.notes}
                    onChange={e => setNewEvent(p => ({...p, notes: e.target.value}))}
                    rows={2} className="field resize-none" />
                </MField>

                <style>{`
                  .field {
                    width:100%; height:40px; padding:0 12px;
                    background:#F8FAFC; border:1.5px solid #E2E8F0;
                    border-radius:12px; font-size:11px; font-weight:600;
                    color:#1E293B; font-family:'Inter',sans-serif;
                    outline:none; transition:all 0.15s;
                  }
                  textarea.field { height:auto; padding:10px 12px; }
                  .field:focus { border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,0.08); }
                `}</style>

                <button type="submit" disabled={isSubmitting}
                  className="w-full h-11 rounded-2xl text-white text-[10px] font-extrabold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                  {isSubmitting ? 'Saving...' : 'Save Event'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────── */}
      {viewDetailsModal && selectedEvent && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={() => setViewDetailsModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 z-[160] modal-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="cal text-[14px] font-extrabold text-slate-900">Event Details</h3>
                <button onClick={() => setViewDetailsModal(false)} className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-all">
                  <Icon name="close" size="xs" className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                <DetailRow icon="user" text={selectedEvent.customerName} />
                <DetailRow icon="calendar" text={fmtEventDate(selectedEvent.eventDate)} />
                <DetailRow icon="clock" text={fmtTime(selectedEvent.eventDate)} />
                <DetailRow icon="location" text={selectedEvent.location || 'Venue TBD'} />
                {selectedEvent.eventType && <DetailRow icon="tag" text={`${selectedEvent.eventType} Event`} />}
                {selectedEvent.notes && <p className="cal text-[9px] font-medium mt-1">{selectedEvent.notes}</p>}
              </div>
            </div>
          </div>
        )}
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-full text-white text-[9px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 cal-in"
            style={{ background: toast.type === 'err' ? '#E11D48' : '#7C3AED' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse" />
            {toast.msg}
          </div>
        )}
    </div>
  );
};

/* ─── Helper sub-components ─────────────────────────────── */
const DetailRow = ({ icon, text }) => (
  <div className="flex items-center gap-2.5">
    <div className="h-6 w-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
      <Icon name={icon} size="xs" className="w-3 h-3 text-slate-400" />
    </div>
    <span className="cal text-[11px] font-semibold text-slate-700 leading-tight">{text}</span>
  </div>
);

const MField = ({ label, children, required }) => (
  <div className="space-y-1">
    <label className="cal text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
      {label}{required && <span className="text-[#7C3AED] ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export default VendorCalendar;
