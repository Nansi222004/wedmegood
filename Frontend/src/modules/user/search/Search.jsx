import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import EmptyState from '../../../components/ui/EmptyState';
import VendorCard from '../vendors/VendorCardFixed';
import userApi from '../../../services/userApi';

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q') || params.get('search') || '';
  });
  const [debouncedQuery, setDebouncedQuery] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q') || params.get('search') || '';
  });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // Fetch real categories from database
  useEffect(() => {
    userApi
      .getCategories()
      .then((res) => {
        if (res.success && res.data) {
          setCategories(res.data);
        }
      })
      .catch((err) => console.error('Error fetching categories for search:', err));
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

    userApi
      .getVendors({
        search: queryTrimmed || undefined,
        category: selectedFilter !== 'all' ? selectedFilter : undefined,
        limit: 24
      })
      .then((res) => {
        if (isMounted) {
          setSearchResults(res.data || []);
        }
      })
      .catch((err) => {
        console.error('Server search error:', err);
        if (isMounted) setSearchResults([]);
      })
      .finally(() => {
        if (isMounted) setIsSearching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, selectedFilter]);

  // Dynamic filters based on DB categories
  const filters = [
    { key: 'all', label: 'All Disciplines', icon: 'search' },
    ...categories.map((c) => ({
      key: c.slug || c.name,
      label: c.name,
      icon: 'sparkles'
    }))
  ];

  const popularSearches = [
    'Wedding Photography',
    'Bridal Makeup',
    'Palace Venues',
    'Royal Decorators',
    'Mehendi Artists',
    'Wedding Planners',
    'DJ & Music',
    'Catering Services'
  ];

  const handlePopularSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
  };

  const handleVendorClick = (vendor) => {
    navigate(`/user/vendor/${vendor._id || vendor.id}`);
  };

  return (
    <div className="bg-[#EDE8E1] min-h-screen text-slate-800 antialiased font-sans">
      <div className="max-w-[430px] md:max-w-4xl mx-auto min-h-screen bg-[#FAF6F0] relative overflow-hidden shadow-2xl pb-28 px-4 sm:px-6 py-6">
        {/* Subtle Luxury Floral Watermarks */}
        <div className="floral-bg-corner-tl opacity-70 pointer-events-none" />
        <div className="floral-bg-corner-br opacity-70 pointer-events-none" />

        {/* Search Header */}
        <div className="mb-5 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/90 border border-[#D4AF37]/35 flex items-center justify-center text-[#4F1325] hover:bg-white active:scale-95 transition-all shadow-xs"
            >
              <Icon name="chevronLeft" size="sm" />
            </button>
            <div className="text-center">
              <span className="text-[10px] font-cinzel uppercase tracking-[0.2em] text-[#D4AF37] block font-bold">
                Royal Directory
              </span>
              <h1 className="text-2xl font-serif font-bold text-[#4F1325]">
                Search Artisans
              </h1>
            </div>
            <div className="w-10"></div>
          </div>
          <p className="text-center text-xs text-[#651731]/70">
            Find vetted venues, photographers, and celebratory services
          </p>
        </div>

        {/* Search Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDebouncedQuery(searchQuery);
          }}
          className="mb-5 relative z-10"
        >
          <div className="relative flex items-center bg-white/95 rounded-full shadow-xs border border-[#D4AF37]/35 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20 transition-all p-1">
            <div className="pl-3.5 pr-2 text-[#D4AF37]">
              <Icon name="search" size="sm" />
            </div>
            <input
              type="text"
              placeholder="Search by vendor name, service, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 bg-transparent text-sm text-[#4F1325] focus:outline-none placeholder-[#4F1325]/45"
            />
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                }}
                className="text-slate-400 hover:text-slate-700 text-xs px-2.5 py-1 cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
            {isSearching && (
              <div className="px-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#4F1325] to-[#651731] text-[#ECC880] text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer ml-1 font-cinzel"
            >
              Search
            </button>
          </div>
        </form>

        {/* Dynamic Category Filters */}
        <div className="mb-6 relative z-10">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shadow-xs flex-shrink-0 ${
                  selectedFilter === filter.key
                    ? 'bg-gradient-to-r from-[#4F1325] to-[#651731] text-[#ECC880] shadow-sm'
                    : 'bg-white/90 border border-[#D4AF37]/25 text-[#4F1325] hover:bg-white'
                }`}
              >
                <Icon name={filter.icon} size="xs" />
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {debouncedQuery || selectedFilter !== 'all' ? (
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-xs font-cinzel font-bold text-[#651731]/75 uppercase tracking-wider">
                {isSearching
                  ? 'Searching marketplace...'
                  : `Found ${searchResults.length} verified artisan${searchResults.length !== 1 ? 's' : ''}`}
              </p>
              {(debouncedQuery || selectedFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  className="text-xs font-bold text-[#651731] underline hover:text-[#4F1325]"
                >
                  Clear search
                </button>
              )}
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((vendor) => (
                  <div key={vendor._id || vendor.id} onClick={() => handleVendorClick(vendor)}>
                    <VendorCard vendor={vendor} layout="responsive" />
                  </div>
                ))}
              </div>
            ) : !isSearching ? (
              <div className="text-center py-16 px-4 bg-white/80 rounded-[28px] border border-[#D4AF37]/25 shadow-xs max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#FAF6F0] border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-3 text-[#D4AF37]">
                  <Icon name="noResults" size="xl" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#4F1325] mb-1">
                  No Artisans Found
                </h3>
                <p className="text-xs text-[#651731]/70 max-w-xs mx-auto">
                  We could not find any verified vendors matching "{debouncedQuery}". Try adjusting your keywords or discipline filter.
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="relative z-10 space-y-6">
            {/* Popular Searches */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#651731] mb-3 font-cinzel">
                Trending Inquiries
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handlePopularSearch(search)}
                    className="px-3.5 py-1.5 rounded-full bg-white/90 border border-[#D4AF37]/25 text-[#4F1325] text-xs font-medium hover:border-[#D4AF37] hover:bg-white shadow-2xs transition-all"
                  >
                    <span>{search}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Browse Categories */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#651731] mb-3 font-cinzel">
                Explore Categories
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => navigate(`/user/vendors/${cat.slug || cat.name}`)}
                    className="p-3.5 rounded-[20px] bg-white/90 border border-[#D4AF37]/25 hover:border-[#D4AF37] shadow-xs hover:shadow-md transition-all group flex flex-col items-center text-center"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF5F6] to-[#FAF6F0] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 group-hover:scale-105 transition-transform">
                      <Icon name="sparkles" size="sm" />
                    </div>
                    <span className="text-xs font-serif font-bold text-[#4F1325] group-hover:text-[#651731]">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;