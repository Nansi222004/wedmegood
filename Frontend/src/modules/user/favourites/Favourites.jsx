import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useToast } from '../../../components/ui/Toast';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { userApi } from '../../../services/userApi';

const Favourites = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const [favouriteVendors, setFavouriteVendors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'photography', name: 'Photo', icon: 'camera' },
    { id: 'decoration', name: 'Decor', icon: 'star' },
    { id: 'catering', name: 'Cater', icon: 'utensils' },
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
      setFavouriteVendors(prev => prev.filter(v => (v.id || v.vendorId) !== vendorId));
      showToast('Vendor removed from favourites', 'info', 2000);
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      showToast('Failed to remove from favourites', 'error', 2000);
    }
  };

  const viewVendorDetails = (vendorId) => {
    navigate(`/user/vendor/${vendorId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: theme.colors.primary[500] }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-4 border-b"
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
              <h1 className="text-xl font-bold" style={{ color: theme.semantic.text.primary }}>
                Favourites
              </h1>
              <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                {favouriteVendors.length} saved vendors
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
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

      {/* Vendors List */}
      <div className="px-4 py-4">
        {favouriteVendors.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="heart" size="xl" style={{ color: theme.colors.primary[300] }} className="mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
              No Favourites Yet
            </h3>
            <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
              Browse approved vendors and tap the heart icon to save them
            </p>
            <Button
              onClick={() => navigate('/user/vendors')}
              className="px-6 py-2 rounded-lg"
              style={{ backgroundColor: theme.colors.primary[500] }}
            >
              Explore Vendors
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favouriteVendors.map((vendor) => {
              const vendorId = vendor.id || vendor.vendorId;
              return (
                <Card
                  key={vendor.favoriteId || vendorId}
                  className="overflow-hidden cursor-pointer group hover:shadow-md transition-shadow"
                  onClick={() => viewVendorDetails(vendorId)}
                >
                  <div className="relative">
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromFavourites(vendorId);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-md active:scale-90 transition-transform"
                    >
                      <Icon name="heart" size="xs" style={{ color: theme.colors.primary[500] }} />
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-base text-gray-900 truncate">
                        {vendor.name}
                      </h3>
                      <div className="flex items-center text-xs font-bold text-amber-500">
                        <Icon name="star" size="xs" className="mr-0.5" />
                        <span>{vendor.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-2">
                      {vendor.category} • {vendor.location}
                    </p>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                      <span className="font-bold text-gray-900">{vendor.price}</span>
                      <span className="text-primary-600 font-semibold group-hover:underline">
                        View Details →
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ToastComponent />
    </div>
  );
};

export default Favourites;