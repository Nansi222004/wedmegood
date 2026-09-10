import { useEffect, useRef } from 'react';

export const useLenis = (options = {}) => {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Dynamic imports for better code splitting
    const initializeLenis = async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger')
      ]);

      // Register ScrollTrigger plugin
      gsap.registerPlugin(ScrollTrigger);

      // Initialize Lenis with optimized settings for mobile
      lenisRef.current = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing for smooth feel
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: true, // Enable smooth scrolling on touch devices
        touchMultiplier: 2,
        infinite: false,
        autoResize: true,
        ...options
      });

      // Update ScrollTrigger on Lenis scroll
      lenisRef.current.on('scroll', (e) => {
        ScrollTrigger.update();
      });

      // GSAP ticker integration for smooth animation loop
      const update = (time) => {
        lenisRef.current.raf(time * 1000);
      };

      gsap.ticker.add(update);

      // Store cleanup function
      lenisRef.current._cleanup = () => {
        gsap.ticker.remove(update);
        lenisRef.current?.destroy();
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      };
    };

    initializeLenis();

    // Cleanup function
    return () => {
      lenisRef.current?._cleanup?.();
    };
  }, []);

  // Return Lenis instance for external control if needed
  return lenisRef.current;
};

export default useLenis;