import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { userApi } from '../../../services/userApi';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Great+Vibes&family=Outfit:wght@300;400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/\d/.test(pwd)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Password reset token is required');
      return;
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await userApi.resetPassword(token.trim(), newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link or token may have expired.');
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
          <h2 className="text-[#5D3E3E] text-4xl font-normal mb-1" style={{ fontFamily: '"Great Vibes", cursive' }}>Reset Password</h2>
          <p className="text-[#5D3E3E]/80 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ fontFamily: '"Outfit", sans-serif' }}>
            Set a new secure password
          </p>
          <div className="mt-2 flex justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#5D3E3E">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
          </div>
        </div>

        <div className="w-full bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl mt-4">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#5D3E3E]">Password Reset Complete!</h3>
              <p className="text-xs text-gray-600">
                Your password has been successfully updated. You can now log in with your new credentials.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full bg-[#5D3E3E] py-3.5 rounded-xl text-white font-bold text-xs tracking-[0.15em] shadow-lg hover:bg-[#4A3232] transition-colors uppercase"
                style={{ fontFamily: '"Outfit", sans-serif' }}
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="w-full bg-red-100 border border-red-200 text-red-600 rounded-xl py-2.5 px-3 text-xs font-semibold text-center">
                  {error}
                </div>
              )}

              {!tokenFromUrl && (
                <div className="space-y-1">
                  <label className="text-[#5D3E3E] text-xs font-bold pl-1" style={{ fontFamily: '"Playfair Display", serif' }}>
                    Reset Token:
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-[#5D3E3E] text-xs font-mono focus:ring-2 focus:ring-[#5D3E3E]/20 focus:outline-none transition-all"
                    placeholder="Paste your reset token here"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[#5D3E3E] text-xs font-bold pl-1" style={{ fontFamily: '"Playfair Display", serif' }}>
                  New Password:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 pr-10 text-[#5D3E3E] text-sm font-semibold focus:ring-2 focus:ring-[#5D3E3E]/20 focus:outline-none transition-all"
                    placeholder="Min. 8 chars, 1 uppercase, 1 digit"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#5D3E3E] text-xs font-bold pl-1" style={{ fontFamily: '"Playfair Display", serif' }}>
                  Confirm New Password:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-[#5D3E3E] text-sm font-semibold focus:ring-2 focus:ring-[#5D3E3E]/20 focus:outline-none transition-all"
                  placeholder="Re-type new password"
                  required
                />
              </div>

              <p className="text-[10px] text-gray-500 pt-1">
                Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.
              </p>

              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full bg-[#5D3E3E] py-3.5 rounded-xl text-white font-bold text-xs tracking-[0.15em] shadow-lg hover:bg-[#4A3232] disabled:opacity-50 transition-colors uppercase mt-2 flex items-center justify-center gap-2"
                style={{ fontFamily: '"Outfit", sans-serif' }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}
        </div>

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

export default ResetPassword;
