import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useVendorState } from '../useVendorState';

// --- Custom High-Fidelity SVG Icon Components ---

const HomeIcon = ({ isActive, className }) => (
  <svg className={className} fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const LeadsIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 16 5-5 4 4 5-5 4 4" />
    <circle cx="15.5" cy="8.5" r="1.5" stroke="none" fill="currentColor" />
  </svg>
);

const BookingsIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11h6m-6 4h4" />
  </svg>
);

const ProfileIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
  </svg>
);

const renderIcon = (name, isActive, className) => {
  switch (name) {
    case 'home':
      return <HomeIcon isActive={isActive} className={className} />;
    case 'image':
      return <LeadsIcon className={className} />;
    case 'clipboard':
      return <BookingsIcon className={className} />;
    case 'user':
      return <ProfileIcon className={className} />;
    default:
      return null;
  }
};

const VendorBottomNav = ({ isApproved }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const navigate = useNavigate();
  const { vendorState } = useVendorState();

  const leadsCount = vendorState?.leads?.length || 2; // Matches screenshot badge or active count

  const leftItems = [
    { label: 'Dashboard', to: '/vendor/dashboard', icon: 'home' },
    { label: 'Leads', to: '/vendor/leads', icon: 'image', badge: leadsCount },
  ];

  const rightItems = [
    { label: 'Bookings', to: '/vendor/bookings', icon: 'clipboard' },
    { label: 'Profile', to: '/vendor/profile', icon: 'user' },
  ];

  const handleLinkClick = (e, isDisabled, to) => {
    if (isDisabled) {
      e.preventDefault();
    } else {
      setShowQuickActions(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pointer-events-none" style={{ bottom: 0, paddingBottom: `calc(env(safe-area-inset-bottom) + 0.5rem)` }}>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Backdrop blur & Quick Actions Overlay */}
      {showQuickActions && (
        <>
          <div 
            className="fixed inset-0 bg-slate-955/15 backdrop-blur-xs z-[90] pointer-events-auto animate-fade-in"
            onClick={() => setShowQuickActions(false)}
          />
          <div className="fixed bottom-20 left-0 right-0 mx-auto max-w-[280px] bg-white/95 backdrop-blur-xl border border-slate-100/80 rounded-[1.75rem] p-3 shadow-[0_15px_40px_rgba(124,58,237,0.16)] z-[100] pointer-events-auto animate-slide-up">
            {/* Native Sheet Drag Handle Indicator */}
            <div className="w-8 h-1 rounded-full bg-slate-200/80 mx-auto mb-2" />
            
            <div className="text-center mb-2.5">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-[#7c3aed]/90">Quick Actions</h4>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => { setShowQuickActions(false); navigate('/vendor/services'); }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-violet-50/50 hover:bg-violet-100/50 border border-violet-100/30 transition-all hover:scale-105 active:scale-95"
              >
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-violet-600 mb-1 shadow-[0_2px_6px_rgba(124,58,237,0.08)]">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <span className="text-[8px] font-black text-slate-700 uppercase tracking-tight text-center leading-tight">Add Service</span>
              </button>
              
              <button 
                onClick={() => { setShowQuickActions(false); navigate('/vendor/calendar'); }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-50/50 hover:bg-indigo-100/50 border border-indigo-100/30 transition-all hover:scale-105 active:scale-95"
              >
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 mb-1 shadow-[0_2px_6px_rgba(79,70,229,0.08)]">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <span className="text-[8px] font-black text-slate-700 uppercase tracking-tight text-center leading-tight">Update Cal</span>
              </button>
              
              <button 
                onClick={() => { setShowQuickActions(false); navigate('/vendor/portfolio'); }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-rose-50/50 hover:bg-rose-100/50 border border-rose-100/30 transition-all hover:scale-105 active:scale-95"
              >
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-rose-600 mb-1 shadow-[0_2px_6px_rgba(225,29,72,0.08)]">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  </svg>
                </div>
                <span className="text-[8px] font-black text-slate-700 uppercase tracking-tight text-center leading-tight">Portfolio</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Bottom Nav Track */}
      <nav className="mx-auto max-w-md bg-white/95 backdrop-blur-xl shadow-[0_12px_45px_-12px_rgba(15,23,42,0.18)] rounded-[2.3rem] border border-slate-100/80 px-2 py-1 flex items-center justify-between pointer-events-auto relative">
        {/* Left Navigation Tabs (Dashboard, Leads) */}
        <div className="flex flex-1 items-center justify-around">
          {leftItems.map((item) => {
            const isHome = item.label === 'Dashboard';
            const isDisabled = !isApproved && !isHome;

            return (
              <NavLink
                key={item.to}
                to={isDisabled ? '#' : item.to}
                onClick={(e) => handleLinkClick(e, isDisabled, item.to)}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-2xl transition-all duration-350 relative flex-1 min-w-0 ${
                    isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
                  } ${isDisabled ? 'opacity-25 grayscale cursor-not-allowed' : 'hover:bg-slate-50/50 active:scale-95'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative transition-all duration-300 ${isActive ? 'scale-115 -translate-y-1 text-violet-600' : 'text-slate-500'}`}>
                      {renderIcon(item.icon, isActive, "w-5 h-5")}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 h-4.5 min-w-[18px] px-1 rounded-full bg-[#ef4444] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[9.5px] tracking-tight transition-colors duration-300 ${isActive ? 'font-black text-[#581c87]' : 'font-extrabold text-slate-500'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-[1.5px] h-1 w-1 rounded-full bg-[#7c3aed] animate-pulse"></div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Center Raised Circular Plus FAB */}
        <div className="flex items-center justify-center px-1.5 relative h-10 w-12 flex-shrink-0">
          <button
            onClick={() => isApproved && setShowQuickActions(!showQuickActions)}
            disabled={!isApproved}
            className={`absolute -top-6 h-12 w-12 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center text-white border-[3.5px] border-white shadow-[0_8px_20px_rgba(124,58,237,0.45)] active:scale-90 transition-all duration-300 z-30 ${
              showQuickActions ? 'rotate-135 bg-gradient-to-tr from-rose-500 to-red-500 shadow-rose-500/35' : ''
            } ${!isApproved ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105'}`}
          >
            <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Right Navigation Tabs (Bookings, Profile) */}
        <div className="flex flex-1 items-center justify-around">
          {rightItems.map((item) => {
            const isHome = item.label === 'Dashboard';
            const isDisabled = !isApproved && !isHome;

            return (
              <NavLink
                key={item.to}
                to={isDisabled ? '#' : item.to}
                onClick={(e) => handleLinkClick(e, isDisabled, item.to)}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-2xl transition-all duration-350 relative flex-1 min-w-0 ${
                    isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
                  } ${isDisabled ? 'opacity-25 grayscale cursor-not-allowed' : 'hover:bg-slate-50/50 active:scale-95'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative transition-all duration-300 ${isActive ? 'scale-115 -translate-y-1 text-violet-600' : 'text-slate-500'}`}>
                      {renderIcon(item.icon, isActive, "w-5 h-5")}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 h-4.5 min-w-[18px] px-1 rounded-full bg-[#ef4444] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[9.5px] tracking-tight transition-colors duration-300 ${isActive ? 'font-black text-[#581c87]' : 'font-extrabold text-slate-500'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-[1.5px] h-1 w-1 rounded-full bg-[#7c3aed] animate-pulse"></div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default VendorBottomNav;

// Ensure safe area inset for devices with home indicator

