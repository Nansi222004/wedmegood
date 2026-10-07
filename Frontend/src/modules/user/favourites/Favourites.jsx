import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../components/ui/Toast';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import { userApi } from '../../../services/userApi';
import usePlatformSettings from '../../../hooks/usePlatformSettings';

const Favourites = () => {
  const { ratingsEnabled } = usePlatformSettings();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const [favouriteVendors, setFavouriteVendors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All Saved', icon: 'grid' },
    { id: 'photography', name: 'Photographers', icon: 'camera' },
    { id: 'decoration', name: 'Decorators', icon: 'palette' },
    { id: 'catering', name: 'Caterers', icon: 'store' },
    { id: 'makeup', name: 'Makeup', icon: 'sparkles' },
    { id: 'venues', name: 'Venues', icon: 'home' }
  ];

  const fetchFavourites = async () => {
    try {
      setIsLoading(true);
      const res = await userApi.getFavorites(selectedCategory);
      if (res.success && res.data) {
        setFavouriteVendors(res.data.favorites || []);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
      showToast('Failed to load favorites', 'error', 2000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, [selectedCategory]);

  const removeFromFavourites = async (vendorId) => {
    try {
      await userApi.removeFavorite(vendorId);
      setFavouriteVendors((prev) => prev.filter((v) => (v.id || v.vendorId) !== vendorId));
      showToast('Vendor removed from favourites', 'info', 2000);
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      showToast('Failed to remove from favourites', 'error', 2000);
    }
  };

  const viewVendorDetails = (vendorId) => {
    navigate(`/user/vendor/${vendorId}`);
  };

  return (
    <div className="bg-[#EDE8E1] min-h-screen text-slate-800 antialiased font-sans">
      <div className="max-w-[430px] md:max-w-4xl mx-auto min-h-screen bg-[#FAF6F0] relative overflow-hidden shadow-2xl pb-28">
        {/* Subtle Luxury Floral Watermarks */}
        <div className="floral-bg-corner-tl opacity-70 pointer-events-none" />
        <div className="floral-bg-corner-br opacity-70 pointer-events-none" />

        {/* Top Header Bar */}
        <div className="px-5 pt-6 pb-4 relative z-10 border-b border-[#D4AF37]/20">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/90 border border-[#D4AF37]/35 flex items-center justify-center text-[#4F1325] hover:bg-white active:scale-95 transition-all shadow-xs"
            >
              <Icon name="chevronLeft" size="sm" />
            </button>
            <div className="text-center">
              <span className="text-[10px] font-cinzel uppercase tracking-[0.2em] text-[#D4AF37] block font-bold">
                Treasured Collection
              </span>
              <h1 className="text-2xl font-serif font-bold text-[#4F1325]">
                Saved Favorites
              </h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/90 border border-[#D4AF37]/35 flex items-center justify-center text-[#651731] shadow-xs">
              <Icon name="heart" size="sm" />
            </div>
          </div>

          <p className="text-center text-xs text-[#651731]/70">
            {favouriteVendors.length} curated vendor{favouriteVendors.length !== 1 ? 's' : ''} saved to your celebration
          </p>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-4 pb-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shadow-xs ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-[#4F1325] to-[#651731] text-[#ECC880] shadow-sm'
                    : 'bg-white/90 border border-[#D4AF37]/25 text-[#4F1325] hover:bg-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Vendors Content List */}
        <div className="px-5 py-6 relative z-10">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-3 border-[#D4AF37] border-t-transparent animate-spin rounded-full mx-auto mb-3"></div>
              <p className="text-xs font-cinzel font-bold text-[#4F1325]/70 uppercase tracking-widest">
                Gathering Your Favorites...
              </p>
            </div>
          ) : favouriteVendors.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white/80 rounded-[28px] border border-[#D4AF37]/25 shadow-xs max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#FFF5F6] border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4 text-[#D4AF37]">
                <Icon name="heart" size="xl" />
              </div>
              <p className="font-script text-[#D4AF37] text-2xl -mb-1">Begin Your Curation</p>
              <h3 className="text-xl font-serif font-bold mb-2 text-[#4F1325]">
                No Favourites Saved Yet
              </h3>
              <p className="text-xs text-[#651731]/70 mb-6 max-w-xs mx-auto leading-relaxed">
                Explore our royal directory of verified venues, photographers, and artisans, and tap the heart icon to save them.
              </p>
              <Button
                onClick={() => navigate('/user/vendors')}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#4F1325] to-[#651731] text-[#ECC880] font-bold text-xs shadow-md hover:opacity-95"
              >
                Explore Marketplace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favouriteVendors.map((vendor) => {
                const vendorId = vendor.id || vendor.vendorId;
                return (
                  <div
                    key={vendor.favoriteId || vendorId}
                    className="overflow-hidden rounded-[22px] bg-white/95 border border-[#D4AF37]/25 hover:border-[#D4AF37] shadow-xs hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => viewVendorDetails(vendorId)}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={vendor.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80'}
                        alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromFavourites(vendorId);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs border border-[#D4AF37]/30 text-[#651731] active:scale-90 transition-transform"
                        title="Remove from favorites"
                      >
                        <Icon name="heart" size="xs" className="fill-[#651731]" />
                      </button>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif font-bold text-base text-[#4F1325] truncate">
                          {vendor.name}
                        </h3>
                        {ratingsEnabled && (
                        <div className="flex items-center text-xs font-bold text-[#D4AF37]">
                          <Icon name="star" size="xs" className="mr-0.5" />
                          <span>{vendor.rating || 'New'}</span>
                        </div>
                        )}
                      </div>

                      <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8E95A4]">
                        {vendor.category || 'Wedding Artisan'} • {vendor.location || 'Indore'}
                      </p>

                      <div className="flex justify-between items-center pt-2 border-t border-[#D4AF37]/15 text-xs">
                        <span className="font-bold text-[#4F1325] text-sm">
                          {vendor.price || 'Price on request'}
                        </span>
                        <span className="text-[#651731] font-bold text-[11px] group-hover:underline flex items-center gap-1">
                          View Details <Icon name="chevronRight" size="xs" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ToastComponent />
    </div>
  );
};

export default Favourites;