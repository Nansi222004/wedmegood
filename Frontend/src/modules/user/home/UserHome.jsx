import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import userApi from '../../../services/userApi';

const UserHome = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState('wedding');
  const [favorites, setFavorites] = useState(new Set());

  // Dynamic data states with robust fallbacks matching exact mock design
  const [featuredVendors, setFeaturedVendors] = useState([
    {
      id: 'rajadhani-weddings',
      name: 'Rajadhani Weddings',
      category: 'Wedding Decorators',
      city: 'Hyderabad',
      rating: 4.9,
      isPremium: true,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBP3vmHLpGwX6-J1pT9806eu73KSHxlCscZneWp7xnnYgzHNj5zahRWMGuEkntnTPlBSyG4AdOVPX3tt8zsZz4YP-RtVP2Fxp5fPvBA-3kM27o7UEe7qeqOTu8C4v20DvHVJidlmJ1hEt7KaugMrbBwIZqUa37n2rzYhKDFWC7OIjSOtff-4pBWSD3iRh4QBFiSiRjnAs2XsMJYF7z3AS6MSYf2CCuGQEZGKz6uik5_Gdfxuhr1ApuHWQ',
      route: '/user/vendors/decorators'
    },
    {
      id: 'moments-photography',
      name: 'Moments Photography',
      category: 'Photography & Videography',
      city: 'Hyderabad',
      rating: 4.8,
      isPremium: true,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5TbBQR-ALDzFzf0Ez6fOwT990sV-3giyOJ8YZeGPQJQ8yr9h08EAPlQWiL56MJUR37bTOJka3uBlYwOwMhg09xtIhMyrCEVT8Sj2bmyoam9XXiYVaPe42jOARm2bU_aaF99GjRRGGhJWt1ytddpQLceCQoeUjiBdW09verMndqisF_7d4AJwinAZPqvNDbbMWilEqWD_kv92y3ZfGu638jST2hfHoTGnwLTtZTZd1cSk2QFJvkzZOgw',
      route: '/user/vendors/photographers'
    },
    {
      id: 'the-grand-venue',
      name: 'The Grand Venue',
      category: 'Banquet Halls',
      city: 'Hyderabad',
      rating: 4.7,
      isPremium: true,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzA86OHAcNR79LRKsKlxPf4X1ZLyLMmO4aYGOtxuCQSi8Yh5pFgIXi131DsGdiRtRX24UvekrvNUJIJHzwSvj_fzAP097El4ApQZGoqbwQZrwKGb1JfB2depmk-8qIE4jMcsTi9ttJz5lvg-Hdvv5ZDJSP69nev9Q4EewzBCLEGhpS618oV29rWRT-6BOrfeG0h1Ew7R37_SpnGgoq_FWPn6MYexn6HwiDEvuRktTwaAvkXt5AIArIXw',
      route: '/user/vendors/venues'
    }
  ]);

  const trendingInspirations = [
    {
      id: 'mandap-ideas',
      title: 'Mandap Ideas',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqdSfRnr_IFR-g2BkIGf86d9BOOwGs-uOERoALBHP5Qv6IgAfwH6LqbswE4720xnf6BlXgxturn-Q_etlSv5tew_Z6y0k9yorji3N2tUj6ymFXJCOa3o2YNwCiyxsz5iIqibbo_MFke6iqpVosBvOYR8-r1szjASHsn9ID4jg9LEa5dvefPZfkpoLIjZ1i7TcAN1WK0F_wUlm1UQ2fTZ2npYmNoMmI-Uo3LVUKSYDJvH94a3_EsFOfGg',
      route: '/user/decor/mandap'
    },
    {
      id: 'reception-decor',
      title: 'Reception Decor',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIR3I3cophLBewsaI7WLpc1edyaXWN8cSJx1l_NBbfCzqhE2K3oJN0ljv4LtgYBaO3RISXSirnGel3g2bDKM1QhqiOFmtCFg2CSkgP-WgPv0z80yhnJV0QlO2uOOUvRx9Nwf1zfQnhJNwaC48ss5Bcr26rWv2MKg2DkiF7bhItdL2ifRhuJ6jAvJnL7ndoYmTyQ0di5NBNFo44XJI3G5PFWczHd-JlVzM6_17ynj_FSvtHhVQvcfdp3A',
      route: '/user/decor/reception'
    },
    {
      id: 'bridal-looks',
      title: 'Bridal Looks',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTL0u6065YQJoAswuEjEw-kdQG2lXxp9UgA0TYI3w6axkYzZKSpiCa9wL2Xufx8EGW37tmEDNOTu3DHlWf0bSNWvHZS68Vbq9LbomJf-_UXxUZM_teVlCcfY5TaSw-bHKjohVOlO-tufGfF22isu9Ux7bIdlTE3iSOgHlialN29m7JUTSMyw7dgBzvfMDZANEt-6bM1RTjc2NVnbpB4PqpXjfqkpI0nr3QA-6Bp-HEKiz6FB1ia30jvQ',
      route: '/user/bridal-looks/makeup'
    },
    {
      id: 'outdoor-weddings',
      title: 'Outdoor Weddings',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk4M6KCDXkp-wW9hQ9qtsXLWnAIH-syoqIhkPiBapmdqec-ZGbYW90SKfAx9PNCmq_g_lS93yLAUZB8xUlBsQK-YlHmf0YyJaqsym4HmkeNwqV3kRJ4MS08zZ2x9bSCRkzh9yL9dkLWb4KbpzUXYgf47pqEbq0N7uLtS5NYhcSsf6dadpess138PTFDl7YuqJ43PG1LKAu3UTfRqkHUgobB-H0Pav0uU1hirMHVYl_tPtK-LAMfaa0_g',
      route: '/user/venues/outdoor'
    }
  ];

  const categories = [
    {
      id: 'wedding',
      name: 'Wedding',
      route: '/user/vendors/venues',
      icon: (
        <svg className="w-7 h-7 text-[#7D1D3A]" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
          <circle cx="9" cy="14" r="5" />
          <circle cx="15" cy="14" r="5" />
          <path d="M12 9 L12 5 M10 6 L14 6" strokeLinecap="round" />
          <circle cx="12" cy="4" fill="#7D1D3A" r="1.5" stroke="none" />
        </svg>
      ),
      activeBg: 'bg-[#FFF5F6] border-[#F2BDCD]'
    },
    {
      id: 'engagement',
      name: 'Engagement',
      route: '/user/vendors/venues',
      icon: (
        <svg className="w-7 h-7 text-[#8B6743]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M6 9l6-6 6 6-6 12-6-12z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 9h12 M9 3l3 6 3-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      activeBg: 'bg-[#F6F4F0] border-stone-200/80'
    },
    {
      id: 'birthday',
      name: 'Birthday',
      route: '/user/vendors/catering',
      icon: (
        <svg className="w-7 h-7 text-[#A06C34]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M4 14h16v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z M6 10h12v4H6v-4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 7v3 M12 7v3 M15 7v3 M9 4.5h.01 M12 4.5h.01 M15 4.5h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      activeBg: 'bg-[#FBF3EA] border-[#ECD9C5]/80'
    },
    {
      id: 'baby-celebration',
      name: 'Baby\nCelebration',
      route: '/user/vendors/decorators',
      icon: (
        <svg className="w-7 h-7 text-[#91586E]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M4 8h11a4 4 0 014 4v3H6a3 3 0 01-3-3V8zm12-4l3 4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8" cy="19" r="2" />
          <circle cx="16" cy="19" r="2" />
        </svg>
      ),
      activeBg: 'bg-[#F8F1F3] border-[#E9D9E0]/80'
    },
    {
      id: 'anniversary',
      name: 'Anniversary',
      route: '/user/vendors/photographers',
      icon: (
        <svg className="w-7 h-7 text-[#87334D]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      activeBg: 'bg-[#FAF0F3] border-[#ECD1DA]/80'
    },
    {
      id: 'housewarming',
      name: 'Housewarming',
      route: '/user/vendors/catering',
      icon: (
        <svg className="w-7 h-7 text-[#73684B]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      activeBg: 'bg-[#F5F5EE] border-stone-200/80'
    },
    {
      id: 'festivals',
      name: 'Festivals',
      route: '/user/festivals',
      icon: (
        <svg className="w-7 h-7 text-[#9B702B]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M12 4c1 3 3 5 5 7-2 1-3 3-5 5-2-2-3-4-5-5 2-2 4-4 5-7z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 14c-2 0-3 2-2 4 2 2 8 3 8 3s6-1 8-3c1-2 0-4-2-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      activeBg: 'bg-[#FCF6EB] border-[#EBDCB9]/80'
    },
    {
      id: 'other',
      name: 'Other\nCelebrations',
      route: '/user/vendors',
      icon: (
        <div className="w-8 h-8 rounded-full border border-dashed border-[#8E445E] flex items-center justify-center">
          <svg className="w-5 h-5 text-[#8E445E]" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="19" cy="12" r="1.7" />
          </svg>
        </div>
      ),
      activeBg: 'bg-[#FAF0F2] border-[#EACED5]/80'
    }
  ];

  // Toggle favorite helper
  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Fetch real vendors if available from backend, with graceful fallback
  useEffect(() => {
    let isMounted = true;
    userApi.getVendors({ limit: 6 })
      .then(res => {
        if (!isMounted) return;
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.slice(0, 5).map((v, idx) => ({
            id: v._id || `vendor-${idx}`,
            name: v.businessName || v.name,
            category: v.category || 'Wedding Specialist',
            city: v.city || 'Hyderabad',
            rating: v.rating && v.rating > 0 ? v.rating : 4.8,
            isPremium: true,
            image: v.portfolio?.[0]?.url || v.profileImage || featuredVendors[idx % featuredVendors.length]?.image,
            route: `/user/vendor/${v._id || v.id}`
          }));
          setFeaturedVendors(mapped);
        }
      })
      .catch(() => {
        // Keep pristine fallback
      });

    if (isAuthenticated) {
      userApi.getUnreadNotificationCount?.()
        .then(res => {
          if (isMounted && typeof res?.count === 'number') {
            setUnreadNotifications(res.count);
          }
        })
        .catch(() => {});
    }

    return () => { isMounted = false; };
  }, [isAuthenticated]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/user/vendors');
    }
  };

  return (
    <div className="font-sans antialiased text-gray-800 flex justify-center min-h-screen py-0 md:py-6 selection:bg-[#F2BDCD] selection:text-[#4F1325]">
      {/* Mobile Viewport Container */}
      <div className="relative w-full max-w-[430px] md:max-w-4xl bg-[#FAF6F0] min-h-screen overflow-x-hidden shadow-2xl md:rounded-[44px] border border-stone-200/60 pb-28 flex flex-col">
        
        {/* BEGIN: Watermark & Botanical Accents */}
        <div className="floral-bg-corner-top-right">
          <svg className="w-full h-full fill-none opacity-80" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
            <path d="M160 0 C120 20 90 70 85 110 C80 90 110 50 160 0 Z" fill="#93688C" opacity="0.45" />
            <path d="M160 25 C130 50 110 90 120 135 C110 100 130 60 160 25 Z" fill="#C8A2C8" opacity="0.35" />
            <path d="M160 60 C135 75 115 115 125 155 C120 120 145 85 160 60 Z" fill="#D4AF37" opacity="0.4" />
            <path d="M110 0 C95 40 105 85 140 115 C115 80 100 40 110 0 Z" fill="#7D4668" opacity="0.3" />
          </svg>
        </div>
        <div className="floral-bg-corner-left">
          <svg className="w-full h-full fill-none" viewBox="0 0 80 160" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60 C35 75 45 105 40 140 C28 110 15 90 0 60 Z" fill="#966F8D" opacity="0.35" />
            <path d="M0 90 C25 100 35 120 20 155 C15 130 5 115 0 90 Z" fill="#D4AF37" opacity="0.3" />
          </svg>
        </div>
        {/* END: Watermark & Botanical Accents */}

        {/* BEGIN: Main Hero Carousel Banner */}
        <section className="px-4 pt-3 pb-2 relative z-20" data-purpose="hero-carousel">
          <div className="relative w-full h-[218px] rounded-[24px] overflow-hidden shadow-lg border border-stone-200/50 bg-[#320817]">
            {/* Right Background Photo (Mandap on Beach sunset with chandelier) */}
            <img 
              alt="Wedding floral mandap celebration" 
              className="absolute inset-0 w-full h-full object-cover object-right" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI0w-im307tmJvKsLMMCJIFpi1Fu-zYWthuk3q3mJO9ACefh9bSBDnmYet6q9DIRgsln6J4pGUYKy-5SOPU2NGJIUEd6gUihnq06FlV3g1x135id-OEYOxT12QJdPXh5cLCFvk0mrUqbeXPP43_LSS9jibKrwGniidu_tHO7z85i7RM7WitiKwa2cNe-rExnz-XXRIaDzhNJU_addF81pr1GHEB-A7u-bnNQzs5a0m7F7fi_2skNPo-Q" 
            />
            {/* Left Luxury Maroon Vignette Overlay */}
            <div className="absolute inset-0 hero-gradient" />

            {/* Hero Content (Left) */}
            <div className="absolute inset-y-0 left-0 w-[62%] p-5 flex flex-col justify-between z-10">
              <div>
                <h1 className="font-serif text-white text-[22px] leading-[1.18] tracking-tight font-medium drop-shadow-sm">
                  Beautiful<br />
                  Celebrations<br />
                  Brighter Lives
                </h1>
                <p className="text-rose-100/80 text-[11px] font-normal leading-snug mt-2 drop-shadow-sm">
                  Find trusted vendors<br />for your special moments
                </p>
              </div>
              <div>
                {/* Explore Now Pill Button */}
                <button 
                  onClick={() => navigate('/user/vendors')}
                  className="bg-gradient-to-r from-[#F9E2B2] via-[#E7C78D] to-[#D8B171] text-[#360918] px-4 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center space-x-1.5 active:scale-95 transition-transform"
                >
                  <span>Explore Now</span>
                  <span className="text-sm font-bold">→</span>
                </button>
                {/* Carousel Pagination Dots */}
                <div className="flex items-center space-x-1.5 mt-3 pl-1">
                  <span className="w-3.5 h-1.5 rounded-full bg-white" />
                  <span className="w-1.5 h-1.5 rounded-full border border-white/80" />
                  <span className="w-1.5 h-1.5 rounded-full border border-white/80" />
                  <span className="w-1.5 h-1.5 rounded-full border border-white/80" />
                </div>
              </div>
            </div>

            {/* Script Overlay on Banner (Right Side) */}
            <div className="absolute right-3.5 top-6 text-right pointer-events-none z-10 flex flex-col items-end">
              <span className="font-script text-white text-[23px] leading-tight tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] transform -rotate-3">
                More than Events
              </span>
              <span className="font-script text-white text-[21px] leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] transform -rotate-3 mt-0.5">
                Memories for Life ♡
              </span>
            </div>
          </div>
        </section>
        {/* END: Main Hero Carousel Banner */}

        {/* BEGIN: What Are You Celebrating Grid */}
        <section className="px-4 pt-3 pb-2 relative z-10" data-purpose="celebration-categories">
          {/* Section Header */}
          <div className="flex justify-between items-baseline mb-2.5">
            <h2 className="font-serif text-[18.5px] font-semibold text-stone-900 tracking-tight">What are you celebrating?</h2>
            <button 
              onClick={() => navigate('/user/vendors')}
              className="text-[#5B1228] text-[12.5px] font-semibold flex items-center space-x-0.5 hover:underline focus:outline-none"
            >
              <span>View All</span>
              <span className="text-xs">→</span>
            </button>
          </div>

          {/* Categories 4x2 Grid */}
          <div className="grid grid-cols-4 gap-2.5 text-center">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <div 
                  key={cat.id} 
                  className="flex flex-col items-center"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    navigate(cat.route);
                  }}
                >
                  <div 
                    className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center p-2 cursor-pointer active:scale-95 transition-all duration-200 ${
                      isSelected 
                        ? 'bg-[#FFF5F6] border-2 border-[#F2BDCD] shadow-sm scale-[1.02]' 
                        : `${cat.activeBg} border shadow-xs hover:border-stone-300`
                    }`}
                  >
                    {cat.icon}
                  </div>
                  <span className="text-[11.5px] font-medium text-stone-800 mt-1.5 leading-tight whitespace-pre-line">
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        {/* END: What Are You Celebrating Grid */}

        {/* BEGIN: Plan. Connect. Celebrate Banner Card */}
        <section className="px-4 py-2.5 relative z-10" data-purpose="promo-value-proposition">
          <div className="w-full bg-[#F3EBE7] rounded-[22px] p-3.5 shadow-sm border border-[#E5D7D1] relative overflow-hidden flex flex-col justify-between">
            {/* Right Background Floral & Script Accent */}
            <div className="absolute -right-2 inset-y-0 w-[42%] pointer-events-none overflow-hidden rounded-r-[22px] flex items-center justify-end">
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#F3EBE7]/40 to-[#F3EBE7] z-10" />
              <img 
                alt="Lilac watercolor floral arrangement" 
                className="w-full h-full object-cover opacity-80" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMuK_RvTy9Yigzv6LdLOYr9PCqV5LI6YawdToMNO3JoV-JnNHAlXUrPvOTIWXImeWckdiQihkAjr3UovkGXccUGUHFsNIbMmxCBeZE06FrMfwTXBxAYTjCiq5ZejlkmAJTlbDlxdfmNGJljNeQmYjPB489pI_zUVxH-RqOMkGM_0DOx3YiN6mAIasrVKedTiWnStb40SRkTmoAgQMaDOsMRGfRhT-4sHFykNzqr43itWrn8RW8v-KKBA" 
              />
              {/* Calligraphy Overlay */}
              <div className="absolute right-3.5 top-6 z-20 text-right leading-tight">
                <span className="font-script text-[21px] text-[#42111E] drop-shadow-sm block transform -rotate-6">Good Things</span>
                <span className="font-script text-[18px] text-[#42111E] drop-shadow-sm block transform -rotate-6 mt-0.5">Happen Here ♡</span>
              </div>
            </div>

            {/* Upper Banner Content */}
            <div className="relative z-20 max-w-[65%]">
              <h3 className="font-serif text-[17px] font-bold text-stone-900 tracking-tight">Plan. Connect. Celebrate.</h3>
              <p className="text-stone-600 text-[11px] leading-snug mt-1">
                Everything you need for your special day in one place.
              </p>
              <button 
                onClick={() => navigate('/user/planning-dashboard')}
                className="mt-2.5 bg-[#4F1325] text-white text-[11px] font-medium px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 shadow-sm active:scale-95 transition-transform"
              >
                <span>See How It Works</span>
                <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            {/* Lower Value Props (4 Pillars) */}
            <div className="relative z-20 grid grid-cols-4 gap-1 pt-3.5 mt-2 border-t border-stone-300/40 text-center">
              {/* 1. Verified Vendors */}
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 flex items-center justify-center text-[#825325]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[9.5px] font-semibold text-stone-700 leading-tight mt-0.5">Verified<br />Vendors</span>
              </div>
              {/* 2. Transparent Pricing */}
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 flex items-center justify-center text-[#825325]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[9.5px] font-semibold text-stone-700 leading-tight mt-0.5">Transparent<br />Pricing</span>
              </div>
              {/* 3. Direct Connect */}
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 flex items-center justify-center text-[#825325]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[9.5px] font-semibold text-stone-700 leading-tight mt-0.5">Direct<br />Connect</span>
              </div>
              {/* 4. Hassle Free Experience */}
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 flex items-center justify-center text-[#825325]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[9.5px] font-semibold text-stone-700 leading-tight mt-0.5">Hassle Free<br />Experience</span>
              </div>
            </div>
          </div>
        </section>
        {/* END: Plan. Connect. Celebrate Banner Card */}

        {/* BEGIN: Trending Inspirations Horizontal Carousel */}
        <section className="pt-2 pb-2.5" data-purpose="trending-inspirations">
          <div className="px-4 flex justify-between items-baseline mb-2">
            <h2 className="font-serif text-[18px] font-semibold text-stone-900 tracking-tight">Trending Inspirations</h2>
            <button 
              onClick={() => navigate('/user/inspirations')}
              className="text-[#5B1228] text-[12.5px] font-semibold flex items-center space-x-0.5 hover:underline focus:outline-none"
            >
              <span>See All</span>
              <span className="text-xs">→</span>
            </button>
          </div>

          {/* Horizontal Scrollable Cards */}
          <div className="flex space-x-3 overflow-x-auto px-4 no-scrollbar pb-1">
            {trendingInspirations.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(item.route)}
                className="flex-shrink-0 w-[124px] h-[130px] rounded-xl overflow-hidden relative shadow-sm border border-stone-200 cursor-pointer active:scale-95 transition-transform"
              >
                <img 
                  alt={item.title} 
                  className="w-full h-full object-cover" 
                  src={item.image} 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <button 
                  aria-label="Favorite" 
                  onClick={(e) => toggleFavorite(item.id, e)}
                  className="absolute bottom-2 right-2 text-white/90 hover:text-white transition-colors"
                >
                  <svg 
                    className={`w-3.5 h-3.5 ${favorites.has(item.id) ? 'fill-rose-500 text-rose-500' : 'fill-none'}`} 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="absolute bottom-2 left-2 text-white font-medium text-[11px] leading-tight pr-4">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </section>
        {/* END: Trending Inspirations Horizontal Carousel */}

        {/* BEGIN: Featured Vendors Section */}
        <section className="pt-2 pb-5" data-purpose="featured-vendors">
          {/* Section Titles */}
          <div className="px-4 flex justify-between items-baseline mb-0.5">
            <div>
              <h2 className="font-serif text-[18px] font-semibold text-stone-900 tracking-tight">Featured Vendors</h2>
              <p className="text-stone-500 text-[11.5px] -mt-0.5">Top rated vendors for your special day</p>
            </div>
            <button 
              onClick={() => navigate('/user/vendors')}
              className="text-[#5B1228] text-[12.5px] font-semibold flex items-center space-x-0.5 hover:underline focus:outline-none"
            >
              <span>See All</span>
              <span className="text-xs">→</span>
            </button>
          </div>

          {/* Horizontal Vendor Cards */}
          <div className="flex space-x-3.5 overflow-x-auto px-4 no-scrollbar pt-2">
            {featuredVendors.map((vendor) => (
              <div 
                key={vendor.id}
                onClick={() => navigate(vendor.route || `/user/vendor/${vendor.id}`)}
                className="flex-shrink-0 w-[190px] bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="relative h-[98px] w-full">
                  <img 
                    alt={vendor.name} 
                    className="w-full h-full object-cover" 
                    src={vendor.image} 
                    loading="lazy"
                  />
                  {/* Star Rating Badge */}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-full flex items-center space-x-0.5 shadow-xs">
                    <span className="text-[#D4AF37] text-[10px]">★</span>
                    <span className="text-[10px] font-bold text-stone-800">{vendor.rating}</span>
                  </div>
                  {/* Favorite button */}
                  <button 
                    aria-label="Favorite Vendor"
                    onClick={(e) => toggleFavorite(vendor.id, e)}
                    className="absolute bottom-2 right-2 text-white drop-shadow-md hover:scale-110 transition-transform"
                  >
                    <svg 
                      className={`w-3.5 h-3.5 ${favorites.has(vendor.id) ? 'fill-rose-500 text-rose-500' : 'fill-none'}`} 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="p-2.5">
                  <h4 className="font-bold text-[12.5px] text-stone-900 tracking-tight leading-snug truncate">
                    {vendor.name}
                  </h4>
                  <p className="text-[10.5px] text-stone-500 font-medium leading-tight mt-0.5 truncate">
                    {vendor.category}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span className="text-[10px] text-stone-500 flex items-center">
                      <svg className="w-2.5 h-2.5 mr-0.5 text-stone-400" fill="currentColor" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" fillRule="evenodd" />
                      </svg>
                      {vendor.city}
                    </span>
                    <span className="bg-[#F6EED8] text-[#845E1B] text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                      <span>👑</span>
                      <span>Premium</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* END: Featured Vendors Section */}
      </div>
    </div>
  );
};

export default UserHome;