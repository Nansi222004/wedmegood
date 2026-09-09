import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { useVendorState } from '../useVendorState';

const VendorTopbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { vendorState } = useVendorState();
  const [showBookingsDropdown, setShowBookingsDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const businessName = vendorState?.businessName || 'Emerald Studio';
  const bookings = vendorState?.bookings || [];
  const upcomingBookings = bookings.filter(b => b.status === 'Upcoming' || b.status === 'Confirmed');

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBookingsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div id="global-topbar" className="bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 h-16 px-2 sm:px-4 lg:px-6 border-b border-slate-100 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300">
      <style>{`
        .font-serif { font-family: 'Poppins', sans-serif; }
      `}</style>

      {/* Left Side: Mobile Menu + Avatar + Brand */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button 
          className="h-8 w-8 flex items-center justify-center bg-transparent text-slate-500 active:scale-95 transition-all lg:hidden flex-shrink-0"
          onClick={onMenuClick}
        >
          <Icon name="menu" size="sm" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-3 cursor-pointer group min-w-0" onClick={() => navigate('/vendor/dashboard')}>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm transition-transform group-hover:scale-105 flex-shrink-0">
            <img 
              src={vendorState?.logo || '/assets/vendor/logo_theme.png'} 
              alt="Logo" 
              className="h-full w-full object-cover"
              onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=' + businessName}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[12px] xs:text-[13px] sm:text-[15px] font-sans font-medium text-slate-900 leading-tight truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[220px] lg:max-w-none">{businessName}</span>
              <Icon name="verified" size="xs" className="text-violet-500 flex-shrink-0" />
            </div>
            <span className="text-[8px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none mt-0.5 truncate">Vendor Portal</span>
          </div>
        </div>
      </div>

      {/* Right Side: Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 mr-3 sm:mr-5">
        <button className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center bg-transparent text-slate-500 hover:text-violet-600 active:scale-95 transition-all">
          <Icon name="search" size="sm" />
        </button>

        {/* Calendar button for bookings dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center transition-all relative active:scale-95 ${
              showBookingsDropdown 
                ? 'text-violet-600 bg-violet-50/70 rounded-lg' 
                : 'bg-transparent text-slate-500 hover:text-violet-600'
            }`}
            onClick={() => setShowBookingsDropdown(!showBookingsDropdown)}
          >
            <Icon name="calendar" size="sm" />
            {upcomingBookings.length > 0 && (
              <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-violet-600 text-white text-[8px] font-medium flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {upcomingBookings.length}
              </span>
            )}
          </button>

          {/* Bookings Dropdown Popover */}
          {showBookingsDropdown && (
            <div className="absolute right-0 top-11 mt-2 w-[290px] sm:w-[320px] bg-white border border-slate-100 shadow-xl rounded-2xl p-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 select-none">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-50">
                <span className="text-[11px] font-medium text-slate-800 uppercase tracking-wider">Upcoming Bookings</span>
                <span className="text-[9px] font-medium text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100/50">
                  {upcomingBookings.length} Active
                </span>
              </div>

              {upcomingBookings.length > 0 ? (
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto no-scrollbar">
                  {upcomingBookings.slice(0, 4).map((book) => {
                    const d = new Date(book.eventDate);
                    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const monthStr = months[d.getMonth()];
                    const dateVal = d.getDate();
                    const dayStr = days[d.getDay()];

                    return (
                      <div 
                        key={book._id || book.id} 
                        className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50/80 cursor-pointer transition-all border border-transparent hover:border-slate-100/50"
                        onClick={() => {
                          setShowBookingsDropdown(false);
                          navigate('/vendor/bookings');
                        }}
                      >
                        {/* Mini Calendar block */}
                        <div className="w-9 h-11 bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-slate-100 flex-shrink-0">
                          <span className="text-[6.5px] font-medium text-violet-500 leading-none uppercase">{monthStr}</span>
                          <span className="text-[12px] font-medium text-slate-700 leading-none my-0.5">{dateVal}</span>
                          <span className="text-[6.5px] font-medium text-slate-400 leading-none uppercase">{dayStr}</span>
                        </div>

                        {/* Customer Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-slate-800 truncate leading-tight tracking-tight">{book.customerName}</p>
                          <p className="text-[8.5px] font-medium text-slate-400 truncate leading-none mt-0.5">{book.services?.join(', ') || 'Wedding Event'}</p>
                          <div className="flex items-center gap-0.5 text-[8px] font-medium text-slate-400 mt-1 truncate">
                            <Icon name="location" size="xs" className="w-2.5 h-2.5 flex-shrink-0 text-slate-300" />
                            <span className="truncate">{book.location}</span>
                          </div>
                        </div>

                        {/* Price Badge */}
                        <div className="flex-shrink-0 text-right">
                          <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100/30">
                            ₹{(book.totalPrice || 0) / 1000}k
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <Icon name="calendar" size="sm" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-700 uppercase tracking-wider">No Bookings Yet</p>
                    <p className="text-[9px] text-slate-400 font-medium max-w-[160px] mx-auto mt-0.5">Your upcoming confirmed bookings will appear here.</p>
                  </div>
                </div>
              )}

              <div className="mt-2.5 pt-2 border-t border-slate-50">
                <button 
                  className="w-full h-8 text-[9px] font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 active:scale-98 transition-all flex items-center justify-center gap-1 uppercase tracking-widest shadow-xs"
                  onClick={() => {
                    setShowBookingsDropdown(false);
                    navigate('/vendor/bookings');
                  }}
                >
                  View All Bookings <Icon name="chevronRight" size="xs" />
                </button>
              </div>
            </div>
          )}
        </div>

        <button 
          className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center bg-transparent text-slate-500 hover:text-violet-600 transition-all active:scale-95 relative"
          onClick={() => navigate('/vendor/notifications')}
        >
          <Icon name="bell" size="sm" />
          <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-rose-500 text-white text-[8px] font-medium flex items-center justify-center border-2 border-white shadow-sm">3</span>
        </button>
      </div>
    </div>
  );
};

export default VendorTopbar;
