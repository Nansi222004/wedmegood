import { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useCart } from '../../contexts/CartContext';
import Icon from './Icon';

const SmartSlider = ({ 
  title, 
  items, 
  onItemClick, 
  className = '' 
}) => {
  const { theme } = useTheme();
  const { addToCart, isInCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(new Set());

  const handleItemClick = (item, index) => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  };

  const handleAddToCart = async (e, item) => {
    e.stopPropagation(); // Prevent item click
    
    if (isInCart(item.id)) {
      return; // Already in cart
    }

    setAddingToCart(prev => new Set([...prev, item.id]));
    
    // Add small delay for visual feedback
    setTimeout(() => {
      addToCart(item);
      setAddingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 500);
  };

  const handleWhatsAppContact = (e, item) => {
    e.stopPropagation(); // Prevent item click
    
    const message = encodeURIComponent(
      `Hi! I found your ${item.category.toLowerCase()} service "${item.name}" on Utsavo and I'm interested in learning more about it for my wedding. Could you please share more details?`
    );
    const whatsappNumber = item.whatsappNumber || '+919876543210';
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`py-6 ${className}`}>
      {/* Section Title - NO ARROW NAVIGATION */}
      <div className="px-4 mb-4">
        <h2 
          className="text-xl font-bold"
          style={{ color: theme.semantic.text.primary }}
        >
          {title}
        </h2>
      </div>

      {/* Cards Container - HORIZONTAL SCROLL */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 px-4" style={{ minWidth: 'max-content' }}>
          {items.map((item, index) => (
            <div key={item.id} className="flex-shrink-0 w-[calc(50vw-24px)] md:w-[calc(33.333vw-24px)]">
              <VendorCard
                item={item}
                index={index}
                theme={theme}
                onItemClick={handleItemClick}
                onAddToCart={handleAddToCart}
                onWhatsAppContact={handleWhatsAppContact}
                addingToCart={addingToCart}
                isInCart={isInCart}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// VendorCard component - FIXED BUTTON ALIGNMENT
const VendorCard = ({ 
  item, 
  index, 
  theme, 
  onItemClick, 
  onAddToCart, 
  onWhatsAppContact, 
  addingToCart, 
  isInCart 
}) => {
  return (
    <div
      className="cursor-pointer mobile-static-card"
      onClick={() => onItemClick(item, index)}
    >
      <div
        className="bg-white rounded-2xl shadow-lg vendor-card-fixed-height"
        style={{
          backgroundColor: theme.semantic.card.background,
          boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40`,
          height: '300px', // Fixed height for consistency
          overflow: 'visible' // Ensure buttons are not cut
        }}
      >
        {/* 1. Image - Fixed Height (128px) */}
        <div className="h-32 overflow-hidden relative flex-shrink-0 rounded-t-2xl">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80';
            }}
          />
          {/* Tag */}
          {item.tag && (
            <div 
              className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: item.tag === 'Trending' ? '#ef4444' :
                               item.tag === 'Best Seller' ? '#f59e0b' :
                               item.tag === 'Budget Pick' ? '#10b981' :
                               item.tag === 'Luxury' ? '#8b5cf6' :
                               theme.colors.primary[500],
                color: 'white'
              }}
            >
              {item.tag}
            </div>
          )}
          {/* Rating Badge */}
          <div 
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white'
            }}
          >
            <Icon name="star" size="xs" style={{ color: '#fbbf24' }} />
            {item.rating}
          </div>
        </div>

        {/* 2. Content Area - Flexible Height (fills remaining space) */}
        <div className="vendor-card-content">
          {/* Vendor Details - Flexible */}
          <div className="vendor-card-details">
            <h3 
              className="font-bold text-sm mb-1 line-clamp-1"
              style={{ color: theme.semantic.text.primary }}
            >
              {item.name}
            </h3>
            <p 
              className="text-xs mb-2 line-clamp-1"
              style={{ color: theme.semantic.text.secondary }}
            >
              {item.category}
            </p>
            <p 
              className="text-xs mb-1 flex items-center line-clamp-1"
              style={{ color: theme.semantic.text.secondary }}
            >
              <Icon name="location" size="xs" className="mr-1 flex-shrink-0" />
              {item.location}
            </p>
          </div>

          {/* 3. Price - Fixed Position Above Buttons */}
          <div 
            className="font-bold text-sm"
            style={{ 
              color: theme.colors.primary[600],
              marginBottom: '12px', // Fixed margin
              marginTop: 'auto' // Push to bottom of details area
            }}
          >
            {item.price}
          </div>

          {/* 4. Action Buttons - Fixed at Bottom */}
          <div className="vendor-card-buttons">
            {/* Add to Cart Button */}
            <button
              onClick={(e) => onAddToCart(e, item)}
              disabled={addingToCart.has(item.id)}
              className={`vendor-card-button flex-1 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                isInCart(item.id) 
                  ? 'opacity-60' 
                  : addingToCart.has(item.id) 
                    ? 'opacity-80' 
                    : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: isInCart(item.id) 
                  ? theme.colors.accent[500] 
                  : theme.colors.primary[500],
                color: 'white'
              }}
            >
              {addingToCart.has(item.id) ? (
                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
              ) : isInCart(item.id) ? (
                <>
                  <Icon name="heart" size="xs" className="mr-1" />
                  Shortlisted
                </>
              ) : (
                <>
                  <Icon name="heart" size="xs" className="mr-1" />
                  Shortlist
                </>
              )}
            </button>

            {/* WhatsApp Button */}
            <button
              onClick={(e) => onWhatsAppContact(e, item)}
              className="vendor-card-whatsapp-button rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: '#25D366',
                color: 'white'
              }}
            >
              <Icon name="whatsapp" size="xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSlider;