import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../hooks/useTheme';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
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
    setError('');
    const result = await login(formData.username, formData.password);
    if (result.success) {
      navigate('/user/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col justify-end overflow-hidden font-['Outfit']"
      style={{ 
        backgroundImage: "url('/login%20page%20bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      
      {/* FOREGROUND CONTENT CONTAINER */}
      <div className="relative w-full pt-[40vh] pb-6 flex flex-col items-center z-10 bg-transparent">
        
        {/* HEADINGS */}
        <div className="text-center mb-6 w-full max-w-sm mt-4 relative z-10">
          <h2 className="text-[#59233D] text-3xl font-black mb-1.5 tracking-tight drop-shadow-sm" style={{ fontFamily: '"Playfair Display", serif' }}>
            Welcome Back
          </h2>
          <p className="text-[#8E95A4] text-[11px] leading-[1.6] px-4 font-medium drop-shadow-sm">
            Login to explore, plan and celebrate<br/>your special moments with Utsavo
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm px-6 flex flex-col space-y-3 relative z-10">
          {error && (
            <div className="w-full bg-red-100 text-red-600 rounded-xl py-2 px-4 text-xs font-semibold shadow-sm text-center mb-2">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div className="relative flex items-center bg-[#F3EBED] rounded-xl border border-transparent focus-within:border-[#59233D]/20 transition-colors">
            <div className="pl-4 pr-3 text-[#59233D]/60">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-transparent py-3.5 pr-4 text-[#301024] text-[12px] font-bold focus:outline-none placeholder-[#8E95A4]"
              placeholder="Mobile Number or Email"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative flex items-center bg-[#F3EBED] rounded-xl border border-transparent focus-within:border-[#59233D]/20 transition-colors">
            <div className="pl-4 pr-3 text-[#59233D]/60">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-transparent py-3.5 pr-12 text-[#301024] text-[12px] font-bold focus:outline-none placeholder-[#8E95A4]"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E95A4] hover:text-[#59233D] transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>

          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-[#59233D] text-[10px] font-bold hover:underline transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* ACTION BUTTON */}
          <button
            type="submit"
            className="relative w-full bg-[#59233D] py-3.5 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-[#43192D] transition-all active:scale-95 overflow-hidden mt-1"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            <span className="text-[15px] font-bold tracking-wide">Login</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
        </form>

        {/* SIGN UP LINK */}
        <div className="w-full max-w-sm text-center mt-6 mb-6 relative z-10">
          <span className="text-[#8E95A4] text-[10.5px] font-medium">Don't have an account? </span>
          <button 
            type="button"
            onClick={() => navigate('/signup')} 
            className="text-[#59233D] text-[10.5px] font-bold hover:underline"
          >
            Sign Up
          </button>
        </div>

        {/* GUEST LOGIN */}
        <div className="w-full max-w-sm px-6 relative z-10">
          <button 
            type="button"
            onClick={() => navigate('/user/dashboard')}
            className="w-full flex items-center justify-center gap-2 border border-[#59233D]/30 rounded-full py-3.5 text-[#59233D] text-[11px] font-bold bg-transparent active:scale-95 transition-transform hover:bg-[#59233D]/5 mb-6"
          >
             <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
             Continue as Guest
          </button>
        </div>

        {/* BOTTOM FEATURES */}
        <div className="w-full max-w-sm flex justify-center items-center gap-3 text-[#59233D] text-[8px] font-bold mb-4 relative z-10">
           <div className="flex items-center gap-1.5"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Plan Events</div>
           <span className="text-[#59233D]/30">|</span>
           <div className="flex items-center gap-1.5"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Connect with Vendors</div>
           <span className="text-[#59233D]/30">|</span>
           <div className="flex items-center gap-1.5"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Create Memories</div>
        </div>

        {/* FOOTER TEXT WITH LOTUS DIVIDER */}
        <div className="w-full max-w-sm px-6 flex flex-col items-center relative z-10">
           <div className="w-full flex items-center justify-center gap-2 mb-2">
             <div className="h-[1px] w-12 bg-gray-200"></div>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="none">
               <path d="M12 3C12 3 14 7 17 9C20 11 22 13 22 16C22 19 19 22 12 22C5 22 2 19 2 16C2 13 4 11 7 9C10 7 12 3 12 3Z" fill="#C99B4B"/>
               <path d="M12 22V10M8 12C6 16 7 22 12 22C17 22 18 16 16 12C14.5 9 12 10 12 10" stroke="#FCF8F8" strokeWidth="1.5" strokeLinecap="round"/>
               <path d="M7 16C5.5 16 4.5 18 4 20M17 16C18.5 16 19.5 18 20 20" stroke="#C99B4B" strokeWidth="1.5" strokeLinecap="round"/>
             </svg>
             <div className="h-[1px] w-12 bg-gray-200"></div>
           </div>
           <p className="text-[#A0A5B1] text-[6.5px] font-bold uppercase tracking-[0.3em]">
             Every celebration deserves a beautiful story
           </p>
        </div>

      </div>
    </div>
  );
};

export default Login;