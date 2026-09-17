import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useLenisContext } from '../../../providers/LenisProvider';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import VendorCard from './VendorCardFixed';
import userApi from '../../../services/userApi';
import { useTheme } from '../../../hooks/useTheme';

const VendorsList = () => {
  const location = useLocation();
  const { category } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();

  // Get global Lenis instance
  const lenis = useLenisContext();

  const categoryTitle = location.state?.categoryTitle || category || 'Vendors';
  const [vendorsList, setVendorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || location.state?.search || '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || location.state?.search || '';
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 'all',
    availability: 'all',
    location: 'all',
    experience: 'all',
    eventDate: ''
  });

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch subcategories for current category from database
  useEffect(() => {
    const loadCategorySubs = async () => {
      try {
        const res = await userApi.getCategories();
        if (res.success && Array.isArray(res.data)) {
          const currentCat = res.data.find(c => 
            (c.slug && c.slug.toLowerCase() === (category || '').toLowerCase()) ||
            c.name.toLowerCase() === (category || '').toLowerCase().replace(/-/g, ' ')
          );
          if (currentCat && Array.isArray(currentCat.subCategories)) {
            setSubCategories(currentCat.subCategories);
          } else {
            setSubCategories([]);
          }
        }
      } catch (err) {
        console.warn('Could not load subcategories:', err);
      }
    };
    if (category && category !== 'all') {
      loadCategorySubs();
      setSelectedSubCategory('all');
      setCurrentPage(1);
    }
  }, [category]);

  const fetchVendors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let minPrice = undefined;
      let maxPrice = undefined;
      if (filters.priceRange === 'budget') maxPrice = 50000;
      else if (filters.priceRange === 'mid') { minPrice = 50000; maxPrice = 150000; }
      else if (filters.priceRange === 'premium') minPrice = 150000;

      let minRating = undefined;
      if (filters.rating === '4+') minRating = 4;
      else if (filters.rating === '4.5+') minRating = 4.5;

      let minExperience = undefined;
      if (filters.experience === '3+') minExperience = 3;
      else if (filters.experience === '5+') minExperience = 5;
      else if (filters.experience === '8+') minExperience = 8;

      const res = await userApi.getVendors({
        category: category && category !== 'all' ? category : undefined,
        subCategory: selectedSubCategory !== 'all' ? selectedSubCategory : undefined,
        city: filters.location !== 'all' ? filters.location : undefined,
        search: debouncedSearch.trim() || undefined,
        sort: sortBy,
        minPrice,
        maxPrice,
        minRating,
        minExperience,
        date: filters.eventDate || undefined,
        availability: filters.availability === 'available' ? 'available' : undefined,
        page: currentPage,
        limit: 12
      });

      if (res.success) {
        setVendorsList(res.data || []);
        setPagination({
          total: res.total ?? res.count ?? (res.data || []).length,
          totalPages: res.totalPages || 1,
          hasNextPage: Boolean(res.hasNextPage),
          hasPreviousPage: Boolean(res.hasPreviousPage)
        });
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err.message || 'Failed to load vendors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [category, selectedSubCategory, sortBy, filters.location, filters.priceRange, filters.rating, filters.experience, filters.availability, filters.eventDate, currentPage, debouncedSearch]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setDebouncedSearch(searchQuery);
    setCurrentPage(1);
    fetchVendors();
  };

  const sortedVendors = vendorsList;

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
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
      location: 'all',
      services: 'all',
      experience: 'all',
      responseTime: 'all'
    });
    setSearchQuery('');
    showToast('All filters cleared', 'info', 2000);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length + (searchQuery ? 1 : 0);
  };

  const toggleSaveVendor = async (vendorId, isCurrentlySaved) => {
    if (!user) {
      showToast('Please log in to save vendors to your favourites', 'error', 3000);
      navigate('/login', { state: { from: location.pathname } });
      return false;
    }

    try {
      if (isCurrentlySaved) {
        await userApi.removeFavorite(vendorId);
        showToast('Vendor removed from favourites', 'info', 2000);
        return false;
      } else {
        await userApi.addFavorite(vendorId);
        showToast('Vendor saved to favourites!', 'success', 2000);
        return true;
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      showToast(err.message || 'Failed to update favourites', 'error', 2500);
      throw err;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#EAE1D8' }}
    >
      <div className="px-4 py-3 max-w-7xl mx-auto space-y-4">
        {/* Back Button and Title (WedMeGood Style) */}
        <div className="flex items-center justify-between pb-2 border-b border-[#3D2B2B]/10">
          <button
            onClick={() => navigate('/user/vendors')}
            className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center text-[#3D2B2B] hover:bg-white/60 transition-all active:scale-90"
          >
            <Icon name="chevronLeft" size="sm" />
          </button>

          <div className="text-center">
            <h1 className="text-[#3D2B2B] text-base font-black tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
              Bhopal • {categoryTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => navigate('/user/favourites')}
               title="View Saved Favourites"
               aria-label="View Saved Favourites"
               className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center text-[#3D2B2B] hover:bg-white/60 transition-all active:scale-90"
             >
                <Icon name="heart" size="sm" />
             </button>
          </div>
        </div>

        {/* Search Bar (Pill Style) */}
        <form onSubmit={handleSearchSubmit} className="relative group">
          <button
            type="submit"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3D2B2B]/60 hover:text-[#BE185D] transition-colors cursor-pointer"
            title="Submit search"
            aria-label="Submit search"
          >
            <Icon name="search" size="sm" />
          </button>
          <input
            type="text"
            placeholder={`Search ${categoryTitle.toLowerCase()} by name, service, or location...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-28 py-3.5 rounded-full border-none text-sm shadow-sm transition-all focus:ring-2 focus:ring-[#3D2B2B]/20"
            style={{
              backgroundColor: 'white',
              color: '#3D2B2B'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearch('');
                setCurrentPage(1);
              }}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs px-2 py-1 cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-[#3D2B2B] text-white text-xs font-bold hover:bg-[#251a1a] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Dynamic Subcategories Pill Bar */}
        {subCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => { setSelectedSubCategory('all'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all shadow-xs ${
                selectedSubCategory === 'all'
                  ? 'bg-[#3D2B2B] text-white shadow-sm'
                  : 'bg-white/80 text-[#3D2B2B] hover:bg-white'
              }`}
            >
              All {categoryTitle}
            </button>
            {subCategories.map(sub => (
              <button
                key={sub._id || sub.name}
                onClick={() => { setSelectedSubCategory(sub.name); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all shadow-xs ${
                  selectedSubCategory === sub.name
                    ? 'bg-[#3D2B2B] text-white shadow-sm'
                    : 'bg-white/80 text-[#3D2B2B] hover:bg-white'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Destination Pricing Toggle (WedMeGood Signature) */}
        <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#3D2B2B]/60" style={{ fontFamily: '"Outfit", sans-serif' }}>
                View Destination Pricing
            </span>
            <div className="w-12 h-6 bg-rose-500 rounded-full relative p-1 shadow-inner">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Price Range Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Price Range
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="vendor-filter-select w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="all">All Prices</option>
                  <option value="budget">Under ₹50K</option>
                  <option value="mid">₹50K - ₹1.5L</option>
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
                  className="vendor-filter-select w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="all">All Ratings</option>
                  <option value="4+">4+ Stars</option>
                  <option value="4.5+">4.5+ Stars</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Availability
                </label>
                <select
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  className="vendor-filter-select w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="all">All Vendors</option>
                  <option value="available">Available Only</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="vendor-filter-select w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="all">All Locations</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="delhi">Delhi</option>
                  <option value="bangalore">Bangalore</option>
                  <option value="pune">Pune</option>
                  <option value="jaipur">Jaipur</option>
                  <option value="goa">Goa</option>
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
                  className="vendor-filter-select w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="all">All Services</option>
                  <option value="photography">Photography</option>
                  <option value="videography">Videography</option>
                  <option value="decoration">Decoration</option>
                  <option value="catering">Catering</option>
                  <option value="music">Music</option>
                  <option value="mehndi">Mehndi</option>
                </select>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Experience
                </label>
                <select
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  className="vendor-filter-select w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="all">All Experience</option>
                  <option value="5+">5+ Years</option>
                  <option value="10+">10+ Years</option>
                  <option value="15+">15+ Years</option>
                </select>
              </div>

              {/* Date & Availability Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Event Date
                </label>
                <input
                  type="date"
                  value={filters.eventDate}
                  onChange={(e) => handleFilterChange('eventDate', e.target.value)}
                  className="vendor-filter-select w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                />
                {filters.eventDate && (
                  <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={filters.availability === 'available'}
                      onChange={(e) => handleFilterChange('availability', e.target.checked ? 'available' : 'all')}
                      className="rounded text-[#BE185D]"
                    />
                    <span>Only available vendors</span>
                  </label>
                )}
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => { setCurrentPage(1); setSortBy(e.target.value); }}
                  className="vendor-filter-select w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="rating">Top Rated</option>
                  <option value="popular">Most Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="experience">Years Experience</option>
                  <option value="newest">Newest</option>
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
              {pagination.total} vendor{pagination.total !== 1 ? 's' : ''} found
              {searchQuery && (
                <span className="text-xs ml-2" style={{ color: theme.semantic.text.secondary }}>
                  for "{searchQuery}"
                </span>
              )}
            </span>
            <span
              className="text-xs xs:hidden ml-2"
              style={{ color: theme.semantic.text.secondary }}
            >
              in {categoryTitle}
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

        {/* Content Area: Loading, Error, or Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 mb-24">
            <div className="w-12 h-12 border-4 border-[#E91E63] border-t-transparent animate-spin rounded-full mb-4"></div>
            <p className="text-sm font-semibold text-slate-500">
              Loading verified vendors from marketplace...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4 bg-red-50 rounded-2xl border border-red-200 max-w-md mx-auto mb-24">
            <Icon name="alertTriangle" size="lg" className="text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-900 mb-1">Failed to load vendors</h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button size="sm" onClick={fetchVendors}>Try Again</Button>
          </div>
        ) : (
          <>
            {/* Responsive Vendors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
              {sortedVendors.map((vendor) => (
                <div key={vendor._id || vendor.id} className="vendor-list-card">
                  <VendorCard
                    vendor={vendor}
                    layout="responsive"
                    onToggleSave={toggleSaveVendor}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2 pb-24">
                <button
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2 text-xs font-bold rounded-full bg-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-[#3D2B2B] transition-all"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-[#3D2B2B]/70 px-2">
                  Page {currentPage} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  className="px-4 py-2 text-xs font-bold rounded-full bg-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-[#3D2B2B] transition-all"
                >
                  Next
                </button>
              </div>
            )}

            {/* Enhanced Empty State */}
            {sortedVendors.length === 0 && (
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
                    <Icon name="noResults" size="2xl" color="muted" />
                  </div>
                </div>
                <h3
                  className="text-lg sm:text-xl font-semibold mb-2"
                  style={{ color: theme.semantic.text.primary }}
                >
                  No vendors found
                </h3>
                <p
                  className="text-sm sm:text-base mb-6 px-4"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  {debouncedSearch
                    ? `No matching vendors found for "${debouncedSearch}" in ${categoryTitle}. Try adjusting your search term or filters.`
                    : `We couldn't find any ${categoryTitle.toLowerCase()} in your area. Try browsing other categories.`}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {debouncedSearch && (
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setDebouncedSearch('');
                        setCurrentPage(1);
                      }}
                      variant="secondary"
                      className="px-4 py-2 text-xs"
                    >
                      Clear Search
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate('/user/vendors')}
                    variant="primary"
                    className="px-6 py-2 text-xs"
                  >
                    Browse All Categories
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Filter & Genie Buttons (WedMeGood Style) */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center bg-[#3D2B2B] text-white rounded-full px-5 py-2.5 shadow-2xl space-x-4 z-50">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center space-x-2 border-r border-white/20 pr-4">
              <Icon name="filter" size="sm" />
              <span className="text-xs font-bold uppercase tracking-wider">Filter</span>
          </button>
          <button className="flex items-center space-x-2">
              <img src="/assets/icons/genie.png" alt="Genie" className="w-5 h-5 invert" onError={(e) => e.target.style.display = 'none'} />
              <Icon name="sparkles" size="sm" />
              <span className="text-xs font-bold uppercase tracking-wider">Genie</span>
          </button>
      </div>

      {/* Toast Component */}
      <ToastComponent />
    </div>
  );
};

export default VendorsList;