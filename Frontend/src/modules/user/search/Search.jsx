import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Input from '../../../components/ui/Input';
import EmptyState from '../../../components/ui/EmptyState';
import VendorCard from '../vendors/VendorCardFixed';
import userApi from '../../../services/userApi';

const Search = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // Fetch real categories from database
  useEffect(() => {
    userApi.getCategories()
      .then(res => {
        if (res.success && res.data) {
          setCategories(res.data);
        }
      })
      .catch(err => console.error('Error fetching categories for search:', err));
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute real server-side search
  useEffect(() => {
    const queryTrimmed = debouncedQuery.trim();
    if (!queryTrimmed && selectedFilter === 'all') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    userApi.getVendors({
      search: queryTrimmed || undefined,
      category: selectedFilter !== 'all' ? selectedFilter : undefined,
      limit: 24
    })
      .then(res => {
        if (isMounted) {
          setSearchResults(res.data || []);
        }
      })
      .catch(err => {
        console.error('Server search error:', err);
        if (isMounted) setSearchResults([]);
      })
      .finally(() => {
        if (isMounted) setIsSearching(false);
      });

    return () => { isMounted = false; };
  }, [debouncedQuery, selectedFilter]);

  // Dynamic filters based on DB categories
  const filters = [
    { key: 'all', label: 'All', icon: 'search' },
    ...categories.map(c => ({
      key: c.slug || c.name,
      label: c.name,
      icon: 'sparkles'
    }))
  ];

  const popularSearches = [
    'Wedding Photography',
    'Bridal Makeup',
    'Wedding Venues',
    'Mehndi Artists',
    'Wedding Planners',
    'DJ Services',
    'Catering',
    'Wedding Decorators'
  ];

  const handlePopularSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
  };

  const handleVendorClick = (vendor) => {
    navigate(`/user/vendor/${vendor._id || vendor.id}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.semantic.background.primary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: theme.semantic.text.primary }}
          >
            Search
          </h1>
          <p 
            className="text-sm"
            style={{ color: theme.semantic.text.secondary }}
          >
            Find approved vendors, services, and everything you need for your wedding
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="search" size="sm" style={{ color: theme.semantic.text.tertiary }} />
            </div>
            <Input
              type="text"
              placeholder="Search by vendor name, service, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Category Filters */}
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  selectedFilter === filter.key
                    ? 'text-white shadow-md'
                    : 'border hover:border-primary-300'
                }`}
                style={{
                  backgroundColor: selectedFilter === filter.key 
                    ? theme.colors.primary[500] 
                    : theme.semantic.card.background,
                  borderColor: selectedFilter === filter.key 
                    ? theme.colors.primary[500] 
                    : theme.semantic.border.light,
                  color: selectedFilter === filter.key 
                    ? 'white' 
                    : theme.semantic.text.secondary,
                  minWidth: 'max-content',
                  marginRight: '4px'
                }}
              >
                <Icon name={filter.icon} size="xs" />
                <span className="text-sm font-medium">{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {debouncedQuery || selectedFilter !== 'all' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                {isSearching ? (
                  `Searching database...`
                ) : (
                  `Found ${searchResults.length} verified vendor${searchResults.length !== 1 ? 's' : ''}`
                )}
              </p>
              {(debouncedQuery || selectedFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  className="text-sm underline"
                  style={{ color: theme.colors.primary[600] }}
                >
                  Clear search
                </button>
              )}
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((vendor) => (
                  <div key={vendor._id || vendor.id} onClick={() => handleVendorClick(vendor)}>
                    <VendorCard 
                      vendor={vendor} 
                      layout="responsive"
                    />
                  </div>
                ))}
              </div>
            ) : !isSearching ? (
              <EmptyState
                icon="noResults"
                title="No vendors found"
                description={`We couldn't find any approved vendors matching "${debouncedQuery}". Try different keywords or city filters.`}
              />
            ) : null}
          </div>
        ) : (
          <div>
            {/* Popular Searches */}
            <div className="mb-8">
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ color: theme.semantic.text.primary }}
              >
                Popular Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handlePopularSearch(search)}
                    className="px-4 py-2 rounded-full border transition-colors hover:border-primary-500"
                    style={{
                      borderColor: theme.semantic.border.light,
                      color: theme.semantic.text.secondary,
                      backgroundColor: theme.semantic.background.secondary
                    }}
                  >
                    <span className="text-sm">{search}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Browse Categories */}
            <div className="mb-8">
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ color: theme.semantic.text.primary }}
              >
                Browse Categories
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => navigate(`/user/vendors/${cat.slug || cat.name}`)}
                    className="p-4 rounded-xl border transition-colors hover:border-primary-500"
                    style={{
                      borderColor: theme.semantic.border.light,
                      backgroundColor: theme.semantic.card.background
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.primary[100] }}
                      >
                        <Icon name="sparkles" size="md" color="primary" />
                      </div>
                      <span 
                        className="text-sm font-medium"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        {cat.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <EmptyState
              icon="search"
              title="Start Your Search"
              description="Enter keywords to find verified vendors, services, venues, and more for your wedding."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;