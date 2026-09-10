import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../hooks/useTheme';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Add Designer fonts for the Lilac theme
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Great+Vibes&family=Outfit:wght@300;400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setError('');
    
    const result = await register(formData);
    if (result.success) {
      navigate('/user/wedding-details');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: '#BE9B9B' }}>
      
      {/* EDGE-TO-EDGE LEAF DECORATION */}
      <div className="absolute top-0 left-0 w-full h-40 opacity-90 pointer-events-none" style={{ mixBlendMode: 'multiply' }}>
         <img src="/assets/vendor/straight_leaves.png" alt="straight leaves top" className="w-full h-full object-cover scale-x-125 origin-top" />
      </div>

      <div className="absolute bottom-0 left-0 w-full h-40 opacity-90 pointer-events-none rotate-180 -mb-16" style={{ mixBlendMode: 'multiply' }}>
         <img src="/assets/vendor/straight_leaves.png" alt="straight leaves bottom" className="w-full h-full object-cover scale-x-125 origin-top" />
      </div>

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        {/* LOGO SECTION - COMPACTED & LIFTED */}
        <div className="mb-0 text-center mt-12">
            <h2 className="text-[#5D3E3E] text-5xl font-normal mb-2" style={{ fontFamily: '"Great Vibes", cursive' }}>Join Us</h2>
            <p className="text-[#5D3E3E]/80 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ fontFamily: '"Outfit", sans-serif' }}>
               Create your dream wedding account
            </p>
            <div className="mt-2 flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#5D3E3E">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
        </div>

        {/* INPUT FIELDS - MAX COMPACTED SPACING */}
        <form onSubmit={handleSubmit} className="w-full space-y-1.5">
          {error && (
            <div className="w-full bg-red-100 text-red-600 rounded-xl py-2 px-4 text-xs font-semibold shadow-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[#5D3E3E] text-xs font-bold pl-1" style={{ fontFamily: '"Playfair Display", serif' }}>Full Name :</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-white rounded-xl py-3.5 px-5 text-[#5D3E3E] text-sm font-semibold shadow-sm focus:ring-2 focus:ring-[#5D3E3E]/20 transition-all border-none placeholder-[#BE9B9B]"
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#5D3E3E] text-xs font-bold pl-1" style={{ fontFamily: '"Playfair Display", serif' }}>Email Address :</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-white rounded-xl py-3.5 px-5 text-[#5D3E3E] text-sm font-semibold shadow-sm focus:ring-2 focus:ring-[#5D3E3E]/20 transition-all border-none placeholder-[#BE9B9B]"
              placeholder="Your email address"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#5D3E3E] text-xs font-bold pl-1" style={{ fontFamily: '"Playfair Display", serif' }}>Phone Number :</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-white rounded-xl py-3.5 px-5 text-[#5D3E3E] text-sm font-semibold shadow-sm focus:ring-2 focus:ring-[#5D3E3E]/20 transition-all border-none placeholder-[#BE9B9B]"
              placeholder="10-digit mobile number"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#5D3E3E] text-xs font-bold pl-1" style={{ fontFamily: '"Playfair Display", serif' }}>City :</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="w-full bg-white rounded-xl py-3.5 px-5 text-[#5D3E3E] text-sm font-semibold shadow-sm focus:ring-2 focus:ring-[#5D3E3E]/20 transition-all border-none placeholder-[#BE9B9B]"
              placeholder="Your city"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#5D3E3E] text-xs font-bold pl-1" style={{ fontFamily: '"Playfair Display", serif' }}>Password :</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-white rounded-xl py-3.5 px-5 pr-12 text-[#5D3E3E] text-sm font-semibold shadow-sm focus:ring-2 focus:ring-[#5D3E3E]/20 transition-all border-none placeholder-[#BE9B9B]"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5D3E3E]/40 hover:text-[#5D3E3E] transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L14.12 14.12"/><path d="M22 17a2.22 2.22 0 0 0-2-2 15.36 15.36 0 0 0-3-1.3l-1.3-.4c-.5-.2-1.1-.1-1.5.3L12 15.7a10.65 10.65 0 0 1-5.7-5.7l2.1-2.1c.4-.4.5-1 .3-1.5l-.4-1.3A15.36 15.36 0 0 0 7 2a2.22 2.22 0 0 0-2 2v1"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-1 py-1">
            <input 
              type="checkbox" 
              id="terms" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 accent-[#5D3E3E] rounded border-none shadow-sm cursor-pointer"
            />
            <label htmlFor="terms" className="text-[10px] text-[#5D3E3E]/70 font-semibold cursor-pointer select-none" style={{ fontFamily: '"Outfit", sans-serif' }}>
              I agree to the <span className="text-[#5D3E3E] border-b border-[#5D3E3E]/40">Terms of Service</span> and <span className="text-[#5D3E3E] border-b border-[#5D3E3E]/40">Privacy Policy</span>
            </label>
          </div>

          {/* ACTION BUTTON (Follows the image's "CONFIRM" button style) */}
          <button
            type="submit"
            className="w-full bg-[#5D3E3E] py-4 rounded-2xl text-white font-black text-sm tracking-[0.2em] shadow-xl hover:bg-[#4A3232] transition-colors mt-2 uppercase"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            Create Account
          </button>
        </form>

        {/* FOOTER LINKS - MOVED UP */}
        <div className="mt-4 flex flex-col items-center gap-4">
           <button 
             onClick={() => navigate('/login')} 
             className="text-[#5D3E3E] text-[10px] font-black uppercase tracking-widest border-b border-[#5D3E3E]/40"
             style={{ fontFamily: '"Outfit", sans-serif' }}
           >
             Go to Login Page
           </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;