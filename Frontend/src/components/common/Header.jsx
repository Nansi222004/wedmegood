import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/userApi';
import HamburgerMenu from './HamburgerMenu';

const Header = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cities = ['Hyderabad', 'Indore', 'Mumbai', 'Delhi NCR', 'Bangalore', 'Jaipur'];

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await userApi.getUnreadNotificationCount();
      if (res && typeof res.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch {
      // Quiet fallback
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
    const handleUpdate = () => fetchUnreadCount();
    window.addEventListener('user-notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('user-notifications-updated', handleUpdate);
    };
  }, [fetchUnreadCount]);

  const isChatRoom = location.pathname.startsWith('/user/family/group/') || location.pathname.startsWith('/user/chats/');

  // Hide header only on dedicated full-screen chat rooms
  if (isChatRoom) {
    return null;
  }

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/user/vendors');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-stone-200/70 transition-all duration-300">
      <div className="max-w-[430px] md:max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-2.5 space-y-2">
        {/* Row 1: Top Navigation & Branding */}
        <div className="flex items-center justify-between">
          {/* Left: Hamburger Menu Button */}
          <button
            onClick={() => setIsHamburgerMenuOpen(true)}
            aria-label="Open menu"
            className="text-stone-800 p-1.5 focus:outline-none hover:opacity-80 active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6 stroke-stone-800 stroke-[2]" fill="none" viewBox="0 0 24 24">
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Center: Branding with Golden Lotus */}
          <div
            onClick={() => navigate('/user/home')}
            className="flex items-center space-x-2 cursor-pointer select-none active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 flex items-center justify-center text-[#C99839]">
              <svg className="w-8 h-8 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 40 40">
                <path d="M20 7 C21 13 23 21 20 27 C17 21 19 13 20 7 Z" fill="#E2BA62" fillOpacity="0.35" />
                <path d="M20 14 C25 17 31 22 28 29 C24 29 21 25 20 23 C19 25 16 29 12 29 C9 22 15 17 20 14 Z" fill="#ECC878" fillOpacity="0.25" />
                <path d="M12 21 C7 21 4 27 7 31 C11 31 15 28 17 25" />
                <path d="M28 21 C33 21 36 27 33 31 C29 31 25 28 23 25" />
                <path d="M13 32 C17 34 23 34 27 32" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif font-bold text-[24px] leading-none tracking-tight text-[#4F1325]">Utsavo</span>
              <span className="text-[7px] uppercase tracking-[0.26em] text-stone-600 font-semibold mt-0.5">Celebrate Every Moment</span>
            </div>
          </div>

          {/* Right: Location & Notifications */}
          <div className="flex items-center space-x-2.5">
            {/* City Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                className="flex items-center space-x-1 bg-white/90 shadow-sm border border-stone-200/80 px-2.5 py-1 rounded-full text-stone-700 text-xs font-medium cursor-pointer active:scale-95 transition-transform"
              >
                <svg className="w-3.5 h-3.5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[11px] font-medium text-stone-800">{selectedCity}</span>
                <svg className={`w-3 h-3 text-stone-500 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isCityDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-stone-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setIsCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${selectedCity === city ? 'bg-[#FFF5F6] text-[#4F1325] font-bold' : 'text-stone-700 hover:bg-stone-50'}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => navigate('/user/notifications')}
              aria-label="Notifications"
              className="relative p-1 text-stone-700 focus:outline-none hover:opacity-80 active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#5E1229] rounded-full ring-2 ring-[#FAF6F0]" />
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center justify-between bg-white border border-stone-200/90 rounded-full px-3.5 py-2 shadow-xs">
          <div className="flex items-center space-x-2.5 flex-1 pr-2">
            <svg className="w-4 h-4 text-stone-400 stroke-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for vendors, services, venues..."
              className="w-full bg-transparent border-none outline-none text-stone-700 text-[12.5px] tracking-tight placeholder-stone-400 focus:ring-0 p-0"
            />
          </div>
          <button
            type="button"
            onClick={() => navigate('/user/vendors')}
            aria-label="Filter Options"
            className="text-stone-600 pl-1 border-l border-stone-200 focus:outline-none hover:text-stone-900 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>

      {/* Hamburger Drawer */}
      <HamburgerMenu
        isOpen={isHamburgerMenuOpen}
        onClose={() => setIsHamburgerMenuOpen(false)}
      />
    </header>
  );
};

export default Header;