import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useToast } from '../../../components/ui/Toast';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import VendorCard from '../vendors/VendorCardFixed';
import { vendors } from '../../../data/vendors';

const Decorators = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 'all',
    availability: 'all',
    services: 'all'
  });

  // Get all decorators
  const allDecorators = vendors.filter(vendor => vendor.category === 'planning-decor');

  // Collections
  const collections = [
    { 
      id: 'all', 
      name: 'All Decorators', 
      count: allDecorators.length,
      icon: 'grid',
      color: theme.colors.primary[500]
    },
    { 
      id: 'top-rated', 
      name: 'Top Rated', 
      count: allDecorators.filter(p => p.rating >= 4.7).length,
      icon: 'star',
      color: theme.colors.accent[500]
    },
    { 
      id: 'trending', 
      name: 'Trending', 
      count: allDecorators.filter(p => p.isTrending).length,
      icon: 'trending',
      color: theme.colors.secondary[500]
    },
    { 
      id: 'luxury', 
      name: 'Luxury', 
      count: allDecorators.filter(p => {
        const price = parseInt((p.price || '0').replace(/[^\d]/g, ''));
        return price >= 150000;
      }).length,
      icon: 'crown',
      color: theme.colors.accent[600]
    },
    { 
      id: 'budget', 
      name: 'Budget Friendly', 
      count: allDecorators.filter(p => {
        const price = parseInt((p.price || '0').replace(/[^\d]/g, ''));
        return price < 100000;
      }).length,
      icon: 'money',
      color: theme.colors.primary[600]
    }
  ];

  // Filter decorators by collection
  const getCollectionDecorators = () => {
    switch(selectedCollection) {
      case 'top-rated':
        return allDecorators.filter(p => p.rating >= 4.7);
      case 'trending':
        return allDecorators.filter(p => p.isTrending);
      case 'luxury':
        return allDecorators.filter(p => {
          const price = parseInt((p.price || '0').replace(/[^\d]/g, ''));
          return price >= 150000;
        });
      case 'budget':
        return allDecorators.filter(p => {
          const price = parseInt((p.price || '0').replace(/[^\d]/g, ''));
          return price < 100000;
        });
      default:
        return allDecorators;
    }
  };

  const filteredDecorators = getCollectionDecorators().filter(decorator => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      decorator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decorator.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decorator.services?.some(service => 
        service.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Price range filter
    const matchesPriceRange = filters.priceRange === 'all' || (() => {
      const price = decorator.price || decorator.priceRange;
      if (!price) return true;
      
      const priceNum = parseInt(price.replace(/[^\d]/g, ''));
      switch (filters.priceRange) {
        case 'budget': return priceNum < 100000;
        case 'mid': return priceNum >= 100000 && priceNum < 150000;
        case 'premium': return priceNum >= 150000;
        default: return true;
      }
    })();
    
    // Rating filter
    const matchesRating = filters.rating === 'all' || (() => {
      const rating = decorator.rating || 0;
      switch (filters.rating) {
        case '4+': return rating >= 4;
        case '4.5+': return rating >= 4.5;
        case '4.7+': return rating >= 4.7;
        default: return true;
      }
    })();
    
    // Services filter
    const matchesServices = filters.services === 'all' || 
      decorator.services?.some(service => 
        service.toLowerCase().includes(filters.services.toLowerCase())
      );
    
    // Availability filter
    const matchesAvailability = filters.availability === 'all' || 
      (filters.availability === 'available' && decorator.isAvailable !== false);
    
    return matchesSearch && matchesPriceRange && matchesRating && matchesServices && matchesAvailability;
  });

  const sortedDecorators = [...filteredDecorators].sort((a, b) => {
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
      availability: 'all',
      services: 'all'
    });
    setSearchQuery('');
    setSelectedCollection('all');
    showToast('All filters cleared', 'info', 2000);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length + 
           (searchQuery ? 1 : 0) + 
           (selectedCollection !== 'all' ? 1 : 0);
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: theme.semantic.background.primary }}
    >
      <div className="px-3 sm:px-4 py-3 max-w-7xl mx-auto">
        {/* Back Button and Title */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-sm font-medium py-1 px-2 rounded-lg hover:bg-opacity-10 hover:bg-black transition-colors"
            style={{ color: theme.semantic.text.secondary }}
          >
            <Icon name="chevronLeft" size="sm" />
            <span className="hidden xs:inline">Back</span>
          </button>
          
          <h1 
            className="text-base sm:text-lg font-bold text-center flex-1 mx-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Wedding Decorators & Planners
          </h1>
          
          <div className="w-12 sm:w-16"></div>
        </div>

        {/* Collections */}
        <div className="mb-4">
          <h2 
            className="text-xs font-semibold mb-2"
            style={{ color: theme.semantic.text.primary }}
          >
            Browse Collections
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => setSelectedCollection(collection.id)}
                className="p-2.5 rounded-lg border transition-all text-left hover:shadow-md"
                style={{
                  backgroundColor: selectedCollection === collection.id 
                    ? `${collection.color}10` 
                    : theme.semantic.background.accent,
                  borderColor: selectedCollection === collection.id 
                    ? collection.color 
                    : theme.semantic.border.light
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${collection.color}20` }}
                  >
                    <Icon name={collection.icon} size="xs" style={{ color: collection.color }} />
                  </div>
                  <span 
                    className="text-base font-bold"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    {collection.count}
                  </span>
                </div>
                <h3 
                  className="text-xs font-semibold leading-tight"
                  style={{ 
                    color: selectedCollection === collection.id 
                      ? collection.color 
                      : theme.semantic.text.primary 
                  }}
                >
                  {collection.name}
                </h3>
              </button>
            ))}
          </div>
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
              placeholder="Search decorators..."
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
                  <option value="budget">Under ₹1L</option>
                  <option value="mid">₹1L - ₹1.5L</option>
                  <option value="premium">Above ₹1.5L</option>
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

              {/* Services Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Services
                </label>
                <select
                  value={filters.services}
                  onChange={(e) => handleFilterChange('services', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="all">All Services</option>
                  <option value="decoration">Decoration</option>
                  <option value="planning">Planning</option>
                  <option value="floral">Floral Arrangements</option>
                  <option value="lighting">Lighting</option>
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
          className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-0 mb-4 p-3 sm:p-4 rounded-lg"
          style={{
            backgroundColor: theme.semantic.card.background,
            borderColor: theme.semantic.card.border,
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <div className="flex items-center justify-between xs:justify-start">
            <span 
              className="text-sm font-medium"
              style={{ color: theme.semantic.text.primary }}
            >
              {sortedDecorators.length} decorator{sortedDecorators.length !== 1 ? 's' : ''} found
              {searchQuery && (
                <span className="text-xs ml-2" style={{ color: theme.semantic.text.secondary }}>
                  for "{searchQuery}"
                </span>
              )}
            </span>
          </div>
          
          {getActiveFiltersCount() > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied
              </span>
              <button
                onClick={clearAllFilters}
                className="text-xs px-2 py-1 rounded"
                style={{ 
                  color: theme.colors.primary[600],
                  backgroundColor: theme.colors.primary[50]
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Decorators Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-24">
          {sortedDecorators.map((decorator) => (
            <div key={decorator.id} className="decorator-card">
              <VendorCard vendor={decorator} layout="responsive" />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedDecorators.length === 0 && (
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
                style={{ backgroundColor: theme.colors.primary[50] }}
              >
                <Icon name="star" size="2xl" style={{ color: theme.colors.primary[500] }} />
              </div>
            </div>
            <h3 
              className="text-lg sm:text-xl font-semibold mb-2"
              style={{ color: theme.semantic.text.primary }}
            >
              No decorators found
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

export default Decorators;
