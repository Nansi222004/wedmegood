import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import userApi from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';

const Inspirations = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [savedMap, setSavedMap] = useState(new Map()); // title -> mongoId
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load public vendor gallery
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    userApi.getInspirationGallery({
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      limit: 30
    })
      .then(res => {
        if (isMounted && res.success && Array.isArray(res.data?.items) && res.data.items.length > 0) {
          setGalleryItems(res.data.items.map(item => ({
            id: item._id,
            title: item.title,
            category: item.category,
            image: item.image,
            saves: item.likesCount || 0,
            views: 120,
            vendorId: item.vendorId,
            vendorBusinessName: item.vendorBusinessName
          })));
        } else if (isMounted) {
          setGalleryItems([]);
        }
      })
      .catch(err => console.warn('Inspiration gallery fetch error:', err.message))
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, [selectedCategory]);

  useEffect(() => {
    if (user) {
      userApi.getInspirations()
        .then(res => {
          if (res.success && res.data) {
            const map = new Map();
            res.data.forEach(item => {
              map.set(item.title, item._id);
            });
            setSavedMap(map);
          }
        })
        .catch(err => console.error('Error fetching saved inspirations:', err));
    }
  }, [user]);

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

  const displayItems = galleryItems.length > 0
    ? galleryItems
    : (selectedCategory === 'all' 
        ? inspirationItems 
        : inspirationItems.filter(item => item.category === selectedCategory));

  const filteredItems = displayItems;

  const handleSave = async (item) => {
    if (!user) {
      toast.info('Please log in to save wedding inspiration ideas.');
      navigate('/login', { state: { from: '/user/inspirations' } });
      return;
    }
    const isSaved = savedMap.has(item.title);
    const existingId = savedMap.get(item.title);

    try {
      if (isSaved && existingId) {
        setSavedMap(prev => {
          const next = new Map(prev);
          next.delete(item.title);
          return next;
        });
        await userApi.deleteInspiration(existingId);
      } else {
        const res = await userApi.saveInspiration({
          title: item.title,
          image: item.image,
          category: item.category,
          sourceType: 'user'
        });
        if (res.success && res.data?._id) {
          setSavedMap(prev => {
            const next = new Map(prev);
            next.set(item.title, res.data._id);
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Failed to update inspiration save state:', err);
      userApi.getInspirations().then(r => {
        if (r.success && r.data) {
          const map = new Map();
          r.data.forEach(i => map.set(i.title, i._id));
          setSavedMap(map);
        }
      });
    }
  };

  const handleItemClick = (item) => {
    navigate(`/user/inspirations/${item.id}`);
  };

  return (
    <div className="min-h-screen pb-20 bg-transparent">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 flex-shrink-0 rounded-2xl bg-white shadow-sm border border-white flex items-center justify-center active:scale-95 transition-all text-[#4A2B42]"
            >
              <Icon name="chevronLeft" size="sm" />
            </button>
            <div>
              <h1 
                className="text-[28px] font-bold text-[#4A2B42] leading-tight"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Wedding Inspirations
              </h1>
              <p className="text-[13px] text-[#6B6C80] leading-snug mt-1">
                {filteredItems.length} ideas to inspire your wedding
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/user/favourites')}
            className="w-12 h-12 flex-shrink-0 rounded-2xl bg-white shadow-sm border border-white flex items-center justify-center active:scale-95 transition-all text-[#9D3875]"
          >
            <Icon name="heart" size="sm" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="relative pb-3">
          <div className="flex gap-2 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200 flex items-center gap-2 shadow-sm border border-white/50 ${
                  selectedCategory === category.id 
                    ? 'bg-[#8A3A69] text-white' 
                    : 'bg-white/80 text-[#4A2B42] hover:bg-white'
                }`}
              >
                <Icon 
                  name={category.icon} 
                  size="xs" 
                  className={selectedCategory === category.id ? 'text-white' : 'text-[#8A3A69]'}
                />
                {category.name}
              </button>
            ))}
          </div>
          {/* Decorative bottom line */}
          <div className="absolute bottom-0 left-0 right-0 flex">
             <div className="h-0.5 bg-[#8A3A69]" style={{ width: '70px', borderRadius: '2px' }}></div>
             <div className="h-0.5 bg-[#8A3A69]/10 flex-1 rounded-r-sm"></div>
          </div>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="px-4 py-3">
        <div className="columns-2 gap-3 space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="break-inside-avoid mb-3 cursor-pointer group relative"
              onClick={() => handleItemClick(item)}
            >
              <div className="relative rounded-[20px] overflow-hidden shadow-sm">
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80';
                  }}
                />
                
                {/* Save Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave(item);
                  }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <Icon 
                    name="heart" 
                    size="sm" 
                    style={{ 
                      color: savedMap.has(item.title) ? '#9D3875' : '#4A2B42' 
                    }} 
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 rounded-full bg-white/60 backdrop-blur shadow-sm flex items-center justify-center mb-4 border border-white">
            <Icon name="search" size="lg" className="text-[#4A2B42]/50" />
          </div>
          <h3 className="text-[17px] font-bold text-[#4A2B42] mb-1">
            No inspirations found
          </h3>
          <p className="text-[13px] text-[#6B6C80]">
            Try selecting a different category
          </p>
        </div>
      )}
    </div>
  );
};

export default Inspirations;
