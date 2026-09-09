import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useToast } from '../../../components/ui/Toast';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import VendorCard from '../vendors/VendorCardFixed';
import { vendors } from '../../../data/vendors';

const VenueCollection = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { collection } = useParams();
  const { showToast, ToastComponent } = useToast();
  
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 'all',
    capacity: 'all'
  });

  // Collection definitions
  const collectionInfo = {
    'luxury': {
      title: 'Luxury Wedding Venues',
      description: 'Premium venues with world-class amenities and services',
      icon: 'crown',
      color: theme.colors.accent[500],
      filter: (venue) => {
        const price = parseInt((venue.price || '0').replace(/[^\d]/g, ''));
        return price >= 100000;
      }
    },
    'budget': {
      title: 'Budget Wedding Venues',
      description: 'Affordable venues without compromising on quality',
      icon: 'money',
      color: theme.colors.primary[500],
      filter: (venue) => {
        const price = parseInt((venue.price || '0').replace(/[^\d]/g, ''));
        return price < 50000;
      }
    },
    'beach': {
      title: 'Beach Wedding Destinations',
      description: 'Beautiful beachside venues for destination weddings',
      icon: 'location',
      color: theme.colors.secondary[500],
      filter: (venue) => {
        return venue.services?.some(s => 
          s.toLowerCase().includes('beach') || 
          s.toLowerCase().includes('destination') ||
          s.toLowerCase().includes('outdoor')
        ) || venue.description?.toLowerCase().includes('beach');
      }
    }
  };

  const currentCollection = collectionInfo[collection] || collectionInfo['luxury'];

  // Get all venues
  const allVenues = vendors.filter(vendor => vendor.category === 'venues');

  // Filter by collection type
  const collectionVenues = allVenues.filter(currentCollection.filter);

  const filteredVenues = collectionVenues.filter(venue => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.services?.some(service => 
        service.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Price range filter
    const matchesPriceRange = filters.priceRange === 'all' || (() => {
      const price = venue.price || venue.priceRange;
      if (!price) return true;
      
      const priceNum = parseInt(price.replace(/[^\d]/g, ''));
      switch (filters.priceRange) {
        case 'budget': return priceNum < 50000;
        case 'mid': return priceNum >= 50000 && priceNum < 100000;
        case 'premium': return priceNum >= 100000;
        default: return true;
      }
    })();
    
    // Rating filter
    const matchesRating = filters.rating === 'all' || (() => {
      const rating = venue.rating || 0;
      switch (filters.rating) {
        case '4+': return rating >= 4;
        case '4.5+': return rating >= 4.5;
        case '4.7+': return rating >= 4.7;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesPriceRange && matchesRating;
  });

  const sortedVenues = [...filteredVenues].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'reviews':
        return b.reviews - a.reviews;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price-low':
        const priceA = parseInt((a.price || a.priceRange || '0').replace(/[^\d]/g, ''));
        const priceB = parseInt((b.price || b.priceRange || '0').replace(/[^\d]/g, ''));
        return priceA - priceB;
      case 'price-high':
        const priceA2 = parseInt((a.price || a.priceRange || '0').replace(/[^\d]/g, ''));
        const priceB2 = parseInt((b.price || b.priceRange || '0').replace(/[^\d]/g, ''));
        return priceB2 - priceA2;
      default:
        return 0;
    }
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: 'all',
      rating: 'all',
      capacity: 'all'
    });
    setSearchQuery('');
    showToast('All filters cleared', 'info', 2000);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length + (searchQuery ? 1 : 0);
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: theme.semantic.background.primary }}
    >
      <div className="px-3 sm:px-4 py-3 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-sm font-medium py-1 px-2 rounded-lg hover:bg-opacity-10 hover:bg-black transition-colors mb-3"
            style={{ color: theme.semantic.text.secondary }}
          >
            <Icon name="chevronLeft" size="sm" />
            <span>Back</span>
          </button>
          
          <div className="flex items-start gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${currentCollection.color}20` }}
            >
              <Icon name={currentCollection.icon} size="lg" style={{ color: currentCollection.color }} />
            </div>
            <div>
              <h1 
                className="text-xl sm:text-2xl font-bold mb-1"
                style={{ color: theme.semantic.text.primary }}
              >
                {currentCollection.title}
              </h1>
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                {currentCollection.description}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center">
            <div 
              className="text-2xl font-bold mb-1"
              style={{ color: theme.semantic.text.primary }}
            >
              {sortedVenues.length}
            </div>
            <div 
              className="text-xs"
              style={{ color: theme.semantic.text.secondary }}
            >
              Venues
            </div>
          </Card>
          <Card className="p-3 text-center">
            <div 
              className="text-2xl font-bold mb-1"
              style={{ color: theme.semantic.text.primary }}
            >
              {sortedVenues.filter(v => v.verified).length}
            </div>
            <div 
              className="text-xs"
              style={{ color: theme.semantic.text.secondary }}
            >
              Verified
            </div>
          </Card>
          <Card className="p-3 text-center">
            <div 
              className="text-2xl font-bold mb-1"
              style={{ color: theme.semantic.text.primary }}
            >
              {sortedVenues.filter(v => v.rating >= 4.5).length}
            </div>
            <div 
              className="text-xs"
              style={{ color: theme.semantic.text.secondary }}
            >
              Top Rated
            </div>
          </Card>
        </div>

        {/* Search Bar with Filter */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Icon 
              name="search" 
              size="sm" 
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{ color: theme.semantic.text.secondary }}
            />
            <input
              type="text"
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm"
              style={{
                backgroundColor: theme.semantic.background.accent,
                borderColor: theme.semantic.border.light,
                color: theme.semantic.text.primary
              }}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition-all relative ${showFilters ? 'shadow-md' : ''}`}
            style={{
              backgroundColor: showFilters ? theme.colors.primary[500] : theme.semantic.background.accent,
              borderColor: showFilters ? theme.colors.primary[500] : theme.semantic.border.light,
              color: showFilters ? 'white' : theme.semantic.text.primary
            }}
          >
            <Icon name="filter" size="sm" />
            {getActiveFiltersCount() > 0 && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: theme.colors.accent[500], color: 'white' }}
              >
                {getActiveFiltersCount()}
              </div>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="mb-4 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: theme.semantic.text.primary }}>
                Filters
              </h3>
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium px-3 py-1 rounded-lg"
                style={{ 
                  color: theme.colors.primary[600],
                  backgroundColor: theme.colors.primary[50]
                }}
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Price Range Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Price Range
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="all">All Prices</option>
                  <option value="budget">Under ₹50K</option>
                  <option value="mid">₹50K - ₹1L</option>
                  <option value="premium">Above ₹1L</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="all">All Ratings</option>
                  <option value="4+">4+ Stars</option>
                  <option value="4.5+">4.5+ Stars</option>
                  <option value="4.7+">4.7+ Stars</option>
                </select>
              </div>

              {/* Capacity Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Capacity
                </label>
                <select
                  value={filters.capacity}
                  onChange={(e) => handleFilterChange('capacity', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="all">All Capacities</option>
                  <option value="small">Under 100</option>
                  <option value="medium">100 - 300</option>
                  <option value="large">Above 300</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="rating">Top Rated</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Results Count */}
        <div 
          className="flex items-center justify-between mb-4 p-3 rounded-lg"
          style={{
            backgroundColor: theme.semantic.card.background,
            borderColor: theme.semantic.card.border,
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <span 
            className="text-sm font-medium"
            style={{ color: theme.semantic.text.primary }}
          >
            {sortedVenues.length} venue{sortedVenues.length !== 1 ? 's' : ''} found
          </span>
          
          {getActiveFiltersCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs px-2 py-1 rounded"
              style={{ 
                color: theme.colors.primary[600],
                backgroundColor: theme.colors.primary[50]
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-24">
          {sortedVenues.map((venue) => (
            <div key={venue.id} className="venue-card">
              <VendorCard vendor={venue} layout="responsive" />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedVenues.length === 0 && (
          <div 
            className="text-center py-12 sm:py-16 mb-24 rounded-lg mx-auto max-w-md"
            style={{
              backgroundColor: theme.semantic.card.background,
              borderColor: theme.semantic.card.border,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <div className="mb-6 flex justify-center">
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${currentCollection.color}20` }}
              >
                <Icon name={currentCollection.icon} size="2xl" style={{ color: currentCollection.color }} />
              </div>
            </div>
            <h3 
              className="text-lg sm:text-xl font-semibold mb-2"
              style={{ color: theme.semantic.text.primary }}
            >
              No venues found
            </h3>
            <p 
              className="text-sm sm:text-base mb-6 px-4"
              style={{ color: theme.semantic.text.secondary }}
            >
              Try adjusting your filters or search criteria
            </p>
            <Button 
              onClick={clearAllFilters}
              variant="primary"
              className="px-6 py-2"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
      
      {/* Toast Component */}
      <ToastComponent />
    </div>
  );
};

export default VenueCollection;
