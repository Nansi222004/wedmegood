import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { useVendorState } from '../useVendorState';

const STOREFRONT_ITEMS = new Set([
  'Dashboard',
  'Profile',
  'Services',
  'Pricing',
  'Portfolio',
  'Inventory',
  'Settings',
  'Support'
]);

const navItems = [
  { label: 'Dashboard', to: '/vendor/dashboard', icon: 'home' },
  { label: 'Profile', to: '/vendor/profile', icon: 'account' },
  { label: 'Services', to: '/vendor/services', icon: 'store' },
  { label: 'Pricing', to: '/vendor/pricing', icon: 'money' },
  { label: 'Portfolio', to: '/vendor/portfolio', icon: 'image' },
  { label: 'Inquiries', to: '/vendor/leads', icon: 'mail', badge: 5 },
  { label: 'Quotes', to: '/vendor/quotes', icon: 'book' },
  { label: 'Bookings', to: '/vendor/bookings', icon: 'calendar' },
  { label: 'Calendar', to: '/vendor/calendar', icon: 'clock' },
  { label: 'Chat', to: '/vendor/chat', icon: 'chat', badge: 2 },
  { label: 'Inventory', to: '/vendor/inventory', icon: 'package' },
  { label: 'Earnings', to: '/vendor/earnings', icon: 'trophy' },
  { label: 'Reviews', to: '/vendor/reviews', icon: 'star' },
  { label: 'Support', to: '/vendor/support', icon: 'help' },
  { label: 'Settings', to: '/vendor/settings', icon: 'edit' }
];

const VendorSidebar = ({ onClose, counts = {} }) => {
  const navigate = useNavigate();
  const navRef = useRef(null);
  const { vendorState } = useVendorState();
  
  const isApproved = vendorState?.status === 'Approved';
  const isSubscribed = vendorState?.subscription?.status === 'Active';
  const isOperationalAllowed = isApproved && isSubscribed;
  
  useEffect(() => {
    let lenisInstance;
    let rafId;

    const initLenis = async () => {
      try {
        const { default: Lenis } = await import('lenis');
        if (!navRef.current) return;

        lenisInstance = new Lenis({
          wrapper: navRef.current,
          lerp: 0.1,
          smoothWheel: true,
          smoothTouch: true,
          touchMultiplier: 1.5,
        });

        const update = (time) => {
          lenisInstance?.raf(time);
          rafId = requestAnimationFrame(update);
        };
        rafId = requestAnimationFrame(update);
      } catch (err) {
        console.warn('Failed to initialize Lenis in Sidebar:', err);
      }
    };

    initLenis();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenisInstance) {
        lenisInstance.destroy();
      }
    };
  }, []);

  const dynamicNavItems = navItems.map(item => {
    if (item.label === 'Inquiries') return { ...item, badge: counts.leads || 0 };
    if (item.label === 'Chat') return { ...item, badge: counts.chat || 0 };
    return item;
  });

  return (
    <aside data-lenis-prevent className="fixed left-0 top-16 w-64 flex flex-col z-40 bg-white border-r border-slate-100" style={{
      height: 'calc(100vh - 4rem)'
    }}>
      <div className="h-full flex flex-col">
        {/* Brand Header */}
        <div className="px-5 py-2.5 border-b border-slate-100/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#581C87]">Utsavo</p>
              <h2 className="text-[13px] font-black text-slate-900 tracking-tight leading-none mt-0.5 uppercase">Vendor Portal</h2>
            </div>
            <button
              type="button"
              className="lg:hidden text-slate-400 hover:text-[#581C87] transition-colors"
              onClick={onClose}
              aria-label="Close menu"
            >
              <Icon name="close" size="md" color="currentColor" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isApproved ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isApproved ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            </span>
            {isApproved ? 'Online & Active' : 'Under Review'}
          </div>
        </div>

        {/* Navigation */}
        <nav ref={navRef} className="flex-1 overflow-y-auto px-3 pt-2 pb-3 space-y-0.5 custom-scrollbar">
          {dynamicNavItems.map((item) => {
            const isOperational = !STOREFRONT_ITEMS.has(item.label);
            const isLocked = isOperational && !isOperationalAllowed;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `group flex items-center gap-3 text-[13px] font-medium transition-all duration-200 px-3.5 py-2.5 rounded-xl ${
                    isActive
                    ? 'bg-[#F3E8FF] text-[#581C87] font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center justify-center transition-colors duration-200 ${
                      isActive
                      ? 'text-[#581C87]'
                      : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                      <Icon name={item.icon} size="md" color="currentColor" />
                    </div>
                    <span className="flex-1 truncate">{item.label}</span>
                    {isLocked ? (
                      <span 
                        className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight bg-amber-50 text-amber-700 border border-amber-200/60"
                        title="Operational module locked"
                      >
                        <Icon name="lock" size="xs" color="currentColor" />
                        <span>Locked</span>
                      </span>
                    ) : item.badge ? (
                      <span className="ml-auto h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Proper, compact Sign Out menu item inside the scrollable list */}
          <div className="pt-2 mt-2 border-t border-slate-100/60">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('vendorToken');
                window.location.href = '/vendor/login';
              }}
              className="w-full flex items-center gap-3 text-[13px] font-medium transition-all duration-200 px-3.5 py-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98] cursor-pointer group"
            >
              <div className="flex items-center justify-center text-slate-400 group-hover:text-rose-500 transition-colors duration-200">
                <Icon name="logout" size="md" color="currentColor" />
              </div>
              <span className="font-semibold text-rose-500/90 group-hover:text-rose-600">Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Fixed Sign Out bottom bar */}
        <div className="p-4 border-t border-slate-100 bg-white mt-auto">
          <button
            type="button"
            className="w-full h-9 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            onClick={() => {
              localStorage.removeItem('vendorToken');
              window.location.href = '/vendor/login';
            }}
          >
            <Icon name="logout" size="sm" color="currentColor" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default VendorSidebar;
