import { createContext, useContext, useEffect, useRef } from 'react';

const LenisContext = createContext();

export const LenisProvider = ({ children }) => {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Dynamic import for better code splitting
    const initializeLenis = async () => {
      try {
        const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
          import('lenis'),
          import('gsap'),
          import('gsap/ScrollTrigger')
        ]);

        // Register ScrollTrigger plugin
        gsap.registerPlugin(ScrollTrigger);

        // Initialize Lenis with optimized settings for ultra-smooth scrolling
        lenisRef.current = new Lenis({
          lerp: 0.08, // Controls the smoothness (lower = smoother/slower, higher = snappier)
          wheelMultiplier: 1, // scroll speed
          smoothWheel: true,
          smoothTouch: false, // Usually false is better for touch devices to preserve native feel
          touchMultiplier: 2,
          infinite: false,
          autoResize: true,
          orientation: 'vertical',
          gestureOrientation: 'vertical'
        });

        // Update ScrollTrigger on Lenis scroll
        lenisRef.current.on('scroll', (e) => {
          ScrollTrigger.update();
        });

        // GSAP ticker integration for smooth animation loop
        const update = (time) => {
          lenisRef.current?.raf(time * 1000);
        };

        gsap.ticker.add(update);

        // Store cleanup function and control methods
        lenisRef.current._cleanup = () => {
          gsap.ticker.remove(update);
          // Safely kill all ScrollTriggers
          try {
            const triggers = ScrollTrigger.getAll();
            triggers.forEach(trigger => {
              try {
                trigger.kill();
              } catch (e) {
                console.warn('Error killing ScrollTrigger:', e);
              }
            });
          } catch (e) {
            console.warn('Error getting ScrollTriggers:', e);
          }
          // Destroy Lenis instance
          try {
            lenisRef.current?.destroy();
          } catch (e) {
            console.warn('Error destroying Lenis:', e);
          }
        };

        // Expose to window for external control
        window.lenis = lenisRef.current;
      } catch (error) {
        console.warn('Failed to initialize Lenis:', error);
      }
    };

    initializeLenis();

    // Cleanup function
    return () => {
      try {
        lenisRef.current?._cleanup?.();
      } catch (error) {
        console.warn('Error during Lenis cleanup:', error);
      }
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
};

export const useLenisContext = () => {
  const context = useContext(LenisContext);
  return context;
};