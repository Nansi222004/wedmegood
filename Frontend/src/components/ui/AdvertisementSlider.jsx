import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

const AdvertisementSlider = () => {
  const { theme } = useTheme();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const intervalRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Mock advertisement data - future-ready for backend integration
  const advertisements = [
    {
      id: 1,
      type: 'venue',
      image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=800&h=300&fit=crop&crop=center&q=80',
      caption: 'Premium Wedding Venues in Indore',
      sponsor: 'Sponsored',
      link: '/user/vendors/venues'
    },
    {
      id: 2,
      type: 'photographer',
      image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=300&fit=crop&crop=center&q=80',
      caption: 'Exclusive Photography Partners',
      sponsor: 'Ad',
      link: '/user/vendors/photographers'
    },
    {
      id: 3,
      type: 'decor',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=300&fit=crop&crop=center&q=80',
      caption: 'Luxury Decor Specialists',
      sponsor: 'Sponsored',
      link: '/user/vendors/decorators'
    },
    {
      id: 4,
      type: 'makeup',
      image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=300&fit=crop&crop=center&q=80',
      caption: 'Professional Makeup Artists',
      sponsor: 'Ad',
      link: '/user/vendors/makeup-artists'
    }
  ];

  // Auto-rotation logic
  useEffect(() => {
    const startAutoRotation = () => {
      intervalRef.current = setInterval(() => {
        if (!isUserInteracting) {
          setCurrentAdIndex((prevIndex) => 
            prevIndex === advertisements.length - 1 ? 0 : prevIndex + 1
          );
        }
      }, 4500); // 4.5 seconds
    };

    startAutoRotation();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isUserInteracting, advertisements.length]);

  // Handle manual swipe navigation
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsUserInteracting(true);
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const swipeDistance = touchStartX.current - touchEndX.current;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swipe left - next ad
        setCurrentAdIndex((prevIndex) => 
          prevIndex === advertisements.length - 1 ? 0 : prevIndex + 1
        );
      } else {
        // Swipe right - previous ad
        setCurrentAdIndex((prevIndex) => 
          prevIndex === 0 ? advertisements.length - 1 : prevIndex - 1
        );
      }
    }

    // Resume auto-rotation after 3 seconds
    setTimeout(() => {
      setIsUserInteracting(false);
    }, 3000);
  };

  const currentAd = advertisements[currentAdIndex];

  return (
    <div className="px-4 py-4">
      {/* Advertisement Container */}
      <div 
        className="relative rounded-xl overflow-hidden shadow-md"
        style={{ backgroundColor: theme.semantic.card.background }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Advertisement Image */}
        <div className="relative h-40 sm:h-44 lg:h-48 overflow-hidden">
          <img
            src={currentAd.image}
            alt={currentAd.caption}
            className="w-full h-full object-cover transition-all duration-500 ease-in-out"
            style={{
              transform: `translateX(0)`,
              opacity: 1
            }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=300&fit=crop&crop=center&q=80';
            }}
            loading="lazy"
          />
          
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          
          {/* Sponsor tag */}
          <div className="absolute top-3 right-3">
            <span 
              className="px-2 py-1 text-xs rounded-md backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: theme.semantic.text.secondary
              }}
            >
              {currentAd.sponsor}
            </span>
          </div>
          
          {/* Caption */}
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white text-sm font-light opacity-90 line-clamp-2">
              {currentAd.caption}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisementSlider;