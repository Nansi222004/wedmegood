import { useEffect, useRef } from 'react';

export const useScrollAnimations = () => {
  const animationsRef = useRef([]);

  useEffect(() => {
    // Dynamic import for better code splitting
    const initializeAnimations = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger')
      ]);

      gsap.registerPlugin(ScrollTrigger);

      // Clear any existing animations
      animationsRef.current.forEach(animation => animation.kill());
      animationsRef.current = [];

      // Animate sections with subtle fade-in and upward motion
      const sections = document.querySelectorAll('.scroll-animate-section');
      
      sections.forEach((section, index) => {
        // Set initial state
        gsap.set(section, {
          opacity: 0,
          y: 30,
          scale: 0.98
        });

        // Create scroll-triggered animation
        const animation = ScrollTrigger.create({
          trigger: section,
          start: 'top 85%',
          end: 'bottom 15%',
          once: true, // Only animate once
          onEnter: () => {
            gsap.to(section, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: 'power2.out',
              delay: index * 0.1 // Stagger animations slightly
            });
          }
        });

        animationsRef.current.push(animation);
      });

      // Animate smart slider sections
      const sliderSections = document.querySelectorAll('.smart-slider-section');
      
      sliderSections.forEach((section, index) => {
        gsap.set(section, {
          opacity: 0,
          y: 20
        });

        const animation = ScrollTrigger.create({
          trigger: section,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            gsap.to(section, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power1.out',
              delay: index * 0.05
            });
          }
        });

        animationsRef.current.push(animation);
      });

      // Animate category circles
      const categoryItems = document.querySelectorAll('.category-item');
      
      categoryItems.forEach((item, index) => {
        gsap.set(item, {
          opacity: 0,
          scale: 0.8,
          y: 20
        });

        const animation = ScrollTrigger.create({
          trigger: item.closest('.categories-container') || item,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(item, {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.5,
              ease: 'back.out(1.7)',
              delay: index * 0.1
            });
          }
        });

        animationsRef.current.push(animation);
      });

      // Animate feedback section with special entrance
      const feedbackSection = document.querySelector('.feedback-section-container');
      
      if (feedbackSection) {
        gsap.set(feedbackSection, {
          opacity: 0,
          y: 40,
          scale: 0.95
        });

        const animation = ScrollTrigger.create({
          trigger: feedbackSection,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.to(feedbackSection, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1,
              ease: 'power2.out'
            });
          }
        });

        animationsRef.current.push(animation);
      }
    };

    initializeAnimations();

    // Cleanup function
    return () => {
      animationsRef.current.forEach(animation => animation.kill());
      animationsRef.current = [];
    };
  }, []);

  return {
    refreshAnimations: async () => {
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      ScrollTrigger.refresh();
    }
  };
};

export default useScrollAnimations;