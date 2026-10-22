import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from '../../../components/ui/Toast';

const THEME_KEY = 'utsavo-login-theme';

const CATEGORY_CHIPS = [
  { label: 'Venues', light: 'bg-[#FDE7EF] text-[#C2185B]', dark: 'bg-[#C2185B]/25 text-[#FFB3D1]' },
  { label: 'Catering', light: 'bg-[#EDE7FB] text-[#6D3FC4]', dark: 'bg-[#6D3FC4]/30 text-[#D2C2FF]' },
  { label: 'Decor', light: 'bg-[#DDF5EA] text-[#1F8A63]', dark: 'bg-[#1F8A63]/30 text-[#9BE8C8]' },
  { label: 'Music', light: 'bg-[#FEEBD6] text-[#B86A12]', dark: 'bg-[#B86A12]/30 text-[#FFD29B]' },
  { label: 'Photography', light: 'bg-[#DDEBFC] text-[#1D4FBF]', dark: 'bg-[#1D4FBF]/30 text-[#A9C8FF]' }
];

// Soft pastel leaves and waves behind the form (pure SVG, so nothing extra to download)
const LoginBackdrop = ({ dark }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div
      className="absolute inset-0 transition-colors duration-300"
      style={{
        background: dark
          ? 'radial-gradient(120% 60% at 50% 0%, #1E1B3A 0%, #12112A 55%, #0C0B1E 100%)'
          : 'radial-gradient(120% 60% at 50% 0%, #FFFFFF 0%, #FDFBF9 55%, #FBF6F4 100%)'
      }}
    />
    <div className={dark ? 'opacity-70' : ''}>
      {/* top-left leaves */}
      <svg className="absolute -top-2 -left-8 w-48 h-60" viewBox="0 0 180 230" fill="none">
        <defs>
          <linearGradient id="lg-pink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF9BC4" /><stop offset="1" stopColor="#F4519B" />
          </linearGradient>
          <linearGradient id="lg-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8FD3FF" /><stop offset="1" stopColor="#4F8DF0" />
          </linearGradient>
          <linearGradient id="lg-orange" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFD68A" /><stop offset="1" stopColor="#FF9F3D" />
          </linearGradient>
        </defs>
        <path d="M-10 120 C 10 40, 70 10, 130 20 C 110 70, 70 130, -10 175 Z" fill="url(#lg-pink)" opacity="0.85" />
        <path d="M-5 70 C 20 30, 50 20, 80 15 C 70 45, 40 80, -5 100 Z" fill="url(#lg-blue)" opacity="0.8" />
        <path d="M120 10 C 150 -5, 175 0, 190 8 C 175 40, 150 60, 118 62 C 128 40, 126 25, 120 10 Z" fill="url(#lg-orange)" opacity="0.85" />
        <circle cx="148" cy="108" r="6" fill="#F4A8CD" opacity="0.7" />
        <circle cx="96" cy="190" r="4" fill="#9ED8FF" opacity="0.7" />
      </svg>
      {/* bottom-right leaves */}
      <svg className="absolute -bottom-6 -right-6 w-44 h-56" viewBox="0 0 180 230" fill="none">
        <path d="M190 230 C 150 190, 140 120, 160 60 C 185 100, 195 170, 190 230 Z" fill="url(#lg-pink)" opacity="0.7" />
        <path d="M185 230 C 140 215, 100 190, 80 150 C 125 150, 170 175, 185 230 Z" fill="url(#lg-blue)" opacity="0.65" />
        <circle cx="150" cy="40" r="7" fill="#FFC7A1" opacity="0.8" />
      </svg>
      {/* bottom waves */}
      <svg className="absolute bottom-0 left-0 w-full h-44" viewBox="0 0 400 190" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="wave-a" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8FD3FF" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#C7A6FF" stopOpacity="0.45" />
            <stop offset="1" stopColor="#FFB88A" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="wave-b" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFB3D1" stopOpacity="0.5" />
            <stop offset="0.6" stopColor="#D9B8FF" stopOpacity="0.45" />
            <stop offset="1" stopColor="#FFD4A8" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <path d="M0 120 C 90 70, 170 150, 260 110 C 320 85, 365 100, 400 80 L400 190 L0 190 Z" fill="url(#wave-a)" />
        <path d="M0 150 C 80 115, 160 175, 250 145 C 320 120, 370 140, 400 125 L400 190 L0 190 Z" fill="url(#wave-b)" />
      </svg>
    </div>
  </div>
);

// Light / dark switch in the top-right corner
const ThemeSwitch = ({ dark, onChange }) => (
  <div
    role="group"
    aria-label="Colour theme"
    className={`flex items-center rounded-full p-1.5 gap-1 shadow-[0_4px_16px_rgba(60,40,90,0.12)] transition-colors ${dark ? 'bg-[#2A2850]' : 'bg-[#E9E8F0]'}`}
  >
    <button
      type="button"
      onClick={() => onChange(false)}
      aria-pressed={!dark}
      aria-label="Light theme"
      className={`w-11 h-9 rounded-full flex items-center justify-center transition-all ${!dark ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] text-[#1B1B33]' : 'text-[#9FA0BC]'}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    </button>
    <button
      type="button"
      onClick={() => onChange(true)}
      aria-pressed={dark}
      aria-label="Dark theme"
      className={`w-11 h-9 rounded-full flex items-center justify-center transition-all ${dark ? 'bg-[#0F1033] shadow-[0_2px_8px_rgba(0,0,0,0.35)] text-white' : 'text-[#1B1B33]'}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
    </button>
  </div>
);

const GoogleIcon = () => (
  <svg width="34" height="34" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const AppleIcon = ({ dark }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill={dark ? '#FFFFFF' : '#000000'} aria-hidden="true">
    <path d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.15-2.9.9-3.7.9-.8 0-1.9-.85-3.1-.8-1.6 0-3.1.9-3.9 2.3-1.7 2.9-.4 7.2 1.2 9.5.8 1.2 1.7 2.4 3 2.4 1.2-.05 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.05 0-2.5-.95-2.5-3.8zM14 5.5c.65-.8 1.1-1.9 1-3-.95.05-2.1.65-2.8 1.45-.6.7-1.15 1.85-1 2.9 1.05.1 2.1-.5 2.8-1.35z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="#1877F2" />
    <path fill="#fff" d="M26.6 38V26.2h4l.6-4.6h-4.6v-2.9c0-1.3.4-2.2 2.3-2.2h2.4v-4.1c-.4-.05-1.8-.2-3.5-.2-3.5 0-5.9 2.1-5.9 6v3.4h-4v4.6h4V38h4.7z" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithOtp, sendPhoneOtp, continueAsGuest } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === 'dark'; } catch (_) { return false; }
  });
  // OTP login
  const [loginMode, setLoginMode] = useState('password'); // 'password' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    // Outfit is the typeface used by this screen
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  const changeTheme = (isDark) => {
    setDark(isDark);
    try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch (_) { /* storage unavailable */ }
  };

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setIsSendingOtp(true);
    const result = await sendPhoneOtp(phone, 'login');
    setIsSendingOtp(false);
    if (result.success) {
      setIsOtpSent(true);
      setOtp(result.devOtp || '');
    } else {
      setError(result.error);
    }
  };

  const switchLoginMode = () => {
    setLoginMode(loginMode === 'password' ? 'otp' : 'password');
    setError('');
    setIsOtpSent(false);
    setOtp('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (loginMode === 'otp' && !isOtpSent) {
      return handleSendOtp();
    }
    if (loginMode === 'otp' && otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setIsSubmitting(true);
    const result = loginMode === 'otp'
      ? await loginWithOtp(phone, otp, rememberMe)
      : await login(formData.username, formData.password, rememberMe);
    setIsSubmitting(false);
    if (result.success) {
      navigate(redirectUrl || '/user/dashboard');
    } else {
      setError(result.error);
    }
  };

  const handleGuestLogin = () => {
    if (typeof continueAsGuest === 'function') {
      continueAsGuest();
    }
    navigate(redirectUrl || '/user/home');
  };

  // Social sign-in needs provider accounts (Google / Apple / Facebook app credentials) that are not
  // set up yet, so for now these tell the user to use another way in instead of doing nothing.
  const handleSocial = (provider) => {
    toast.info(`${provider} sign-in is coming soon. Please log in with your email or mobile number.`);
  };

  const submitLabel = loginMode === 'otp' && !isOtpSent ? 'Send OTP' : 'Login';

  const fieldClass =
    `relative flex items-center rounded-[14px] border transition-all ${dark
      ? 'bg-[#1B1A38] border-[#34325C] shadow-none focus-within:border-[#9B6BFF]'
      : 'bg-white border-[#ECE9F3] shadow-[0_2px_8px_rgba(60,40,90,0.05)] focus-within:border-[#7B3FE4]/60 focus-within:shadow-[0_0_0_3px_rgba(123,63,228,0.12)]'}`;
  const inputClass =
    `w-full bg-transparent h-[46px] text-[13px] focus:outline-none ${dark ? 'text-white placeholder-[#8D8EAE]' : 'text-[#1B1B33] placeholder-[#7E8094]'}`;
  const iconClass = dark ? 'text-[#B9A4FF]' : 'text-[#6D3FD0]';
  const socialClass =
    `w-[84px] h-[68px] rounded-[22px] flex items-center justify-center active:scale-95 transition-transform ${dark
      ? 'bg-[#1B1A38] border border-[#34325C]'
      : 'bg-white border border-[#EFEDF4] shadow-[0_6px_18px_rgba(60,40,90,0.10)]'}`;

  return (
    <div className={`min-h-[100dvh] relative overflow-x-hidden font-['Outfit',sans-serif] transition-colors ${dark ? 'text-white' : 'text-[#1B1B33]'}`}>
      <LoginBackdrop dark={dark} />

      <div className="relative z-10 w-full max-w-md mx-auto px-6 pt-4 pb-5 flex flex-col items-center min-h-[100dvh]">
        {/* theme switch */}
        <div className="w-full flex justify-end">
          <ThemeSwitch dark={dark} onChange={changeTheme} />
        </div>

        {/* LOGO */}
        <img
          src={dark ? '/utsavo_logo_transparent_dark.webp' : '/utsavo_logo_transparent.webp'}
          alt="Utsavo - Celebrate Every Moment"
          width="1565"
          height="1005"
          className="w-[80%] max-w-[300px] h-auto select-none -mt-4"
          draggable="false"
        />

        <div className="relative w-full font-['Poppins',sans-serif]">
        {/* two small accent dots beside the chips */}
        <span aria-hidden="true" className="absolute left-[3px] top-[58px] w-[6px] h-[6px] rounded-full bg-[#6B3FD6]" />
        <span aria-hidden="true" className="absolute right-[1px] top-[98px] w-[5px] h-[5px] rounded-full bg-[#F0338A]" />

        {/* HEADINGS */}
        <div className="text-center mt-1">
          <h1 className={`text-[25px] leading-tight font-bold tracking-tight ${dark ? 'text-white' : 'text-[#0E0E36]'}`}>
            Welcome back
          </h1>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#B7B8D6]' : 'text-[#4A4A62]'}`}>Sign in to plan, book and celebrate every event.</p>
          <div className="mt-3 mx-auto max-w-[290px] flex flex-wrap justify-center gap-x-2 gap-y-1.5">
            {CATEGORY_CHIPS.map(chip => (
              <span key={chip.label} className={`px-[11px] h-[26px] inline-flex items-center rounded-full text-[11px] font-medium ${dark ? chip.dark : chip.light}`}>{chip.label}</span>
            ))}
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5 mt-5">
          {error && (
            <div role="alert" className="w-full bg-red-50 border border-red-200 text-red-600 rounded-2xl py-3 px-4 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {loginMode === 'otp' ? (
            <>
              <div className={fieldClass}>
                <div className={`pl-4 pr-3 ${iconClass}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
                </div>
                <span className="pr-2 text-[13px] font-semibold">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setIsOtpSent(false);
                    setOtp('');
                  }}
                  className={`${inputClass} pr-28`}
                  placeholder="Mobile Number"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || phone.length !== 10}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-[11px] font-semibold rounded-full px-3.5 py-1.5 disabled:opacity-40 transition-opacity"
                  style={{ background: 'linear-gradient(90deg,#FF2E93,#7B3FE4)' }}
                >
                  {isSendingOtp ? 'Sending...' : (isOtpSent ? 'Resend' : 'Send OTP')}
                </button>
              </div>

              {isOtpSent && (
                <div className={fieldClass}>
                  <div className={`pl-4 pr-3 ${iconClass}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /><circle cx="12" cy="16" r="1" fill="currentColor" /></svg>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`${inputClass} pr-5 tracking-[0.3em] placeholder:tracking-normal`}
                    placeholder={`OTP sent to +91 ${phone}`}
                    required
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className={fieldClass}>
                <div className={`pl-4 pr-3 ${iconClass}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`${inputClass} pr-5`}
                  placeholder="Username or Email"
                  required
                />
              </div>

              <div className={fieldClass}>
                <div className={`pl-4 pr-3 ${iconClass}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /><circle cx="12" cy="16" r="1" fill="currentColor" /></svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${inputClass} pr-12`}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className={`absolute right-[15px] top-1/2 -translate-y-1/2 transition-colors ${dark ? 'text-[#A9AACB] hover:text-white' : 'text-[#6B6D85] hover:text-[#1B1B33]'}`}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between -mt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className={`w-[17px] h-[17px] rounded-[4px] border flex items-center justify-center transition-colors peer-checked:border-transparent peer-checked:bg-gradient-to-br peer-checked:from-[#E63B9A] peer-checked:to-[#9B2FD0] peer-focus-visible:ring-2 peer-focus-visible:ring-[#7B3FE4]/40 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100 ${dark ? 'border-[#4A4880] bg-[#1B1A38]' : 'border-[#D4C9E6] bg-white'}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6" /></svg>
                  </span>
                  <span className="text-[12px]">Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className={`text-[12px] font-medium hover:underline ${dark ? 'text-[#7FA8FF]' : 'text-[#2D4FD6]'}`}
                >
                  Forgot Password?
                </button>
              </div>
            </>
          )}

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="relative w-full h-[56px] rounded-full text-white text-[15px] font-semibold flex items-center justify-center overflow-hidden active:scale-[0.98] transition-transform disabled:opacity-70"
            style={{
              background: 'linear-gradient(90deg,#DB2288 0%,#9A2BC0 38%,#5B33DE 68%,#2F5FEA 100%)',
              boxShadow: '0 10px 22px -10px rgba(91,51,222,0.55)'
            }}
          >
            <span>{isSubmitting ? 'Please wait...' : submitLabel}</span>
            <span className="absolute right-[7px] top-1/2 -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-white/25 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
            </span>
          </button>
        </form>
        </div>

        {/* OR CONTINUE WITH */}
        <div className="w-full flex items-center gap-4 mt-5 mb-4">
          <div className={`h-px flex-1 ${dark ? 'bg-[#3A385F]' : 'bg-[#D9D8E3]'}`} />
          <span className={`text-[14px] font-medium tracking-[0.2em] uppercase ${dark ? 'text-[#B7B8D6]' : 'text-[#4A4B63]'}`}>Or continue with</span>
          <div className={`h-px flex-1 ${dark ? 'bg-[#3A385F]' : 'bg-[#D9D8E3]'}`} />
        </div>

        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={() => handleSocial('Google')} aria-label="Continue with Google" className={socialClass}><GoogleIcon /></button>
          <button type="button" onClick={() => handleSocial('Apple')} aria-label="Continue with Apple" className={socialClass}><AppleIcon dark={dark} /></button>
          <button type="button" onClick={() => handleSocial('Facebook')} aria-label="Continue with Facebook" className={socialClass}><FacebookIcon /></button>
        </div>

        {/* CREATE ACCOUNT */}
        <p className={`mt-auto pt-5 text-[17px] text-center ${dark ? 'text-[#C9CAE6]' : 'text-[#3A3B55]'}`}>
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup' + (location.search || ''))}
            className={`font-semibold hover:underline ${dark ? 'text-[#7FA8FF]' : 'text-[#1D5FE0]'}`}
          >
            Create Account
          </button>
        </p>

        {/* Existing ways in that the picture does not show: kept as quiet links */}
        <div className={`mt-2 flex items-center justify-center gap-3 text-[13.5px] ${dark ? 'text-[#9FA0BC]' : 'text-[#6B6D85]'}`}>
          <button type="button" onClick={switchLoginMode} className="hover:underline">
            {loginMode === 'password' ? 'Login with mobile OTP' : 'Login with email & password'}
          </button>
          <span aria-hidden="true">•</span>
          <button type="button" onClick={handleGuestLogin} className="hover:underline">Continue as guest</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
