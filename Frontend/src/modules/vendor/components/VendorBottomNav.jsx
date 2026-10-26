import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useVendorState } from '../useVendorState';

// --- Custom High-Fidelity SVG Icon Components ---

const ChatsIcon = ({ isActive, className }) => (
  <svg className={className} fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75h6.75M8.625 13.5h3.75M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
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
    case 'chat':
      return <ChatsIcon isActive={isActive} className={className} />;
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

  // Enquiries still waiting for the vendor (same count as "New Enquiries" on the Leads page)
  const leadsCount = (vendorState?.leads || []).filter(l => l.status === 'New' || l.status === 'Accepted').length;

  // The dashboard is the home page; the header's Home button opens it from any other page
  const leftItems = [
    { label: 'Chats', to: '/vendor/chat', icon: 'chat' },
    { label: 'Leads', to: '/vendor/leads', icon: 'image', badge: leadsCount },
  ];

  const rightItems = [
    { label: 'Bookings', to: '/vendor/bookings', icon: 'clipboard' },
    { label: 'Profile', to: '/vendor/profile', icon: 'user' },
  ];

  const handleLinkClick = () => {
    setShowQuickActions(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100]">
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
          <div className="fixed bottom-[88px] left-0 right-0 mx-auto max-w-[280px] bg-white/95 backdrop-blur-xl border border-slate-100/80 rounded-[1.75rem] p-3 shadow-[0_15px_40px_rgba(124,58,237,0.16)] z-[100] pointer-events-auto animate-slide-up">
            {/* Native Sheet Drag Handle Indicator */}
            <div className="w-8 h-1 rounded-full bg-slate-200/80 mx-auto mb-2" />
            
            <div className="text-center mb-2.5">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-[#7c3aed]/90">Quick Actions</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setShowQuickActions(false); navigate('/vendor/expenditures'); }}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-50/60 hover:bg-amber-100/60 border border-amber-100/40 transition-all hover:scale-105 active:scale-95"
              >
                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center text-amber-600 mb-1 shadow-[0_2px_6px_rgba(217,119,6,0.10)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M6 3h12M6 8h12M6 3c4.5 0 7 1.8 7 5s-2.5 5-7 5l7 8" />
                  </svg>
                </div>
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight text-center leading-tight">Expenditures</span>
                <span className="text-[8px] font-semibold text-slate-400 text-center leading-tight mt-0.5">Spending &amp; to-do</span>
              </button>

              <button
                onClick={() => { setShowQuickActions(false); navigate('/vendor/payments'); }}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/60 border border-emerald-100/40 transition-all hover:scale-105 active:scale-95"
              >
                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center text-emerald-600 mb-1 shadow-[0_2px_6px_rgba(5,150,105,0.10)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M7 17 17 7M9 7h8v8" />
                    <path d="M17 21H7" />
                  </svg>
                </div>
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight text-center leading-tight">Payments</span>
                <span className="text-[8px] font-semibold text-slate-400 text-center leading-tight mt-0.5">Paid &amp; received</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Bottom Nav Track */}
      <nav
        className="w-full bg-white border-t border-slate-200 shadow-[0_-2px_12px_rgba(15,23,42,0.06)] px-1 pt-1 flex items-center justify-between relative"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.25rem)' }}
      >
        {/* Left Navigation Tabs (Chats, Leads) */}
        <div className="flex flex-1 items-center justify-around">
          {leftItems.map((item) => {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-2xl transition-all duration-350 relative flex-1 min-w-0 ${
                    isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
                  } hover:bg-slate-50/50 active:scale-95`
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
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`absolute -top-6 h-12 w-12 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center text-white border-[3.5px] border-white shadow-[0_8px_20px_rgba(124,58,237,0.45)] active:scale-90 transition-all duration-300 z-30 hover:scale-105 ${
              showQuickActions ? 'rotate-135 bg-gradient-to-tr from-rose-500 to-red-500 shadow-rose-500/35' : ''
            }`}
          >
            <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Right Navigation Tabs (Bookings, Profile) */}
        <div className="flex flex-1 items-center justify-around">
          {rightItems.map((item) => {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-2xl transition-all duration-350 relative flex-1 min-w-0 ${
                    isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
                  } hover:bg-slate-50/50 active:scale-95`
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

