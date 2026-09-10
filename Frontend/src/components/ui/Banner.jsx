import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

const Banner = ({ 
  type = 'single', 
  images = [], 
  title = '', 
  subtitle = '', 
  clickAction = null,
  autoSlide = true,
  slideInterval = 4000,
  className = ''
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide for carousel banners
  useEffect(() => {
    if (type === 'carousel' && autoSlide && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % images.length);
      }, slideInterval);
      return () => clearInterval(interval);
    }
  }, [type, autoSlide, images.length, slideInterval]);

  const handleBannerClick = () => {
    if (clickAction) {
      navigate(clickAction);
    }
  };

  const SingleImageBanner = ({ image, title, subtitle }) => (
    <div 
      className={`relative overflow-hidden rounded-xl shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md ${className}`}
      onClick={handleBannerClick}
      style={{
        backgroundColor: theme.semantic.background.accent,
        height: '160px',
        minHeight: '160px'
      }}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-200 hover:scale-105"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Fallback Image */}
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover opacity-0"
        loading="lazy"
        onLoad={(e) => {
          e.target.style.opacity = '0'; // Keep hidden since we use background-image
        }}
        onError={(e) => {
          // If image fails, show a gradient background
          e.target.parentElement.style.background = `linear-gradient(135deg, ${theme.colors.primary[100]} 0%, ${theme.colors.primary[200]} 100%)`;
        }}
      />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)'
        }}
      />
      
      {/* Content */}
      {(title || subtitle) && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          {title && (
            <h3 className="text-white text-sm font-medium mb-1 drop-shadow-lg">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-white/90 text-xs drop-shadow-lg">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const CarouselBanner = ({ images, title, subtitle }) => (
    <div 
      className={`relative overflow-hidden rounded-xl shadow-sm cursor-pointer ${className}`}
      onClick={handleBannerClick}
      style={{
        backgroundColor: theme.semantic.background.accent,
        height: '160px',
        minHeight: '160px'
      }}
    >
      {/* Images */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            {/* Fallback Image */}
            <img
              src={image}
              alt={`${title} ${index + 1}`}
              className="w-full h-full object-cover opacity-0"
              loading="lazy"
              onError={(e) => {
                // If image fails, show a gradient background
                e.target.parentElement.querySelector('div').style.background = `linear-gradient(135deg, ${theme.colors.primary[100]} 0%, ${theme.colors.primary[200]} 100%)`;
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)'
        }}
      />
      
      {/* Content */}
      {(title || subtitle) && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          {title && (
            <h3 className="text-white text-sm font-medium mb-1 drop-shadow-lg">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-white/90 text-xs drop-shadow-lg">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {/* Slide Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 right-4 flex space-x-1 z-20">
          {images.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (type === 'carousel' && images.length > 1) {
    return <CarouselBanner images={images} title={title} subtitle={subtitle} />;
  }

  return <SingleImageBanner image={images[0]} title={title} subtitle={subtitle} />;
};

export default Banner;