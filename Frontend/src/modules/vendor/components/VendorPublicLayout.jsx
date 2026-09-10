import { Outlet, useLocation } from 'react-router-dom';
import '../vendorTheme.css';

const VendorPublicLayout = () => {
  const location = useLocation();
  const normalizedPath = location.pathname.toLowerCase().replace(/\/$/, '');
  const isRegisterPage = normalizedPath.startsWith('/vendor/register');
  const isLoginPage = normalizedPath === '/vendor/login';
  const isAuthPage = isRegisterPage || isLoginPage;
  const hideLogo = isRegisterPage || isLoginPage || normalizedPath.startsWith('/vendor/onboarding');
  const hidePaddingX = isRegisterPage || isLoginPage || normalizedPath.startsWith('/vendor/onboarding');
  return (
    <div className="vendor-shell min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 50%, #f3e8ff 100%)'
    }}>
      {/* Background decoration removed for clean white aesthetic */}


      {!hideLogo && (
        <div className={`absolute ${isLoginPage ? 'top-5' : 'top-2'} sm:top-3.5 left-0 right-0 flex justify-center w-full z-50 pointer-events-none`}>
          <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 cursor-pointer group" onClick={() => window.location.href = '/'}>
            <div className="relative">
              <img src="/assets/vendor/logo_theme.png" alt="Utsavo Logo" className="h-8 sm:h-11 w-auto hover:scale-105 transition-all duration-500 rounded-lg shadow-md ring-1 ring-white/10" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-sm sm:text-lg font-black italic tracking-tighter bg-clip-text text-transparent drop-shadow-sm leading-tight" style={{
                fontFamily: "'Playfair Display', serif",
                backgroundImage: 'linear-gradient(135deg, #7c3aed, #6d28d9, #5b21b6)'
              }}>Utsavo</h1>
              {isAuthPage && (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div className="h-[1px] w-5 bg-gradient-to-r from-rose-700/40 to-transparent"></div>
                  <p className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-[0.22em] text-rose-800/80 drop-shadow-sm">
                    Elite Wedding Network
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`min-h-screen flex flex-col relative z-10 ${
        hideLogo
          ? 'pt-0 sm:pt-20 pb-0 sm:pb-3 px-0 sm:px-3' 
          : `pt-12 sm:pt-20 pb-3 ${hidePaddingX ? 'px-0' : 'px-1'} sm:px-3`
      }`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="mx-auto max-w-6xl w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPublicLayout;
