import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';

const Inspirations = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [savedItems, setSavedItems] = useState(new Set());

  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'bridal', name: 'Bridal', icon: 'user' },
    { id: 'decor', name: 'Decor', icon: 'home' },
    { id: 'mehndi', name: 'Mehndi', icon: 'hand' },
    { id: 'jewelry', name: 'Jewelry', icon: 'diamond' },
    { id: 'venues', name: 'Venues', icon: 'location' },
    { id: 'photography', name: 'Photography', icon: 'camera' },
    { id: 'outfits', name: 'Outfits', icon: 'shirt' }
  ];

  const inspirationItems = [
    // Bridal Lehengas
    { id: 1, title: 'Red Bridal Lehenga', category: 'bridal', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=600&fit=crop&q=80', saves: 1234, views: 5678 },
    { id: 2, title: 'Pink Bridal Lehenga', category: 'bridal', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop&q=80', saves: 987, views: 4321 },
    { id: 3, title: 'Golden Bridal Lehenga', category: 'bridal', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop&q=80', saves: 2345, views: 8765 },
    
    // Mehndi Designs
    { id: 4, title: 'Intricate Bridal Mehndi', category: 'mehndi', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=600&fit=crop&q=80', saves: 3456, views: 12345 },
    { id: 5, title: 'Arabic Mehndi Design', category: 'mehndi', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=600&fit=crop&q=80', saves: 2876, views: 9876 },
    { id: 6, title: 'Minimal Mehndi Design', category: 'mehndi', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=600&fit=crop&q=80', saves: 1987, views: 6543 },
    
    // Jewelry
    { id: 7, title: 'Bridal Jewelry Set', category: 'jewelry', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=600&fit=crop&q=80', saves: 4567, views: 15678 },
    { id: 8, title: 'Gold Necklace Design', category: 'jewelry', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=600&fit=crop&q=80', saves: 3210, views: 11234 },
    { id: 9, title: 'Temple Jewelry', category: 'jewelry', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=600&fit=crop&q=80', saves: 2987, views: 9876 },
    
    // Decor
    { id: 10, title: 'Mandap Decoration', category: 'decor', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80', saves: 5678, views: 23456 },
    { id: 11, title: 'Floral Decor Ideas', category: 'decor', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop&q=80', saves: 4321, views: 18765 },
    { id: 12, title: 'Stage Decoration', category: 'decor', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=600&fit=crop&q=80', saves: 3987, views: 16543 },
    { id: 13, title: 'Entrance Decor', category: 'decor', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=600&fit=crop&q=80', saves: 3456, views: 14321 },
    
    // Venues
    { id: 14, title: 'Beach Wedding Venue', category: 'venues', image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=400&h=600&fit=crop&q=80', saves: 6789, views: 28765 },
    { id: 15, title: 'Palace Wedding Venue', category: 'venues', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop&q=80', saves: 5432, views: 24321 },
    { id: 16, title: 'Garden Wedding Setup', category: 'venues', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=600&fit=crop&q=80', saves: 4876, views: 21234 },
    
    // Photography
    { id: 17, title: 'Couple Photography Pose', category: 'photography', image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=600&fit=crop&q=80', saves: 7890, views: 32456 },
    { id: 18, title: 'Candid Wedding Shot', category: 'photography', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=600&fit=crop&q=80', saves: 6543, views: 28765 },
    { id: 19, title: 'Pre-Wedding Shoot', category: 'photography', image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=600&fit=crop&q=80', saves: 5876, views: 25432 },
    
    // Outfits
    { id: 20, title: 'Groom Sherwani', category: 'outfits', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&q=80', saves: 4321, views: 18765 },
    { id: 21, title: 'Sangeet Outfit', category: 'outfits', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop&q=80', saves: 3987, views: 16543 },
    { id: 22, title: 'Reception Gown', category: 'outfits', image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=600&fit=crop&q=80', saves: 5234, views: 22345 },
    { id: 23, title: 'Mehndi Outfit Ideas', category: 'outfits', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop&q=80', saves: 4567, views: 19876 },
    { id: 24, title: 'Haldi Ceremony Outfit', category: 'outfits', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop&q=80', saves: 3876, views: 17654 }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? inspirationItems 
    : inspirationItems.filter(item => item.category === selectedCategory);

  const handleSave = (itemId) => {
    setSavedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleItemClick = (item) => {
    navigate(`/user/inspirations/${item.id}`);
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
                Wedding Inspirations
              </h1>
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                {filteredItems.length} ideas to inspire your wedding
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/user/favourites')}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="heart" size="sm" style={{ color: theme.colors.primary[500] }} />
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: selectedCategory === category.id 
                  ? theme.colors.primary[500] 
                  : theme.semantic.background.accent,
                color: selectedCategory === category.id 
                  ? 'white' 
                  : theme.semantic.text.primary
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="px-4 py-4">
        <div className="columns-2 gap-3 space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="break-inside-avoid mb-3 cursor-pointer group"
              onClick={() => handleItemClick(item)}
            >
              <div 
                className="relative rounded-2xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-xl"
                style={{ backgroundColor: theme.semantic.background.accent }}
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80';
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
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

                  {/* Info on Hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 text-white/90 text-xs">
                      <span className="flex items-center gap-1">
                        <Icon name="heart" size="xs" />
                        {item.saves}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="eye" size="xs" />
                        {item.views}
                      </span>
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
            No inspirations found
          </h3>
          <p 
            className="text-sm text-center"
            style={{ color: theme.semantic.text.secondary }}
          >
            Try selecting a different category
          </p>
        </div>
      )}
    </div>
  );
};

export default Inspirations;
