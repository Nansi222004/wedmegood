import React, { useEffect, useState, useCallback, useMemo } from 'react';

/**
 * UserSplashScreen - Celebrative Utsavo Splash Screen
 * Featuring:
 * 1. Letter-by-letter rebuilding of "UTSAVO" with color-matched bounce & sparkle pops
 * 2. Dramatic, beautiful bloom of the rainbow celebration arch leaves & dots
 * 3. Tagline unfolding with animated accent lines & dots
 * 4. 100% laser-straight alignment (zero tilt)
 */

// Logo artboard (px of the source artwork) that every layer below is positioned in
const ART_W = 1181;
const ART_H = 797;
const ARCH_H = 500; // rainbow arch band height
const TAGLINE_TOP = 754;
const TAGLINE_H = 40;

// Each leaf and dot of the rainbow celebration arch, cut from /utsavo_arch_pieces.png
// (a 1024 x 574 sprite atlas): x/y/w/h place it on the artboard, ax/ay locate it in
// the atlas, cx/cy is its visual centre (bloom origin).
const ARCH_ATLAS_W = 1024;
const ARCH_ATLAS_H = 574;
const ARCH_PIECES = [
  { id: 1, x: 58, y: 441, w: 51, h: 50, ax: 887, ay: 389, cx: 82, cy: 466, isOuter: false, hex: '#fb8a63' },
  { id: 2, x: 87, y: 284, w: 41, h: 38, ax: 375, ay: 526, cx: 107, cy: 303, isOuter: false, hex: '#f979a2' },
  { id: 3, x: 43, y: 285, w: 293, h: 154, ax: 220, ay: 220, cx: 161, cy: 355, isOuter: true, hex: '#e964b4' },
  { id: 4, x: 142, y: 237, w: 48, h: 47, ax: 942, ay: 389, cx: 165, cy: 260, isOuter: false, hex: '#8457bc' },
  { id: 5, x: 110, y: 323, w: 175, h: 176, ax: 366, ay: 4, cx: 185, cy: 439, isOuter: true, hex: '#fcab51' },
  { id: 6, x: 160, y: 180, w: 221, h: 133, ax: 4, ay: 389, cx: 267, cy: 234, isOuter: true, hex: '#66baeb' },
  { id: 7, x: 248, y: 347, w: 41, h: 74, ax: 569, ay: 389, cx: 268, cy: 389, isOuter: false, hex: '#a2e2d4' },
  { id: 8, x: 254, y: 134, w: 40, h: 40, ax: 244, ay: 526, cx: 273, cy: 153, isOuter: false, hex: '#f660a9' },
  { id: 9, x: 294, y: 306, w: 46, h: 44, ax: 4, ay: 526, cx: 316, cy: 327, isOuter: false, hex: '#5cb4e1' },
  { id: 10, x: 306, y: 126, w: 120, h: 193, ax: 118, ay: 4, cx: 372, cy: 199, isOuter: true, hex: '#79dcc9' },
  { id: 11, x: 431, y: 211, w: 54, h: 57, ax: 663, ay: 389, cx: 455, cy: 238, isOuter: false, hex: '#aae2c5' },
  { id: 12, x: 442, y: 56, w: 39, h: 39, ax: 288, ay: 526, cx: 462, cy: 75, isOuter: false, hex: '#f879b9' },
  { id: 13, x: 376, y: 88, w: 212, h: 165, ax: 4, ay: 220, cx: 481, cy: 160, isOuter: true, hex: '#f783b0' },
  { id: 14, x: 493, y: 215, w: 42, h: 41, ax: 154, ay: 526, cx: 513, cy: 235, isOuter: false, hex: '#fcc960' },
  { id: 15, x: 496, y: 61, w: 52, h: 90, ax: 513, ay: 389, cx: 516, cy: 103, isOuter: false, hex: '#f78ba5' },
  { id: 16, x: 534, y: 5, w: 110, h: 212, ax: 4, ay: 4, cx: 589, cy: 99, isOuter: true, hex: '#fdcc63' },
  { id: 17, x: 630, y: 60, w: 56, h: 91, ax: 453, ay: 389, cx: 662, cy: 104, isOuter: false, hex: '#f8d879' },
  { id: 18, x: 645, y: 215, w: 40, h: 41, ax: 200, ay: 526, cx: 665, cy: 235, isOuter: false, hex: '#eca580' },
  { id: 19, x: 588, y: 87, w: 214, h: 167, ax: 726, ay: 4, cx: 697, cy: 160, isOuter: true, hex: '#97d584' },
  { id: 20, x: 697, y: 57, w: 40, h: 39, ax: 331, ay: 526, cx: 718, cy: 76, isOuter: false, hex: '#b4d977' },
  { id: 21, x: 694, y: 213, w: 53, h: 56, ax: 721, ay: 389, cx: 723, cy: 238, isOuter: false, hex: '#f0c191' },
  { id: 22, x: 753, y: 125, w: 120, h: 192, ax: 242, ay: 4, cx: 806, cy: 199, isOuter: true, hex: '#8fe2cf' },
  { id: 23, x: 839, y: 305, w: 47, h: 44, ax: 54, ay: 526, cx: 862, cy: 327, isOuter: false, hex: '#fb9560' },
  { id: 24, x: 882, y: 134, w: 45, h: 41, ax: 105, ay: 526, cx: 904, cy: 153, isOuter: false, hex: '#59c9b0' },
  { id: 25, x: 887, y: 348, w: 45, h: 74, ax: 614, ay: 389, cx: 909, cy: 389, isOuter: false, hex: '#badc87' },
  { id: 26, x: 799, y: 180, w: 220, h: 133, ax: 229, ay: 389, cx: 910, cy: 234, isOuter: true, hex: '#fdc23c' },
  { id: 27, x: 894, y: 323, w: 177, h: 176, ax: 545, ay: 4, cx: 994, cy: 440, isOuter: true, hex: '#5ccbdc' },
  { id: 28, x: 987, y: 235, w: 51, h: 51, ax: 778, ay: 389, cx: 1013, cy: 260, isOuter: false, hex: '#fcc13c' },
  { id: 29, x: 845, y: 285, w: 291, h: 154, ax: 517, ay: 220, cx: 1016, cy: 355, isOuter: true, hex: '#f682a2' },
  { id: 30, x: 1053, y: 284, w: 39, h: 38, ax: 420, ay: 526, cx: 1071, cy: 302, isOuter: false, hex: '#f081bb' },
  { id: 31, x: 1070, y: 440, w: 50, h: 51, ax: 833, ay: 389, cx: 1096, cy: 466, isOuter: false, hex: '#43b2e0' },
];

// Exact letter bounding boxes in the 1181 x 797 artboard
const LETTERS = [
  { char: 'U', src: '/letter_u.png', left: 6, top: 515, width: 178, height: 206, color: '#f82a82', delay: 0.10 },
  { char: 'T', src: '/letter_t.png', left: 199, top: 515, width: 182, height: 206, color: '#7939a4', delay: 0.28 },
  { char: 'S', src: '/letter_s.png', left: 382, top: 515, width: 162, height: 206, color: '#157fcf', delay: 0.46 },
  { char: 'A', src: '/letter_a.png', left: 543, top: 515, width: 241, height: 206, color: '#26b59f', delay: 0.64 },
  { char: 'V', src: '/letter_v.png', left: 729, top: 515, width: 232, height: 206, color: '#fc981b', delay: 0.82 },
  { char: 'O', src: '/letter_o.png', left: 952, top: 515, width: 223, height: 206, color: '#f1362c', delay: 1.00 },
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

          {/* Master Responsive Logo Artboard: 1181 x 797 */}
          <div
            className="relative w-full max-w-[340px] sm:max-w-[420px] md:max-w-[460px]"
            style={{ aspectRatio: `${ART_W} / ${ART_H}` }}
          >

            {/* ============================================================== */}
            {/* STEP 2: RAINBOW ARCH LEAVES & DOTS (Burst out after letters are built) */}
            {/* ============================================================== */}
            <svg
              viewBox={`0 0 ${ART_W} ${ART_H}`}
              className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
            >
              {ARCH_PIECES.map((piece) => {
                // Energetic rainbow bloom sweeping from the apex outwards; big leaves lead, small dots follow
                const apexDist = Math.abs(piece.cx - ART_W / 2) / 470;
                const pieceDelay = 1.15 + apexDist * 0.35 + (piece.isOuter ? 0 : 0.06);

                return (
                  <g
                    key={piece.id}
                    style={{
                      transformOrigin: `${piece.cx}px ${piece.cy}px`,
                      animation: `dot-bloom 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                      animationDelay: `${pieceDelay}s`,
                      opacity: 0,
                      filter: `drop-shadow(0 3px 12px ${piece.hex}66)`
                    }}
                  >
                    <svg
                      x={piece.x}
                      y={piece.y}
                      width={piece.w}
                      height={piece.h}
                      viewBox={`${piece.ax} ${piece.ay} ${piece.w} ${piece.h}`}
                    >
                      <image href="/utsavo_arch_pieces.png" width={ARCH_ATLAS_W} height={ARCH_ATLAS_H} />
                    </svg>
                  </g>
                );
              })}
            </svg>

            {/* High-Fidelity Rainbow Arch Layer (Fades in smoothly to seal the perfection) */}
            <img
              src="/utsavo_rainbow_arch.png"
              alt="Utsavo Rainbow Arch"
              className="absolute left-0 top-0 w-full object-contain pointer-events-none z-15"
              style={{
                height: `${(ARCH_H / ART_H) * 100}%`,
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
                const leftPercent = (letter.left / ART_W) * 100;
                const topPercent = (letter.top / ART_H) * 100;
                const widthPercent = (letter.width / ART_W) * 100;
                const heightPercent = (letter.height / ART_H) * 100;

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
              className="absolute left-0 w-full pointer-events-none z-25 flex items-center justify-between"
              style={{
                top: `${(TAGLINE_TOP / ART_H) * 100}%`,
                height: `${(TAGLINE_H / ART_H) * 100}%`,
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
                maskImage: 'url(/utsavo_logo_artboard.png)',
                WebkitMaskImage: 'url(/utsavo_logo_artboard.png)',
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
