import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-[100dvh] relative flex flex-col items-center justify-between overflow-x-hidden font-['Poppins',sans-serif] bg-[#FAF6F0]">
      {/* 1. ELEGANT WATERCOLOR FLORAL WEDDING BACKGROUND */}
      <div 
        className={`fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 pointer-events-none ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundImage: "url('/background.png')",
          backgroundColor: '#FAF6F0',
        }}
      />

      {/* Subtle Warm Ivory & Watercolor Wash Blend Overlay */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(250, 246, 240, 0.45) 0%, rgba(250, 246, 240, 0.15) 70%, rgba(250, 246, 240, 0.35) 100%)',
        }}
      />

      {/* 2. DELICATE GOLDEN SWEEPING ARCS FROM BOTTOM CORNERS */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-70" 
        viewBox="0 0 390 844" 
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Left sweeping gold arc */}
        <path 
          d="M 60 790 C 20 710, 0 540, 42 410 C 48 390, 52 375, 42 355" 
          stroke="#C59A5A" 
          strokeWidth="1.2" 
          strokeLinecap="round"
        />
        {/* Right sweeping gold arc */}
        <path 
          d="M 210 820 C 300 780, 365 670, 355 520 C 345 400, 375 280, 345 180" 
          stroke="#C59A5A" 
          strokeWidth="1.1" 
          strokeLinecap="round"
        />
      </svg>

      {/* 3. FLOATING DELICATE GOLD WIREFRAME HEARTS ON THE SIDES */}
      {/* Left Margin Heart + Sparkle Star */}
      <div 
        className={`absolute top-[34%] left-[6%] sm:left-[10%] md:left-[16%] lg:left-[22%] pointer-events-none z-10 flex items-center gap-1.5 transition-all duration-1000 delay-500 transform ${isLoaded ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Tiny 4-point gold sparkle star */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#C59A5A" className="text-[#C59A5A] opacity-80">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
        {/* Wireframe Gold Heart */}
        <svg width="22" height="20" viewBox="0 0 24 22" fill="none" stroke="#C59A5A" strokeWidth="1.4" className="-rotate-12">
          <path d="M12 20.2 C 10.5 18.8, 2 13.2, 2 7.5 C 2 3.8, 5 1.5, 8.5 1.5 C 10.5 1.5, 11.5 2.5, 12 3.2 C 12.5 2.5, 13.5 1.5, 15.5 1.5 C 19 1.5, 22 3.8, 22 7.5 C 22 13.2, 13.5 18.8, 12 20.2 Z" />
        </svg>
      </div>

      {/* Right Margin Heart */}
      <div 
        className={`absolute top-[25%] right-[6%] sm:right-[10%] md:right-[16%] lg:right-[22%] pointer-events-none z-10 transition-all duration-1000 delay-600 transform ${isLoaded ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Wireframe Gold Heart */}
        <svg width="22" height="20" viewBox="0 0 24 22" fill="none" stroke="#C59A5A" strokeWidth="1.4" className="rotate-12">
          <path d="M12 20.2 C 10.5 18.8, 2 13.2, 2 7.5 C 2 3.8, 5 1.5, 8.5 1.5 C 10.5 1.5, 11.5 2.5, 12 3.2 C 12.5 2.5, 13.5 1.5, 15.5 1.5 C 19 1.5, 22 3.8, 22 7.5 C 22 13.2, 13.5 18.8, 12 20.2 Z" />
        </svg>
      </div>

      {/* 4. CENTERED HERO CONTENT CONTAINER */}
      <div className="relative z-20 w-full max-w-sm sm:max-w-md min-h-[100dvh] flex flex-col justify-between items-center px-6 py-8 sm:py-11 mx-auto text-center">
        
        {/* BRAND HEADER: Gold Emblem, Wordmark, and Tagline */}
        <div className={`pt-1 sm:pt-2 transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className="flex flex-col items-center justify-center">
            {/* Elegant Gold Emblem: Interlocking wedding knot & hearts */}
            <svg width="34" height="40" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#C19A5B] mb-1">
              {/* Top smaller heart */}
              <path d="M18 15 C16 12 12.5 8 12.5 5 C12.5 2.5 14.5 1 17 1 C18 1 18.8 1.6 19 2.2 C19.2 1.6 20 1 21 1 C23.5 1 25.5 2.5 25.5 5 C25.5 8 22 12 18 15 Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              {/* Interlocking bottom larger heart */}
              <path d="M18 39 C15 34 5.5 26 5.5 17 C5.5 10 10 7 14.5 7 C16.5 7 18 8.2 19 9.5 C20 8.2 21.5 7 23.5 7 C28 7 32.5 10 32.5 17 C32.5 26 23 34 18 39 Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              {/* Inner ring circle */}
              <circle cx="18" cy="18" r="2.8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
            </svg>

            {/* "Utsavo" Wordmark in deep plum serif */}
            <span 
              className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#3E1430] leading-none"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Utsavo
            </span>

            {/* "CELEBRATE EVERY MOMENT" in gold uppercase */}
            <span 
              className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-[0.28em] text-[#C19A5B] mt-1.5"
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              Celebrate Every Moment
            </span>
          </div>
        </div>

        {/* HERO CONTENT: "Your Dream", "Wedding", "Starts Here" */}
        <div className={`my-auto py-5 sm:py-7 transition-all duration-1000 delay-200 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className="flex flex-col items-center">
            {/* Line 1: Your Dream */}
            <h1 
              className="text-[38px] sm:text-[44px] font-bold text-[#3E1430] tracking-tight leading-none"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Your Dream
            </h1>

            {/* Line 2: Wedding (Large Flowing Script) */}
            <div 
              className="text-[74px] sm:text-[86px] text-[#3E1430] leading-[0.96] -my-1.5 select-none"
              style={{ fontFamily: '"Great Vibes", cursive', fontWeight: 400 }}
            >
              Wedding
            </div>

            {/* Line 3: Starts Here */}
            <h2 
              className="text-[38px] sm:text-[44px] font-bold text-[#3E1430] tracking-tight leading-none"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Starts Here
            </h2>

            {/* Gold Ornamental Heart Flourish Divider (~ ♡ ~) */}
            <div className="my-3.5">
              <svg width="136" height="24" viewBox="0 0 136 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#C59A5A]">
                {/* Left flourish curve */}
                <path d="M12 12 C 30 7, 44 17, 54 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                {/* Center heart */}
                <path d="M68 18 C 66.5 16, 61 11, 61 7 C 61 4.2, 63.2 2.5, 65.8 2.5 C 67.1 2.5, 67.8 3.2, 68 4 C 68.2 3.2, 68.9 2.5, 70.2 2.5 C 72.8 2.5, 75 4.2, 75 7 C 75 11, 69.5 16, 68 18 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* Right flourish curve */}
                <path d="M82 12 C 92 17, 106 7, 124 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            {/* Subtitle / Value Proposition */}
            <p 
              className="text-[10.5px] sm:text-[11.5px] font-medium tracking-[0.16em] uppercase text-[#6B4F60] max-w-[280px] leading-relaxed"
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              Plan • Organize • Celebrate Your Perfect Journey
            </p>
          </div>
        </div>

        {/* PRIMARY ACTION BUTTONS & CAROUSEL INDICATORS */}
        <div className={`w-full max-w-[285px] sm:max-w-[305px] flex flex-col items-center space-y-3 pb-2 transition-all duration-1000 delay-300 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          {/* Button 1: Get Started → */}
          <button
            onClick={() => navigate('/signup')}
            className="w-full py-3.5 px-6 rounded-full bg-[#4F1A3B] hover:bg-[#411330] active:scale-95 text-white text-[16px] shadow-[0_4px_16px_rgba(79,26,59,0.32)] hover:shadow-[0_6px_20px_rgba(79,26,59,0.42)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span 
              className="font-medium tracking-wide"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Get Started
            </span>
            <svg 
              className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          {/* Button 2: ALREADY HAVE AN ACCOUNT */}
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-6 rounded-full bg-[#F6EDE5]/85 hover:bg-[#F6EDE5] active:scale-95 border border-[#E8DCD2] text-[#4F1A3B] text-[11px] font-bold tracking-[0.14em] uppercase transition-all shadow-xs cursor-pointer"
            style={{ fontFamily: '"Poppins", sans-serif' }}
          >
            Already Have an Account
          </button>

          {/* Three Carousel Dots Indicators */}
          <div className="flex items-center justify-center gap-2 pt-3">
            {/* Active Dot (Deep plum) */}
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F1A3B]" />
            {/* Inactive Dot 2 */}
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4C2CB]" />
            {/* Inactive Dot 3 */}
            <span className="w-1.5 h-1.5 rounded-full bg-[#E2D3DC]" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Welcome;