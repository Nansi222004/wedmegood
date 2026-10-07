import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userApi from '../../../services/userApi';
import usePlatformSettings from '../../../hooks/usePlatformSettings';

const defaultCategoryMetadata = {
  venues: {
    name: 'Wedding Venues',
    count: '1,420+ Venues',
    tags: ['Banquet Halls', 'Lawns & Farmhouses', 'Palaces', 'Luxury Resorts'],
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=600&h=450&fit=crop&crop=center',
    badge: 'Popular'
  },
  photographers: {
    name: 'Photographers',
    count: '980+ Studios',
    tags: ['Candid Photography', 'Traditional', 'Cinematic Pre-Wedding', 'Drone'],
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=450&fit=crop&crop=center',
    badge: 'Trending'
  },
  decorators: {
    name: 'Decorators & Florists',
    count: '650+ Designers',
    tags: ['Mandap Design', 'Floral Styling', 'Ambient Lighting', 'Theme Stages'],
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop&crop=center',
    badge: 'Featured'
  },
  'makeup-artists': {
    name: 'Bridal Makeup',
    count: '820+ Artists',
    tags: ['HD Bridal Glam', 'Airbrush Makeup', 'Hairstyling', 'Saree Draping'],
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=450&fit=crop&crop=center',
    badge: 'Top Rated'
  },
  makeup: {
    name: 'Bridal Makeup',
    count: '820+ Artists',
    tags: ['HD Bridal Glam', 'Airbrush Makeup', 'Hairstyling', 'Saree Draping'],
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=450&fit=crop&crop=center',
    badge: 'Top Rated'
  },
  catering: {
    name: 'Catering & Feasts',
    count: '430+ Caterers',
    tags: ['Pure Vegetarian', 'Multi-Cuisine', 'Dessert Bars', 'Live Food Stations'],
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=450&fit=crop&crop=center',
    badge: 'Verified'
  },
  entertainment: {
    name: 'Entertainment & DJs',
    count: '310+ Artists',
    tags: ['Wedding DJs', 'Live Bands', 'Sangeet Choreography', 'Folk Troupe'],
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=450&fit=crop&crop=center',
    badge: 'Curated'
  }
};

const fallbackCategories = [
  {
    id: 'venues',
    name: 'Wedding Venues',
    count: '1,420+ Venues',
    tags: ['Banquet Halls', 'Lawns & Farmhouses', 'Palaces', 'Luxury Resorts'],
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=600&h=450&fit=crop&crop=center',
    badge: 'Popular',
    route: '/user/vendors/venues'
  },
  {
    id: 'photographers',
    name: 'Photographers',
    count: '980+ Studios',
    tags: ['Candid Photography', 'Traditional', 'Cinematic Pre-Wedding', 'Drone'],
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=450&fit=crop&crop=center',
    badge: 'Trending',
    route: '/user/vendors/photographers'
  },
  {
    id: 'decorators',
    name: 'Decorators & Florists',
    count: '650+ Designers',
    tags: ['Mandap Design', 'Floral Styling', 'Ambient Lighting', 'Theme Stages'],
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop&crop=center',
    badge: 'Featured',
    route: '/user/vendors/decorators'
  },
  {
    id: 'makeup-artists',
    name: 'Bridal Makeup',
    count: '820+ Artists',
    tags: ['HD Bridal Glam', 'Airbrush Makeup', 'Hairstyling', 'Saree Draping'],
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=450&fit=crop&crop=center',
    badge: 'Top Rated',
    route: '/user/vendors/makeup'
  },
  {
    id: 'catering',
    name: 'Catering & Feasts',
    count: '430+ Caterers',
    tags: ['Pure Vegetarian', 'Multi-Cuisine', 'Dessert Bars', 'Live Food Stations'],
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=450&fit=crop&crop=center',
    badge: 'Verified',
    route: '/user/vendors/catering'
  },
  {
    id: 'entertainment',
    name: 'Entertainment & DJs',
    count: '310+ Artists',
    tags: ['Wedding DJs', 'Live Bands', 'Sangeet Choreography', 'Folk Troupe'],
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=450&fit=crop&crop=center',
    badge: 'Curated',
    route: '/user/vendors/entertainment'
  }
];

const premierVendors = [
  {
    id: 'rajadhani-weddings',
    name: 'Rajadhani Royal Decorators',
    category: 'Wedding Decorators',
    rating: 4.9,
    reviews: 142,
    startingPrice: '₹1.5 Lakhs',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBP3vmHLpGwX6-J1pT9806eu73KSHxlCscZneWp7xnnYgzHNj5zahRWMGuEkntnTPlBSyG4AdOVPX3tt8zsZz4YP-RtVP2Fxp5fPvBA-3kM27o7UEe7qeqOTu8C4v20DvHVJidlmJ1hEt7KaugMrbBwIZqUa37n2rzYhKDFWC7OIjSOtff-4pBWSD3iRh4QBFiSiRjnAs2XsMJYF7z3AS6MSYf2CCuGQEZGKz6uik5_Gdfxuhr1ApuHWQ',
    route: '/user/vendors/decorators'
  },
  {
    id: 'moments-photography',
    name: 'Moments Cinematic Stories',
    category: 'Photography & Cinema',
    rating: 4.8,
    reviews: 98,
    startingPrice: '₹80,000 / day',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5TbBQR-ALDzFzf0Ez6fOwT990sV-3giyOJ8YZeGPQJQ8yr9h08EAPlQWiL56MJUR37bTOJka3uBlYwOwMhg09xtIhMyrCEVT8Sj2bmyoam9XXiYVaPe42jOARm2bU_aaF99GjRRGGhJWt1ytddpQLceCQoeUjiBdW09verMndqisF_7d4AJwinAZPqvNDbbMWilEqWD_kv92y3ZfGu638jST2hfHoTGnwLTtZTZd1cSk2QFJvkzZOgw',
    route: '/user/vendors/photographers'
  },
  {
    id: 'the-grand-venue',
    name: 'The Grand Heritage Palace',
    category: 'Palaces & Lawns',
    rating: 4.9,
    reviews: 210,
    startingPrice: '₹2,200 / plate',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzA86OHAcNR79LRKsKlxPf4X1ZLyLMmO4aYGOtxuCQSi8Yh5pFgIXi131DsGdiRtRX24UvekrvNUJIJHzwSvj_fzAP097El4ApQZGoqbwQZrwKGb1JfB2depmk-8qIE4jMcsTi9ttJz5lvg-Hdvv5ZDJSP69nev9Q4EewzBCLEGhpS618oV29rWRT-6BOrfeG0h1Ew7R37_SpnGgoq_FWPn6MYexn6HwiDEvuRktTwaAvkXt5AIArIXw',
    route: '/user/vendors/venues'
  }
];

const VendorsMain = () => {
  const { ratingsEnabled } = usePlatformSettings();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('selectedCity') || 'Hyderabad');
  const [categories, setCategories] = useState(fallbackCategories);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  // Sync city updates from header
  useEffect(() => {
    const handleCityChange = (e) => {
      if (e?.detail) setSelectedCity(e.detail);
    };
    window.addEventListener('city-changed', handleCityChange);
    return () => window.removeEventListener('city-changed', handleCityChange);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await userApi.getCategories();
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((cat) => {
            const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const meta = defaultCategoryMetadata[slug] || {};
            const subList = Array.isArray(cat.subCategories) && cat.subCategories.length > 0
              ? cat.subCategories.map((s) => s.name)
              : meta.tags || ['Verified Professionals', 'Exclusive Packages'];

            return {
              id: slug,
              dbId: cat._id,
              name: cat.name || meta.name,
              count: meta.count || '500+ Verified',
              tags: subList,
              rating: meta.rating || '4.8',
              image: cat.image || meta.image || defaultCategoryMetadata.venues.image,
              badge: meta.badge || 'Verified',
              route: `/user/vendors/${slug}`
            };
          });
          setCategories(mapped);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Falls back seamlessly to curated fallbackCategories
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

  const filterOptions = [
    'All',
    'Venues',
    'Photographers',
    'Decorators',
    'Makeup',
    'Catering',
    'Entertainment'
  ];

  const filteredCategories = categories.filter((cat) => {
    if (activeFilter === 'All') return true;
    const term = activeFilter.toLowerCase();
    return (
      cat.name.toLowerCase().includes(term) ||
      cat.id.toLowerCase().includes(term) ||
      cat.tags.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-stone-800 antialiased font-sans selection:bg-[#F2BDCD] selection:text-[#4F1325]">
      {/* Central Viewport Container */}
      <div className="max-w-[430px] md:max-w-4xl mx-auto min-h-screen bg-[#FAF7F2] relative overflow-hidden shadow-sm pb-28">
        
        {/* Subtle Luxury Corner Watermarks */}
        <div className="floral-bg-corner-top-right opacity-60 pointer-events-none" />
        <div className="floral-bg-corner-left opacity-60 pointer-events-none" />

        <div className="px-4 sm:px-6 pt-4 pb-6 relative z-10 space-y-5">
          
          {/* Header & City Title Banner (Clean, no second search bar) */}
          <div className="pt-1">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#651731] font-cinzel">
                  Royal Wedding Atelier
                </span>
              </div>
              <span className="text-[11px] font-semibold text-stone-600 bg-white/90 border border-stone-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                📍 {selectedCity}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#491221] tracking-tight leading-tight">
                Vendor Marketplace
              </h1>
              <span className="text-[11.5px] font-medium text-stone-500 font-cinzel">
                {categories.length} Disciplines
              </span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-stone-600 font-normal mt-0.5 leading-relaxed">
              Curated master artisans, venues, and luxury creators for your special day.
            </p>
          </div>

          {/* Quick Discipline Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-4 px-4 sm:-mx-6 sm:px-6 no-scrollbar select-none">
            {filterOptions.map((opt) => {
              const isActive = activeFilter === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setActiveFilter(opt)}
                  className={`px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#651731] text-[#FAF6F0] shadow-sm scale-[1.02]'
                      : 'bg-white/90 text-stone-600 border border-stone-200/80 hover:bg-stone-50 active:scale-95'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Category Cards Showcase */}
          <div className="space-y-2.5 pt-1">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="group relative bg-white/95 rounded-2xl p-4 sm:p-4.5 border border-[#E8DFC8]/70 hover:border-[#D4AF37] shadow-[0_2px_12px_rgba(74,18,36,0.03)] hover:shadow-[0_6px_20px_rgba(74,18,36,0.07)] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-serif font-bold text-[17px] sm:text-[19px] text-[#4F1325] tracking-tight group-hover:text-[#651731] transition-colors">
                        {category.name}
                      </h2>
                      {category.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF5F6] border border-[#F2BDCD] text-[9px] font-bold text-[#651731] uppercase tracking-wider">
                          {category.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-stone-500 font-medium leading-relaxed mt-1">
                      {Array.isArray(category.tags) ? category.tags.join(' • ') : category.tags}
                    </p>
                  </div>

                  <span className="text-[10.5px] font-bold text-[#8A2846] bg-[#FFF5F6] border border-[#F2BDCD]/70 px-2.5 py-1 rounded-full shrink-0">
                    {category.count}
                  </span>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between pt-2.5 border-t border-stone-100 mt-2">
                  <div className="flex items-center gap-2">
                    {ratingsEnabled && (
                      <>
                        <span className="text-[11px] font-semibold text-[#B38038] flex items-center gap-1">
                          ★ {category.rating}
                        </span>
                        <span className="text-stone-300">•</span>
                      </>
                    )}
                    <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                      Verified Partners
                    </span>
                  </div>
                  
                  <span className="text-[11.5px] font-bold text-[#651731] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Explore
                    <svg className="w-3.5 h-3.5 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24">
                      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Top-Rated Premier Wedding Artisans Section */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#651731] font-cinzel">
                  Handpicked Spotlight
                </span>
                <h3 className="font-serif font-bold text-lg text-[#4F1325]">
                  Featured Wedding Masters
                </h3>
              </div>
              <button
                onClick={() => navigate('/user/vendors/all')}
                className="text-[11px] font-bold text-[#8A2846] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {premierVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => navigate(vendor.route)}
                  className="bg-white rounded-xl p-2.5 border border-[#E8DFC8]/60 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative w-full h-28 rounded-lg overflow-hidden mb-2 bg-stone-100">
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {ratingsEnabled && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9.5px] font-semibold text-[#ECC880] flex items-center gap-0.5">
                        ★ {vendor.rating} ({vendor.reviews})
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-[13px] text-stone-900 tracking-tight leading-snug truncate group-hover:text-[#651731] transition-colors">
                      {vendor.name}
                    </h4>
                    <p className="text-[10.5px] text-stone-500 font-medium truncate mt-0.5">
                      {vendor.category}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-100">
                    <span className="text-[10.5px] font-bold text-[#651731]">
                      {vendor.startingPrice}
                    </span>
                    <span className="text-[10px] font-semibold text-stone-500 group-hover:text-[#651731] flex items-center">
                      View →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complimentary Concierge / Genie Services Card */}
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#4F1325] to-[#651731] p-4 text-white shadow-md flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#E2BA62] font-cinzel">
                Personalized Assistance
              </span>
              <h4 className="font-serif font-bold text-base text-white leading-tight">
                Need Help Selecting Vendors?
              </h4>
              <p className="text-[11px] text-[#FAF6F0]/80 leading-snug">
                Let our dedicated Wedding Genie negotiate packages & curate top recommendations.
              </p>
            </div>
            <button
              onClick={() => navigate('/user/genie-services')}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#ECC880] text-[#4F1325] text-[11px] font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all"
            >
              Ask Genie
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VendorsMain;