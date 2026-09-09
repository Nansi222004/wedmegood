import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import { vendors } from '../../../data/vendors';

const PhotographerCollection = () => {
  const { collection } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collection configurations
  const collectionConfig = {
    'top-rated': {
      title: 'Top Rated Photographers',
      icon: 'star',
      description: 'Highest rated photographers with excellent reviews',
      filters: ['all', 'wedding', 'candid', 'traditional', 'pre-wedding']
    },
    'budget-friendly': {
      title: 'Budget Friendly Photographers',
      icon: 'money',
      description: 'Quality photography within your budget',
      filters: ['all', 'basic', 'standard', 'premium']
    },
    'trending': {
      title: 'Trending Photographers',
      icon: 'trending',
      description: 'Most popular photographers this season',
      filters: ['all', 'wedding', 'candid', 'cinematic', 'traditional']
    },
    'verified': {
      title: 'Verified Photographers',
      icon: 'shield',
      description: 'Verified and trusted photography professionals',
      filters: ['all', 'wedding', 'candid', 'traditional', 'destination']
    },
    'luxury': {
      title: 'Luxury Photographers',
      icon: 'diamond',
      description: 'Premium photography services for grand weddings',
      filters: ['all', 'cinematic', 'destination', 'royal', 'celebrity']
    },
    'candid': {
      title: 'Candid Photographers',
      icon: 'camera',
      description: 'Specialists in candid wedding photography',
      filters: ['all', 'natural', 'artistic', 'documentary', 'storytelling']
    }
  };

  const currentCollection = collectionConfig[collection] || collectionConfig['top-rated'];

  // Get photography vendors (category: 'photography')
  const photographyVendors = vendors.filter(v => v.category === 'photography');

  // Filter based on collection type
  const getFilteredVendors = () => {
    let filtered = [...photographyVendors];

    // Collection-specific filtering
    switch(collection) {
      case 'top-rated':
        filtered = filtered.filter(v => v.rating >= 4.5).sort((a, b) => b.rating - a.rating);
        break;
      case 'budget-friendly':
        filtered = filtered.filter(v => v.price <= 50000).sort((a, b) => a.price - b.price);
        break;
      case 'trending':
        filtered = filtered.filter(v => v.isTrending);
        break;
      case 'verified':
        filtered = filtered.filter(v => v.isVerified);
        break;
      case 'luxury':
        filtered = filtered.filter(v => v.price >= 80000).sort((a, b) => b.price - a.price);
        break;
      case 'candid':
        filtered = filtered.filter(v => v.specialties?.includes('Candid Photography'));
        break;
      default:
        filtered = filtered.sort((a, b) => b.rating - a.rating);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredVendors = getFilteredVendors();

  const handleVendorClick = (vendorId) => {
    navigate(`/user/vendor/${vendorId}`);
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-40 px-4 py-4 border-b"
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
              <h1 
                className="text-xl font-bold"
                style={{ color: theme.semantic.text.primary }}
              >
                {currentCollection.title}
              </h1>
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                {filteredVendors.length} photographers
              </p>
            </div>
          </div>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name={currentCollection.icon} size="sm" style={{ color: theme.colors.primary[500] }} />
          </div>
        </div>

        {/* Description */}
        <p 
          className="text-sm mb-4"
          style={{ color: theme.semantic.text.secondary }}
        >
          {currentCollection.description}
        </p>

        {/* Search Bar */}
        <div 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3"
          style={{ backgroundColor: theme.semantic.background.accent }}
        >
          <Icon name="search" size="sm" style={{ color: theme.semantic.text.tertiary }} />
          <input
            type="text"
            placeholder="Search photographers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: theme.semantic.text.primary }}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {currentCollection.filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize"
              style={{
                backgroundColor: selectedFilter === filter 
                  ? theme.colors.primary[500] 
                  : theme.semantic.background.accent,
                color: selectedFilter === filter 
                  ? 'white' 
                  : theme.semantic.text.primary
              }}
            >
              {filter.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div 
        className="mx-4 mt-4 p-4 rounded-xl grid grid-cols-3 gap-4"
        style={{ backgroundColor: theme.semantic.background.accent }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.primary[500] }}>
            {filteredVendors.length}
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            Photographers
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.primary[500] }}>
            {filteredVendors.filter(v => v.isVerified).length}
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            Verified
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.primary[500] }}>
            {filteredVendors.length > 0 ? (filteredVendors.reduce((sum, v) => sum + v.rating, 0) / filteredVendors.length).toFixed(1) : '0.0'}
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            Avg Rating
          </p>
        </div>
      </div>

      {/* Photographers List */}
      <div className="px-4 py-4 space-y-3">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            onClick={() => handleVendorClick(vendor.id)}
            className="rounded-2xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <div className="flex gap-3 p-3">
              {/* Image */}
              <div className="relative flex-shrink-0">
                <img
                  src={vendor.image}
                  alt={vendor.name}
                  className="w-24 h-24 rounded-xl object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=200&h=200&fit=crop&q=80';
                  }}
                />
                {vendor.isVerified && (
                  <div 
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.primary[500] }}
                  >
                    <Icon name="shield" size="xs" style={{ color: 'white' }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 
                    className="font-semibold text-base truncate"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    {vendor.name}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <Icon name="star" size="xs" style={{ color: '#FFA500' }} />
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {vendor.rating}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  <Icon name="location" size="xs" style={{ color: theme.semantic.text.tertiary }} />
                  <p 
                    className="text-xs truncate"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {vendor.location}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Icon name="camera" size="xs" style={{ color: theme.semantic.text.tertiary }} />
                    <span 
                      className="text-xs"
                      style={{ color: theme.semantic.text.secondary }}
                    >
                      {vendor.reviewCount} bookings
                    </span>
                  </div>
                  <p 
                    className="text-sm font-bold"
                    style={{ color: theme.colors.primary[500] }}
                  >
                    ₹{vendor.price.toLocaleString()}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {vendor.isTrending && (
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: theme.colors.primary[100],
                        color: theme.colors.primary[700]
                      }}
                    >
                      Trending
                    </span>
                  )}
                  {vendor.price <= 50000 && (
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: theme.colors.primary[100],
                        color: theme.colors.primary[700]
                      }}
                    >
                      Budget Friendly
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredVendors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="search" size="lg" style={{ color: theme.semantic.text.tertiary }} />
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: theme.semantic.text.primary }}
          >
            No photographers found
          </h3>
          <p 
            className="text-sm text-center"
            style={{ color: theme.semantic.text.secondary }}
          >
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotographerCollection;
