import React, { useEffect, useState } from 'react';

const VendorSplashScreen = ({ onComplete }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash screen for 3500ms, then trigger fade-out
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 3500);

    // After 4100ms (fade-out completes), remove splash screen entirely
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 w-full h-full z-[99999] flex flex-col items-center justify-between py-14 px-6 overflow-hidden select-none transition-opacity duration-600 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, #1E0F35 0%, #0A0415 100%)',
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      {/* CSS Animations style tag */}
      <style>{`
        @keyframes scale-up-emblem {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fade-in-name {
          0% {
            opacity: 0;
            letter-spacing: 0.1em;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            letter-spacing: 0.22em;
            transform: translateY(0);
          }
        }
        @keyframes slide-up-sub {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 0.85;
            transform: translateY(0);
          }
        }
        @keyframes pulse-radial-glow {
          0%, 100% {
            filter: drop-shadow(0 0 15px rgba(139,92,246,0.22));
          }
          50% {
            filter: drop-shadow(0 0 35px rgba(167,139,250,0.45));
          }
        }
        @keyframes purple-wave-flow {
          0%, 100% {
            transform: translateY(0) scaleY(1);
            opacity: 0.25;
          }
          50% {
            transform: translateY(-3px) scaleY(1.03);
            opacity: 0.45;
          }
        }
        .animate-emblem {
          animation: scale-up-emblem 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-brand-name {
          animation: fade-in-name 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
        .animate-subtitle {
          animation: slide-up-sub 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.7s;
          opacity: 0;
        }
        .animate-wave-slow {
          animation: purple-wave-flow 6s ease-in-out infinite;
        }
      `}</style>

      {/* Dynamic Purple/White Particle Dust rising subtly in the background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(30)].map((_, i) => {
          const size = Math.random() * 2.5 + 0.8;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const delay = Math.random() * 3;
          const duration = Math.random() * 4 + 3;

          return (
            <div
              key={i}
              className="absolute rounded-full bg-purple-400/40 blur-[0.3px] animate-pulse"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              }}
            />
          );
        })}
      </div>

      {/* Floating Purple Wave/Track at the bottom (mocking the second image waves in purple) */}
      <div className="absolute bottom-16 left-0 right-0 h-28 pointer-events-none z-0 opacity-30 animate-wave-slow">
        <svg className="w-full h-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path
            d="M0,80 C360,130 720,30 1080,90 C1260,110 1380,105 1440,95 L1440,120 L0,120 Z"
            fill="url(#purple-wave-grad)"
          />
          <path
            d="M0,80 C360,130 720,30 1080,90 C1260,110 1380,105 1440,95"
            stroke="url(#purple-line-grad)"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient id="purple-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="purple-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Spacer to align center vertically */}
      <div className="w-full h-12" />

      {/* Center content container (Crown, Emblem, Brand, Subtitle) */}
      <div className="flex flex-col items-center justify-center text-center max-w-sm z-10">
        
        {/* Majestic Glowing Circular Crown Emblem */}
        <div className="animate-emblem w-52 h-52 sm:w-56 sm:h-56">
          <svg
            className="w-full h-full"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ animation: 'pulse-radial-glow 4s ease-in-out infinite' }}
          >
            <defs>
              <radialGradient id="purple-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="purple-emblem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FAF5FF" />
                <stop offset="35%" stopColor="#D8B4FE" />
                <stop offset="70%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            
            {/* Background Radial Purple Light */}
            <circle cx="100" cy="105" r="90" fill="url(#purple-glow)" />

            {/* Detailed Royal Purple Crown */}
            <g transform="translate(0, 3)">
              {/* Crown Base Band */}
              <path d="M 83 74 Q 100 76.5 117 74 L 116 71.5 Q 100 74 84 71.5 Z" fill="url(#purple-emblem-grad)" />
              {/* Main Crown Body with Points */}
              <path d="M 83 71.5 C 80 62 77 56 77 56 L 85 65 L 100 46 L 115 65 L 123 56 C 123 56 120 62 117 71.5 Q 100 74 83 71.5 Z" fill="url(#purple-emblem-grad)" />
              {/* Pearls on crown tips */}
              <circle cx="77" cy="54" r="2.2" fill="#FAF5FF" />
              <circle cx="100" cy="44" r="3" fill="#FAF5FF" />
              <circle cx="123" cy="54" r="2.2" fill="#FAF5FF" />
              {/* Inner jewels */}
              <circle cx="100" cy="62" r="1.5" fill="#D8B4FE" />
              <circle cx="89" cy="67" r="1.2" fill="#D8B4FE" />
              <circle cx="111" cy="67" r="1.2" fill="#D8B4FE" />
            </g>

            {/* Central Double Border Circles */}
            <circle cx="100" cy="110" r="35" stroke="url(#purple-emblem-grad)" strokeWidth="3" />
            <circle cx="100" cy="110" r="30" stroke="url(#purple-emblem-grad)" strokeWidth="0.8" strokeDasharray="3 2" />

            {/* Elegant letter U inside circular borders */}
            <text
              x="100"
              y="124.5"
              fontFamily="'Playfair Display', 'Georgia', serif"
              fontSize="42"
              fontWeight="900"
              fill="url(#purple-emblem-grad)"
              textAnchor="middle"
            >
              U
            </text>

            {/* Left flourish scroll ornament (Matches mockup perfectly) */}
            <path
              d="M58 110 C46 110 42 124 52 128 C60 130 64 122 58 116 C56 114 52 114 50 116 M54 102 C40 102 34 114 44 122 M58 94 C48 86 38 100 48 110"
              stroke="url(#purple-emblem-grad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Right flourish scroll ornament (Matches mockup perfectly) */}
            <path
              d="M142 110 C154 110 158 124 148 128 C140 130 136 122 142 116 C144 114 148 114 150 116 M146 102 C160 102 166 114 156 122 M142 94 C152 86 162 100 152 110"
              stroke="url(#purple-emblem-grad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Bottom Point diamond decoration */}
            <path d="M100 153 L103 156.5 L100 160 L97 156.5 Z" fill="url(#purple-emblem-grad)" />

          </svg>
        </div>

        {/* Brand Name "UTSAVO" */}
        <h1
          className="text-4xl sm:text-5xl font-black uppercase tracking-[0.22em] mt-7 pl-[0.22em] animate-brand-name text-center"
          style={{
            fontFamily: "'Playfair Display', serif",
            background: 'linear-gradient(135deg, #FAF5FF 0%, #D8B4FE 50%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))'
          }}
        >
          UTSAVO
        </h1>

        {/* Separator line with small center dot */}
        <div className="flex items-center justify-center w-36 my-4 opacity-50">
          <div className="h-[0.5px] w-full bg-purple-400/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mx-2 flex-shrink-0" />
          <div className="h-[0.5px] w-full bg-purple-400/50" />
        </div>

        {/* Subtitle */}
        <p
          className="text-[12.5px] sm:text-[13px] font-semibold text-white/90 tracking-wider animate-subtitle leading-relaxed max-w-[270px]"
        >
          India's Smart Event <br />
          Vendor Ecosystem
        </p>

      </div>

      {/* Bottom Loading Indicator & Connecting text */}
      <div className="flex flex-col items-center justify-center gap-3.5 z-10 pb-4">
        
        {/* Purple Circular Spinner (Replicating the loader in the second image in purple) */}
        <div className="h-6.5 w-6.5 rounded-full border-[2.2px] border-purple-500/20 border-t-purple-400 animate-spin" />

        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-purple-300/80 leading-none">
          Connecting Vendors...
        </p>
      </div>

    </div>
  );
};

export default VendorSplashScreen;
