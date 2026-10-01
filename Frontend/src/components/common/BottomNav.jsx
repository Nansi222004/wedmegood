import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide BottomNav only on dedicated full-screen flows (chat keyboard rooms, public invitation links)
  if (
    location.pathname.startsWith('/user/family/group/') ||
    location.pathname.startsWith('/family/join') ||
    location.pathname.includes('/chats/') ||
    location.pathname.startsWith('/invite/') ||
    location.pathname === '/user/wedding-details' ||
    location.pathname.startsWith('/user/vendor/') ||
    location.pathname.startsWith('/user/photographer/') ||
    location.pathname.startsWith('/user/decorator/') ||
    location.pathname.startsWith('/user/makeup/')
  ) {
    return null;
  }

  const getHasRequirements = () => {
    try {
      const saved = localStorage.getItem('eventDetails');
      if (!saved || saved === 'null' || saved === 'undefined') return false;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
    } catch {
      return false;
    }
  };

  const hasRequirements = getHasRequirements();
  const centerRoute = hasRequirements ? '/user/planning-dashboard' : '/user/requirements';
  const isCenterActive =
    location.pathname.startsWith('/user/requirements') ||
    location.pathname === '/user/planning-dashboard' ||
    location.pathname === '/user/wedding-form';

  const isHomeActive = location.pathname === '/user/home' || location.pathname === '/user/dashboard';
  const isDiscoverActive =
    location.pathname.startsWith('/user/vendors') ||
    location.pathname.startsWith('/user/vendor/') ||
    location.pathname === '/user/search';
  const isSavedActive = location.pathname === '/user/favourites' || location.pathname === '/user/shortlist';
  const isProfileActive = location.pathname.startsWith('/user/account');

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/user/home',
      isActive: isHomeActive,
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors duration-200 ${
            active ? 'fill-[#651731] text-[#651731]' : 'stroke-[#716860] stroke-[1.8] fill-none'
          }`}
          viewBox="0 0 24 24"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      )
    },
    {
      id: 'discover',
      label: 'Discover',
      path: '/user/vendors',
      isActive: isDiscoverActive,
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors duration-200 ${
            active ? 'text-[#651731] stroke-[#651731]' : 'text-[#716860] stroke-current'
          }`}
          fill="none"
          strokeWidth={active ? 2.3 : 1.8}
          viewBox="0 0 24 24"
        >
          <path
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    },
    {
      id: 'create',
      label: 'Create',
      path: centerRoute,
      isActive: isCenterActive,
      icon: (active) => (
        <div
          className={`relative w-12 h-12 -mt-4 rounded-full flex items-center justify-center transition-all duration-300 ${
            active
              ? 'bg-gradient-to-tr from-[#D49826] via-[#FFD700] to-[#FFF4B8] shadow-[0_6px_22px_rgba(245,175,25,0.75)] ring-2.5 ring-[#ECC880] scale-105'
              : 'bg-gradient-to-tr from-[#C58B16] via-[#F7C844] to-[#FFF0A3] shadow-[0_4px_16px_rgba(235,165,20,0.52)] hover:shadow-[0_6px_22px_rgba(245,175,25,0.7)] hover:scale-105'
          } border-2 border-[#FFF8D6]`}
        >
          {/* Subtle Golden Inner Highlight Rim */}
          <div className="absolute inset-[1.5px] rounded-full border border-white/60 pointer-events-none" />

          {/* Golden Lotus Diya Emblem in Royal Maroon */}
          <svg
            className="w-6 h-6 fill-none stroke-[#4A1224] stroke-[2.2] relative z-10 drop-shadow-[0_1px_1.5px_rgba(255,255,255,0.65)]"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 40 40"
          >
            <path d="M20 7 C21.5 13 23.5 21 20 27 C16.5 21 18.5 13 20 7 Z" fill="#4A1224" fillOpacity="0.88" />
            <path
              d="M20 14 C25 17 31 22 28 29 C24 29 21 25 20 23 C19 25 16 29 12 29 C9 22 15 17 20 14 Z"
              fill="#4A1224"
              fillOpacity="0.4"
            />
            <path d="M12 21 C7 21 4 27 7 31 C11 31 15 28 17 25" stroke="#4A1224" strokeWidth="2.1" />
            <path d="M28 21 C33 21 36 27 33 31 C29 31 25 28 23 25" stroke="#4A1224" strokeWidth="2.1" />
            <path d="M13 32 C17 34 23 34 27 32" stroke="#4A1224" strokeWidth="2.3" />
          </svg>
        </div>
      )
    },
    {
      id: 'saved',
      label: 'Saved',
      path: '/user/favourites',
      isActive: isSavedActive,
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors duration-200 ${
            active ? 'fill-[#651731] text-[#651731]' : 'stroke-[#716860] stroke-[1.8] fill-none'
          }`}
          viewBox="0 0 24 24"
        >
          <path
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/user/account',
      isActive: isProfileActive,
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors duration-200 ${
            active ? 'stroke-[#651731] stroke-[2.3]' : 'stroke-[#716860] stroke-[1.8]'
          }`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    }
  ];

  const handleTabClick = (item) => {
    if (item.isActive) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full z-40 bg-[#FAF7F2]/95 backdrop-blur-xl border-t border-[#E8DFC8]/70 shadow-[0_-2px_15px_rgba(74,18,36,0.04)]"
      data-purpose="bottom-navigation"
    >
      <div className="max-w-md sm:max-w-lg md:max-w-2xl mx-auto px-2 sm:px-6 pt-2 pb-3.5 flex items-center justify-around">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => handleTabClick(item)}
            className="relative flex flex-col items-center flex-1 py-1 cursor-pointer focus:outline-none select-none"
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {/* Classy Flat Bar Active Indicator */}
            {item.isActive && (
              <motion.div
                layoutId="bottomNavActiveBar"
                className={`absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full ${
                  item.id === 'create'
                    ? 'bg-gradient-to-r from-[#D49826] via-[#FFD700] to-[#D49826] shadow-[0_1px_6px_rgba(245,175,25,0.6)]'
                    : 'bg-gradient-to-r from-[#651731] via-[#8B1E3F] to-[#D4AF37] shadow-[0_1px_4px_rgba(101,23,49,0.25)]'
                }`}
                transition={{ type: 'spring', stiffness: 480, damping: 34 }}
              />
            )}

            <motion.div
              animate={{
                scale: item.isActive ? (item.id === 'create' ? 1.08 : 1.12) : 1,
                y: item.isActive ? -1 : 0
              }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            >
              {item.icon(item.isActive)}
            </motion.div>

            <span
              className={`text-[10px] mt-1 tracking-tight transition-colors duration-200 ${
                item.id === 'create'
                  ? item.isActive
                    ? 'text-[#651731] font-bold'
                    : 'text-[#8A5A12] font-bold'
                  : item.isActive
                  ? 'text-[#651731] font-bold'
                  : 'text-[#716860] font-medium'
              }`}
            >
              {item.label}
            </span>
          </motion.button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
