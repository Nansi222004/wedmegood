import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { userApi } from '../../../services/userApi';

const EVENT_TYPE_CONFIG = {
  WEDDING: {
    label: 'Wedding Day',
    color: 'bg-amber-500',
    textColor: 'text-amber-800',
    bgLight: 'bg-amber-50 border-amber-200',
    dotColor: '#D97706',
    icon: 'rings'
  },
  BOOKING: {
    label: 'Vendor Booking',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-800',
    bgLight: 'bg-emerald-50 border-emerald-200',
    dotColor: '#059669',
    icon: 'buildingPremium'
  },
  CHECKLIST: {
    label: 'Checklist Task',
    color: 'bg-sky-500',
    textColor: 'text-sky-800',
    bgLight: 'bg-sky-50 border-sky-200',
    dotColor: '#0284C7',
    icon: 'checkList'
  },
  TIMELINE: {
    label: 'Timeline Event',
    color: 'bg-purple-500',
    textColor: 'text-purple-800',
    bgLight: 'bg-purple-50 border-purple-200',
    dotColor: '#7C3AED',
    icon: 'clock'
  },
  RSVP_DEADLINE: {
    label: 'RSVP Deadline',
    color: 'bg-rose-500',
    textColor: 'text-rose-800',
    bgLight: 'bg-rose-50 border-rose-200',
    dotColor: '#E11D48',
    icon: 'mail'
  }
};

// Safe date normalization preventing UTC shifting
const toDateKey = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const WeddingCalendar = () => {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'agenda'

  // Fetch events for active view range
  useEffect(() => {
    let isMounted = true;
    const fetchCalendarEvents = async () => {
      try {
        setLoading(true);
        // Load for current year & surrounding months
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const start = new Date(year, month - 1, 1).toISOString();
        const end = new Date(year, month + 2, 0).toISOString();

        const res = await userApi.getCalendar({ startDate: start, endDate: end });
        if (isMounted && res.success && Array.isArray(res.data?.events)) {
          setEvents(res.data.events);
        }
      } catch (err) {
        console.warn('Failed to load calendar events:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCalendarEvents();
    return () => { isMounted = false; };
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      if (filterType !== 'ALL' && ev.type !== filterType) continue;
      const key = toDateKey(ev.date);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events, filterType]);

  // Calendar matrix calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid = useMemo(() => {
    const days = [];
    // Leading blank days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ blank: true, key: `blank-${i}` });
    }
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const mStr = String(month + 1).padStart(2, '0');
      const dateKey = `${year}-${mStr}-${dayStr}`;
      days.push({
        dayNumber: d,
        dateKey,
        events: eventsByDate[dateKey] || []
      });
    }
    return days;
  }, [year, month, firstDayOfMonth, daysInMonth, eventsByDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateKey(toDateKey(now));
  };

  const selectedDayEvents = eventsByDate[selectedDateKey] || [];

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 pb-28 bg-transparent">
      <div className="max-w-xl mx-auto space-y-5">
        
        {/* Top Header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="w-12 h-12 flex-shrink-0 rounded-2xl bg-white shadow-sm border border-white flex items-center justify-center active:scale-95 transition-all text-[#4A2B42]"
          >
            <Icon name="chevronLeft" size="sm" />
          </button>
          <div>
            <h1 className="text-[28px] font-bold text-[#4A2B42] leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
              Wedding Planning Calendar
            </h1>
            <p className="text-[13px] text-[#6B6C80] leading-snug mt-1">
              Milestones, vendor dates, checklists, deadlines, and timeline events
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-5 py-2.5 rounded-[14px] text-[13px] font-bold transition-all ${
              viewMode === 'month' ? 'bg-[#5C204B] text-white shadow-md' : 'bg-white/70 text-[#4A2B42] hover:bg-white'
            }`}
          >
            Month View
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-5 py-2.5 rounded-[14px] text-[13px] font-bold transition-all ${
              viewMode === 'agenda' ? 'bg-[#5C204B] text-white shadow-md' : 'bg-white/70 text-[#4A2B42] hover:bg-white'
            }`}
          >
            Agenda View
          </button>
          <button 
            onClick={goToToday} 
            className="px-5 py-2.5 rounded-[14px] text-[13px] font-bold bg-[#F4E8F8] text-[#863773] hover:bg-[#ebd5f2] transition-all"
          >
            Today
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'WEDDING', 'BOOKING', 'CHECKLIST', 'TIMELINE', 'RSVP_DEADLINE'].map(type => {
            const isSelected = filterType === type;
            const config = EVENT_TYPE_CONFIG[type];
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${
                  isSelected
                    ? 'bg-[#5C204B] text-white'
                    : 'bg-white/90 text-[#6B6C80] hover:bg-white'
                }`}
              >
                {config && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.dotColor }}
                  />
                )}
                {type === 'ALL' ? 'All Milestones' : config?.label || type}
              </button>
            );
          })}
        </div>

        {/* Main Calendar Area */}
        {viewMode === 'month' ? (
          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md rounded-2xl p-2 px-4 border border-white/50">
              <button
                onClick={prevMonth}
                className="p-2 active:scale-95 transition-all text-[#4A2B42]"
              >
                <Icon name="chevronLeft" size="sm" />
              </button>
              <h2 className="text-[19px] font-bold text-[#4A2B42]" style={{ fontFamily: '"Playfair Display", serif' }}>
                {monthName}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 active:scale-95 transition-all text-[#4A2B42]"
              >
                <Icon name="chevronRight" size="sm" />
              </button>
            </div>

            {/* 7-day Grid */}
            <div 
              className="rounded-3xl p-5 shadow-sm border border-white/50 bg-white/40"
              style={{
                backgroundImage: "url('/calender%20bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-3 text-center text-[10px] font-bold uppercase text-[#6B6C80] tracking-widest">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-2">
                {daysGrid.map((cell, idx) => {
                  if (cell.blank) {
                    return <div key={cell.key || idx} className="aspect-square" />;
                  }

                  const isSelected = cell.dateKey === selectedDateKey;
                  const isToday = cell.dateKey === toDateKey(new Date());

                  return (
                    <button
                      key={cell.dateKey}
                      onClick={() => setSelectedDateKey(cell.dateKey)}
                      className={`relative aspect-square rounded-[14px] flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#5C204B] text-white shadow-md'
                          : 'bg-[#FDFBF9] hover:bg-white text-[#4A2B42]'
                      }`}
                    >
                      <span className={`text-[15px] font-semibold ${isSelected ? 'text-white' : 'text-[#4A2B42]'}`}>
                        {cell.dayNumber}
                      </span>
                      
                      {/* Event Dots Container */}
                      <div className="absolute bottom-1.5 flex gap-0.5 justify-center w-full">
                        {cell.events.slice(0, 3).map((ev, i) => {
                          const conf = EVENT_TYPE_CONFIG[ev.type] || {};
                          return (
                            <span
                              key={ev.id || i}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: isSelected ? 'white' : conf.dotColor || '#5C204B' }}
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Inspector Panel */}
            <div 
              className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/50 relative overflow-hidden"
              style={{
                backgroundImage: "url('/cakender%20div%20bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className="mb-6 relative z-10">
                <p className="text-[10px] font-black uppercase text-[#6B6C80] tracking-wider mb-1">
                  EVENTS ON
                </p>
                <h3 className="text-[22px] font-bold text-[#4A2B42]" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="py-8 text-center text-[#6B6C80] relative z-10">
                  <div className="w-14 h-14 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                    <Icon name="calendar" size="md" className="text-[#4A2B42]/50" />
                  </div>
                  <p className="text-[14px] font-bold text-[#4A2B42] mb-1">No milestones on this day</p>
                  <p className="text-[12px]">Select another date or switch to agenda view</p>
                </div>
              ) : (
                <div className="space-y-3 relative z-10">
                  {selectedDayEvents.map(ev => {
                    const conf = EVENT_TYPE_CONFIG[ev.type] || {};
                    return (
                      <div
                        key={ev.id}
                        className={`p-4 rounded-2xl bg-white/80 shadow-sm border border-white transition-all`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: conf.dotColor || '#5C204B' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: conf.dotColor || '#5C204B' }} />
                            {conf.label || ev.type}
                          </span>
                          {ev.time && (
                            <span className="text-[11px] font-bold text-[#6B6C80]">
                              {ev.time}
                            </span>
                          )}
                        </div>
                        <h4 className="text-[15px] font-bold text-[#4A2B42]">
                          {ev.title}
                        </h4>
                        {ev.status && (
                          <p className="text-[12px] text-[#6B6C80] capitalize mt-1">
                            Status: <span className="font-semibold text-[#4A2B42]">{ev.status}</span>
                          </p>
                        )}
                        {ev.navigationPath && (
                          <button
                            onClick={() => navigate(ev.navigationPath)}
                            className="mt-3 text-[12px] font-bold text-[#5C204B] hover:underline flex items-center gap-1"
                          >
                            <span>Open details</span>
                            <Icon name="chevronRight" size="xs" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Agenda View */
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/50 space-y-4">
            <h3 className="text-xl font-bold text-[#4A2B42]" style={{ fontFamily: '"Playfair Display", serif' }}>
              All Upcoming Milestones & Deadlines
            </h3>

            {loading ? (
              <div className="py-12 text-center text-[#6B6C80]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C204B] mx-auto mb-2" />
                <p className="text-[13px]">Loading calendar milestones...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center text-[#6B6C80]">
                <p className="text-[14px]">No milestones found in this window.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#4A2B42]/10">
                {events
                  .filter(ev => filterType === 'ALL' || ev.type === filterType)
                  .map(ev => {
                    const conf = EVENT_TYPE_CONFIG[ev.type] || {};
                    const dateObj = new Date(ev.date);
                    return (
                      <div key={ev.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-4">
                          <div className="w-12 text-center flex-shrink-0 bg-white rounded-xl py-2 shadow-sm border border-white">
                            <span className="text-[10px] font-black uppercase text-[#5C204B] block">
                              {dateObj.toLocaleString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-[18px] font-bold text-[#4A2B42] leading-none block mt-0.5">
                              {dateObj.getDate()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: conf.dotColor || '#5C204B' }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: conf.dotColor || '#5C204B' }} />
                                {conf.label || ev.type}
                              </span>
                              {ev.status && (
                                <span className="text-[10px] text-[#6B6C80] capitalize">
                                  • {ev.status}
                                </span>
                              )}
                            </div>
                            <h4 className="text-[15px] font-bold text-[#4A2B42]">{ev.title}</h4>
                          </div>
                        </div>

                        {ev.navigationPath && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(ev.navigationPath)}
                            className="self-end sm:self-center text-xs bg-white text-[#4A2B42] border-[#4A2B42]/20 hover:border-[#4A2B42]/40"
                          >
                            View
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default WeddingCalendar;
