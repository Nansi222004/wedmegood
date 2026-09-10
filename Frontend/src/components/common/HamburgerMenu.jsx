import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Icon from '../ui/Icon';

const HamburgerMenu = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartState } = useCart();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

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

  const cartVendors = cartItems.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    unread: Math.random() > 0.5
  }));

  return (
    <>
      {/* 1. Backdrop with Deep Blur */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-700 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* 2. Editorial Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[85%] max-w-[400px] shadow-2xl transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: '#FDF2F8' }}
      >
        {/* Arched Header - Ultra Compact */}
        <div className="bg-gradient-to-br from-[#9D174D] via-[#BE185D] to-[#9D174D] px-6 pt-8 pb-6 rounded-b-[2rem] shadow-sm flex items-center justify-between border-b border-white/10">
           <div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>Menu</h2>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/60">The Utsavo Collection</p>
           </div>
           <button 
             onClick={onClose}
             className="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 border border-white/30 active:scale-90 transition-all"
           >
              <Icon name="close" size="xs" style={{ color: 'white' }} />
           </button>
        </div>

        {/* Scrollable Content - High Density */}
        <div className="overflow-y-auto h-[calc(100vh-80px)] p-4 space-y-2.5 scrollbar-hide">
           {/* Section 1: Member Card - Ultra Compact */}
           {isAuthenticated && (
             <div className="bg-white rounded-[1.5rem] p-3 space-y-3 shadow-sm border border-black/5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full overflow-hidden border border-[#EAE1D8] shadow-sm">
                      <img 
                        src={user.profileImage} 
                        className="w-full h-full object-cover" 
                        alt={user.name} 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80'; }}
                      />
                   </div>
                   <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#3D2B2B] truncate" style={{ fontFamily: '"Playfair Display", serif' }}>{user.name}</h3>
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#BE185D] underline">{user.city || 'Indore'}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleNavigation('/user/account')}
                  className="w-full py-2.5 rounded-full bg-[#3D2B2B] text-white text-[7px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                >
                   Guest Profile
                </button>
             </div>
           )}

           {/* Section 2: Conversational Hub - Ultra Compact */}
           <div 
             onClick={() => handleNavigation('/user/chats')}
             className="bg-white rounded-[1.25rem] p-3 flex items-center justify-between shadow-sm cursor-pointer border border-black/5 active:scale-95 transition-all"
           >
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-[#EAE1D8]/30 flex items-center justify-center">
                    <Icon name="chat" size="xs" style={{ color: '#3D2B2B' }} />
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>My Chats</h4>
                    <p className="text-[7px] font-black uppercase tracking-widest text-[#3D2B2B]/40">Internal Messengers</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="w-4 h-4 rounded-full bg-[#BE185D] text-white flex items-center justify-center text-[8px] font-bold">{cartVendors.length}</span>
                 <Icon name="chevronDown" size="xs" className="-rotate-90" style={{ color: '#3D2B2B/20' }} />
              </div>
           </div>

           {/* Section 3: Tiered Collections - High Density */}
           <div className="space-y-3">
              <h5 className="text-[8px] font-black uppercase tracking-[0.2em] text-[#3D2B2B]/40 px-2" style={{ fontFamily: '"Outfit", sans-serif' }}>Curation Tools</h5>
              <div className="space-y-1.5">
                 {[
                   { title: 'My Cart', path: '/user/cart', icon: 'cart' },
                   { title: 'Bookings', path: '/user/bookings', icon: 'calendar' },
                   { title: 'Shortlist', path: '/user/shortlist', icon: 'bookmark' },
                   { title: 'Favourites', path: '/user/favourites', icon: 'heart' }
                 ].map((item, i) => (
                    <button 
                      key={i}
                      onClick={() => handleNavigation(item.path)}
                      className="w-full flex items-center justify-between p-2.5 rounded-[1.25rem] bg-white shadow-sm border border-black/5 hover:bg-pink-50 active:scale-98 transition-all"
                    >
                     <div className="flex items-center gap-3">
                        <Icon name={item.icon} size="xs" style={{ color: '#3D2B2B/60' }} />
                        <span className="text-[11px] font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>{item.title}</span>
                     </div>
                     <Icon name="chevronDown" size="xs" className="-rotate-90" style={{ color: '#3D2B2B/20' }} />
                   </button>
                 ))}
              </div>
           </div>

           {/* Section 4: Global Settings */}
           <div className="pt-4 border-t border-[#3D2B2B]/10 flex items-center justify-between">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 text-[#BE185D]"
              >
                 <Icon name="logout" size="sm" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
              </button>
              <div className="flex gap-4">
                 <Icon name="settings" size="xs" style={{ color: '#3D2B2B/40' }} />
                 <Icon name="help" size="xs" style={{ color: '#3D2B2B/40' }} />
              </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default HamburgerMenu;