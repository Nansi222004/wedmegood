import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userApi } from '../../../services/userApi';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Great+Vibes&family=Outfit:wght@300;400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetToken(null);
    setIsLoading(true);

    try {
      const res = await userApi.forgotPassword(email.trim().toLowerCase());
      setMessage(res.message || 'Password reset link has been dispatched to your email.');
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setError(err.message || 'Failed to process password reset request. Please check the email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: '#BE9B9B' }}>
      {/* Leaves decoration */}
      <div className="absolute top-0 left-0 w-full h-40 opacity-90 pointer-events-none" style={{ mixBlendMode: 'multiply' }}>
        <img src="/assets/vendor/straight_leaves.png" alt="leaves top" className="w-full h-full object-cover scale-x-125 origin-top" />
      </div>

      <div className="absolute bottom-0 left-0 w-full h-40 opacity-90 pointer-events-none rotate-180 -mb-16" style={{ mixBlendMode: 'multiply' }}>
        <img src="/assets/vendor/straight_leaves.png" alt="leaves bottom" className="w-full h-full object-cover scale-x-125 origin-top" />
      </div>

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        <div className="mb-2 text-center mt-8">
          <h2 className="text-[#5D3E3E] text-4xl font-normal mb-1" style={{ fontFamily: '"Great Vibes", cursive' }}>Forgot Password</h2>
          <p className="text-[#5D3E3E]/80 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ fontFamily: '"Outfit", sans-serif' }}>
            Recover access to your wedding account
          </p>
          <div className="mt-2 flex justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#5D3E3E">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-3 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl mt-4">
          {error && (
            <div className="w-full bg-red-100 border border-red-200 text-red-600 rounded-xl py-2.5 px-3 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {message && (
            <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl py-3 px-3 text-xs text-center space-y-2">
              <p className="font-semibold">{message}</p>
              {resetToken && (
                <div className="pt-2 border-t border-emerald-200">
                  <p className="text-[11px] text-gray-500 mb-2">Development Reset Token Generated:</p>
                  <button
                    type="button"
                    onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                    className="w-full bg-[#5D3E3E] text-white py-2 rounded-xl font-bold text-xs hover:bg-[#4A3232] transition-colors"
                  >
                    Proceed with Reset Token &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[#5D3E3E] text-xs font-bold pl-1" style={{ fontFamily: '"Playfair Display", serif' }}>
              Registered Email Address:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-[#5D3E3E] text-sm font-semibold focus:ring-2 focus:ring-[#5D3E3E]/20 focus:outline-none transition-all"
              placeholder="e.g. bride@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full bg-[#5D3E3E] py-3.5 rounded-xl text-white font-bold text-xs tracking-[0.15em] shadow-lg hover:bg-[#4A3232] disabled:opacity-50 transition-colors uppercase mt-2 flex items-center justify-center gap-2"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending Instructions...</span>
              </>
            ) : (
              <span>Request Reset Instructions</span>
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2">
          <Link
            to="/login"
            className="text-[#5D3E3E] text-xs font-bold uppercase tracking-widest border-b border-[#5D3E3E]/40 pb-0.5 hover:text-[#4A3232]"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            &larr; Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
