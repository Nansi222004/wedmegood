import { useState, useEffect, useRef } from 'react';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';
import Icon from '../../../components/ui/Icon';

/* ─── Static Demo Data ───────────────────────────────────────────── */
const DEMO_PROJECTS = [
  {
    id: 1,
    title: 'Rahul & Sneha',
    theme: 'Royal Floral Stage',
    venue: 'The Leela Palace, Delhi',
    date: '25 May, 2024',
    cost: '₹4.5L',
    badge: 'FEATURED',
    badgeColor: '#6D3BFF',
    views: '2.8K', likes: 145, bookmarks: 52,
    category: 'Wedding Decor',
    img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 2,
    title: 'Amit & Pooja',
    theme: 'Rose Garden Aisle',
    venue: 'ITC Maratha, Mumbai',
    date: '18 May, 2024',
    cost: '₹3.2L',
    badge: 'TRENDING',
    badgeColor: '#F59E0B',
    views: '2.2K', likes: 128, bookmarks: 44,
    category: 'Reception',
    img: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 3,
    title: 'Vikram & Anjali',
    theme: 'Golden Mandap Stage',
    venue: 'Taj Lands End, Mumbai',
    date: '10 May, 2024',
    cost: '₹2.8L',
    badge: 'POPULAR',
    badgeColor: '#10B981',
    views: '1.9K', likes: 110, bookmarks: 38,
    category: 'Wedding Decor',
    img: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=600',
  },
];

const DEMO_LATEST = [
  { id: 4, title: 'Neha & Karan Wedding', theme: 'Peach & White Theme', venue: 'JW Marriott, Pune', date: '27 Jun, 2024', views: 960, likes: 44, bookmarks: 32, category: 'Wedding Decor', img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=400' },
  { id: 5, title: 'Rohan & Piya Wedding', theme: 'Enchanted Garden Theme', venue: 'The Oberoi, Gurgaon', date: '24 May, 2024', views: '1.4K', likes: 88, bookmarks: 21, category: 'Reception', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400' },
  { id: 6, title: 'Siddharth & Isha Wedding', theme: 'White & Green Wisdom Theme', venue: 'Grand Lexis, Bengaluru', date: '30 May, 2024', views: '1.1K', likes: 72, bookmarks: 26, category: 'Haldi', img: 'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=400' },
  { id: 7, title: 'Kunal & Deepa Wedding', theme: 'Traditional South Indian Decor', venue: 'Leela Palace, Chennai', date: '11 May, 2024', views: '1.5K', likes: 95, bookmarks: 27, category: 'Mehendi', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400' },
];

const ALBUMS = [
  { id: 1, label: 'Royal Weddings', count: 18, img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300' },
  { id: 2, label: 'Floral Fantasy', count: 22, img: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=300' },
  { id: 3, label: 'Luxury Decor', count: 16, img: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=300' },
  { id: 4, label: 'Outdoor Weddings', count: 14, img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=300' },
  { id: 5, label: 'Traditional Decor', count: 12, img: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=300' },
];

const CATEGORIES = ['All Projects', 'Wedding Decor', 'Reception', 'Haldi', 'Mehendi', 'More'];
const CAT_COUNTS = { 'All Projects': 128, 'Wedding Decor': 48, 'Reception': 22, 'Haldi': 15, 'Mehendi': 12, 'More': '···' };
const LOCATIONS = ['All', 'Delhi', 'Mumbai', 'Pune', 'Gurgaon', 'Bengaluru', 'Chennai'];
const SORT_OPTIONS = [
  { id: 'latest', label: 'Latest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'views', label: 'Most Viewed' },
  { id: 'likes', label: 'Most Liked' },
];

// Utility Helpers
const parseDate = (dStr) => {
  if (!dStr || dStr === '—') return new Date(0);
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const parts = dStr.replace(',', '').split(' ');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = months[parts[1]] || 0;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dStr) || new Date(0);
};

const parseViewsNum = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  const str = v.toString().toUpperCase();
  if (str.endsWith('K')) return parseFloat(str) * 1000;
  if (str.endsWith('M')) return parseFloat(str) * 1000000;
  return parseFloat(str) || 0;
};

/* ─── Component ──────────────────────────────────────────────────── */
const VendorPortfolio = () => {
  const { vendorState, refreshData } = useVendorState();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Projects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [newItem, setNewItem] = useState({ title: '', tag: 'Wedding Decor', type: 'Photo', url: '' });
  const featuredRef = useRef(null);

  // Filter and Sort states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const [isAlbumsModalOpen, setIsAlbumsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const getProjectNarrative = (proj) => {
    if (!proj) return '';
    if (proj.description) return proj.description;
    return `A custom-themed event styling meticulously curated for the client. Features premium floral installations, customized HSL-tailored ambient lighting configurations, and absolute structural excellence. Designed to establish a luxurious and memorable ambiance at ${proj.venue || 'the venue'}.`;
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (vendorState.portfolio) {
      setPortfolio(vendorState.portfolio);
      setLoading(false);
    } else {
      (async () => {
        const token = localStorage.getItem('vendorToken');
        try {
          const res = await vendorApi.getProfile(token);
          if (res.success) setPortfolio(res.data.portfolio || []);
        } catch (_) {}
        setLoading(false);
      })();
    }
  }, [vendorState.portfolio]);

  const handleImageUpload = async (file) => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.uploadMedia(file, token);
      if (res.success) setNewItem(p => ({ ...p, url: res.url }));
    } catch (_) {} finally { setIsUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newItem.title || !newItem.url) return;
    const updated = [...portfolio, { ...newItem }];
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.updatePortfolio(updated, token);
      if (res.success) {
        setPortfolio(res.data);
        setIsModalOpen(false);
        setNewItem({ title: '', tag: 'Wedding Decor', type: 'Photo', url: '' });
        refreshData();
        showToast('Work added to portfolio!');
      }
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-violet-400 border-t-transparent rounded-full" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Portfolio...</p>
      </div>
    );
  }

  const hasRealPortfolio = portfolio.length > 0;

  // ─── Dynamic KPI Calculations ──────────────────────────────
  const formatNumber = (num, fallback = '0') => {
    if (num === undefined || num === null || num === 0) return fallback;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // 1. Total Projects (Baseline 128 + any new uploads beyond initial demo items)
  const totalProjects = 128 + Math.max(0, portfolio.length - 3);

  // 2. Total Views (From vendorState.analytics, baseline 85.2K)
  const profileViews = vendorState.analytics?.profileViews || 0;
  const displayViews = profileViews > 0 ? formatNumber(profileViews) : '85.2K';

  // 3. Enquiries (From vendorState.analytics, baseline 340)
  const inquiries = vendorState.analytics?.inquiries || 340;

  // 4. Most Viewed Theme (Dynamic based on highest views, fallback to Royal Wedding Theme)
  let mostViewedTheme = 'Royal Wedding Theme';
  let mostViewedCount = '12.5K views';
  
  if (portfolio.length > 0) {
    const parseViews = (v) => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        if (v.endsWith('K')) return parseFloat(v) * 1000;
        if (v.endsWith('M')) return parseFloat(v) * 1000000;
        return parseFloat(v) || 0;
      }
      return 0;
    };
    
    let maxViews = -1;
    let bestProj = null;
    portfolio.forEach(p => {
      const v = parseViews(p.views);
      if (v > maxViews) {
        maxViews = v;
        bestProj = p;
      }
    });
    
    if (bestProj) {
      mostViewedTheme = bestProj.theme || bestProj.title || 'Royal Wedding Theme';
      const viewsVal = parseViews(bestProj.views);
      mostViewedCount = (viewsVal > 0 ? formatNumber(viewsVal) : '12.5K') + ' views';
    }
  }

  const dynamicKpis = [
    {
      value: totalProjects.toString(),
      label: 'Total Projects',
      trend: '18% vs last month',
      icon: 'calendar',
      color: '#6D3BFF',
      bg: '#F5F2FF',
      border: '#D8CFFF',
      badgeBg: '#E9E4FF',
      valueColor: '#6D3BFF'
    },
    {
      value: displayViews,
      label: 'Total Views',
      trend: '22% vs last month',
      icon: 'eye',
      color: '#2563EB',
      bg: '#F0F6FF',
      border: '#C7DDFE',
      badgeBg: '#DCE9FE',
      valueColor: '#2563EB'
    },
    {
      value: inquiries.toString(),
      label: 'Enquiries Generated',
      trend: '20% vs last month',
      icon: 'users',
      color: '#10B981',
      bg: '#EEFBF4',
      border: '#C1F2D9',
      badgeBg: '#D3F8E6',
      valueColor: '#10B981'
    },
    {
      value: mostViewedTheme,
      label: 'Most Viewed Theme',
      trend: mostViewedCount,
      icon: 'trophy',
      color: '#F59E0B',
      bg: '#FFFDF0',
      border: '#FDE4A3',
      badgeBg: '#FFF2C6',
      valueColor: '#1E293B',
      isTheme: true
    }
  ];

  // ─── Filter & Sort Calculations for Projects ───────────────────
  const featuredProjects = (hasRealPortfolio
    ? portfolio.map((p, i) => ({
        ...p,
        id: `feat-real-${i}`,
        badge: i === 0 ? 'FEATURED' : 'TRENDING',
        badgeColor: i === 0 ? '#6D3BFF' : '#F59E0B',
        views: p.views || '1.2K',
        likes: p.likes || 88,
        bookmarks: p.bookmarks || 30,
        cost: '—',
        venue: p.venue || 'The Leela Palace, Delhi',
        date: p.date || '25 May, 2024',
        theme: p.tag,
        category: p.tag
      }))
    : DEMO_PROJECTS
  );

  const latestProjects = (hasRealPortfolio
    ? portfolio.map((p, i) => ({
        ...p,
        id: `lat-real-${i}`,
        views: p.views || 860,
        likes: p.likes || 44,
        bookmarks: p.bookmarks || 22,
        venue: p.venue || 'JW Marriott, Pune',
        date: p.date || '27 Jun, 2024',
        theme: p.tag,
        category: p.tag
      }))
    : DEMO_LATEST
  );

  // 1. Filter Featured by activeCategory
  const filteredFeatured = activeCategory === 'All Projects' || activeCategory === 'More'
    ? featuredProjects
    : featuredProjects.filter(p => p.category === activeCategory);

  // 2. Filter Latest by activeCategory AND selectedLocation
  let filteredLatest = latestProjects.filter(p => {
    const matchesCategory = activeCategory === 'All Projects' || activeCategory === 'More' || p.category === activeCategory;
    const matchesLocation = selectedLocation === 'All' || p.venue.includes(selectedLocation);
    return matchesCategory && matchesLocation;
  });

  // 3. Sort Latest Projects
  filteredLatest = [...filteredLatest].sort((a, b) => {
    if (sortBy === 'latest') {
      return parseDate(b.date) - parseDate(a.date);
    }
    if (sortBy === 'oldest') {
      return parseDate(a.date) - parseDate(b.date);
    }
    if (sortBy === 'views') {
      return parseViewsNum(b.views) - parseViewsNum(a.views);
    }
    if (sortBy === 'likes') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return 0;
  });

  return (
    <div className="space-y-0 pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        .pf-serif { font-family: 'Playfair Display', Georgia, serif; }
        .pf-sans  { font-family: 'Poppins', 'Inter', 'Arial', sans-serif; }
        .pf-poppins { font-family: 'Poppins', sans-serif !important; }
        .pf-card {
          background: rgba(255,255,255,0.97);
          border-radius: 4px;
          border: 1px solid #ECECF4;
          box-shadow: 0 2px 10px -3px rgba(109,59,255,0.05), 0 1px 3px -1px rgba(0,0,0,0.02);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pfFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pf-fadein { animation: pfFadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes pfModalCenterUp {
          from {
            transform: scale(0.92) translateY(12px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        .pf-modal-center {
          animation: pfModalCenterUp 0.35s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
        }
        .feat-badge {
          font-family: 'Inter', sans-serif;
          font-size: 8px; font-weight: 900;
          letter-spacing: 1.5px; text-transform: uppercase;
          padding: 3px 8px; border-radius: 999px;
          color: #fff; display: inline-block;
        }
      `}</style>

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div className="pf-fadein mx-1 mt-1 rounded-md px-3 py-2.5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #fdf4ff 50%, #f0f4ff 100%)' }}>
        <div className="absolute -top-8 -right-6 w-24 h-24 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6D3BFF, transparent 70%)' }} />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div>
            <p className="pf-sans text-[8px] font-black uppercase tracking-[0.22em] text-[#6D3BFF] mb-0.5">Showcase</p>
            <h1 className="pf-sans text-[15px] font-black text-slate-900 leading-tight tracking-tight">Portfolio Showcase</h1>
            <p className="pf-sans text-[8.5px] font-medium text-slate-500 mt-0.5 leading-tight">Showcase your best work &amp; create lasting impressions</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #6D3BFF, #9333ea)', boxShadow: '0 2px 6px rgba(109,59,255,0.25)' }}
          >
            <Icon name="plus" size="xs" /> Add Work
          </button>
        </div>
      </div>

      {/* ── KPI Horizontal Scroll ─────────────────────────────── */}
      <div className="mt-2.5 px-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1.5 pt-0.5">
          {dynamicKpis.map((kpi, i) => (
            <div
              key={i}
              className="pf-fadein shrink-0 rounded p-2.5 w-[114px] sm:w-[120px] flex flex-col justify-start border transition-all hover:shadow-sm"
              style={{
                backgroundColor: kpi.bg,
                borderColor: kpi.border,
                animationDelay: `${i * 80}ms`
              }}
            >
              {/* Icon Badge */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: kpi.badgeBg }}
              >
                <Icon name={kpi.icon} size="xs" color={kpi.color} className="shrink-0" />
              </div>

              {/* Data Content */}
              <div className="mt-1.5 flex-1 flex flex-col justify-start">
                <h3
                  className={`pf-poppins font-black tracking-tight leading-none ${
                    kpi.isTheme ? 'text-[9.5px] sm:text-[10px] line-clamp-2' : 'text-sm sm:text-base'
                  }`}
                  style={{ color: kpi.valueColor }}
                >
                  {kpi.value}
                </h3>
                <p className="pf-poppins text-[7.5px] font-bold text-slate-500 tracking-tight leading-tight uppercase mt-1">
                  {kpi.label}
                </p>
              </div>

              {/* Trend */}
              <div className="mt-1 flex items-center shrink-0">
                {kpi.isTheme ? (
                  <span className="pf-poppins text-[7.5px] font-bold text-slate-700 leading-none">
                    {kpi.trend}
                  </span>
                ) : (
                  <span className="pf-poppins text-[7.5px] font-bold text-emerald-600 flex items-center gap-0.5 leading-none">
                    <span>↑</span> {kpi.trend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Browse by Categories ───────────────────────────────── */}
      <div className="mt-2.5 px-1">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <h2 className="pf-sans text-[12px] font-black text-slate-800 tracking-tight">Browse by Categories</h2>
          <button 
            onClick={() => { setActiveCategory('All Projects'); setSelectedLocation('All'); }}
            className="pf-sans text-[9px] font-black text-[#6D3BFF] uppercase tracking-wider active:scale-95 transition-all"
          >
            View All
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="shrink-0 flex flex-col items-center px-2.5 py-1 rounded-md text-[9px] font-black transition-all active:scale-95"
                style={{
                  background: active ? '#6D3BFF' : '#fff',
                  color: active ? '#fff' : '#475569',
                  border: active ? '1.5px solid #6D3BFF' : '1.5px solid #ECECF4',
                  boxShadow: active ? '0 2px 8px rgba(109,59,255,0.22)' : '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <span className="uppercase tracking-wide">{cat}</span>
                <span className="text-[8px] font-extrabold opacity-80">{CAT_COUNTS[cat]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Featured Projects ─────────────────────────────────── */}
      <div className="mt-2.5 px-1">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <h2 className="pf-sans text-[12px] font-black text-slate-800 tracking-tight">Featured Projects</h2>
          <button 
            onClick={() => setIsFeaturedModalOpen(true)}
            className="pf-sans text-[9px] font-black text-[#6D3BFF] uppercase tracking-wider active:scale-95 transition-all"
          >
            View All
          </button>
        </div>
        <div ref={featuredRef} className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {filteredFeatured.length === 0 ? (
            <div className="flex-1 py-6 flex flex-col items-center justify-center text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg min-w-[200px]">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">No Featured Projects</p>
              <p className="text-[7.5px] font-semibold text-slate-400 mt-0.5">For this category selection.</p>
            </div>
          ) : (
            filteredFeatured.slice(0, 3).map((proj, i) => (
              <div 
                key={proj.id} 
                onClick={() => setSelectedProject(proj)}
                className="shrink-0 overflow-hidden pf-card pf-fadein cursor-pointer hover:border-violet-300 hover:shadow-md transition-all active:scale-98"
                style={{ minWidth: 106, maxWidth: 106, borderRadius: '4px', animationDelay: `${i * 100}ms` }}
              >
                <div className="relative h-[72px] overflow-hidden bg-slate-100">
                  <img src={proj.img || proj.url} alt={proj.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <span className="feat-badge absolute top-1 left-1" style={{ background: proj.badgeColor || '#6D3BFF', fontSize: '5.5px', padding: '1px 4px', borderRadius: '3px' }}>{proj.badge || 'FEATURED'}</span>
                </div>
                <div className="p-1.5">
                  <p className="pf-sans text-[8.5px] font-black text-slate-900 leading-tight truncate">{proj.title}</p>
                  <p className="pf-sans text-[7px] font-semibold text-violet-500 truncate mt-0.5">{proj.theme}</p>
                  <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-100 text-[6.5px] text-slate-400 font-semibold leading-none">
                    <span className="flex items-center gap-0.5"><Icon name="eye" size="xs" className="w-2 h-2 shrink-0" /> {proj.views}</span>
                    <span className="flex items-center gap-0.5"><Icon name="heart" size="xs" className="w-2 h-2 shrink-0" /> {proj.likes}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Project Albums ────────────────────────────────────── */}
      <div className="mt-2.5 px-1">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <h2 className="pf-sans text-[12px] font-black text-slate-800 tracking-tight">Project Albums</h2>
          <button 
            onClick={() => setIsAlbumsModalOpen(true)}
            className="pf-sans text-[9px] font-black text-[#6D3BFF] uppercase tracking-wider active:scale-95 transition-all"
          >
            View All Albums
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {ALBUMS.map((album, i) => (
            <div 
              key={album.id} 
              onClick={() => setSelectedProject({
                title: album.label,
                theme: 'Curated Album Showcase',
                venue: 'Multiple Premium Venues',
                date: 'Curated 2024 Collection',
                cost: '₹12.5L Avg',
                views: `${album.count * 1.5}K`,
                likes: album.count * 12,
                bookmarks: album.count * 5,
                img: album.img,
                badge: 'CURATED ALBUM',
                badgeColor: '#10B981',
                description: `A highly curated album containing ${album.count} premium wedding concepts styled under the "${album.label}" theme. Includes masterfully integrated lighting, floral architectures, and bespoke backdrop assemblies designed to deliver unmatched aesthetic grandeur.`
              })}
              className="shrink-0 flex flex-col items-center pf-fadein cursor-pointer hover:scale-102 transition-transform duration-200 active:scale-98" 
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="relative w-[72px] h-[62px] rounded-md overflow-hidden bg-slate-100 shadow-sm border border-slate-100 hover:border-violet-300">
                <img src={album.img} alt={album.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute top-1 right-1 text-[8px] font-black text-white bg-black/30 backdrop-blur-sm px-1 py-0.5 rounded-full leading-none">
                  {album.count}
                </span>
              </div>
              <p className="pf-sans text-[8px] font-bold text-slate-700 mt-1 text-center leading-tight max-w-[68px] truncate">{album.label}</p>
              <p className="pf-sans text-[7px] font-semibold text-slate-400 leading-none">{album.count} Projects</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Latest Projects Grid ──────────────────────────────── */}
      <div className="mt-2.5 px-1">
        <div className="flex items-center justify-between mb-1.5 px-0.5 relative">
          <h2 className="pf-sans text-[12px] font-black text-slate-800 tracking-tight">Latest Projects</h2>
          <div className="flex items-center gap-1.5 relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="pf-sans text-[8.5px] font-black flex items-center gap-0.5 border rounded-full px-2 py-0.5 active:scale-95 transition-all"
              style={{
                borderColor: isFilterOpen || selectedLocation !== 'All' ? '#6D3BFF' : '#E2E8F0',
                color: isFilterOpen || selectedLocation !== 'All' ? '#6D3BFF' : '#94A3B8',
                backgroundColor: isFilterOpen || selectedLocation !== 'All' ? '#F5F2FF' : '#FFF'
              }}
            >
              <Icon name="filter" size="xs" className="w-2 h-2" /> Filter {(selectedLocation !== 'All' || activeCategory !== 'All Projects') && '•'}
            </button>
            
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="pf-sans text-[8.5px] font-black flex items-center gap-0.5 border rounded-full px-2 py-0.5 active:scale-95 transition-all"
              style={{
                borderColor: isSortOpen || sortBy !== 'latest' ? '#6D3BFF' : '#E2E8F0',
                color: isSortOpen || sortBy !== 'latest' ? '#6D3BFF' : '#94A3B8',
                backgroundColor: isSortOpen || sortBy !== 'latest' ? '#F5F2FF' : '#FFF'
              }}
            >
              {SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'Latest First'} <Icon name="chevronDown" size="xs" className="w-2 h-2" />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-7 mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-lg z-30 p-1 pf-fadein">
                {SORT_OPTIONS.map(opt => {
                  const active = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsSortOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[8.5px] font-bold transition-all hover:bg-slate-50 flex items-center justify-between"
                      style={{ color: active ? '#6D3BFF' : '#475569' }}
                    >
                      <span>{opt.label}</span>
                      {active && <span className="text-[#6D3BFF]">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {isFilterOpen && (
          <div className="pf-fadein mt-1 mb-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
            <div>
              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Filter by Location</p>
              <div className="flex flex-wrap gap-1">
                {LOCATIONS.map(loc => {
                  const active = selectedLocation === loc;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setSelectedLocation(loc)}
                      className="px-2 py-0.5 rounded-full text-[8px] font-bold transition-all active:scale-95 border"
                      style={{
                        background: active ? '#6D3BFF' : '#fff',
                        color: active ? '#fff' : '#475569',
                        borderColor: active ? '#6D3BFF' : '#ECECF4'
                      }}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60">
              <button 
                type="button"
                onClick={() => { setSelectedLocation('All'); setActiveCategory('All Projects'); }}
                className="text-[8px] font-black text-rose-500 uppercase tracking-widest active:scale-90 transition-all ml-0.5"
              >
                Clear Filters
              </button>
              <button 
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest active:scale-90 transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {filteredLatest.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Icon name="eye" size="xs" />
            </div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No Projects Found</p>
            <p className="text-[7.5px] font-semibold text-slate-400 mt-0.5 max-w-[180px] leading-tight">Try clearing your filters or changing your selection.</p>
            <button 
              onClick={() => { setSelectedLocation('All'); setActiveCategory('All Projects'); }}
              className="mt-2.5 px-3 py-0.5 bg-[#6D3BFF] text-white rounded-full text-[7.5px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredLatest.map((proj, i) => (
            <div 
              key={proj.id} 
              onClick={() => setSelectedProject(proj)}
              className="rounded overflow-hidden pf-card pf-fadein cursor-pointer hover:border-violet-300 hover:shadow-md transition-all active:scale-98"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="relative h-[90px] bg-slate-100 overflow-hidden">
                <img src={proj.img || proj.url} alt={proj.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
              </div>
              <div className="p-1.5">
                <p className="pf-sans text-[9px] font-black text-slate-900 leading-tight truncate">{proj.title}</p>
                <p className="pf-sans text-[7.5px] font-semibold text-violet-500 truncate">{proj.theme}</p>
                <div className="flex items-center gap-0.5 text-[7px] text-slate-400 font-semibold">
                  <Icon name="location" size="xs" className="w-1.5 h-1.5 shrink-0" />
                  <span className="truncate">{proj.venue}</span>
                </div>
                <div className="flex items-center gap-0.5 text-[7px] text-slate-400 font-semibold">
                  <Icon name="calendar" size="xs" className="w-1.5 h-1.5 shrink-0" />
                  <span>{proj.date}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-100 text-[7px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-0.5"><Icon name="eye" size="xs" className="w-1.5 h-1.5" /> {proj.views}</span>
                  <span>❤️ {proj.likes}</span>
                  <span>🔖 {proj.bookmarks}</span>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Real uploaded portfolio (if any, shown at bottom) ── */}
      {hasRealPortfolio && (
        <div className="mt-4 px-1">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h2 className="pf-sans text-[13px] font-black text-slate-800 tracking-tight">My Uploads</h2>
            <button onClick={() => setIsModalOpen(true)} className="pf-sans text-[10px] font-black text-[#6D3BFF] uppercase tracking-wider">+ Add More</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {portfolio.map((item, index) => (
              <div 
                key={index} 
                onClick={() => setSelectedProject({
                  title: item.title,
                  theme: item.tag || 'Portfolio Media',
                  venue: item.venue || 'Emerald Studio Showcase',
                  date: item.date || 'Recently Uploaded',
                  cost: item.cost || '—',
                  views: item.views || '1.1K',
                  likes: item.likes || 42,
                  bookmarks: item.bookmarks || 15,
                  img: item.url,
                  type: item.type,
                  description: `This project was designed and uploaded to the portfolio. It showcases high-fidelity work in ${item.tag || 'event planning'} with dynamic staging and elements.`
                })}
                className="rounded-md overflow-hidden relative group border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-95"
              >
                <div className="aspect-square bg-slate-100">
                  {item.type === 'Video'
                    ? <video src={item.url} className="w-full h-full object-cover" />
                    : <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                    <p className="text-[7px] font-black text-white truncate uppercase">{item.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upload Modal ──────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-4 sm:p-5 overflow-hidden pf-modal-center">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="pf-serif text-lg font-black text-slate-900 leading-tight">Add New Work</h3>
                <p className="pf-sans text-[10px] font-semibold text-slate-400 mt-0.5">Upload a stunning project to your gallery</p>
              </div>
              <button onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90 flex-shrink-0">
                <Icon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <label className="pf-sans text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Title</label>
                <input type="text"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl pf-sans text-xs font-semibold focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  placeholder="e.g. Rahul & Sneha Royal Wedding"
                  value={newItem.title}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="pf-sans text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                  <div className="relative">
                    <select 
                      className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl pf-sans text-xs font-semibold focus:outline-none focus:border-violet-400 appearance-none cursor-pointer transition-all"
                      value={newItem.type} 
                      onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                    >
                      <option value="Photo">Photo</option>
                      <option value="Video">Video</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Icon name="chevronDown" size="xs" className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="pf-sans text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <div className="relative">
                    <select 
                      className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl pf-sans text-xs font-semibold focus:outline-none focus:border-violet-400 appearance-none cursor-pointer transition-all"
                      value={newItem.tag} 
                      onChange={e => setNewItem({ ...newItem, tag: e.target.value })}
                    >
                      {CATEGORIES.filter(c => c !== 'More').map(c => <option key={c}>{c}</option>)}
                      <option>Pre-Wedding</option>
                      <option>Other</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Icon name="chevronDown" size="xs" className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="pf-sans text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Media Upload</label>
                <div className="relative h-24 sm:h-32 w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden group cursor-pointer hover:border-violet-300 transition-colors">
                  {newItem.url ? (
                    <div className="absolute inset-0">
                      {newItem.type === 'Video'
                        ? <video src={newItem.url} className="w-full h-full object-cover" />
                        : <img src={newItem.url} alt="Preview" className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="pf-sans text-[9px] font-black text-white uppercase tracking-widest">Change Photo</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 p-2">
                      <Icon name="image" size="lg" className="text-slate-400/80" />
                      <p className="pf-sans text-[8.5px] font-black uppercase tracking-widest mt-1 text-slate-400 text-center">
                        {isUploading ? 'Uploading...' : 'Tap to upload photo / video'}
                      </p>
                    </div>
                  )}
                  <input type="file" accept={newItem.type === 'Video' ? 'video/*' : 'image/*'}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={e => handleImageUpload(e.target.files[0])} />
                </div>
              </div>

              <button type="submit"
                disabled={isUploading || !newItem.url || !newItem.title}
                className="w-full h-10 rounded-xl pf-sans text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6D3BFF, #9333ea)', boxShadow: '0 3px 10px rgba(109,59,255,0.25)' }}>
                {isUploading ? 'Uploading...' : 'Add to Portfolio'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Featured Projects View All Modal ── */}
      {isFeaturedModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFeaturedModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 overflow-hidden pf-modal-center max-h-[78vh] flex flex-col z-[120]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h3 className="pf-serif text-lg font-black text-slate-900">Featured Projects</h3>
                <p className="pf-sans text-[10px] font-semibold text-slate-400 mt-0.5">Your premium showcased creations</p>
              </div>
              <button onClick={() => setIsFeaturedModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90">
                <Icon name="close" size="sm" />
              </button>
            </div>
            
            <div className="overflow-y-auto no-scrollbar flex-1 space-y-3 pb-2">
              {featuredProjects.map((proj, i) => (
                <div 
                  key={proj.id} 
                  onClick={() => { setSelectedProject(proj); setIsFeaturedModalOpen(false); }}
                  className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex bg-white p-2 gap-3 pf-fadein cursor-pointer hover:border-violet-300 hover:shadow-md transition-all active:scale-98" 
                  style={{ animationDelay: `${i * 65}ms` }}
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 shrink-0 relative">
                    <img src={proj.img || proj.url} alt={proj.title} className="w-full h-full object-cover" />
                    <span className="feat-badge absolute top-1.5 left-1.5" style={{ background: proj.badgeColor || '#6D3BFF', fontSize: '5px', padding: '1px 3.5px', borderRadius: '3px' }}>{proj.badge || 'FEATURED'}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5 pr-1">
                    <div>
                      <h4 className="pf-sans text-[11px] font-black text-slate-900 leading-tight">{proj.title}</h4>
                      <p className="pf-sans text-[9px] font-bold text-violet-500 mt-0.5">{proj.theme}</p>
                      <p className="pf-sans text-[8.5px] font-semibold text-slate-400 flex items-center gap-1 mt-1">
                        <Icon name="location" size="xs" className="w-2 h-2 shrink-0" /> {proj.venue}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[8.5px] text-slate-400 font-bold border-t border-slate-100 pt-1.5 mt-1.5">
                      <span className="flex items-center gap-0.5"><Icon name="eye" size="xs" className="w-2.5 h-2.5" /> {proj.views}</span>
                      <span>❤️ {proj.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Project Albums View All Modal ── */}
      {isAlbumsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAlbumsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 overflow-hidden pf-modal-center max-h-[78vh] flex flex-col z-[120]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h3 className="pf-serif text-lg font-black text-slate-900">Project Albums</h3>
                <p className="pf-sans text-[10px] font-semibold text-slate-400 mt-0.5">Explore your collections by category & style</p>
              </div>
              <button onClick={() => setIsAlbumsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90">
                <Icon name="close" size="sm" />
              </button>
            </div>
            
            <div className="overflow-y-auto no-scrollbar flex-1 pb-2">
              <div className="grid grid-cols-2 gap-3">
                {ALBUMS.map((album, i) => (
                  <div 
                    key={album.id} 
                    onClick={() => {
                      setSelectedProject({
                        title: album.label,
                        theme: 'Curated Album Showcase',
                        venue: 'Multiple Premium Venues',
                        date: 'Curated 2024 Collection',
                        cost: '₹12.5L Avg',
                        views: `${album.count * 1.5}K`,
                        likes: album.count * 12,
                        bookmarks: album.count * 5,
                        img: album.img,
                        badge: 'CURATED ALBUM',
                        badgeColor: '#10B981',
                        description: `A highly curated album containing ${album.count} premium wedding concepts styled under the "${album.label}" theme. Includes masterfully integrated lighting, floral architectures, and bespoke backdrop assemblies designed to deliver unmatched aesthetic grandeur.`
                      });
                      setIsAlbumsModalOpen(false);
                    }}
                    className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white p-2 pf-fadein cursor-pointer hover:border-violet-300 hover:shadow-md transition-all active:scale-98" 
                    style={{ animationDelay: `${i * 65}ms` }}
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 relative shadow-inner">
                      <img src={album.img} alt={album.label} className="w-full h-full object-cover" />
                      <span className="absolute top-1.5 right-1.5 text-[8px] font-black text-white bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full leading-none">
                        {album.count}
                      </span>
                    </div>
                    <div className="mt-1.5 px-0.5">
                      <h4 className="pf-sans text-[9px] font-black text-slate-800 truncate">{album.label}</h4>
                      <p className="pf-sans text-[7.5px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{album.count} Projects</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Project Details Modal ── */}
      {selectedProject && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3.5">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setSelectedProject(null)} />
          <div className="relative w-full max-w-[330px] bg-white rounded-2xl shadow-2xl overflow-hidden pf-modal-center max-h-[78vh] flex flex-col z-[140] border border-slate-100/80">
            
            {/* Sleek Hero Image/Video Section */}
            <div className="relative h-32 w-full bg-slate-100 shrink-0">
              {selectedProject.type === 'Video' ? (
                <video src={selectedProject.img || selectedProject.url} className="w-full h-full object-cover" controls autoPlay loop muted />
              ) : (
                <img src={selectedProject.img || selectedProject.url} alt={selectedProject.title} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
              
              {/* Sleek Minimalist Badge */}
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-wider text-white" style={{ background: selectedProject.badgeColor || '#6D3BFF' }}>
                {selectedProject.badge || 'PROJECT WORK'}
              </span>

              {/* Floating Sleek Close Button */}
              <button 
                onClick={() => setSelectedProject(null)}
                className="h-6 w-6 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center absolute top-2.5 right-2.5 hover:bg-black/60 transition-all active:scale-90"
              >
                <Icon name="close" size="xs" className="w-3.5 h-3.5" />
              </button>

              {/* Title & Theme Overlay */}
              <div className="absolute bottom-2.5 left-3 right-3">
                <span className="text-[7.5px] font-extrabold text-[#D9C4FF] uppercase tracking-wider leading-none">
                  {selectedProject.category || selectedProject.theme}
                </span>
                <h3 className="pf-sans text-[12px] font-black text-white leading-tight mt-0.5 truncate">
                  {selectedProject.title}
                </h3>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto no-scrollbar p-3 flex-1 space-y-3">
              
              {/* Professional Unified Horizontal Stats Strip */}
              <div className="grid grid-cols-4 bg-slate-50/80 border border-slate-100 rounded-xl py-1.5 px-0.5 text-center divide-x divide-slate-200/50">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tight leading-none mb-0.5">Views</span>
                  <span className="pf-poppins text-[9.5px] font-extrabold text-slate-800 leading-none">{selectedProject.views || '0'}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tight leading-none mb-0.5">Likes</span>
                  <span className="pf-poppins text-[9.5px] font-extrabold text-rose-500 leading-none">❤️ {selectedProject.likes || '0'}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tight leading-none mb-0.5">Saved</span>
                  <span className="pf-poppins text-[9.5px] font-extrabold text-amber-600 leading-none">🔖 {selectedProject.bookmarks || '0'}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tight leading-none mb-0.5">Budget</span>
                  <span className="pf-poppins text-[9.5px] font-extrabold text-[#6D3BFF] leading-none">{selectedProject.cost || '—'}</span>
                </div>
              </div>

              {/* Side-by-side Location & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50/50 border border-slate-100/80 rounded-xl p-1.5 flex items-center gap-1.5 min-w-0">
                  <div className="h-5 w-5 rounded-md bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <Icon name="location" size="xs" className="w-2.5 h-2.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-wider leading-none">Venue</p>
                    <p className="text-[8px] font-extrabold text-slate-700 truncate leading-tight mt-0.5">{selectedProject.venue || 'Premium Venue'}</p>
                  </div>
                </div>
                
                <div className="bg-slate-50/50 border border-slate-100/80 rounded-xl p-1.5 flex items-center gap-1.5 min-w-0">
                  <div className="h-5 w-5 rounded-md bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <Icon name="calendar" size="xs" className="w-2.5 h-2.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-wider leading-none">Date</p>
                    <p className="text-[8px] font-extrabold text-slate-700 truncate leading-tight mt-0.5">{selectedProject.date || '25 May, 2024'}</p>
                  </div>
                </div>
              </div>

              {/* Narrative Text */}
              <div className="space-y-1">
                <h4 className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Project Narrative</h4>
                <p className="text-[8.5px] font-medium text-slate-500 leading-relaxed bg-slate-50/30 p-2.5 rounded-xl border border-slate-100/50 max-h-[80px] overflow-y-auto no-scrollbar">
                  {getProjectNarrative(selectedProject)}
                </p>
              </div>

              {/* Compact Sleek Action Row */}
              <div className="grid grid-cols-2 gap-2 pt-0.5 shrink-0">
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('Sharing link copied!');
                  }}
                  className="h-8 rounded-lg bg-[#F5F2FF] hover:bg-[#EAE4FF] text-[#6D3BFF] text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1 border border-[#E9E4FF]"
                >
                  <Icon name="search" size="xs" className="w-2.5 h-2.5 text-[#6D3BFF]" /> Share
                </button>
                
                <button 
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="h-8 rounded-lg text-[8px] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #6D3BFF, #9333ea)' }}
                >
                  Close View
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ────────────────────────────────── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-full bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border border-slate-800/50 pf-sans">
          <span className="h-2 w-2 rounded-full bg-[#6D3BFF] animate-pulse" />
          {toast}
        </div>
      )}
    </div>
  );
};

export default VendorPortfolio;
