import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useToast } from '../../../components/ui/Toast';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import VendorCard from '../vendors/VendorCardFixed';
import { vendors } from '../../../data/vendors';

const VenueBooking = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    capacity: 'all',
    rating: 'all'
  });

  // Get all venues
  const allVenues = vendors.filter(vendor => vendor.category === 'venues');

  // Categories
  const categories = [
    { id: 'all', name: 'All Venues', count: allVenues.length, icon: 'grid' },
    { id: 'banquet', name: 'Banquet Halls', count: allVenues.filter(v => v.services?.includes('venue')).length, icon: 'location' },
    { id: 'outdoor', name: 'Outdoor', count: allVenues.filter(v => v.services?.includes('lawn') || v.name.toLowerCase().includes('garden')).length, icon: 'star' },
    { id: 'luxury', name: 'Luxury', count: allVenues.filter(v => parseInt((v.price || '0').replace(/[^\d]/g, '')) >= 200000).length, icon: 'crown' },
    { id: 'budget', name: 'Budget Friendly', count: allVenues.filter(v => parseInt((v.price || '0').replace(/[^\d]/g, '')) < 100000).length, icon: 'money' }
  ];

  // Filter venues
  const getFilteredVenues = () => {
    let filtered = allVenues;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(venue => {
        const price = parseInt((venue.price || '0').replace(/[^\d]/g, ''));
        switch(selectedCategory) {
          case 'banquet':
            return venue.services?.includes('venue');
          case 'outdoor':
            return venue.services?.includes('lawn') || venue.name.toLowerCase().includes('garden');
          case 'luxury':
            return price >= 200000;
          case 'budget':
            return price < 100000;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(venue => {
        const price = parseInt((venue.price || '0').replace(/[^\d]/g, ''));
        switch(filters.priceRange) {
          case 'budget': return price < 100000;
          case 'mid': return price >= 100000 && price < 200000;
          case 'premium': return price >= 200000;
          default: return true;
        }
      });
    }

    // Rating filter
    if (filters.rating !== 'all') {
      filtered = filtered.filter(venue => {
        const rating = venue.rating || 0;
        switch(filters.rating) {
          case '4+': return rating >= 4;
          case '4.5+': return rating >= 4.5;
          case '4.7+': return rating >= 4.7;
          default: return true;
        }
      });
    }

    return filtered;
  };

  const filteredVenues = getFilteredVenues();

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: 'all',
      capacity: 'all',
      rating: 'all'
    });
    setSearchQuery('');
    setSelectedCategory('all');
    showToast('All filters cleared', 'info', 2000);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length + 
           (searchQuery ? 1 : 0) + 
           (selectedCategory !== 'all' ? 1 : 0);
  };

  return (
    <div 
      className="min-h-screen pb-24"
      style={{ backgroundColor: theme.semantic.background.primary }}
    >
      <div className="px-3 sm:px-4 py-3 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
            style={{ 
              color: theme.semantic.text.secondary,
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.semantic.background.accent}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Icon name="chevronLeft" size="sm" />
            <span className="hidden xs:inline">Back</span>
          </button>
          
          <h1 
            className="text-base sm:text-lg font-bold text-center flex-1 mx-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Venue Booking
          </h1>
          
          <div className="w-12 sm:w-16"></div>
        </div>

        {/* Hero Banner */}
        <div 
          className="mb-6 p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.secondary[500]} 100%)`,
            boxShadow: `0 8px 24px ${theme.colors.primary[500]}40`
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="location" size="lg" style={{ color: 'white' }} />
              <span className="text-white text-xs font-semibold px-2 py-1 bg-white/20 rounded-full">
                {filteredVenues.length} Venues Available
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Find Your Perfect Venue
            </h2>
            <p className="text-white/90 text-sm">
              Browse and book from the best wedding venues
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold mb-1" style={{ color: theme.colors.primary[600] }}>
              {allVenues.length}
            </p>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Total Venues
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold mb-1" style={{ color: theme.colors.accent[600] }}>
              {allVenues.filter(v => v.verified).length}
            </p>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Verified
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold mb-1" style={{ color: theme.colors.secondary[600] }}>
              4.6+
            </p>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Avg Rating
            </p>
          </Card>
        </div>

        {/* Categories */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="flex-shrink-0 px-4 py-2 rounded-lg border transition-all flex items-center gap-2"
                style={{
                  backgroundColor: selectedCategory === category.id 
                    ? theme.colors.primary[500]
                    : theme.semantic.background.accent,
                  borderColor: selectedCategory === category.id 
                    ? theme.colors.primary[500]
                    : theme.semantic.border.light,
                  color: selectedCategory === category.id ? 'white' : theme.semantic.text.primary
                }}
              >
                <Icon name={category.icon} size="sm" />
                <span className="text-sm font-medium">{category.name}</span>
                <span 
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: selectedCategory === category.id 
                      ? 'rgba(255,255,255,0.2)'
                      : theme.colors.primary[100],
                    color: selectedCategory === category.id 
                      ? 'white'
                      : theme.colors.primary[700]
                  }}
                >
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter */}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <option value="mid">₹1L - ₹2L</option>
                  <option value="premium">Above ₹2L</option>
                </select>
              </div>

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
                  <option value="small">Under 200</option>
                  <option value="medium">200 - 500</option>
                  <option value="large">Above 500</option>
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
            {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} found
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVenues.map((venue) => (
            <VendorCard key={venue.id} vendor={venue} layout="responsive" />
          ))}
        </div>

        {/* Empty State */}
        {filteredVenues.length === 0 && (
          <div 
            className="text-center py-16 rounded-lg"
            style={{
              backgroundColor: theme.semantic.card.background,
              borderColor: theme.semantic.card.border,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <div className="mb-4 flex justify-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.primary[50] }}
              >
                <Icon name="location" size="2xl" style={{ color: theme.colors.primary[500] }} />
              </div>
            </div>
            <h3 
              className="text-xl font-semibold mb-2"
              style={{ color: theme.semantic.text.primary }}
            >
              No venues found
            </h3>
            <p 
              className="text-sm mb-6"
              style={{ color: theme.semantic.text.secondary }}
            >
              Try adjusting your filters or search
            </p>
            <Button 
              onClick={clearAllFilters}
              variant="primary"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
      
      <ToastComponent />
    </div>
  );
};

export default VenueBooking;
