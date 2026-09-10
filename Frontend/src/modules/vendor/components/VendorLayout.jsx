import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import VendorSidebar from './VendorSidebar';
import VendorTopbar from './VendorTopbar';
import VendorBottomNav from './VendorBottomNav';
import VendorChatbot from './VendorChatbot';
import { useVendorState } from '../useVendorState';
import { UploadProvider } from '../context/UploadContext';
import UploadProgressWidget from './UploadProgressWidget';

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { vendorState, loading } = useVendorState();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!loading && !token) {
      navigate('/vendor/login');
    } else if (!loading && vendorState._id && vendorState.onboardingStep !== 'completed') {
      navigate('/vendor/onboarding/subscription');
    }
  }, [loading, vendorState._id, vendorState.onboardingStep, navigate]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (window.lenis && typeof window.lenis.stop === 'function') {
        window.lenis.stop();
      }

      const preventTouch = (e) => {
        const scrollContainer = document.querySelector('.custom-scrollbar');
        if (scrollContainer && scrollContainer.contains(e.target)) {
          return;
        }
        e.preventDefault();
      };

      document.addEventListener('touchmove', preventTouch, { passive: false });

      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if (window.lenis && typeof window.lenis.start === 'function') {
          window.lenis.start();
        }
        document.removeEventListener('touchmove', preventTouch);
      };
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start();
      }
    }
  }, [sidebarOpen]);

  const isApproved = vendorState.status === 'Approved';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7c3aed]"></div>
      </div>
    );
  }

  return (
    <UploadProvider>
    <div className="vendor-shell min-h-screen relative overflow-x-hidden">


      <div className="flex min-h-screen relative z-10 flex-col">
        {/* Full width fixed topbar */}
        <VendorTopbar 
          notifications={vendorState.notifications} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />

        {/* Content layout below topbar */}
        <div className="flex flex-1 pt-16 min-w-0">
          {/* Desktop Sidebar placeholder */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <VendorSidebar 
              isApproved={isApproved} 
              onClose={() => setSidebarOpen(false)} 
              counts={{
                leads: (vendorState.leads || []).length,
                chat: (vendorState.notifications || []).length // Using notifications as chat count for now if chat list is missing
              }}
            />
          </div>

          {/* Mobile Sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 flex lg:hidden pt-16">
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs top-16" onClick={() => setSidebarOpen(false)}></div>
              <div className="relative w-64 h-full z-40 flex flex-col shadow-2xl animate-slide-in">
                <VendorSidebar 
                  isApproved={isApproved} 
                  onClose={() => setSidebarOpen(false)} 
                  counts={{
                    leads: (vendorState.leads || []).length,
                    chat: (vendorState.notifications || []).length
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 px-3 py-3 lg:px-8 lg:py-6 mb-20 lg:mb-0 min-w-0">
              {!isApproved && vendorState.isServiceProfileCompleted ? (
                <div className="h-full flex items-center justify-center min-h-[70vh] p-4">
                  <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-white shadow-2xl text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto relative overflow-hidden">
                        <Icon name="shield" size="lg" color="#7c3aed" />
                        <div className="absolute inset-0 bg-slate-400/10 animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Under Review</h2>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">
                        Verifying your profile. You'll get access once approved.
                      </p>
                    </div>
                  </div>
                </div>
              ) : vendorState.isActive === false ? (
                <div className="h-full flex items-center justify-center min-h-[70vh] p-4">
                  <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-white shadow-2xl text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="h-20 w-20 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto relative overflow-hidden">
                        <Icon name="warning" size="lg" color="#e11d48" />
                        <div className="absolute inset-0 bg-rose-400/10 animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-rose-600 tracking-tight leading-none uppercase">Account Suspended</h2>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">
                        Your account has been temporarily deactivated by the admin. Please contact support to resolve this issue.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Outlet />
              )}
            </main>
          </div>
        </div>
      </div>
      
      {/* Global AI Chatbot */}
      <VendorChatbot />

      <div className="lg:hidden" id="global-bottom-nav">
         <VendorBottomNav isApproved={isApproved} />
      </div>
      
      <UploadProgressWidget token={localStorage.getItem('vendorToken')} />
    </div>
    </UploadProvider>
  );
};

export default VendorLayout;
