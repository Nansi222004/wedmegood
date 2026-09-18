import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import userApi from '../../../services/userApi';

const defaultCategoryImages = {
  'venues': 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=400&h=400&fit=crop&crop=center',
  'photographers': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=400&fit=crop&crop=center',
  'catering': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop&crop=center',
  'makeup-artists': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center',
  'decorators': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=400&fit=crop&crop=center',
  'wedding-planners': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=400&fit=crop&crop=center',
  'bridal-wear': 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&crop=center',
  'groom-wear': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center',
  'mehendi-artists': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=400&fit=crop&crop=center',
  'jewellery': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center',
  'wedding-invitations': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=400&fit=crop&crop=center',
  'choreographers': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
  'music-djs': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop&crop=center'
};

const VendorsMain = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedCity] = useState('Indore');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await userApi.getCategories();
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map(cat => {
            const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const subList = Array.isArray(cat.subCategories) ? cat.subCategories.map(s => s.name).join(', ') : '';
            return {
              id: slug,
              dbId: cat._id,
              name: cat.name,
              subtitle: subList || cat.description || 'Verified Wedding Professionals',
              image: cat.image || defaultCategoryImages[slug] || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop&crop=center',
              route: `/user/vendors/${slug}`
            };
          });
          setCategories(mapped);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load marketplace categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (category) => {
    navigate(category.route, { 
      state: { 
        category: category.id,
        categoryTitle: category.name 
      } 
    });
  };

  const handleSearchClick = () => {
    navigate('/user/search');
  };

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/vendors/all?search=${encodeURIComponent(searchQuery.trim())}`, {
        state: { category: 'all', categoryTitle: 'All Categories', search: searchQuery.trim() }
      });
    } else {
      navigate('/user/search');
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#EAE1D8' }}>
      {/* 1. Atelier Header - Arched Surface */}
      <div 
        className="px-8 pt-10 pb-12 rounded-b-[3rem] bg-white shadow-sm border-b border-[#3D2B2B]/5 relative z-10"
      >
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#BE185D]"></span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#3D2B2B]/30">Curation Service</span>
           </div>
           <button 
             type="button"
             onClick={handleSearchClick}
             className="w-10 h-10 rounded-full flex items-center justify-center bg-[#EAE1D8]/30 border border-[#EAE1D8] hover:bg-[#EAE1D8]/60 transition-all cursor-pointer"
             title="Search all vendors"
             aria-label="Search all vendors"
           >
              <Icon name="search" size="xs" style={{ color: '#3D2B2B' }} />
           </button>
        </div>

        <div className="space-y-1">
           <h1 className="text-[2.75rem] font-bold text-[#3D2B2B] leading-none mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
             The Atelier
           </h1>
           <div className="flex items-center gap-2 text-[#BE185D]">
              <Icon name="location" size="xs" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ fontFamily: '"Outfit", sans-serif' }}>{selectedCity}</span>
              <Icon name="chevronDown" size="xs" />
           </div>
        </div>

        {/* Interactive Search Bar on Discovery Landing */}
        <form onSubmit={handleSearchSubmit} className="mt-5 relative">
          <div className="relative flex items-center">
            <button
              type="submit"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#BE185D] transition-colors cursor-pointer"
              title="Search"
            >
              <Icon name="search" size="xs" />
            </button>
            <input
              type="text"
              placeholder="Search all vendors, services, or cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-[#3D2B2B] focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 focus:bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-[#BE185D] text-white text-[11px] font-bold hover:bg-[#9D174D] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* 2. Collections Grid - Arched Cards */}
      <div className="px-8 -mt-6 relative z-20 space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm">
            <div className="w-8 h-8 border-3 border-[#BE185D] border-t-transparent animate-spin rounded-full mx-auto mb-3"></div>
            <p className="text-xs font-bold text-[#3D2B2B]/60 uppercase tracking-widest">Loading Marketplace Categories...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-sm text-red-600 text-xs font-semibold">
            {error}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-sm text-[#3D2B2B]/60 text-xs">
            No marketplace categories available.
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="bg-white rounded-[2.5rem] p-6 flex items-center gap-5 shadow-sm border border-black/5 hover:shadow-md active:scale-95 transition-all group cursor-pointer"
            >
              {/* Visual Anchor */}
              <div className="relative w-16 h-16 shrink-0">
                 <div className="absolute inset-0 rounded-full bg-gray-50 scale-125 group-hover:scale-135 transition-transform duration-500"></div>
                 <img 
                   src={category.image} 
                   alt={category.name}
                   className="w-full h-full rounded-full object-cover relative z-10 border border-white shadow-sm"
                 />
              </div>

              {/* Editorial Copy */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-lg font-bold text-[#3D2B2B] truncate leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                    {category.name}
                  </h3>
                  <Icon name="arrowRight" size="xs" style={{ color: '#3D2B2B/20' }} />
                </div>
                <p className="text-[9px] font-medium text-[#3D2B2B]/40 leading-relaxed uppercase tracking-widest truncate italic">
                  {category.subtitle}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Global Action Bar Spacing */}
      <div className="h-10"></div>
    </div>
  );
};

export default VendorsMain;