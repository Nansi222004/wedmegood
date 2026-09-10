import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useToast } from '../../../components/ui/Toast';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const Shortlist = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  
  const [shortlistedVendors, setShortlistedVendors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock shortlisted vendors data
  const mockShortlistedVendors = [
    {
      id: 1,
      name: "Royal Photography Studio",
      category: "photography",
      rating: 4.8,
      reviews: 156,
      price: "₹45,000 - ₹80,000",
      location: "Mumbai, Maharashtra",
      image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop",
      addedDate: "2024-01-15",
      isAvailable: true,
      specialties: ["Wedding Photography", "Pre-wedding", "Candid"]
    },
    {
      id: 2,
      name: "Elegant Decorators",
      category: "decoration",
      rating: 4.6,
      reviews: 89,
      price: "₹1,20,000 - ₹3,50,000",
      location: "Delhi, NCR",
      image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop",
      addedDate: "2024-01-12",
      isAvailable: true,
      specialties: ["Floral Decoration", "Stage Setup", "Lighting"]
    },
    {
      id: 3,
      name: "Spice Garden Catering",
      category: "catering",
      rating: 4.7,
      reviews: 234,
      price: "₹800 - ₹1,500 per plate",
      location: "Bangalore, Karnataka",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop",
      addedDate: "2024-01-10",
      isAvailable: false,
      specialties: ["Multi-cuisine", "Live Counters", "Desserts"]
    },
    {
      id: 4,
      name: "Melody Music Band",
      category: "music",
      rating: 4.5,
      reviews: 67,
      price: "₹25,000 - ₹60,000",
      location: "Pune, Maharashtra",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      addedDate: "2024-01-08",
      isAvailable: true,
      specialties: ["Live Band", "DJ Services", "Sound System"]
    },
    {
      id: 5,
      name: "Bridal Beauty Lounge",
      category: "makeup",
      rating: 4.9,
      reviews: 145,
      price: "₹15,000 - ₹35,000",
      location: "Chennai, Tamil Nadu",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
      addedDate: "2024-01-05",
      isAvailable: true,
      specialties: ["Bridal Makeup", "Hair Styling", "Mehendi"]
    }
  ];

  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'photography', name: 'Photo', icon: 'camera' },
    { id: 'decoration', name: 'Decor', icon: 'star' },
    { id: 'catering', name: 'Cater', icon: 'utensils' },
    { id: 'music', name: 'Music', icon: 'music' },
    { id: 'makeup', name: 'Makeup', icon: 'sparkles' }
  ];

  useEffect(() => {
    // Load shortlisted vendors from localStorage
    const savedShortlist = localStorage.getItem('shortlistedVendors');
    if (savedShortlist) {
      setShortlistedVendors(JSON.parse(savedShortlist));
    } else {
      // Use mock data for demo
      setShortlistedVendors(mockShortlistedVendors);
      localStorage.setItem('shortlistedVendors', JSON.stringify(mockShortlistedVendors));
    }
    setIsLoading(false);
  }, []);

  const filteredVendors = selectedCategory === 'all' 
    ? shortlistedVendors 
    : shortlistedVendors.filter(vendor => vendor.category === selectedCategory);

  const removeFromShortlist = (vendorId) => {
    const updatedShortlist = shortlistedVendors.filter(vendor => vendor.id !== vendorId);
    setShortlistedVendors(updatedShortlist);
    localStorage.setItem('shortlistedVendors', JSON.stringify(updatedShortlist));
    showToast('Vendor removed from shortlist', 'info', 2000);
  };

  const clearAllShortlist = () => {
    setShortlistedVendors([]);
    localStorage.removeItem('shortlistedVendors');
    showToast('All vendors removed from shortlist', 'info', 2000);
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
                My Shortlist
              </h1>
              <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} shortlisted
              </p>
            </div>
          </div>
          
          {shortlistedVendors.length > 0 && (
            <button
              onClick={clearAllShortlist}
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
              {selectedCategory === 'all' ? 'No vendors shortlisted' : `No ${selectedCategory} vendors shortlisted`}
            </h3>
            <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
              Start exploring vendors and add them to your shortlist
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
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="w-full h-full object-cover"
                    />
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
                        <p className="text-xs font-medium" style={{ color: theme.colors.primary[600] }}>
                          {vendor.price}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeFromShortlist(vendor.id)}
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

export default Shortlist;