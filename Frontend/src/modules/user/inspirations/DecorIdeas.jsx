import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Toast from '../../../components/ui/Toast';

const DecorIdeas = () => {
  const { category } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [savedItems, setSavedItems] = useState(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Category configurations
  const categoryConfig = {
    mandap: {
      title: 'Mandap Decoration',
      icon: 'home',
      filters: ['all', 'traditional', 'modern', 'floral', 'royal']
    },
    stage: {
      title: 'Stage Decoration',
      icon: 'star',
      filters: ['all', 'elegant', 'grand', 'minimal', 'themed']
    },
    entrance: {
      title: 'Entrance Decoration',
      icon: 'location',
      filters: ['all', 'floral', 'lights', 'traditional', 'modern']
    },
    ceiling: {
      title: 'Ceiling Decoration',
      icon: 'star',
      filters: ['all', 'drapes', 'lights', 'flowers', 'chandeliers']
    },
    table: {
      title: 'Table Decoration',
      icon: 'grid',
      filters: ['all', 'centerpieces', 'elegant', 'rustic', 'modern']
    },
    outdoor: {
      title: 'Outdoor Decoration',
      icon: 'sun',
      filters: ['all', 'garden', 'beach', 'poolside', 'terrace']
    }
  };

  const currentCategory = categoryConfig[category] || categoryConfig.mandap;

  // Mock data for decorations
  const decorData = {
    mandap: [
      { id: 1, title: 'Traditional Red Mandap', filter: 'traditional', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80', price: '₹1,50,000', decorator: 'Ferns N Petals', saves: 3456, theme: 'Traditional' },
      { id: 2, title: 'Modern White Mandap', filter: 'modern', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop&q=80', price: '₹1,25,000', decorator: 'Tamarind Global', saves: 2876 },
      { id: 3, title: 'Floral Paradise Mandap', filter: 'floral', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=600&fit=crop&q=80', price: '₹2,00,000', decorator: 'Altair Decor', saves: 4321 },
      { id: 4, title: 'Royal Golden Mandap', filter: 'royal', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=600&fit=crop&q=80', price: '₹2,50,000', decorator: 'Devika Narain', saves: 5678 },
      { id: 5, title: 'Traditional Marigold Mandap', filter: 'traditional', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80', price: '₹1,35,000', decorator: 'Ferns N Petals', saves: 2987 },
      { id: 6, title: 'Minimalist Modern Mandap', filter: 'modern', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop&q=80', price: '₹1,10,000', decorator: 'The Wedding Design Company', saves: 2345 },
      { id: 7, title: 'Rose Garden Mandap', filter: 'floral', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=600&fit=crop&q=80', price: '₹1,80,000', decorator: 'Altair Decor', saves: 3876 },
      { id: 8, title: 'Palace Style Mandap', filter: 'royal', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=600&fit=crop&q=80', price: '₹3,00,000', decorator: 'Devika Narain', saves: 6543 }
    ],
    stage: [
      { id: 9, title: 'Elegant White Stage', filter: 'elegant', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=600&fit=crop&q=80', price: '₹85,000', decorator: 'Tamarind Global', saves: 2456 },
      { id: 10, title: 'Grand Royal Stage', filter: 'grand', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=600&fit=crop&q=80', price: '₹1,50,000', decorator: 'Devika Narain', saves: 3987 },
      { id: 11, title: 'Minimal Modern Stage', filter: 'minimal', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop&q=80', price: '₹65,000', decorator: 'The Wedding Design Company', saves: 1876 },
      { id: 12, title: 'Themed Bollywood Stage', filter: 'themed', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80', price: '₹1,20,000', decorator: 'Altair Decor', saves: 3210 }
    ],
    entrance: [
      { id: 13, title: 'Floral Arch Entrance', filter: 'floral', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=600&fit=crop&q=80', price: '₹45,000', decorator: 'Ferns N Petals', saves: 2109 },
      { id: 14, title: 'LED Lights Entrance', filter: 'lights', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=600&fit=crop&q=80', price: '₹55,000', decorator: 'Tamarind Global', saves: 2654 },
      { id: 15, title: 'Traditional Toran Entrance', filter: 'traditional', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80', price: '₹35,000', decorator: 'Devika Narain', saves: 1765 },
      { id: 16, title: 'Modern Glass Entrance', filter: 'modern', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop&q=80', price: '₹65,000', decorator: 'The Wedding Design Company', saves: 2876 }
    ],
    ceiling: [
      { id: 17, title: 'Fabric Drapes Ceiling', filter: 'drapes', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=600&fit=crop&q=80', price: '₹75,000', decorator: 'Tamarind Global', saves: 2345 },
      { id: 18, title: 'Fairy Lights Ceiling', filter: 'lights', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop&q=80', price: '₹55,000', decorator: 'Altair Decor', saves: 2987 },
      { id: 19, title: 'Hanging Flowers Ceiling', filter: 'flowers', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=600&fit=crop&q=80', price: '₹95,000', decorator: 'Ferns N Petals', saves: 3456 },
      { id: 20, title: 'Crystal Chandeliers', filter: 'chandeliers', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80', price: '₹1,25,000', decorator: 'Devika Narain', saves: 4321 }
    ]
  };

  const items = decorData[category] || decorData.mandap;
  const filteredItems = selectedFilter === 'all' 
    ? items 
    : items.filter(item => item.filter === selectedFilter);

  const handleSave = (itemId) => {
    setSavedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        setToastMessage('Removed from saved');
      } else {
        newSet.add(itemId);
        setToastMessage('Saved to your collection');
      }
      setShowToast(true);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-40 px-4 py-4 border-b"
        style={{ 
          backgroundColor: theme.semantic.background.primary,
          borderBottomColor: theme.semantic.border.light
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 
                className="text-xl font-bold"
                style={{ color: theme.semantic.text.primary }}
              >
                {currentCategory.title}
              </h1>
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                {filteredItems.length} stunning designs
              </p>
            </div>
          </div>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name={currentCategory.icon} size="sm" style={{ color: theme.colors.primary[500] }} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {currentCategory.filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize"
              style={{
                backgroundColor: selectedFilter === filter 
                  ? theme.colors.primary[500] 
                  : theme.semantic.background.accent,
                color: selectedFilter === filter 
                  ? 'white' 
                  : theme.semantic.text.primary
              }}
            >
              {filter.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div 
        className="mx-4 mt-4 p-4 rounded-xl grid grid-cols-3 gap-4"
        style={{ backgroundColor: theme.semantic.background.accent }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.primary[500] }}>
            {items.length}
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            Designs
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.primary[500] }}>
            {savedItems.size}
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            Saved
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.primary[500] }}>
            20+
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            Decorators
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer"
              onClick={() => navigate(`/user/inspirations/${item.id}`)}
            >
              <div 
                className="rounded-2xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-xl"
                style={{ backgroundColor: theme.semantic.background.accent }}
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80';
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                  
                  {/* Save Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(item.id);
                    }}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{ 
                      backgroundColor: savedItems.has(item.id) 
                        ? theme.colors.primary[500] 
                        : 'rgba(255,255,255,0.9)'
                    }}
                  >
                    <Icon 
                      name="heart" 
                      size="sm" 
                      style={{ 
                        color: savedItems.has(item.id) 
                          ? 'white' 
                          : theme.semantic.text.tertiary 
                      }} 
                    />
                  </button>

                  {/* Saves Count Badge */}
                  <div 
                    className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                  >
                    <Icon name="heart" size="xs" />
                    {item.saves}
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm mb-1">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between text-white/90 text-xs">
                      <span>{item.decorator}</span>
                      <span className="font-semibold">{item.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="search" size="lg" style={{ color: theme.semantic.text.tertiary }} />
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: theme.semantic.text.primary }}
          >
            No designs found
          </h3>
          <p 
            className="text-sm text-center"
            style={{ color: theme.semantic.text.secondary }}
          >
            Try selecting a different filter
          </p>
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default DecorIdeas;
