import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Shown instead of account-only content (saved vendors, ...) while browsing as a guest.
 */
const LoginRequired = ({ title = 'You are not logged in', message = 'Please log in or sign up to use this feature.' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 min-h-[50vh]">
      <div className="w-16 h-16 rounded-full bg-[#FAF0F2] border border-[#EACED5] flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-[#8E445E]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 11V8a4 4 0 10-8 0v3M6 11h12a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1v-7a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-[#4F1325] mb-1">{title}</h2>
      <p className="text-sm text-stone-600 max-w-xs mb-5">{message}</p>
      <button
        onClick={() => navigate('/login', { state: { from: location.pathname } })}
        className="px-6 py-2.5 rounded-full bg-[#4F1325] text-white text-sm font-semibold active:scale-95 transition-transform"
      >
        Log in
      </button>
    </div>
  );
};

export default LoginRequired;
