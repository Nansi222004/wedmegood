import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Icon from '../ui/Icon';

const HamburgerMenu = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartState } = useCart();
  const navigate = useNavigate();

  // Simple body scroll lock when menu is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const cartItems = cartState?.items || [];

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const cartVendors = cartItems.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] overflow-hidden pointer-events-auto">
          {/* 1. Backdrop with Blur */}
          <motion.div
            key="menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* 2. Editorial Panel */}
          <motion.div
            key="menu-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[75] w-[85%] max-w-[380px] shadow-2xl bg-[#FAF6F0] border-l border-[#D4AF37]/30"
          >
            {/* Luxury Header */}
            <div className="bg-gradient-to-br from-[#4F1325] via-[#651731] to-[#4F1325] px-6 pt-8 pb-6 rounded-b-[2rem] shadow-sm flex items-center justify-between border-b border-[#D4AF37]/30">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#ECC880] block font-semibold">
                  The Royal Collection
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white">Utsavo Menu</h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 border border-white/20 active:scale-90 transition-all text-white hover:bg-white/20 cursor-pointer"
                title="Close Menu"
              >
                <Icon name="close" size="xs" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto h-[calc(100vh-100px)] p-4 space-y-3.5 no-scrollbar">
              {/* Section 1: Member Card */}
              {isAuthenticated && user && (
                <div className="bg-white/95 rounded-[1.5rem] p-3.5 space-y-3 shadow-xs border border-stone-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-stone-200 shadow-xs shrink-0">
                      <img
                        src={user.profileImage}
                        className="w-full h-full object-cover"
                        alt={user.name}
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-stone-900 truncate">
                        {user.name}
                      </h3>
                      <p className="text-xs font-medium text-stone-500">
                        {user.city || 'Indore'} • Celebration Host
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNavigation('/user/account')}
                    className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#4F1325] to-[#651731] text-[#ECC880] text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    View Profile
                  </button>
                </div>
              )}

              {/* Section 2: Conversational Hub */}
              <div
                onClick={() => handleNavigation('/user/chats')}
                className="bg-white/95 rounded-[1.25rem] p-3 flex items-center justify-between shadow-xs cursor-pointer border border-stone-200/80 hover:border-stone-300 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] border border-amber-200/50 flex items-center justify-center text-[#4F1325]">
                    <Icon name="chat" size="xs" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">
                      Artisan Conversations
                    </h4>
                    <p className="text-[10px] text-stone-500 font-medium">
                      Direct Inquiries
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cartVendors.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#651731] text-[#ECC880] flex items-center justify-center text-[9px] font-bold">
                      {cartVendors.length}
                    </span>
                  )}
                  <Icon name="chevronRight" size="xs" className="text-stone-400" />
                </div>
              </div>

              {/* Section 3: Curation Tools */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-stone-600 px-2">
                  Celebration Essentials
                </h5>
                <div className="space-y-1.5">
                  {[
                    { title: 'Vendor Directory', path: '/user/vendors', icon: 'store' },
                    { title: 'Saved Favorites', path: '/user/favourites', icon: 'heart' },
                    { title: 'Planning Roadmap', path: '/user/planning-dashboard', icon: 'calendar' },
                    { title: 'Inspirations Gallery', path: '/user/inspirations', icon: 'sparkles' },
                    { title: 'My Bookings', path: '/user/bookings', icon: 'check' },
                    { title: 'Digital E-Invites', path: '/user/e-invites', icon: 'envelope' },
                    { title: 'AI Concierge', path: '/user/ai-assistant', icon: 'sparkles' }
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleNavigation(item.path)}
                      className="w-full flex items-center justify-between p-2.5 rounded-[1.25rem] bg-white/95 shadow-xs border border-stone-200/80 hover:border-stone-300 hover:bg-[#FFF5F6] active:scale-98 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF6F0] flex items-center justify-center text-[#4F1325] group-hover:text-[#651731]">
                          <Icon name={item.icon} size="xs" />
                        </div>
                        <span className="text-xs font-semibold text-stone-800 group-hover:text-[#651731]">
                          {item.title}
                        </span>
                      </div>
                      <Icon
                        name="chevronRight"
                        size="xs"
                        className="text-stone-400 group-hover:text-stone-600"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 4: Global Settings & Sign Out */}
              <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between px-1">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 text-xs font-semibold cursor-pointer"
                  >
                    <Icon name="logout" size="sm" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="flex items-center gap-2 text-stone-800 hover:text-[#4F1325] text-xs font-semibold cursor-pointer"
                  >
                    <Icon name="account" size="sm" />
                    <span>Sign In</span>
                  </button>
                )}
                <div className="flex gap-3 text-[#D4AF37]">
                  <button
                    onClick={() => handleNavigation('/user/help')}
                    title="Help & Support"
                    className="cursor-pointer"
                  >
                    <Icon name="help" size="sm" />
                  </button>
                  <button
                    onClick={() => handleNavigation('/user/privacy')}
                    title="Privacy Policy"
                    className="cursor-pointer"
                  >
                    <Icon name="settings" size="sm" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HamburgerMenu;