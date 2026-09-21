import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import Icon from '../ui/Icon';

const BottomNav = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const getHasRequirements = () => {
    try {
      const saved = localStorage.getItem('eventDetails');
      if (!saved || saved === 'null' || saved === 'undefined') return false;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
    } catch (e) {
      return false;
    }
  };

  const hasRequirements = getHasRequirements();

  // Left side nav items (before center button)
  const leftItems = [
    { path: '/user/dashboard', label: 'Dashboard', iconName: 'sparkles' },
    { path: '/user/home', label: 'Home', iconName: 'home' },
  ];

  // Right side nav items (after center button)
  const rightItems = [
    { path: '/user/vendors', label: 'Vendors', iconName: 'vendors' },
    { path: '/user/account', label: 'Account', iconName: 'account' },
  ];

  const centerRoute = hasRequirements ? '/user/planning-dashboard' : '/user/requirements';

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40" style={{ height: '80px' }}>
      {/* Curved SVG Background */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 400 90"
        preserveAspectRatio="none"
        style={{ height: '80px' }}
      >
        <defs>
          <linearGradient id="navBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8F0F5" />
            <stop offset="100%" stopColor="#F3E8EE" />
          </linearGradient>
          <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E3AE56" stopOpacity="0.1" />
            <stop offset="20%" stopColor="#C59A5A" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#E3AE56" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#C59A5A" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#E3AE56" stopOpacity="0.1" />
          </linearGradient>
          <filter id="navShadow" x="-5%" y="-30%" width="110%" height="160%">
            <feDropShadow dx="0" dy="-3" stdDeviation="4" floodColor="#3D2B2B" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Main body with center notch */}
        <path
          d="M0,28 L145,28 C155,28 160,10 175,2 C183,-2 192,-2 200,2 C208,-2 217,-2 225,2 C240,10 245,28 255,28 L400,28 L400,90 L0,90 Z"
          fill="url(#navBg)"
          filter="url(#navShadow)"
        />

        {/* Gold accent line along the top edge */}
        <path
          d="M0,28 L145,28 C155,28 160,10 175,2 C183,-2 192,-2 200,2 C208,-2 217,-2 225,2 C240,10 245,28 255,28 L400,28"
          fill="none"
          stroke="url(#goldLine)"
          strokeWidth="1.5"
        />

        {/* Decorative floral accent - left */}
        <g opacity="0.12" transform="translate(10, 35)">
          <path d="M0,20 C5,10 15,5 25,10 C20,15 10,20 0,20Z" fill="#C59A5A" />
          <path d="M5,25 C10,15 20,10 30,15 C25,20 15,25 5,25Z" fill="#C59A5A" />
          <path d="M2,15 C8,8 18,5 25,8" stroke="#C59A5A" strokeWidth="0.5" fill="none" />
        </g>

        {/* Decorative floral accent - right */}
        <g opacity="0.12" transform="translate(360, 35) scale(-1,1)">
          <path d="M0,20 C5,10 15,5 25,10 C20,15 10,20 0,20Z" fill="#C59A5A" />
          <path d="M5,25 C10,15 20,10 30,15 C25,20 15,25 5,25Z" fill="#C59A5A" />
          <path d="M2,15 C8,8 18,5 25,8" stroke="#C59A5A" strokeWidth="0.5" fill="none" />
        </g>
      </svg>

      {/* Navigation Items Container */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-2" style={{ height: '72px', paddingBottom: '8px' }}>

        {/* Left side items */}
        {leftItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center flex-1 py-1"
          >
            {({ isActive }) => (
              <>
                <div
                  className="mb-1 transition-all duration-200"
                  style={{
                    color: isActive ? '#9B1B5A' : '#6B5B6B',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  <Icon name={item.iconName} size="lg" />
                </div>
                <span
                  className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                  style={{
                    fontFamily: '"Outfit", sans-serif',
                    color: isActive ? '#9B1B5A' : '#6B5B6B',
                  }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* Center FAB - Create Event */}
        <div className="flex flex-col items-center flex-1" style={{ marginTop: '-32px' }}>
          <button
            onClick={() => navigate(centerRoute)}
            className="relative flex items-center justify-center rounded-full shadow-xl active:scale-95 transition-transform duration-200"
            style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #F8DF9E 0%, #C59A5A 50%, #A67C3D 100%)',
              boxShadow: '0 4px 20px rgba(197, 154, 90, 0.45), inset 0 1px 2px rgba(255,255,255,0.3)',
              border: '3px solid rgba(255, 255, 255, 0.6)',
            }}
            aria-label="Create Event"
          >
            {/* Lotus / flower icon using SVG */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              {/* Center petal */}
              <path
                d="M12 3C12 3 9 7 9 11C9 14 10.5 16 12 16C13.5 16 15 14 15 11C15 7 12 3 12 3Z"
                fill="rgba(255,255,255,0.85)"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="0.5"
              />
              {/* Left petal */}
              <path
                d="M12 16C12 16 7 14 5 11C3.5 8.5 4 6 5.5 5.5C7 5 9 6.5 10 9"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1"
                strokeLinecap="round"
              />
              {/* Right petal */}
              <path
                d="M12 16C12 16 17 14 19 11C20.5 8.5 20 6 18.5 5.5C17 5 15 6.5 14 9"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1"
                strokeLinecap="round"
              />
              {/* Base */}
              <path
                d="M10 16C10 16 11 19 12 20C13 19 14 16 14 16"
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span
            className="text-[9px] font-semibold tracking-wide mt-1"
            style={{
              fontFamily: '"Outfit", sans-serif',
              color: '#6B5B6B',
            }}
          >
            Create Event
          </span>
        </div>

        {/* Right side items */}
        {rightItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center flex-1 py-1"
          >
            {({ isActive }) => (
              <>
                <div
                  className="mb-1 transition-all duration-200"
                  style={{
                    color: isActive ? '#9B1B5A' : '#6B5B6B',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  <Icon name={item.iconName} size="lg" />
                </div>
                <span
                  className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                  style={{
                    fontFamily: '"Outfit", sans-serif',
                    color: isActive ? '#9B1B5A' : '#6B5B6B',
                  }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" style={{ backgroundColor: '#F3E8EE' }}></div>
    </nav>
  );
};

export default BottomNav;
