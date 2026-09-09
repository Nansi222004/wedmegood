import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useToast } from '../../../components/ui/Toast';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const Favourites = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  
  const [favouriteVendors, setFavouriteVendors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock favourite vendors data
  const mockFavouriteVendors = [
    {
      id: 1,
      name: "Dream Wedding Photography",
      category: "photography",
      rating: 4.9,
      reviews: 287,
      price: "₹55,000 - ₹95,000",
      location: "Mumbai, Maharashtra",
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop",
      addedDate: "2024-01-20",
      isAvailable: true,
      specialties: ["Candid Photography", "Traditional", "Destination"],
      isFeatured: true,
      responseTime: "2 hours"
    },
    {
      id: 2,
      name: "Luxury Event Planners",
      category: "decoration",
      rating: 4.8,
      reviews: 156,
      price: "₹2,50,000 - ₹8,00,000",
      location: "Delhi, NCR",
      image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop",
      addedDate: "2024-01-18",
      isAvailable: true,
      specialties: ["Theme Decoration", "Floral Design", "Lighting"],
      isFeatured: true,
      responseTime: "1 hour"
    },
    {
      id: 3,
      name: "Royal Feast Catering",
      category: "catering",
      rating: 4.7,
      reviews: 342,
      price: "₹1,200 - ₹2,500 per plate",
      location: "Jaipur, Rajasthan",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
      addedDate: "2024-01-15",
      isAvailable: true,
      specialties: ["Rajasthani Cuisine", "Live Counters", "Veg & Non-veg"],
      isFeatured: false,
      responseTime: "30 minutes"
    },
    {
      id: 4,
      name: "Harmony Music Group",
      category: "music",
      rating: 4.6,
      reviews: 98,
      price: "₹35,000 - ₹85,000",
      location: "Bangalore, Karnataka",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
      addedDate: "2024-01-12",
      isAvailable: false,
      specialties: ["Live Orchestra", "DJ", "Sound & Lighting"],
      isFeatured: true,
      responseTime: "4 hours"
    },
    {
      id: 5,
      name: "Glamour Bridal Studio",
      category: "makeup",
      rating: 4.9,
      reviews: 203,
      price: "₹25,000 - ₹65,000",
      location: "Hyderabad, Telangana",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
      addedDate: "2024-01-10",
      isAvailable: true,
      specialties: ["HD Makeup", "Hair Styling", "Saree Draping"],
      isFeatured: true,
      responseTime: "1 hour"
    },
    {
      id: 6,
      name: "Classic Car Rentals",
      category: "transportation",
      rating: 4.5,
      reviews: 76,
      price: "₹8,000 - ₹25,000 per day",
      location: "Goa",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
      addedDate: "2024-01-08",
      isAvailable: true,
      specialties: ["Vintage Cars", "Luxury Sedans", "Decorated Cars"],
      isFeatured: false,
      responseTime: "3 hours"
    }
  ];

  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'photography', name: 'Photo', icon: 'camera' },
    { id: 'decoration', name: 'Decor', icon: 'star' },
    { id: 'catering', name: 'Cater', icon: 'utensils' },
    { id: 'music', name: 'Music', icon: 'music' },
    { id: 'makeup', name: 'Makeup', icon: 'sparkles' },
    { id: 'transportation', name: 'Transport', icon: 'car' }
  ];

  useEffect(() => {
    // Load favourite vendors from localStorage
    const savedFavourites = localStorage.getItem('favouriteVendors');
    if (savedFavourites) {
      setFavouriteVendors(JSON.parse(savedFavourites));
    } else {
      // Use mock data for demo
      setFavouriteVendors(mockFavouriteVendors);
      localStorage.setItem('favouriteVendors', JSON.stringify(mockFavouriteVendors));
    }
    setIsLoading(false);
  }, []);

  const filteredVendors = selectedCategory === 'all' 
    ? favouriteVendors 
    : favouriteVendors.filter(vendor => vendor.category === selectedCategory);

  const removeFromFavourites = (vendorId) => {
    const updatedFavourites = favouriteVendors.filter(vendor => vendor.id !== vendorId);
    setFavouriteVendors(updatedFavourites);
    localStorage.setItem('favouriteVendors', JSON.stringify(updatedFavourites));
    showToast('Vendor removed from favourites', 'info', 2000);
  };

  const clearAllFavourites = () => {
    setFavouriteVendors([]);
    localStorage.removeItem('favouriteVendors');
    showToast('All vendors removed from favourites', 'info', 2000);
  };

  const contactVendor = (vendor) => {
    showToast(`Contacting ${vendor.name}...`, 'info', 2000);
    // Here you would implement actual contact functionality
  };

  const viewVendorDetails = (vendorId) => {
    navigate(`/user/vendors/${vendorId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
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
        className="sticky top-0 z-10 px-4 py-4 border-b backdrop-blur-sm"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}95`,
          borderBottomColor: theme.semantic.border.light 
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 rounded-full"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
                My Favourites
              </h1>
              <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                {filteredVendors.length} favourite vendor{filteredVendors.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {favouriteVendors.length > 0 && (
            <button
              onClick={clearAllFavourites}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ 
                backgroundColor: theme.semantic.background.accent,
                color: theme.semantic.text.secondary 
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-3">
        <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === category.id ? 'shadow-md' : ''
              }`}
              style={{
                backgroundColor: selectedCategory === category.id 
                  ? theme.colors.primary[500] 
                  : theme.semantic.background.accent,
                color: selectedCategory === category.id 
                  ? 'white' 
                  : theme.semantic.text.primary,
                minWidth: 'fit-content'
              }}
            >
              <Icon name={category.icon} size="xs" />
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vendors List */}
      <div className="px-4">
        {filteredVendors.length === 0 ? (
          <div className="text-center py-16">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="heart" size="lg" style={{ color: theme.semantic.text.secondary }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: theme.semantic.text.primary }}>
              {selectedCategory === 'all' ? 'No favourite vendors' : `No favourite ${selectedCategory} vendors`}
            </h3>
            <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
              Mark vendors as favourites to see them here
            </p>
            <Button
              onClick={() => navigate('/user/vendors')}
              className="px-6 py-3"
              style={{
                backgroundColor: theme.colors.primary[500],
                color: 'white'
              }}
            >
              <Icon name="search" size="sm" className="mr-2" />
              Browse Vendors
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id} className="overflow-hidden">
                <div className="flex">
                  {/* Vendor Image */}
                  <div className="w-24 h-24 flex-shrink-0 relative">
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="w-full h-full object-cover"
                    />
                    {vendor.isFeatured && (
                      <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded text-xs font-bold">
                        ⭐
                      </div>
                    )}
                  </div>
                  
                  {/* Vendor Info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1" style={{ color: theme.semantic.text.primary }}>
                          {vendor.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center gap-1">
                            <Icon name="star" size="xs" style={{ color: '#fbbf24' }} />
                            <span className="text-xs font-medium" style={{ color: theme.semantic.text.primary }}>
                              {vendor.rating}
                            </span>
                            <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                              ({vendor.reviews})
                            </span>
                          </div>
                          <div className={`px-2 py-0.5 rounded-full text-xs ${vendor.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {vendor.isAvailable ? 'Available' : 'Busy'}
                          </div>
                        </div>
                        <p className="text-xs mb-1" style={{ color: theme.semantic.text.secondary }}>
                          <Icon name="mapPin" size="xs" className="inline mr-1" />
                          {vendor.location}
                        </p>
                        <p className="text-xs font-medium mb-1" style={{ color: theme.colors.primary[600] }}>
                          {vendor.price}
                        </p>
                        <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                          <Icon name="clock" size="xs" className="inline mr-1" />
                          Responds in {vendor.responseTime}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeFromFavourites(vendor.id)}
                        className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                        style={{ color: '#ef4444' }}
                      >
                        <Icon name="heart" size="sm" className="fill-current" />
                      </button>
                    </div>
                    
                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {vendor.specialties.slice(0, 2).map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ 
                            backgroundColor: theme.semantic.background.accent,
                            color: theme.semantic.text.secondary 
                          }}
                        >
                          {specialty}
                        </span>
                      ))}
                      {vendor.specialties.length > 2 && (
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ 
                            backgroundColor: theme.semantic.background.accent,
                            color: theme.semantic.text.secondary 
                          }}
                        >
                          +{vendor.specialties.length - 2} more
                        </span>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewVendorDetails(vendor.id)}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                        style={{
                          borderColor: theme.colors.primary[500],
                          color: theme.colors.primary[500],
                          backgroundColor: 'transparent'
                        }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => contactVendor(vendor)}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: theme.colors.primary[500],
                          color: 'white'
                        }}
                      >
                        <Icon name="phone" size="xs" className="mr-1" />
                        Contact
                      </button>
                    </div>
                    
                    {/* Added Date */}
                    <p className="text-xs mt-2" style={{ color: theme.semantic.text.secondary }}>
                      Added on {formatDate(vendor.addedDate)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Toast Component */}
      <ToastComponent />
    </div>
  );
};

export default Favourites;