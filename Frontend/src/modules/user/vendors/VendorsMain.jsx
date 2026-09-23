import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import userApi from '../../../services/userApi';

const getCategoryIcon = (slug) => {
  const color = "#B08953";
  switch (slug) {
    case 'venues':
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
    case 'photographers':
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M6 2L3 8l9 14 9-14-3-6H6z" /><path d="M3 8h18" /><path d="M12 2v20" /><path d="M6 2l6 6" /><path d="M18 2l-6 6" /></svg>;
    case 'catering':
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M6 13.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-.5"></path><path d="M12 4v2"></path><path d="M4.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H4.5z"></path></svg>;
    case 'decorators':
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><circle cx="9" cy="9" r="4"></circle><circle cx="15" cy="9" r="4"></circle><path d="M9 13v6"></path><path d="M15 13v6"></path></svg>;
    case 'makeup-artists':
    case 'makeup':
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><circle cx="12" cy="8" r="5"></circle><path d="M12 13a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8z"></path></svg>;
    case 'entertainment':
    case 'music-djs':
    case 'choreographers':
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>;
    default:
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
  }
};

const VendorsMain = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedCity] = useState('Indore');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await userApi.getCategories();
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map(cat => {
            const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const subList = Array.isArray(cat.subCategories) ? cat.subCategories.map(s => s.name).join(', ') : '';
            return {
              id: slug,
              dbId: cat._id,
              name: cat.name,
              subtitle: subList || cat.description || 'Verified Wedding Professionals',
              image: cat.image || defaultCategoryImages[slug] || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop&crop=center',
              route: `/user/vendors/${slug}`
            };
          });
          setCategories(mapped);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load marketplace categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (category) => {
    navigate(category.route, { 
      state: { 
        category: category.id,
        categoryTitle: category.name 
      } 
    });
  };

  const handleSearchClick = () => {
    navigate('/user/search');
  };

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/vendors/all?search=${encodeURIComponent(searchQuery.trim())}`, {
        state: { category: 'all', categoryTitle: 'All Categories', search: searchQuery.trim() }
      });
    } else {
      navigate('/user/search');
    }
  };

  return (
    <div className="min-h-screen pb-32 relative bg-transparent">
      {/* Background Image for the whole page */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" style={{ backgroundImage: "url('/uservendorre%20page%20bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1 }} />

      <div className="px-6 pt-6 pb-12 relative z-10">

        {/* The Atelier Section */}
        <div className="mb-8">
           <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#BE185D]"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6B6C80]">Curation Service</span>
           </div>

           <div className="flex justify-between items-start">
             <div>
               <h1 className="text-[42px] font-bold text-[#301024] leading-none mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                 The Atelier
               </h1>
               <div className="flex items-center gap-1.5 text-[#BE185D] mb-6">
                  <Icon name="location" size="xs" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em]">{selectedCity}</span>
                  <Icon name="chevronDown" size="xs" />
               </div>
             </div>
             <button className="w-10 h-10 bg-[#FDF4F7] rounded-full flex items-center justify-center shadow-sm border border-white shrink-0 active:scale-95 transition-transform">
                <Icon name="search" size="xs" className="text-[#301024]" />
             </button>
           </div>

           {/* Second Search Bar */}
           <form onSubmit={handleSearchSubmit} className="relative">
             <div className="relative flex items-center bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-white p-1">
               <Icon name="search" size="sm" className="absolute left-4 text-gray-400" />
               <input
                 type="text"
                 placeholder="Search all vendors, services, or cities..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-11 pr-3 py-2.5 bg-transparent text-[13px] font-medium text-[#301024] focus:outline-none placeholder-[#301024]/50"
               />
               <button
                 type="submit"
                 className="px-6 py-2.5 rounded-full bg-[#BE185D] text-white text-[12px] font-bold shadow-md hover:bg-[#9D174D] active:scale-95 transition-all ml-2"
               >
                 Search
               </button>
             </div>
           </form>
        </div>

        {/* Categories Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white/60 backdrop-blur-md rounded-[32px] p-12 text-center shadow-sm border border-white">
              <div className="w-8 h-8 border-3 border-[#BE185D] border-t-transparent animate-spin rounded-full mx-auto mb-3"></div>
              <p className="text-xs font-bold text-[#301024]/60 uppercase tracking-widest">Loading...</p>
            </div>
          ) : error ? (
            <div className="bg-white/60 backdrop-blur-md rounded-[32px] p-8 text-center shadow-sm border border-white text-red-600 text-xs font-semibold">
              {error}
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-md rounded-[32px] p-8 text-center shadow-sm border border-white text-[#301024]/60 text-xs">
              No categories available.
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="relative bg-white/90 backdrop-blur-sm rounded-[32px] p-5 pr-8 flex items-center gap-5 shadow-sm border border-white hover:shadow-md active:scale-95 transition-all group cursor-pointer overflow-hidden"
              >
                {/* Background image on the card */}
                <div className="absolute inset-0 bg-no-repeat opacity-30 pointer-events-none" style={{ backgroundImage: "url('/uservendorre%20page%20bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

                {/* Star icon top right */}
                <div className="absolute top-5 right-5 text-[#301024]/40">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </div>

                <div className="w-14 h-14 shrink-0 bg-[#FDFBF9] rounded-full flex items-center justify-center border border-[#F3E8DC] shadow-sm relative z-10">
                   {getCategoryIcon(category.id)}
                </div>

                <div className="flex-1 min-w-0 relative z-10 pr-4">
                  <h3 className="text-[24px] font-bold text-[#2A1B24] mb-0.5 leading-tight truncate" style={{ fontFamily: '"Playfair Display", serif' }}>
                    {category.name}
                  </h3>
                  <p className="text-[10px] font-bold text-[#8E95A4] leading-relaxed uppercase tracking-wider truncate">
                    {category.subtitle}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="h-10"></div>
    </div>
  );
};

export default VendorsMain;