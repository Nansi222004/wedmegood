import { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';

const VendorBookings = () => {
  const { refreshData } = useVendorState();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.getBookings(token);
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.updateBookingStatus(bookingId, newStatus, token);
      if (res.success) {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: res.data.status } : b));
        setOpenMenu(null);
        refreshData();
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (b._id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'Pending').length,
      confirmed: bookings.filter(b => b.status === 'Confirmed' || b.status === 'Accepted').length,
      revenue: bookings.reduce((acc, b) => acc + (b.totalPrice || b.totalAmount || 0), 0)
    };
  }, [bookings]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return { bg: '#F0FDF4', color: '#16A34A', border: '#DCFCE7' };
      case 'Rejected': return { bg: '#FFF1F2', color: '#E11D48', border: '#FFE4E6' };
      case 'Confirmed': return { bg: '#F0F9FF', color: '#0284C7', border: '#E0F2FE' };
      case 'Pending': return { bg: '#FFFBEB', color: '#D97706', border: '#FEF3C7' };
      default: return { bg: '#F8FAFC', color: '#64748B', border: '#F1F5F9' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-rose-400 border-t-transparent rounded-full"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streaming Event Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>
        {`
          @keyframes flipIn {
            0% {
              opacity: 0;
              transform: perspective(1000px) rotateX(-15deg) translateY(20px) scale(0.98);
            }
            100% {
              opacity: 1;
              transform: perspective(1000px) rotateX(0deg) translateY(0) scale(1);
            }
          }
          .animate-flip-in {
            animation: flipIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
        `}
      </style>
      
      {/* Header & Search Group */}
      <div className="space-y-2 pb-1 animate-flip-in" style={{ animationDelay: '0ms' }}>
        {/* Simple Clean Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-[20px] font-semibold text-[#1e293b] tracking-tight leading-tight">Order Management</h1>
            <p className="text-[11px] font-medium text-slate-500">Overseeing {stats.total} Secured Engagements</p>
          </div>
          <button
            onClick={fetchBookings}
            className="h-8 w-8 rounded-lg bg-white border border-slate-100 text-slate-500 hover:text-indigo-600 transition-all flex items-center justify-center active:scale-95 hover:rotate-180 duration-500 shadow-sm"
          >
            <Icon name="clock" size="xs" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-1.5 px-1 overflow-x-auto no-scrollbar">
          <div className="relative flex-shrink-0">
            <Icon name="search" size="xs" color="#94a3b8" className="absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 sm:w-44 h-8 pl-8 pr-3 bg-white border border-slate-100 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-200 transition-all shadow-sm focus:w-40 sm:focus:w-52"
            />
          </div>
          <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100 flex-shrink-0">
            {['All', 'Pending', 'Accepted', 'Confirmed', 'Rejected'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all ${statusFilter === status ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 scale-105' : 'text-slate-500 hover:text-slate-700 hover:scale-105'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-1">
        {[
          { 
            label: 'Booked Volume', 
            value: stats.revenue > 100000 ? `Γé╣${(stats.revenue/100000).toFixed(1)}L` : `Γé╣${stats.revenue.toLocaleString()}`, 
            trend: 'Total Revenue', 
            color: 'amber', 
            icon: 'money',
            path: 'M0 25 L15 15 L35 22 L55 10 L75 18 L90 5 L100 10',
            dots: [[15,15], [35,22], [55,10], [75,18], [90,5]]
          },
          { 
            label: 'Active Schedule', 
            value: stats.total, 
            trend: 'All Bookings', 
            color: 'indigo', 
            icon: 'calendar',
            path: 'M0 20 L20 25 L40 15 L60 20 L80 10 L100 15',
            dots: [[20,25], [40,15], [60,20], [80,10]]
          },
          { 
            label: 'Pending Confirm', 
            value: stats.pending, 
            trend: 'Needs Action', 
            color: 'blue', 
            icon: 'clock',
            path: 'M0 15 L20 10 L40 20 L60 15 L80 25 L100 20',
            dots: [[20,10], [40,20], [60,15], [80,25]]
          },
          { 
            label: 'Confirmed Events', 
            value: stats.confirmed, 
            trend: 'Secured', 
            color: 'emerald', 
            icon: 'check',
            path: 'M0 28 L15 22 L35 25 L55 15 L75 20 L90 8 L100 12',
            dots: [[15,22], [35,25], [55,15], [75,20], [90,8]]
          }
        ].map((item, i) => {
          const colorStyles = {
            indigo: { bg: 'bg-indigo-50/50', border: 'border-indigo-100/50', iconBg: 'bg-white', text: 'text-indigo-600', trend: 'text-indigo-500' },
            blue: { bg: 'bg-blue-50/50', border: 'border-blue-100/50', iconBg: 'bg-white', text: 'text-blue-600', trend: 'text-blue-500' },
            amber: { bg: 'bg-orange-50/50', border: 'border-orange-100/50', iconBg: 'bg-white', text: 'text-orange-500', trend: 'text-orange-400' },
            emerald: { bg: 'bg-emerald-50/50', border: 'border-emerald-100/50', iconBg: 'bg-white', text: 'text-emerald-600', trend: 'text-emerald-500' },
          };
          const style = colorStyles[item.color];
          
          return (
            <div 
              key={i} 
              className={`relative p-2.5 pb-10 sm:pb-11 rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] animate-flip-in ${style.border} ${style.bg} flex flex-col min-h-[95px] sm:min-h-[105px] overflow-hidden`}
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              {/* Top Row: Icon + Value */}
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center shadow-sm ${style.iconBg} ${style.text}`}>
                  <Icon name={item.icon} size="xs" />
                </div>
                <span className={`text-[16px] sm:text-[20px] font-semibold tracking-tight leading-none ${style.text}`}>{item.value}</span>
              </div>
              
              {/* Middle Row: Label + Trend */}
              <div className="relative z-10 flex-1 flex flex-col justify-start pl-0.5">
                <p className="text-[10px] sm:text-[12px] font-medium text-slate-800 leading-tight mb-0.5">{item.label}</p>
                <p className={`text-[8.5px] sm:text-[10px] font-medium ${style.trend}`}>{item.trend}</p>
              </div>
              
              {/* Bottom Sparkline / Wave */}
              <div className={`absolute bottom-0 left-0 right-0 h-10 sm:h-12 ${style.text} pointer-events-none transition-transform duration-500 group-hover:translate-y-1`}>
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full opacity-80">
                  <defs>
                    <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Gradient Fill */}
                  <path d={`${item.path} L100 30 L0 30 Z`} fill={`url(#grad-${i})`} />
                  {/* Stroke Line */}
                  <path d={item.path} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  {/* Dots */}
                  {item.dots.map((dot, idx) => (
                    <circle key={idx} cx={dot[0]} cy={dot[1]} r="1.5" fill="currentColor" className="animate-pulse" />
                  ))}
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Booking Grid */}
      <div className="grid gap-4">
        {filteredBookings.length === 0 ? (
          <div className="vendor-surface rounded-[2.5rem] p-24 text-center bg-slate-50 border border-dashed border-slate-200 animate-flip-in">
             <div className="h-20 w-20 rounded-full bg-white mx-auto flex items-center justify-center text-slate-200 mb-6 shadow-sm">
                <Icon name="checkList" size="lg" />
             </div>
             <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No active bookings</p>
             <p className="text-[11px] font-bold text-slate-300 mt-2 italic">Your event calendar is currently open for new opportunities.</p>
          </div>
        ) : (
          filteredBookings.map((booking, index) => {
            const status = getStatusColor(booking.status);
            
            // Format Date
            const d = booking.eventDate ? new Date(booking.eventDate) : null;
            const month = d ? d.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
            const dateNum = d ? d.getDate() : '--';
            const dayStr = d ? d.toLocaleString('en-US', { weekday: 'short' }) : '---';
            
            // Get Initials
            const getInitials = (name) => {
              if (!name) return 'BK';
              return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            };

            return (
              <div 
                key={booking._id} 
                className="rounded-[1rem] p-4 border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-x-auto no-scrollbar animate-flip-in"
                style={{ 
                  backgroundColor: status.bg, 
                  borderColor: status.border,
                  animationDelay: `${(index + 5) * 100}ms`
                }}
              >
                <div className="flex flex-col gap-4 min-w-[550px]">
                  
                  {/* Main Content Row */}
                  <div className="flex items-center gap-4">
                    
                    {/* Date Column */}
                    <div className="flex flex-col items-center justify-center w-12 shrink-0">
                      <span className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase mb-0.5">{month}</span>
                      <span className="text-[22px] font-bold text-[#1e293b] leading-none mb-1">{dateNum}</span>
                      <span className="text-[10px] font-semibold text-slate-500">{dayStr}</span>
                    </div>

                    {/* Customer Image Placeholder */}
                    <div className="h-[60px] w-[60px] rounded-[14px] bg-[#fdf2f8] flex items-center justify-center text-[#db2777] shrink-0 border border-slate-50 shadow-inner">
                       <span className="text-xl font-bold tracking-tighter">{getInitials(booking.customerName)}</span>
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 flex flex-col justify-center min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-[15px] font-semibold text-[#1e293b] tracking-tight">{booking.customerName}</h3>
                        <span className="px-2 py-0.5 rounded text-[#7F56D9] bg-[#F4EBFF] text-[9px] font-semibold uppercase tracking-widest">
                          Event
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
                        <Icon name="map" size="xs" color="#64748b" />
                        <span className="truncate">{booking.location || 'Venue details pending'}</span>
                      </div>

                      <div className="text-[11px] font-medium text-slate-500">
                         {booking.services?.join(' / ') || 'Standard Photography'}
                      </div>
                    </div>

                    {/* Pricing & Status */}
                    <div className="flex flex-col items-end shrink-0 min-w-[100px]">
                       <span className="text-[15px] font-bold text-[#1e293b] mb-0.5">Γé╣{(booking.totalPrice || booking.totalAmount || 0).toLocaleString()}</span>
                       <span className="text-[9px] font-medium text-slate-400 mb-2">Total Package</span>
                       <span className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: status.bg, color: status.color }}>
                          {booking.status}
                       </span>
                    </div>
                    
                    {/* Circular Progress */}
                    <div className="flex flex-col items-center shrink-0 ml-2">
                       <div className="h-[46px] w-[46px] rounded-full border-[3px] border-indigo-600 flex items-center justify-center mb-1">
                          <span className="text-[11px] font-semibold text-[#1e293b]">100%</span>
                       </div>
                       <span className="text-[8px] text-slate-500 font-medium">Preparation</span>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex items-center gap-2 pt-2">
                    <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200/60 text-[11px] font-semibold text-indigo-600 hover:shadow-sm transition-all shadow-sm">
                      <Icon name="eye" size="xs" /> View Details
                    </button>
                    <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200/60 text-[11px] font-semibold text-slate-600 hover:shadow-sm transition-all shadow-sm">
                      <Icon name="phone" size="xs" /> Call
                    </button>
                    <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200/60 text-[11px] font-semibold text-emerald-600 hover:shadow-sm transition-all shadow-sm">
                      <Icon name="chat" size="xs" /> WhatsApp
                    </button>
                    
                    {booking.status === 'Pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(booking._id, 'Accepted')}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-[11px] font-semibold text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all ml-auto"
                      >
                         <Icon name="check" size="xs" /> Accept
                      </button>
                    )}
                    {booking.status === 'Accepted' && (
                      <button 
                        onClick={() => handleStatusUpdate(booking._id, 'Confirmed')}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 text-[11px] font-semibold text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all ml-auto"
                      >
                         <Icon name="check" size="xs" /> Confirm
                      </button>
                    )}
                    
                    <div className="relative ml-auto">
                       <button 
                         className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                         onClick={(e) => {
                           e.stopPropagation();
                           setOpenMenu(openMenu === booking._id ? null : booking._id);
                         }}
                       >
                          <Icon name="more" size="xs" />
                       </button>

                       {openMenu === booking._id && (
                         <>
                           <div className="fixed inset-0 z-[120]" onClick={() => setOpenMenu(null)}></div>
                           <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-[130] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 p-1.5">
                              {booking.status !== 'Confirmed' && booking.status !== 'Rejected' && (
                                <button 
                                  onClick={() => handleStatusUpdate(booking._id, 'Confirmed')}
                                  className="w-full px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest hover:bg-slate-50 text-slate-700 rounded-lg transition-all"
                                >
                                   Mark as Confirmed
                                </button>
                              )}
                              <button 
                                onClick={() => handleStatusUpdate(booking._id, 'Rejected')}
                                className="w-full px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest hover:bg-rose-50 text-rose-600 rounded-lg transition-all mt-1"
                              >
                                 Cancel Booking
                              </button>
                           </div>
                         </>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VendorBookings;
