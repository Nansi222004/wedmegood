import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

const Welcome = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Add Designer fonts via Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Great+Vibes&family=Outfit:wght@300;400;600;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-hidden font-['Outfit']">
      
      {/* NEW THEME BACKGROUND (Matches Signup/Login) */}
      <div 
        className={`fixed inset-0 z-0 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundColor: '#8F7575',
        }}
      >
        <div className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] bg-white opacity-[0.05] rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#5D3E3E] opacity-[0.1] rounded-full blur-3xl" />
      </div>

      {/* FLOATING DESIGNER ELEMENTS (Hearts) */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
         {[...Array(18)].map((_, i) => (
           <div 
             key={i}
             className="absolute animate-pulse opacity-15"
             style={{
               top: `${(i * 12) + 5}%`,
               left: i % 2 === 0 ? '8%' : '82%',
               transform: `rotate(${i * 45}deg) scale(${0.7 + Math.random() * 0.4})`,
               animationDelay: `${i * 0.5}s`
             }}
           >
             <svg width="35" height="35" viewBox="0 0 24 24" fill="#f82b76">
               <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
             </svg>
           </div>
         ))}
      </div>

      {/* COMPACT MAIN CONTENT - MOVED UP */}
      <div className="relative z-20 w-full max-w-sm flex flex-col items-center px-8 pt-20 h-screen">
        
        {/* LOGO AREA - Minimalist */}
        <div className={`mb-12 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                <svg viewBox="0 0 100 100" className="w-6 h-6 fill-white">
                   <path d="M50 85c-2-2-35-25-35-45 0-12 10-20 20-20 6 0 11 3 15 8 4-5 9-8 15-8 10 0 20 8 20 20 0 20-33 43-35 45z"/>
                </svg>
             </div>
             <span className="text-white text-xl font-black tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>Utsavo</span>
          </div>
        </div>

        {/* HEADLINE SECTION - MOVED UP */}
        <div className={`text-center space-y-1 mb-12 transition-all duration-1000 delay-200 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
           <h1 className="text-[#5D3E3E] text-6xl font-bold leading-none" style={{ fontFamily: '"Great Vibes", cursive' }}>
             Your Dream <br/>
             Wedding Starts
           </h1>
           <p className="text-[#5D3E3E]/60 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ fontFamily: '"Outfit", sans-serif' }}>
             Plan • Organize • Celebrate Your Perfect Journey
           </p>
        </div>

        {/* ACTION AREA - DESIGNER & ULTRA COMPACT - POSITIONED HIGHER */}
        <div className={`w-full max-w-[280px] space-y-3 transition-all duration-1000 delay-400 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
           <button
             onClick={() => navigate('/signup')}
             className="w-full py-3.5 rounded-2xl bg-white text-[#5D3E3E] text-lg font-black tracking-tight shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
             style={{ fontFamily: '"Playfair Display", serif' }}
           >
             Get Started
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
             </svg>
           </button>

           <button
             onClick={() => navigate('/login')}
             className="w-full py-2.5 rounded-2xl text-white text-[9px] font-black tracking-[0.2em] bg-white/10 border border-white/5 hover:bg-white/20 transition-all uppercase"
             style={{ fontFamily: '"Playfair Display", serif' }}
           >
             Already Have an Account
           </button>

           {/* SOCIAL INDICATORS - ULTRA MINIMAL */}
           <div className="flex gap-4 justify-center pt-8 opacity-40">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
           </div>
        </div>

      </div>
    </div>
  );
};

export default Welcome;