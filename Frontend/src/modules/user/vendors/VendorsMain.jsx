import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';

const VendorsMain = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedCity] = useState('Indore');
  const [hoveredIcon, setHoveredIcon] = useState(null);

  // Vendor categories with exact styling from reference
  const vendorCategories = [
    {
      id: 'invites-gifts',
      name: 'Invites & Gifts',
      subtitle: 'Invitations, Favors, Trousseau Packages',
      bgColor: '#f3e8ff', // Light purple
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/invites-gifts'
    },
    {
      id: 'food',
      name: 'Food',
      subtitle: 'Catering Services, Cake, Chaat & Food Stalls',
      bgColor: '#fce7f3', // Light pink
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/food'
    },
    {
      id: 'pre-wedding-shoot',
      name: 'Pre Wedding Shoot',
      subtitle: 'Pre Wedding Photographers',
      bgColor: '#dbeafe', // Light blue
      image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/pre-wedding-shoot'
    },
    {
      id: 'bridal-wear',
      name: 'Bridal Wear',
      subtitle: 'Bridal Lehengas, Kanjeevaram / Silk Sarees',
      bgColor: '#f0fdf4', // Light green
      image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/bridal-wear'
    },
    {
      id: 'groom-wear',
      name: 'Groom Wear',
      subtitle: 'Sherwani, Wedding Suits / Tuxes, Sehra',
      bgColor: '#f0f9ff', // Light cyan
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/groom-wear'
    },
    {
      id: 'jewellery',
      name: 'Jewellery',
      subtitle: 'Jewellery, Flower Jewellery, Bridal Jewellery',
      bgColor: '#fef3c7', // Light yellow
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/jewellery'
    },
    {
      id: 'pandits',
      name: 'Pandits',
      subtitle: 'Wedding Pandits',
      bgColor: '#fed7aa', // Light orange
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/pandits'
    },
    {
      id: 'mehndi',
      name: 'Mehndi',
      subtitle: 'Mehendi Artists',
      bgColor: '#f3e8ff', // Light purple
      image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/mehndi'
    },
    {
      id: 'music-dance',
      name: 'Music & Dance',
      subtitle: 'DJs, Sangeet Choreographer, Wedding Entertainment',
      bgColor: '#fce7f3', // Light pink
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/music-dance'
    },
    {
      id: 'venues',
      name: 'Venues',
      subtitle: 'Banquet Halls, Marriage Garden / Lawn',
      bgColor: '#dbeafe', // Light blue
      image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/venues'
    },
    {
      id: 'photographers',
      name: 'Photographers',
      subtitle: 'Photographers',
      bgColor: '#fce7f3', // Light pink
      image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/photographers'
    },
    {
      id: 'makeup',
      name: 'Makeup',
      subtitle: 'Bridal Makeup Artists',
      bgColor: '#fecaca', // Light red
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/makeup'
    },
    {
      id: 'planning-decor',
      name: 'Planning & Decor',
      subtitle: 'Wedding Planners, Decorators',
      bgColor: '#fed7aa', // Light orange
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/planning-decor'
    },
    {
      id: 'virtual-planning',
      name: 'Virtual Planning',
      subtitle: 'Virtual planning',
      bgColor: '#f0fdf4', // Light green
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop&crop=center',
      route: '/user/vendors/virtual-planning'
    }
  ];

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
           <button className="w-10 h-10 rounded-full flex items-center justify-center bg-[#EAE1D8]/30 border border-[#EAE1D8]">
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
      </div>

      {/* 2. Collections Grid - Arched Cards */}
      <div className="px-8 -mt-6 relative z-20 space-y-4">
        {vendorCategories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            className="bg-white rounded-[2.5rem] p-6 flex items-center gap-5 shadow-sm border border-black/5 hover:shadow-md active:scale-95 transition-all group"
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
        ))}
      </div>

      {/* 3. Global Action Bar Spacing */}
      <div className="h-10"></div>
    </div>
  );
};

export default VendorsMain;