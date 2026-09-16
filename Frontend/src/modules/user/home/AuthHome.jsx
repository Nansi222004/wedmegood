import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import userApi from '../../../services/userApi';

const AuthHome = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [currentCity] = useState('Indore');
  
  const [trendingVendors, setTrendingVendors] = useState([]);
  const [venuesInCity, setVenuesInCity] = useState([]);
  const [budgetFriendlyVendors, setBudgetFriendlyVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      userApi.getTrendingVendors({ limit: 10 }).catch(() => ({ data: [] })),
      userApi.getVendors({ category: 'Venues', city: currentCity, limit: 10 }).catch(() => ({ data: [] })),
      userApi.getVendors({ maxPrice: 40000, limit: 10 }).catch(() => ({ data: [] }))
    ]).then(([trendRes, venueRes, budgetRes]) => {
      if (!isMounted) return;
      setTrendingVendors(trendRes.data || []);
      setVenuesInCity(venueRes.data || []);
      setBudgetFriendlyVendors(budgetRes.data || []);
      setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, [currentCity]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Premium Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: theme.colors.primary[50] }}>
              <Icon name="location" size="xs" style={{ color: theme.colors.primary[500] }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Planning in</span>
              <span className="text-sm font-black text-gray-800 flex items-center gap-1">
                {currentCity}
                <Icon name="chevronDown" size="xxs" style={{ color: theme.colors.primary[300] }} />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[
              { icon: 'search', id: 'search', onClick: () => navigate('/user/search') },
              { icon: 'bell', id: 'notifications', onClick: () => {} },
              { icon: 'user', id: 'profile', onClick: () => navigate('/user/profile') }
            ].map((action) => (
              <button 
                key={action.id}
                onClick={action.onClick}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-gray-50 hover:bg-gray-100 active:scale-90"
              >
                <Icon name={action.icon} size="sm" style={{ color: theme.semantic.text.secondary }} />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* Category Grid */}
        <section>
          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
            {[
              { name: 'Venues', icon: 'building', color: '#fdf2f8', slug: 'Venues' },
              { name: 'Photographers', icon: 'camera', color: '#fffbeb', slug: 'Photography' },
              { name: 'Makeup', icon: 'palette', color: '#ecfdf5', slug: 'Makeup' },
              { name: 'Decorators', icon: 'sparkles', color: '#f5f3ff', slug: 'Decoration' },
              { name: 'Catering', icon: 'heart', color: '#eff6ff', slug: 'Catering' }
            ].map((category, index) => (
              <div
                key={index}
                onClick={() => navigate(`/user/vendors/${category.slug}`)}
                className="flex flex-col items-center cursor-pointer group min-w-[80px]"
              >
                <div 
                  className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-3 transition-all duration-300 group-hover:shadow-xl group-hover:translate-y-[-4px]"
                  style={{ backgroundColor: category.color }}
                >
                  <Icon name={category.icon} size="md" style={{ color: theme.colors.primary[500] }} />
                </div>
                <span className="text-xs font-black text-gray-600 tracking-tight text-center">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Planning Dashboard Card */}
        <section>
          <div 
            className="w-full rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl cursor-pointer transition-transform hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.primary[600]} 100%)` }}
            onClick={() => navigate('/user/planning-dashboard')}
          >
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-2">Continue Your Dream Plan</h2>
              <p className="text-white/80 text-sm font-medium mb-6">Explore real verified vendors and track your wedding budget on Utsavo!</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[60%]" />
                </div>
                <span className="font-black text-sm">Active</span>
              </div>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>
        </section>

        {/* Horizontal Sections */}
        {[
          { title: "Trending Vendors Near You", items: trendingVendors },
          { title: "Venues in your city", items: venuesInCity },
          { title: "Budget Friendly Picks", items: budgetFriendlyVendors }
        ].filter(sec => sec.items.length > 0).map((section, idx) => (
          <section key={idx} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">{section.title}</h2>
              <button 
                onClick={() => navigate('/user/vendors')}
                className="text-sm font-black text-rose-500 hover:rose-600 transition-colors uppercase tracking-widest"
              >
                View all
              </button>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
              {section.items.map((vendor) => {
                const vendorId = vendor._id || vendor.id;
                const img = vendor.portfolio?.[0]?.url || vendor.profileImage || vendor.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80';
                const price = vendor.pricing?.range ? `₹${vendor.pricing.range}` : (vendor.startingPrice ? `From ₹${vendor.startingPrice.toLocaleString()}` : (vendor.price || 'Contact for price'));
                const rating = vendor.rating && vendor.rating > 0 ? vendor.rating : 'New';
                return (
                  <div
                    key={vendorId}
                    className="w-[280px] flex-shrink-0 cursor-pointer group"
                    onClick={() => navigate(`/user/vendor/${vendorId}`)}
                  >
                    <div className="relative h-48 rounded-[2rem] overflow-hidden mb-4 shadow-lg">
                      <img
                        src={img}
                        alt={vendor.businessName || vendor.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Icon name="check" size="xxs" style={{ color: '#10b981' }} />
                        <span className="text-[10px] font-black text-gray-800 uppercase">Verified</span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                         <span className="text-white font-black text-sm drop-shadow-md">{price}</span>
                         <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-2 py-1 rounded-lg">
                           <Icon name="star" size="xxs" style={{ color: '#fbbf24' }} />
                           <span className="text-white text-[10px] font-black">{rating}</span>
                         </div>
                      </div>
                    </div>
                    <h3 className="text-base font-black text-gray-800 mb-1 group-hover:text-rose-500 transition-colors line-clamp-1">
                      {vendor.businessName || vendor.name}
                    </h3>
                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider">
                      <Icon name="location" size="xxs" />
                      {vendor.city || vendor.location || 'Indore'}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Floating Magic Genie Button */}
      <button 
        onClick={() => navigate('/user/planning-dashboard')}
        className="fixed bottom-24 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-40 transition-all hover:scale-110 active:scale-90 hover:rotate-12"
        style={{ background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.primary[700]} 100%)` }}
      >
        <Icon name="sparkles" size="md" className="text-white" />
      </button>

      {/* Modern Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-3xl border-t border-gray-100 flex justify-around items-center h-20 px-4 md:hidden">
        {[
          { name: 'For You', icon: 'heart', active: true, path: '/user' },
          { name: 'Vendors', icon: 'users', path: '/user/vendors' },
          { name: 'Search', icon: 'search', path: '/user/search' },
          { name: 'Profile', icon: 'user', path: '/user/profile' }
        ].map((tab, index) => (
          <button
            key={index}
            onClick={() => tab.path && navigate(tab.path)}
            className={`flex flex-col items-center justify-center gap-1 ${
              tab.active ? 'text-rose-500' : 'text-gray-400'
            }`}
          >
            <Icon name={tab.icon} size="sm" />
            <span className="text-[10px] font-black uppercase tracking-tighter">{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AuthHome;