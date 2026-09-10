import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Input from '../../../components/ui/Input';
import EmptyState from '../../../components/ui/EmptyState';
import VendorCard from '../vendors/VendorCardFixed';
import { vendors } from '../../../data/vendors';
import { smartSliderCategories } from '../../../data/smartSliderData';

const Search = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Debounce search to avoid too many re-renders
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    if (searchQuery) {
      setIsSearching(true);
    }

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search filters
  const filters = [
    { key: 'all', label: 'All', icon: 'search' },
    { key: 'photographers', label: 'Photography', icon: 'camera' },
    { key: 'venues', label: 'Venues', icon: 'building' },
    { key: 'makeup', label: 'Makeup', icon: 'makeup' },
    { key: 'planning-decor', label: 'Planning', icon: 'decoration' },
    { key: 'mehndi', label: 'Mehndi', icon: 'heart' },
    { key: 'music-dance', label: 'Music', icon: 'sparkles' },
    { key: 'food', label: 'Catering', icon: 'heart' },
    { key: 'invites-gifts', label: 'Invites', icon: 'envelope' }
  ];

  // Combine all searchable data
  const allSearchableItems = useMemo(() => {
    const vendorItems = vendors.map(vendor => ({
      ...vendor,
      type: 'vendor',
      searchText: `${vendor.name} ${vendor.description} ${vendor.location} ${vendor.services.join(' ')} ${vendor.category}`.toLowerCase()
    }));

    // Add items from smart slider data
    const sliderItems = [];
    Object.values(smartSliderCategories).forEach(category => {
      category.items.forEach(item => {
        // Only add if not already in vendors (avoid duplicates)
        if (!vendorItems.find(v => v.id === item.id)) {
          sliderItems.push({
            ...item,
            type: 'vendor',
            searchText: `${item.name} ${item.category} ${item.location}`.toLowerCase()
          });
        }
      });
    });

    return [...vendorItems, ...sliderItems];
  }, []);

  // Search logic
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];

    const query = debouncedQuery.toLowerCase().trim();
    const words = query.split(' ').filter(word => word.length > 0);

    return allSearchableItems.filter(item => {
      // Filter by category if selected
      if (selectedFilter !== 'all' && item.category !== selectedFilter) {
        return false;
      }

      // Check if all search words are found in the item
      return words.every(word => 
        item.searchText.includes(word) ||
        item.name.toLowerCase().includes(word) ||
        item.category.toLowerCase().includes(word) ||
        item.location.toLowerCase().includes(word)
      );
    }).slice(0, 20); // Limit results to 20 items
  }, [debouncedQuery, selectedFilter, allSearchableItems]);

  // Popular searches
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
    navigate(`/user/vendor/${vendor.id}`);
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
            Find vendors, services, and everything you need for your perfect wedding
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
              placeholder="Search for vendors, services, venues..."
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

        {/* Search Filters */}
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
        {debouncedQuery ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                {isSearching ? (
                  `Searching for "${debouncedQuery}"...`
                ) : (
                  `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${debouncedQuery}"`
                )}
              </p>
              {searchResults.length > 0 && (
                <button
                  onClick={() => setSearchQuery('')}
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
                  <div key={`${vendor.type}-${vendor.id}`} onClick={() => handleVendorClick(vendor)}>
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
                title="No results found"
                description={`We couldn't find any vendors matching "${debouncedQuery}". Try different keywords or browse by category.`}
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

            {/* Recent Searches - Placeholder */}
            <div className="mb-8">
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ color: theme.semantic.text.primary }}
              >
                Browse Categories
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filters.slice(1).map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => navigate(`/user/vendors/${filter.key}`)}
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
                        <Icon name={filter.icon} size="md" color="primary" />
                      </div>
                      <span 
                        className="text-sm font-medium"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        {filter.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <EmptyState
              icon="search"
              title="Start Your Search"
              description="Enter keywords to find vendors, services, venues, and more for your wedding."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;