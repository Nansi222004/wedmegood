import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';
import { useVendorState } from '../useVendorState';
import VendorSplashScreen from '../components/VendorSplashScreen';

import loginImg from '../../../assets/login (2).png';

const VendorLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSplash, setShowSplash] = useState(true);

  const { updateVendorState, refreshData } = useVendorState();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email && password) {
      try {
        const res = await vendorApi.login(email, password);
        if (res.success) {
          localStorage.setItem('vendorToken', res.token);
          updateVendorState({ vendor: res.vendor });
          refreshData(); // Trigger the /me API to hydrate global context
          navigate('/vendor/dashboard');
        } else {
          alert(res.message || 'Login failed');
        }
      } catch (err) {
        alert('Server error connecting to backend');
      }
    } else {
      alert('Please enter your credentials');
    }
  };

  if (showSplash) {
    return <VendorSplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="w-full min-h-[100dvh] sm:h-auto sm:max-w-xl sm:mx-auto flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Super Compact Card wrapper */}
      <div className="bg-white min-h-[100dvh] sm:min-h-0 sm:h-auto w-full rounded-none sm:rounded-[28px] shadow-none sm:shadow-[0_12px_40px_rgba(124,58,237,0.08)] border-0 sm:border border-slate-100 flex flex-col transition-all duration-300">
        
        {/* Subtle purple accent glow at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4F35C3]/10 via-[#4F35C3]/40 to-[#4F35C3]/10" />

        {/* Logo inside card */}
        <div className="flex flex-col items-center justify-center pt-8 pb-5 select-none flex-shrink-0">
          <div className="pointer-events-auto flex items-center gap-1.5 cursor-pointer group" onClick={() => window.location.href = '/'}>
            <div className="relative">
              <img src="/assets/vendor/logo_theme.png" alt="Utsavo Logo" className="h-8 sm:h-11 w-auto rounded-lg shadow-sm transition-all duration-300 group-hover:scale-105" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg sm:text-2xl font-black italic tracking-tighter bg-clip-text text-transparent leading-none" style={{
                fontFamily: "'Playfair Display', serif",
                backgroundImage: 'linear-gradient(135deg, #7c3aed, #6d28d9, #5b21b6)'
              }}>Utsavo</h1>
              <div className="mt-0.5 flex items-center gap-0.5">
                <div className="h-[1px] w-4 bg-gradient-to-r from-rose-700/40 to-transparent"></div>
                <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.25em] text-rose-800/80 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Elite Wedding Network
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col px-6 sm:px-10 pb-8 relative z-10 items-center">
          {/* Centered Traditional Wedding Couple Illustration */}
          <div className="w-full flex justify-center mb-6 transition-transform duration-500 hover:scale-105">
            <img src={loginImg} alt="Vendor Portal Illustration" className="h-28 sm:h-36 w-auto object-contain rounded-2xl" />
          </div>

          <div className="text-center mb-6 w-full">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#4F35C3] mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>Vendor Portal</p>
            <h2 className="text-3xl sm:text-[34px] font-extrabold text-slate-800 font-['Outfit'] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome Back</h2>
            <p className="text-[11.5px] sm:text-[13px] font-semibold text-slate-500 mt-2.5">Sign in to manage your wedding business.</p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#4F35C3]">
                  <Icon name="mail" size="sm" color="current" />
                </div>
                <input
                  type="email"
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50/20 focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/5 outline-none transition-all duration-150 placeholder-slate-400"
                  placeholder="vendor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1 mb-1.5">
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Password</label>
                <button type="button" className="text-[10.5px] font-bold tracking-wide text-[#4F35C3] hover:text-[#3f2aa6] transition-colors">Forgot?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#4F35C3]">
                  <Icon name="lock" size="sm" color="current" />
                </div>
                <input
                  type="password"
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50/20 focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/5 outline-none transition-all duration-150 placeholder-slate-400"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="w-full mt-6 rounded-xl py-3 text-[13px] sm:text-sm font-extrabold text-white transition-all duration-200 bg-[#4F35C3] shadow-sm hover:shadow-[0_4px_16px_rgba(79,53,195,0.25)] hover:brightness-105 active:scale-[0.98] flex items-center justify-center gap-2">
              Sign In ✨
            </button>
          </form>

          <div className="mt-7 text-center">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500">
              Don't have a vendor account?
              <Link to="/vendor/register" className="ml-1.5 text-[#4F35C3] hover:text-[#3f2aa6] font-extrabold hover:underline">Register Now</Link>
            </p>
          </div>

          {/* Trust badges below */}
          <div className="flex justify-center gap-6 mt-8">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">🔒 Secure Login</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">✅ Trusted Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;
