import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  PartyPopper
} from 'lucide-react';

const VendorSubmittedOnboarding = () => {
  const navigate = useNavigate();

  const handleDashboard = () => {
    navigate('/vendor/dashboard');
  };

  return (
    <div
      className="w-full min-h-[100dvh] sm:max-w-md sm:mx-auto flex flex-col bg-white"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@1,700&display=swap');
      `}</style>

      {/* HEADER BLOCK */}
      <div className="flex-shrink-0 px-4 pt-3 pb-0 select-none">
        
        {/* Logo */}
        <div
          className="flex items-center justify-center gap-1.5 cursor-pointer group mb-2"
          onClick={() => window.location.href = '/'}
        >
          <img
            src="/assets/vendor/logo_theme.png"
            alt="Utsavo"
            className="h-7 w-auto rounded-md shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
          <div className="flex flex-col leading-none">
            <span
              className="text-base font-black italic tracking-tight bg-clip-text text-transparent"
              style={{
                fontFamily: "'Playfair Display', serif",
                backgroundImage: 'linear-gradient(135deg, #7c3aed, #5b21b6)'
              }}
            >Utsavo</span>
            <span className="text-[6.5px] font-black uppercase tracking-[0.22em] text-rose-800/70">
              Elite Wedding Network
            </span>
          </div>
        </div>

        {/* Header Title spacing */}
        <div className="flex items-center justify-center py-2 mb-1">
          <p className="text-[13.5px] font-extrabold text-slate-800 tracking-tight">
            Vendor Onboarding
          </p>
        </div>

        {/* Step circles — same style as VendorRegister.jsx */}
        <div className="relative flex items-center justify-between w-full max-w-[260px] mx-auto mb-3 select-none">
          {/* connector line */}
          <div className="absolute top-1/2 left-3 right-3 h-[1px] bg-slate-200 -translate-y-1/2 z-0" />
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isActive    = num === 7;
            const isCompleted = num < 7;
            return (
              <div key={num} className="relative z-10">
                <div
                  className={`h-[26px] w-[26px] rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#4F35C3] text-white shadow-md ring-4 ring-[#4F35C3]/15 scale-110'
                      : isCompleted
                        ? 'bg-[#EDE9FE] text-[#4F35C3] border border-[#C4B5FD]'
                        : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  ) : (
                    num
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className="flex-1 flex flex-col px-4 pb-6 justify-center gap-6 animate-in fade-in duration-300">
        
        {/* Animated Celebration Icon & Checkmark Badge */}
        <div className="flex flex-col items-center justify-center relative py-4">
          <div className="relative">
            {/* Confetti Background */}
            <div className="absolute -inset-8 flex items-center justify-center pointer-events-none opacity-85 scale-110">
              <PartyPopper className="w-24 h-24 text-violet-400/40 animate-pulse" />
            </div>
            {/* Circular Green Checkmark badge */}
            <div className="relative w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center shadow-md animate-in zoom-in duration-500">
              <Check className="w-10 h-10 text-emerald-600" strokeWidth={3.5} />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center px-4 space-y-2">
          <h2 className="text-[20px] font-black text-slate-900 tracking-tight leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Registration Submitted!
          </h2>
          <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
            Thank you for registering with us. Our team will review your details and get back to you soon.
          </p>
        </div>

        {/* "What's Next" Info Box */}
        <div className="rounded-[20px] border border-slate-100 bg-[#F9F8FF] p-5 shadow-sm max-w-sm mx-auto w-full">
          <h4 className="text-[12px] font-extrabold text-slate-800 tracking-tight mb-3">
            What's Next?
          </h4>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5 text-[11px] text-slate-600 font-medium leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F35C3] mt-1.5 flex-shrink-0" />
              <span>Your profile will be reviewed</span>
            </li>
            <li className="flex items-start gap-2.5 text-[11px] text-slate-600 font-medium leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F35C3] mt-1.5 flex-shrink-0" />
              <span>You will get a notification</span>
            </li>
            <li className="flex items-start gap-2.5 text-[11px] text-slate-600 font-medium leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F35C3] mt-1.5 flex-shrink-0" />
              <span>Once approved, you can log in and start receiving bookings</span>
            </li>
          </ul>
        </div>

        {/* Go to Dashboard Action Button */}
        <div className="mt-auto max-w-md mx-auto w-full px-0.5 pt-4">
          <button
            type="button"
            onClick={handleDashboard}
            className="w-full rounded-xl py-3.5 text-[13.5px] font-extrabold text-white bg-[#4F35C3] shadow-md hover:shadow-[0_4px_16px_rgba(79,53,195,0.25)] hover:brightness-105 active:scale-[0.98] transition-all duration-300"
          >
            Go to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default VendorSubmittedOnboarding;
