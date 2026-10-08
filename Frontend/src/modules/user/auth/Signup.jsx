import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../hooks/useTheme';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, sendPhoneOtp, verifySignupOtp } = useAuth();
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
  // Phone OTP verification
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const isPhoneVerified = Boolean(phoneVerificationToken);

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    // Add Designer fonts for the Lilac theme
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Great+Vibes&family=Outfit:wght@300;400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setIsSendingOtp(true);
    const result = await sendPhoneOtp(formData.phone, 'register');
    setIsSendingOtp(false);
    if (result.success) {
      setIsOtpSent(true);
      setOtp(result.devOtp || '');
    } else {
      setError(result.error);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setError('');
    setIsVerifyingOtp(true);
    const result = await verifySignupOtp(formData.phone, otp);
    setIsVerifyingOtp(false);
    if (result.success) {
      setPhoneVerificationToken(result.phoneVerificationToken);
      setIsOtpSent(false);
    } else {
      setError(result.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    if (!isPhoneVerified) {
      setError('Please verify your mobile number with OTP first.');
      return;
    }
    setError('');

    const result = await register({ ...formData, phoneVerificationToken });
    if (result.success) {
      navigate(redirectUrl || '/user/wedding-details');
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
      <div className="relative w-full pt-[15vh] pb-6 px-6 flex flex-col items-center z-10 bg-transparent">
        {/* LOGO SECTION REMOVED AS REQUESTED */}

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
            <div className="relative">
              <input
                type="tel"
                inputMode="numeric"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)});
                  setIsOtpSent(false);
                  setOtp('');
                  setPhoneVerificationToken('');
                }}
                className={`w-full bg-white rounded-xl py-3.5 px-5 pr-28 text-[#5D3E3E] text-sm font-semibold shadow-sm focus:ring-2 focus:ring-[#5D3E3E]/20 transition-all placeholder-[#BE9B9B] ${isPhoneVerified ? 'border border-green-500' : 'border-none'}`}
                placeholder="10-digit mobile number"
                required
              />
              {isPhoneVerified ? (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 text-[11px] font-bold">✓ Verified</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || formData.phone.length !== 10}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#5D3E3E] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg px-3 py-2 disabled:opacity-40 transition-opacity"
                >
                  {isSendingOtp ? 'Sending...' : (isOtpSent ? 'Resend' : 'Send OTP')}
                </button>
              )}
            </div>
          </div>

          {isOtpSent && !isPhoneVerified && (
            <div className="space-y-1">
              <label className="text-[#5D3E3E] text-xs font-bold pl-1" style={{ fontFamily: '"Playfair Display", serif' }}>OTP :</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-white rounded-xl py-3.5 px-5 pr-28 text-[#5D3E3E] text-sm font-semibold tracking-[0.3em] shadow-sm focus:ring-2 focus:ring-[#5D3E3E]/20 transition-all border-none placeholder-[#BE9B9B] placeholder:tracking-normal"
                  placeholder={`OTP sent to +91 ${formData.phone}`}
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp || otp.length !== 6}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg px-3 py-2 disabled:opacity-40 transition-opacity"
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

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
             onClick={() => navigate('/login' + (location.search || ''))} 
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