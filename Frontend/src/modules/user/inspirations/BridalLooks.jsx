import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Toast from '../../../components/ui/Toast';

const BridalLooks = () => {
  const { category } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [savedItems, setSavedItems] = useState(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Category configurations
  const categoryConfig = {
    lehengas: {
      title: 'Bridal Lehengas',
      icon: 'shirt',
      filters: ['all', 'traditional', 'modern', 'designer', 'budget-friendly']
    },
    jewelry: {
      title: 'Bridal Jewelry',
      icon: 'diamond',
      filters: ['all', 'necklace', 'earrings', 'maang-tikka', 'bangles']
    },
    makeup: {
      title: 'Bridal Makeup',
      icon: 'makeup',
      filters: ['all', 'natural', 'glam', 'traditional', 'minimal']
    },
    hairstyles: {
      title: 'Bridal Hairstyles',
      icon: 'user',
      filters: ['all', 'bun', 'braids', 'open-hair', 'floral']
    },
    sarees: {
      title: 'Bridal Sarees',
      icon: 'shirt',
      filters: ['all', 'silk', 'designer', 'traditional', 'modern']
    },
    accessories: {
      title: 'Bridal Accessories',
      icon: 'star',
      filters: ['all', 'clutches', 'footwear', 'dupatta', 'belts']
    }
  };

  const currentCategory = categoryConfig[category] || categoryConfig.lehengas;

  // Mock data for lehengas
  const bridalLooksData = {
    lehengas: [
      { id: 1, title: 'Red Traditional Lehenga', filter: 'traditional', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=600&fit=crop&q=80', price: '₹85,000', designer: 'Sabyasachi', saves: 2345 },
      { id: 2, title: 'Pink Modern Lehenga', filter: 'modern', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop&q=80', price: '₹65,000', designer: 'Anita Dongre', saves: 1876 },
      { id: 3, title: 'Golden Designer Lehenga', filter: 'designer', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop&q=80', price: '₹1,25,000', designer: 'Manish Malhotra', saves: 3456 },
      { id: 4, title: 'Maroon Traditional Lehenga', filter: 'traditional', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=600&fit=crop&q=80', price: '₹75,000', designer: 'Tarun Tahiliani', saves: 2109 },
      { id: 5, title: 'Pastel Modern Lehenga', filter: 'modern', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop&q=80', price: '₹55,000', designer: 'Ridhi Mehra', saves: 1654 },
      { id: 6, title: 'Peach Designer Lehenga', filter: 'designer', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop&q=80', price: '₹95,000', designer: 'Sabyasachi', saves: 2987 },
      { id: 7, title: 'Budget Red Lehenga', filter: 'budget-friendly', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=600&fit=crop&q=80', price: '₹35,000', designer: 'Kalki Fashion', saves: 1234 },
      { id: 8, title: 'Budget Pink Lehenga', filter: 'budget-friendly', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop&q=80', price: '₹28,000', designer: 'Mohey', saves: 987 },
      { id: 9, title: 'Royal Blue Traditional', filter: 'traditional', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop&q=80', price: '₹80,000', designer: 'Falguni Shane Peacock', saves: 2456 },
      { id: 10, title: 'Mint Green Modern', filter: 'modern', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=600&fit=crop&q=80', price: '₹62,000', designer: 'Anita Dongre', saves: 1765 },
      { id: 11, title: 'Ivory Designer Lehenga', filter: 'designer', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop&q=80', price: '₹1,15,000', designer: 'Manish Malhotra', saves: 3210 },
      { id: 12, title: 'Budget Golden Lehenga', filter: 'budget-friendly', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop&q=80', price: '₹32,000', designer: 'Kalki Fashion', saves: 1098 }
    ],
    jewelry: [
      { id: 13, title: 'Kundan Necklace Set', filter: 'necklace', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=600&fit=crop&q=80', price: '₹45,000', designer: 'Tanishq', saves: 2876 },
      { id: 14, title: 'Diamond Earrings', filter: 'earrings', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=600&fit=crop&q=80', price: '₹65,000', designer: 'PC Jeweller', saves: 3456 },
      { id: 15, title: 'Gold Maang Tikka', filter: 'maang-tikka', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=600&fit=crop&q=80', price: '₹25,000', designer: 'Kalyan Jewellers', saves: 1987 },
      { id: 16, title: 'Polki Bangles Set', filter: 'bangles', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=600&fit=crop&q=80', price: '₹35,000', designer: 'Tanishq', saves: 2345 }
    ],
    makeup: [
      { id: 17, title: 'Natural Bridal Look', filter: 'natural', image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=600&fit=crop&q=80', price: '₹15,000', designer: 'Makeup by Chandni', saves: 2109 },
      { id: 18, title: 'Glam Bridal Makeup', filter: 'glam', image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=600&fit=crop&q=80', price: '₹25,000', designer: 'Ojas Rajani', saves: 3210 },
      { id: 19, title: 'Traditional Red Look', filter: 'traditional', image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=600&fit=crop&q=80', price: '₹18,000', designer: 'Namrata Soni', saves: 2654 },
      { id: 20, title: 'Minimal Bridal Makeup', filter: 'minimal', image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=600&fit=crop&q=80', price: '₹12,000', designer: 'Makeup Studio', saves: 1876 }
    ]
  };

  const items = bridalLooksData[category] || bridalLooksData.lehengas;
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
                {filteredItems.length} beautiful options
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
            Total Looks
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
            15+
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            Designers
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

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm mb-1">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between text-white/90 text-xs">
                      <span>{item.designer}</span>
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
            No looks found
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

export default BridalLooks;
