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
    <div className="min-h-screen px-4 sm:px-6 py-6 pb-28" style={{ backgroundColor: '#EAE1D8' }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="p-2.5 rounded-xl bg-white shadow-sm border border-white active:scale-95 transition-all text-[#3D2B2B]"
            >
              <Icon name="chevronLeft" size="sm" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
                Wedding Planning Calendar
              </h1>
              <p className="text-xs text-[#3D2B2B]/60">
                Milestones, vendor dates, checklist deadlines, and timeline events
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex bg-white/70 backdrop-blur rounded-xl p-1 shadow-sm border border-white">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'month' ? 'bg-[#3D2B2B] text-white shadow' : 'text-[#3D2B2B]/70'
                }`}
              >
                Month Grid
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'agenda' ? 'bg-[#3D2B2B] text-white shadow' : 'text-[#3D2B2B]/70'
                }`}
              >
                Agenda View
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={goToToday} className="bg-white">
              Today
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['ALL', 'WEDDING', 'BOOKING', 'CHECKLIST', 'TIMELINE', 'RSVP_DEADLINE'].map(type => {
            const isSelected = filterType === type;
            const config = EVENT_TYPE_CONFIG[type];
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm border ${
                  isSelected
                    ? 'bg-[#3D2B2B] text-white border-[#3D2B2B]'
                    : 'bg-white/90 text-[#3D2B2B]/80 border-white hover:bg-white'
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

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-white">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-[#EAE1D8]/50 active:scale-95 transition-all text-[#3D2B2B]"
            aria-label="Previous Month"
          >
            <Icon name="chevronLeft" size="md" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
            {monthName}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-[#EAE1D8]/50 active:scale-95 transition-all text-[#3D2B2B]"
            aria-label="Next Month"
          >
            <Icon name="chevronRight" size="md" />
          </button>
        </div>

        {/* Main Calendar Area */}
        {viewMode === 'month' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-day Grid */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-white">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] font-black uppercase text-[#3D2B2B]/40 tracking-wider">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {daysGrid.map((cell, idx) => {
                  if (cell.blank) {
                    return <div key={cell.key || idx} className="h-20 sm:h-24 rounded-2xl bg-transparent" />;
                  }

                  const isSelected = cell.dateKey === selectedDateKey;
                  const isToday = cell.dateKey === toDateKey(new Date());
                  const hasEvents = cell.events.length > 0;

                  return (
                    <button
                      key={cell.dateKey}
                      onClick={() => setSelectedDateKey(cell.dateKey)}
                      className={`h-20 sm:h-24 rounded-2xl p-1.5 flex flex-col justify-between text-left transition-all border ${
                        isSelected
                          ? 'border-[#3D2B2B] bg-[#3D2B2B]/5 shadow-sm'
                          : isToday
                          ? 'border-rose-300 bg-rose-50/50'
                          : 'border-transparent bg-[#FAF8F5] hover:bg-[#F3EFEA]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold rounded-md px-1.5 py-0.5 ${
                          isSelected
                            ? 'bg-[#3D2B2B] text-white'
                            : isToday
                            ? 'bg-rose-500 text-white'
                            : 'text-[#3D2B2B]'
                        }`}>
                          {cell.dayNumber}
                        </span>
                        {hasEvents && (
                          <span className="text-[10px] font-bold text-[#3D2B2B]/50">
                            {cell.events.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips / Dots */}
                      <div className="w-full space-y-1 overflow-hidden">
                        {cell.events.slice(0, 2).map((ev, i) => {
                          const conf = EVENT_TYPE_CONFIG[ev.type] || {};
                          return (
                            <div
                              key={ev.id || i}
                              className={`text-[9px] font-semibold truncate rounded px-1 py-0.5 leading-tight ${conf.bgLight || 'bg-gray-100'} ${conf.textColor || 'text-gray-700'}`}
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                        {cell.events.length > 2 && (
                          <div className="text-[8px] font-bold text-[#3D2B2B]/50 pl-1">
                            +{cell.events.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Inspector Panel */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-white flex flex-col h-fit">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <p className="text-[10px] font-black uppercase text-[#3D2B2B]/40 tracking-wider">
                  Events on
                </p>
                <h3 className="text-xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="py-12 text-center text-[#3D2B2B]/50 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#EAE1D8]/50 flex items-center justify-center">
                    <Icon name="calendar" size="md" />
                  </div>
                  <p className="text-xs font-semibold">No milestones on this day</p>
                  <p className="text-[10px] text-[#3D2B2B]/40">Select another date or switch to agenda view</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map(ev => {
                    const conf = EVENT_TYPE_CONFIG[ev.type] || {};
                    return (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-2xl border transition-all ${conf.bgLight || 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white ${conf.color || 'bg-gray-600'}`}>
                            {conf.label || ev.type}
                          </span>
                          {ev.time && (
                            <span className="text-[10px] font-bold text-gray-500">
                              {ev.time}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[#3D2B2B]">
                          {ev.title}
                        </h4>
                        {ev.status && (
                          <p className="text-[11px] text-gray-600 capitalize mt-0.5">
                            Status: <span className="font-semibold">{ev.status}</span>
                          </p>
                        )}
                        {ev.navigationPath && (
                          <button
                            onClick={() => navigate(ev.navigationPath)}
                            className="mt-2 text-xs font-bold text-[#3D2B2B] hover:underline flex items-center gap-1"
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
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white space-y-4">
            <h3 className="text-lg font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
              All Upcoming Milestones & Deadlines
            </h3>

            {loading ? (
              <div className="py-12 text-center text-[#3D2B2B]/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D2B2B] mx-auto mb-2" />
                <p className="text-xs">Loading calendar milestones...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center text-[#3D2B2B]/50">
                <p className="text-sm">No milestones found in this window.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {events
                  .filter(ev => filterType === 'ALL' || ev.type === filterType)
                  .map(ev => {
                    const conf = EVENT_TYPE_CONFIG[ev.type] || {};
                    const dateObj = new Date(ev.date);
                    return (
                      <div key={ev.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 text-center flex-shrink-0">
                            <span className="text-[10px] font-black uppercase text-[#3D2B2B]/40 block">
                              {dateObj.toLocaleString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-lg font-bold text-[#3D2B2B] leading-none block">
                              {dateObj.getDate()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white ${conf.color || 'bg-gray-600'}`}>
                                {conf.label || ev.type}
                              </span>
                              {ev.status && (
                                <span className="text-[10px] text-gray-500 capitalize">
                                  ({ev.status})
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-[#3D2B2B]">{ev.title}</h4>
                          </div>
                        </div>

                        {ev.navigationPath && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(ev.navigationPath)}
                            className="self-end sm:self-center text-xs"
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
