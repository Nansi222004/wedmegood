import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/userApi';
import Button from '../ui/Button';
import CartIcon from './CartIcon';
import HamburgerMenu from './HamburgerMenu';
import Icon from '../ui/Icon';

const Header = () => {
  const { theme, changeTheme, availableThemes, themeName } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);

  // Dynamic notification unread count
  const [unreadCount, setUnreadCount] = useState(0);

  const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

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

  const handleNotificationsClick = () => {
    navigate('/user/notifications');
  };

  const isDashboard = location.pathname === '/user/dashboard';

  const headerStyles = {
    backgroundColor: 'transparent',
  };

  const mobileMenuStyles = {
    backgroundColor: theme.semantic.background.accent,
    borderTopColor: theme.semantic.border.accent,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
  };

  return (
    <header className="sticky top-0 z-50 transition-all duration-300" style={headerStyles}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-3 space-y-3">
        {/* Row 1: Top Navigation & Branding */}
        <div className="flex justify-between items-center h-12">
          
          {/* Left: Hamburger Menu */}
          <button
            onClick={() => setIsHamburgerMenuOpen(!isHamburgerMenuOpen)}
            className="p-1 -ml-1 text-[#3D2B2B] focus:outline-none active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Center: Branding */}
          <div className="flex flex-col items-center justify-center cursor-pointer" onClick={() => navigate('/user/home')}>
             <div className="flex items-center">
                {/* SVG Graphic Approximation for the golden U */}
                <svg width="24" height="28" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                   <path d="M20 5 C30 5, 35 15, 30 25 C25 35, 10 35, 10 25 C10 15, 20 15, 20 25" stroke="#C59A5A" strokeWidth="3" strokeLinecap="round" fill="none"/>
                   <path d="M15 10 L20 0 L25 10 Z" fill="#C59A5A"/>
                   <path d="M5 15 L10 5 L15 15 Z" fill="#C59A5A"/>
                   <path d="M25 15 L30 5 L35 15 Z" fill="#C59A5A"/>
                </svg>
                <span className="text-2xl font-semibold tracking-tight" style={{ color: '#7A1C43', fontFamily: '"Playfair Display", serif' }}>
                  Utsavo
                </span>
             </div>
             <span className="text-[5px] font-black uppercase tracking-[0.25em]" style={{ color: '#C59A5A', fontFamily: '"Outfit", sans-serif' }}>
                Celebrate Every Moment
             </span>
          </div>

          {/* Right: Location & Notifications */}
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-1 text-[#3D2B2B] hover:opacity-70 transition-opacity">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] font-semibold">Hyderabad</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
             </button>

             {isAuthenticated && (
              <button
                onClick={handleNotificationsClick}
                className="relative p-1 text-[#3D2B2B] active:scale-95 transition-transform"
              >
                <Icon name="bell" size="sm" />
                {unreadCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 px-0.5 rounded-full flex items-center justify-center bg-[#BE185D]">
                    <span className="text-[8px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Search and Filter */}
        <div className="flex items-center gap-3">
           <div className="flex-1 flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/60">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search for vendors, services, venues..." 
                className="bg-transparent border-none outline-none w-full text-xs text-[#3D2B2B] placeholder-gray-400 font-medium"
                style={{ fontFamily: '"Outfit", sans-serif' }}
              />
           </div>
           <button className="w-10 h-10 flex-shrink-0 bg-[#FDF2F8] shadow-sm rounded-xl flex items-center justify-center text-[#7A1C43] active:scale-95 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
           </button>
        </div>

      </div>

      {/* Hamburger Menu */}
      <HamburgerMenu
        isOpen={isHamburgerMenuOpen}
        onClose={() => setIsHamburgerMenuOpen(false)}
      />
    </header>
  );
};

export default Header;