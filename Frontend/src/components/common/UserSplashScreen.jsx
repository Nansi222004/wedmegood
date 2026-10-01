import React, { useEffect, useState, useCallback, useMemo } from 'react';

/**
 * UserSplashScreen - Celebrative Utsavo Splash Screen
 * Featuring:
 * 1. Letter-by-letter rebuilding of "UTSAVO" with color-matched bounce & sparkle pops
 * 2. Dramatic, beautiful bloom of the 24 rainbow celebration arch dots
 * 3. Tagline unfolding with animated accent lines & dots
 * 4. 100% laser-straight alignment (zero tilt)
 */

// Precise dot data extracted from the Utsavo logo
const RAINBOW_DOTS = [
  // Outer Arch (12 dots from left to right)
  { id: 'o-1', relX: 103, relY: 254, r: 26, isOuter: true, hex: '#e83c81', order: 0 },
  { id: 'o-2', relX: 125, relY: 188, r: 28, isOuter: true, hex: '#bb3d98', order: 1 },
  { id: 'o-3', relX: 163, relY: 126, r: 29, isOuter: true, hex: '#8b41a0', order: 2 },
  { id: 'o-4', relX: 220, relY: 77,  r: 28, isOuter: true, hex: '#542dca', order: 3 },
  { id: 'o-5', relX: 285, relY: 45,  r: 29, isOuter: true, hex: '#1587d6', order: 4 },
  { id: 'o-6', relX: 352, relY: 32,  r: 29, isOuter: true, hex: '#20b7d8', order: 5 },
  { id: 'o-7', relX: 425, relY: 34,  r: 28, isOuter: true, hex: '#32b094', order: 6 },
  { id: 'o-8', relX: 495, relY: 55,  r: 29, isOuter: true, hex: '#9eb440', order: 7 },
  { id: 'o-9', relX: 557, relY: 92,  r: 28, isOuter: true, hex: '#fbc52a', order: 8 },
  { id: 'o-10', relX: 606, relY: 143, r: 28, isOuter: true, hex: '#f7a129', order: 9 },
  { id: 'o-11', relX: 639, relY: 202, r: 27, isOuter: true, hex: '#f06f39', order: 10 },
  { id: 'o-12', relX: 658, relY: 259, r: 23, isOuter: true, hex: '#eb4a3e', order: 11 },

  // Inner Arch (12 dots from left to right)
  { id: 'i-1', relX: 176, relY: 259, r: 18, isOuter: false, hex: '#c94098', order: 0 },
  { id: 'i-2', relX: 192, relY: 210, r: 18, isOuter: false, hex: '#bb439b', order: 1 },
  { id: 'i-3', relX: 222, relY: 166, r: 18, isOuter: false, hex: '#824aac', order: 2 },
  { id: 'i-4', relX: 262, relY: 132, r: 17, isOuter: false, hex: '#5c34cb', order: 3 },
  { id: 'i-5', relX: 308, relY: 110, r: 18, isOuter: false, hex: '#1f8ff0', order: 4 },
  { id: 'i-6', relX: 358, relY: 101, r: 18, isOuter: false, hex: '#2bbbdb', order: 5 },
  { id: 'i-7', relX: 408, relY: 101, r: 18, isOuter: false, hex: '#3ab092', order: 6 },
  { id: 'i-8', relX: 458, relY: 118, r: 18, isOuter: false, hex: '#bfbe26', order: 7 },
  { id: 'i-9', relX: 501, relY: 146, r: 18, isOuter: false, hex: '#fbca34', order: 8 },
  { id: 'i-10', relX: 535, relY: 180, r: 18, isOuter: false, hex: '#f7ad32', order: 9 },
  { id: 'i-11', relX: 560, relY: 218, r: 18, isOuter: false, hex: '#f1893b', order: 10 },
  { id: 'i-12', relX: 577, relY: 259, r: 17, isOuter: false, hex: '#ea5143', order: 11 }
];

// Exact letter bounding boxes in the 764 x 483 container
const LETTERS = [
  { char: 'U', src: '/letter_u.png', left: 0,   top: 296, width: 117, height: 139, color: '#e81c6e', delay: 0.10 },
  { char: 'T', src: '/letter_t.png', left: 126, top: 296, width: 118, height: 139, color: '#6e37a6', delay: 0.28 },
  { char: 'S', src: '/letter_s.png', left: 247, top: 296, width: 104, height: 139, color: '#0276d7', delay: 0.46 },
  { char: 'A', src: '/letter_a.png', left: 354, top: 296, width: 151, height: 139, color: '#00a887', delay: 0.64 },
  { char: 'V', src: '/letter_v.png', left: 480, top: 296, width: 141, height: 139, color: '#f58220', delay: 0.82 },
  { char: 'O', src: '/letter_o.png', left: 623, top: 296, width: 141, height: 139, color: '#eb4d3d', delay: 1.00 }
];

const UserSplashScreen = ({ onComplete }) => {
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDismiss = useCallback(() => {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      if (typeof onComplete === 'function') onComplete();
    }, 450);
  }, [fading, onComplete]);

  // Handle keyboard Escape or Space to skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDismiss]);

  // Total duration: 3.2s
  useEffect(() => {
    const startTime = Date.now();
    const duration = 3200;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(currentProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [handleDismiss]);

  // Ambient vertical floating sparkles (zero rotation, perfectly straight)
  const sparkles = useMemo(() => {
    const colors = ['#EC1A67', '#6E37A6', '#0276D7', '#00A887', '#F58220', '#EB4D3D', '#FFD166'];
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: (i * 39 + 7) % 94 + 3,
      y: (i * 27 + 11) % 90 + 5,
      size: (i % 3 === 0 ? 4 : 2.5) + (i % 2) * 1.5,
      color: colors[i % colors.length],
      duration: 2.8 + (i % 3) * 0.9,
      delay: (i % 6) * 0.35
    }));
  }, []);

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 w-full h-full z-[99999] flex flex-col items-center justify-between py-6 sm:py-10 px-4 sm:px-6 overflow-hidden select-none cursor-pointer transition-all duration-500 ease-out ${
        fading ? 'opacity-0 scale-[1.01] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 38%, #FFFFFF 0%, #FFFDF8 38%, #FDF7ED 70%, #F5EDE0 100%)',
        fontFamily: "'Plus Jakarta Sans', 'Poppins', sans-serif"
      }}
    >
      {/* Styles for Letter-by-Letter and Rainbow Dot Animations */}
      <style>{`
        /* Letter assembling animation */
        @keyframes letter-assemble {
          0% {
            opacity: 0;
            transform: translateY(28px) scale(0.65);
          }
          60% {
            opacity: 1;
            transform: translateY(-6px) scale(1.08);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }

        /* Rainbow dot elastic pop-out */
        @keyframes dot-bloom {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          65% {
            opacity: 1;
            transform: scale(1.4);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Tagline expansion */
        @keyframes tagline-reveal {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }

        /* Left accent line extension */
        @keyframes line-expand-left {
          0% {
            transform: scaleX(0);
            transform-origin: right;
            opacity: 0;
          }
          100% {
            transform: scaleX(1);
            transform-origin: right;
            opacity: 1;
          }
        }

        /* Right accent line extension */
        @keyframes line-expand-right {
          0% {
            transform: scaleX(0);
            transform-origin: left;
            opacity: 0;
          }
          100% {
            transform: scaleX(1);
            transform-origin: left;
            opacity: 1;
          }
        }

        /* Ambient subtle pulse behind whole logo */
        @keyframes celebrative-halo {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.75;
            transform: scale(1.05);
          }
        }

        /* Light sweep across finished logo */
        @keyframes gleam-pass {
          0% {
            transform: translateX(-150%) skewX(-20deg);
          }
          100% {
            transform: translateX(250%) skewX(-20deg);
          }
        }

        /* Twinkle vertical sparkle */
        @keyframes sparkle-float {
          0%, 100% {
            opacity: 0.2;
            transform: translateY(0px) scale(0.8);
          }
          50% {
            opacity: 0.95;
            transform: translateY(-8px) scale(1.2);
          }
        }
      `}</style>

      {/* 1. Auspicious Festive Celebration Mandala Watermark (Slow, Subtle Background) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <svg
          className="w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] opacity-[0.035] text-amber-900"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        >
          <circle cx="100" cy="100" r="92" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="76" />
          <circle cx="100" cy="100" r="54" strokeDasharray="4 2" />
          <circle cx="100" cy="100" r="34" />
          <circle cx="100" cy="100" r="16" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 100 100)`}>
              <path d="M 100 24 C 108 50, 108 72, 100 84 C 92 72, 92 50, 100 24 Z" fill="currentColor" fillOpacity="0.08" />
              <circle cx="100" cy="20" r="2.5" fill="currentColor" />
            </g>
          ))}
        </svg>
      </div>

      {/* 2. Floating Festive Sparkles (Strictly Vertical Drift, No Tilt) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {sparkles.map((s) => (
          <div
            key={s.id}
            className="absolute"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              animation: `sparkle-float ${s.duration}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`
            }}
          >
            {s.size > 3.5 ? (
              <svg width={s.size * 3} height={s.size * 3} viewBox="0 0 24 24" fill={s.color} style={{ filter: `drop-shadow(0 0 4px ${s.color})` }}>
                <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
              </svg>
            ) : (
              <div
                className="rounded-full"
                style={{
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  backgroundColor: s.color,
                  boxShadow: `0 0 8px ${s.color}`
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 3. Top Bar: Welcome Pill & Skip Button */}
      <div className="w-full max-w-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-amber-200/60 shadow-[0_2px_12px_rgba(245,158,11,0.08)]">
          <span className="text-xs">✨</span>
          <span className="text-[11px] font-semibold text-stone-700 tracking-wide">
            Welcome to Celebrations
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white active:scale-95 transition-all duration-200 border border-stone-200/80 shadow-sm hover:shadow text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          <span className="text-[11px] font-semibold tracking-wider uppercase">Skip</span>
          <svg className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 4. Center Stage: Rebuilding Logo Container (Completely Straight, No Rotation) */}
      <div className="flex flex-col items-center justify-center text-center max-w-lg w-full z-10 my-auto px-2">
        
        {/* Soft Radial Ambient Aura Behind Logo */}
        <div className="relative flex items-center justify-center w-full">
          <div
            className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(254, 215, 170, 0.45) 0%, rgba(251, 146, 60, 0.16) 40%, rgba(236, 72, 153, 0.08) 65%, transparent 75%)',
              animation: 'celebrative-halo 4s ease-in-out infinite',
              filter: 'blur(22px)'
            }}
          />

          {/* Master Responsive Logo Artboard: 764 x 483 */}
          <div className="relative w-full max-w-[340px] sm:max-w-[420px] md:max-w-[460px] aspect-[764/483]">
            
            {/* ============================================================== */}
            {/* STEP 2: RAINBOW ARCH DOTS (Burst out after letters are built) */}
            {/* ============================================================== */}
            <svg
              viewBox="0 0 764 483"
              className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
            >
              {RAINBOW_DOTS.map((dot) => {
                // Calculate delay: starts at 1.15s, blooms outward from top or sweeps left-to-right
                // Let's create an energetic rainbow bloom sweeping from apex outwards:
                const apexDist = Math.abs(dot.relX - 382) / 300;
                const dotDelay = 1.15 + apexDist * 0.35 + (dot.isOuter ? 0 : 0.06);

                return (
                  <circle
                    key={dot.id}
                    cx={dot.relX}
                    cy={dot.relY}
                    r={dot.r}
                    fill={dot.hex}
                    style={{
                      transformOrigin: `${dot.relX}px ${dot.relY}px`,
                      animation: `dot-bloom 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                      animationDelay: `${dotDelay}s`,
                      opacity: 0,
                      filter: `drop-shadow(0 2px 8px ${dot.hex}66)`
                    }}
                  />
                );
              })}
            </svg>

            {/* High-Fidelity Rainbow Arch Layer (Fades in smoothly to seal the perfection) */}
            <img
              src="/utsavo_rainbow_arch.png"
              alt="Utsavo Rainbow Arch"
              className="absolute left-0 top-0 w-full h-[60.2%] object-contain pointer-events-none z-15"
              style={{
                animation: 'tagline-reveal 0.6s ease-out forwards',
                animationDelay: '1.55s',
                opacity: 0
              }}
            />

            {/* ============================================================== */}
            {/* STEP 1: LETTERS REBUILDING ONE BY ONE ("U", "T", "S", "A", "V", "O") */}
            {/* ============================================================== */}
            <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
              {LETTERS.map((letter) => {
                const leftPercent = (letter.left / 764) * 100;
                const topPercent = (letter.top / 483) * 100;
                const widthPercent = (letter.width / 764) * 100;
                const heightPercent = (letter.height / 483) * 100;

                return (
                  <div
                    key={letter.char}
                    className="absolute"
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                      animation: `letter-assemble 0.7s cubic-bezier(0.25, 1.35, 0.5, 1) forwards`,
                      animationDelay: `${letter.delay}s`,
                      opacity: 0,
                      transformOrigin: '50% 100%'
                    }}
                  >
                    <img
                      src={letter.src}
                      alt={letter.char}
                      className="w-full h-full object-contain"
                      style={{
                        filter: `drop-shadow(0 4px 10px ${letter.color}35)`
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* ============================================================== */}
            {/* STEP 3: TAGLINE ("CELEBRATE EVERY MOMENT" with Accent Lines)  */}
            {/* ============================================================== */}
            <div
              className="absolute left-0 top-[93.5%] w-full h-[6%] pointer-events-none z-25 flex items-center justify-between"
              style={{
                animation: 'tagline-reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                animationDelay: '1.65s',
                opacity: 0
              }}
            >
              <img
                src="/utsavo_tagline.png"
                alt="Celebrate Every Moment"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Step 4: Light sweep shimmer across the completed logo */}
            <div
              className="absolute inset-0 pointer-events-none z-30 opacity-40 overflow-hidden"
              style={{
                maskImage: 'url(/utsavo_logo_transparent.png)',
                WebkitMaskImage: 'url(/utsavo_logo_transparent.png)',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center'
              }}
            >
              <div
                className="w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent"
                style={{
                  animation: 'gleam-pass 2.4s ease-in-out infinite',
                  animationDelay: '1.9s'
                }}
              />
            </div>

          </div>
        </div>

        {/* Celebrative Golden Sub-Badge */}
        <div
          className="mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-teal-500/10 border border-amber-300/40 backdrop-blur-sm shadow-[0_2px_12px_rgba(245,158,11,0.08)]"
          style={{
            animation: 'tagline-reveal 0.6s ease-out forwards',
            animationDelay: '1.85s',
            opacity: 0
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-[11.5px] sm:text-[12.5px] font-bold tracking-[0.16em] uppercase bg-gradient-to-r from-rose-600 via-purple-700 to-amber-600 bg-clip-text text-transparent">
            India's Celebration Platform
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        </div>

        {/* Category Pills */}
        <p
          className="mt-2.5 text-[11.5px] sm:text-[12.5px] font-medium text-stone-600/90 tracking-wide"
          style={{
            animation: 'tagline-reveal 0.6s ease-out forwards',
            animationDelay: '2.0s',
            opacity: 0
          }}
        >
          Weddings • Venues • Photography • Decor • Styling
        </p>

      </div>

      {/* 5. Bottom Loading Indicator & Celebrative Progress */}
      <div className="flex flex-col items-center justify-center gap-2.5 w-full max-w-xs z-10 pb-2">
        {/* Rainbow Progress Track */}
        <div className="w-full h-1.5 bg-stone-200/70 rounded-full overflow-hidden shadow-inner p-[1px]">
          <div
            className="h-full rounded-full transition-all duration-75 ease-out shadow-sm"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #EC1A67 0%, #6E37A6 20%, #0276D7 40%, #00A887 60%, #F58220 80%, #EB4D3D 100%)',
              boxShadow: '0 0 8px rgba(236, 26, 103, 0.45)'
            }}
          />
        </div>

        {/* Dynamic Status Text */}
        <div className="flex items-center gap-2 text-stone-500">
          <div className="w-2 h-2 rounded-full border border-amber-400 border-t-rose-500 animate-spin" />
          <span className="text-[11px] font-medium tracking-wide text-stone-600">
            {progress < 35
              ? 'Assembling celebrations...'
              : progress < 70
              ? 'Illuminating rainbow moments...'
              : 'Opening your celebration experience...'}
          </span>
        </div>

        <p className="text-[9.5px] text-stone-400/80 tracking-widest uppercase mt-0.5">
          Tap anywhere to continue
        </p>
      </div>

    </div>
  );
};

export default UserSplashScreen;
