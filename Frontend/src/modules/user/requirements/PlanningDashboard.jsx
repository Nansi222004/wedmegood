import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import { useState, useEffect } from 'react';
import { useLenisContext } from '../../../providers/LenisProvider';
import { userApi } from '../../../services/userApi';

const PlanningDashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const lenis = useLenisContext();
  const [eventData, setEventData] = useState(null);
  const [planningCategories, setPlanningCategories] = useState([]);
  const [selectedCeremony, setSelectedCeremony] = useState(null);

  // Lock body scroll and stop Lenis when modal is open
  useEffect(() => {
    if (selectedCeremony) {
      document.body.style.overflow = 'hidden';
      lenis?.stop();
    } else {
      document.body.style.overflow = '';
      lenis?.start();
    }
    return () => {
      document.body.style.overflow = '';
      lenis?.start();
    };
  }, [selectedCeremony, lenis]);

  // Load event data from Backend (with localStorage fallback)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await userApi.getWeddingDetails();
        if (isMounted && res.success && res.data?.weddingDetails && res.data.weddingDetails.category) {
          const wd = res.data.weddingDetails;
          const normalized = {
            category: wd.category,
            subcategories: wd.subcategories || [],
            subcategoryLabels: wd.subcategoryLabels || [],
            details: {
              brideName: wd.brideName || '',
              groomName: wd.groomName || '',
              weddingDate: wd.weddingDate || '',
              venue: wd.venue || '',
              budget: wd.budget || 0,
              guestCount: wd.guestCount || 0
            }
          };
          setEventData(normalized);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch wedding details from backend, checking local cache:', err.message);
      }

      const saved = localStorage.getItem('eventDetails');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            if (isMounted) setEventData(parsed);
            return;
          }
        } catch (e) {
          localStorage.removeItem('eventDetails');
        }
      }

      if (isMounted) {
        navigate('/user/requirements', { replace: true });
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    userApi.getBudget()
      .then(res => {
        if (isMounted && res.success && res.data?.categories && res.data.categories.length > 0) {
          const mapped = res.data.categories.map(c => ({
            id: c.name.toLowerCase().replace(/\s+/g, '-'),
            name: c.name,
            status: (c.spent > 0 || c.advancePaid > 0) ? 'Confirmed' : 'Pending with Budget',
            advancePaid: c.advancePaid ? `₹${c.advancePaid.toLocaleString()}` : null,
            balanceAmount: c.balanceAmount ? `₹${c.balanceAmount.toLocaleString()}` : null,
            totalBudget: c.allocated ? `₹${c.allocated.toLocaleString()}` : '₹0'
          }));
          setPlanningCategories(mapped);
        } else if (isMounted) {
          setPlanningCategories([
            { name: 'Venue', status: 'Pending with Discussion', advancePaid: null, balanceAmount: null, totalBudget: '₹1,00,000', id: 'venue' },
            { name: 'Catering', status: 'Pending with Discussion', advancePaid: null, balanceAmount: null, totalBudget: '₹50,000', id: 'catering' },
            { name: 'Photography', status: 'Pending with Budget', advancePaid: null, balanceAmount: null, totalBudget: '₹30,000', id: 'photography' },
            { name: 'Decoration', status: 'Pending with Budget', advancePaid: null, balanceAmount: null, totalBudget: '₹50,000', id: 'decoration' },
            { name: 'Invitations', status: 'Pending with Discussion', advancePaid: null, balanceAmount: null, totalBudget: '₹15,000', id: 'invitations' },
            { name: 'Entertainment', status: 'Pending with Budget', advancePaid: null, balanceAmount: null, totalBudget: '₹20,000', id: 'entertainment' }
          ]);
        }
      })
      .catch(err => {
        console.warn('Could not load budget categories from backend:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  // Update category status
  const updateCategoryStatus = (categoryId, newStatus) => {
    const updatedCategories = planningCategories.map(category =>
      category.id === categoryId
        ? { ...category, status: newStatus }
        : category
    );
    setPlanningCategories(updatedCategories);
  };

  // Update category financial details
  const updateCategoryFinancials = async (categoryId, advancePaid, balanceAmount) => {
    const updatedCategories = planningCategories.map(category =>
      category.id === categoryId
        ? {
          ...category,
          advancePaid,
          balanceAmount,
          status: 'Confirmed'
        }
        : category
    );
    setPlanningCategories(updatedCategories);

    // Sync to MongoDB Budget
    try {
      const advNum = parseInt(String(advancePaid || '').replace(/[₹,]/g, '') || 0);
      const balNum = parseInt(String(balanceAmount || '').replace(/[₹,]/g, '') || 0);
      const matchedCat = updatedCategories.find(c => c.id === categoryId);
      if (matchedCat) {
        const allocNum = parseInt(String(matchedCat.totalBudget || '').replace(/[₹,]/g, '') || 0);
        await userApi.updateBudget({
          categories: [{
            name: matchedCat.name,
            allocated: allocNum,
            advancePaid: advNum,
            balanceAmount: balNum,
            spent: advNum
          }]
        });
      }
    } catch (err) {
      console.error('Error syncing category financials to MongoDB:', err);
    }
  };

  // Get category color
  const getCategoryColor = (categoryName) => {
    const colors = {
      'Venue': '#ec4899',
      'Catering': '#10b981',
      'Photography': '#f59e0b',
      'Decoration': '#8b5cf6',
      'Invitations': '#06b6d4',
      'Entertainment': '#ef4444',
      'Makeup': '#06b6d4',
      'Others': '#ef4444'
    };
    return colors[categoryName] || '#6b7280';
  };

  // Handle tool navigation with proper state
  const handleToolNavigation = (tool) => {
    // Store current context for navigation
    localStorage.setItem('lastVisitedTool', tool.id);
    navigate(tool.route);
  };

  // Handle vendor navigation
  const handleVendorNavigation = (categoryName) => {
    // Convert category name to URL-friendly format
    const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/user/vendors/${categorySlug}`);
  };

  // Handle planning progress click
  const handlePlanningProgressClick = () => {
    // Navigate to budget planner with context
    navigate('/user/tools/budget', { state: { fromPlanningDashboard: true } });
  };

  // Get dashboard title based on event type
  const getDashboardTitle = () => {
    if (!eventData) return 'Planning Dashboard';

    const eventTitles = {
      wedding: 'Wedding Planning Dashboard',
      birthday: 'Birthday Planning Dashboard',
      anniversary: 'Anniversary Planning Dashboard',
      corporate: 'Corporate Event Planning Dashboard',
      baby_shower: 'Baby Shower Planning Dashboard',
      house_warming: 'House Warming Planning Dashboard',
      naming_ceremony: 'Naming Ceremony Planning Dashboard',
      private_party: 'Party Planning Dashboard',
      festival: 'Festival Celebration Dashboard',
      others: 'Event Planning Dashboard'
    };

    return eventTitles[eventData.category] || 'Planning Dashboard';
  };

  // Reordered planning tools as per requirements
  const planningTools = [
    { id: 'venue', title: 'FIND VENUE', description: 'Book perfect venues', icon: 'home', route: '/user/vendors/venues', color: '#10b981' },
    { id: 'photography', title: 'PHOTOGRAPHY & VIDEOGRAPHY', description: 'Capture moments', icon: 'camera', route: '/user/vendors/photographers', color: '#f59e0b' },
    { id: 'guests', title: 'START YOUR GUEST LIST', description: 'Manage RSVPs', icon: 'users', route: '/user/tools/guests', color: '#06b6d4' },
    { id: 'caterers', title: 'CATERERS', description: 'Food services', icon: 'store', route: '/user/vendors/catering', color: '#10b981' },
    { id: 'family', title: 'CREATE A GROUP WITH FAMILY & FRIENDS', description: 'Coordinate with family', icon: 'users', route: '/user/family/groups', color: '#ef4444' },
    { id: 'transport', title: 'TRANSPORTATION', description: 'Travel services', icon: 'globe', route: '/user/vendors/transport', color: '#8b5cf6' },
    { id: 'invitations', title: 'INVITATION CARDS', description: 'Digital Invites', icon: 'envelope', route: '/user/e-invites', color: '#ec4899' },
    { id: 'decorators', title: 'FLOWERS & DECORATORS', description: 'Venue decoration', icon: 'palette', route: '/user/vendors/decorators', color: '#8b5cf6' },
    { id: 'accessories', title: 'BRIDAL & GROOM ACCESSORIES', description: 'Wedding attire', icon: 'store', route: '/user/vendors/accessories', color: '#ec4899' },
    { id: 'health', title: 'HEALTH & BEAUTY', description: 'Makeup & Spa', icon: 'makeup', route: '/user/vendors/makeup', color: '#06b6d4' },
    { id: 'entertainment', title: 'ENTERTAINMENTS', description: 'DJ & Performances', icon: 'party', route: '/user/vendors/entertainment', color: '#ef4444' },
    { id: 'gifts', title: 'RETURN GIFTS', description: 'Guest favors', icon: 'sparkles', route: '/user/vendors/gifts', color: '#f59e0b' },
    { id: 'honeymoon', title: 'HONEYMOON', description: 'Travel planning', icon: 'globe', route: '/user/vendors/honeymoon', color: '#06b6d4' },
    { id: 'mehndi', title: 'MEHANDI ARTIST', description: 'Bridal designs', icon: 'palette', route: '/user/vendors/mehndi', color: '#f59e0b' },
    { id: 'choreographers', title: 'CHOREOGRAPHERS', description: 'Dance training', icon: 'star', route: '/user/vendors/choreography', color: '#8b5cf6' },
    { id: 'cakes', title: 'CAKES', description: 'Desserts & Cakes', icon: 'sparkles', route: '/user/vendors/cakes', color: '#ec4899' },
    { id: 'jewellery', title: 'JEWELLERY', description: 'Wedding jewels', icon: 'rings', route: '/user/vendors/jewellery', color: '#f59e0b' },
    { id: 'led', title: 'LED SCREEN', description: 'Visual displays', icon: 'video', route: '/user/vendors/led', color: '#06b6d4' },
    { id: 'streaming', title: 'LIVE STREAMING', description: 'Remote viewing', icon: 'video', route: '/user/vendors/streaming', color: '#ef4444' },
    { id: 'fraudstars', title: 'REPORTED FRAUDSTARS', description: 'Security alerts', icon: 'warning', route: '/user/vendors/fraudstars', color: '#ef4444' },
    {
      id: 'timeline',
      title: 'Event Timeline',
      description: 'Plan your event schedule',
      icon: 'clock',
      route: '/user/tools/timeline',
      color: '#8b5cf6'
    }
  ];

  const subcategoryEmojis = {
    engagement: '💍',
    mehendi: '🌿',
    haldi: '💛',
    sangeet: '💃',
    wedding: '💑',
    reception: '🎊',
    kids_party: '🎈',
    theme_party: '🎭',
    milestone: '🏆',
    surprise: '🎁',
    dinner: '🍽️',
    silver: '🥈',
    golden: '🥇',
    vow_renewal: '📜',
    intimate_dinner: '🕯️',
    grand_party: '✨',
    seminar: '🎤',
    workshop: '📝',
    team_building: '🤝',
    award_show: '🏅',
    product_launch: '🚀',
    annual_party: '🥂',
    exhibition: '🖼️',
    fair: '🎡',
    religious: '🙏',
    gathering: '👥',
    party: '🎉',
    godh_bharai: '🤰',
    gender_reveal: '🎈',
    baby_homecoming: '👶',
    griha_pravesh: '🕉️',
    house_party: '🏠',
    dinner_celebration: '🍽️',
    namkaran: '📿',
    cradle_ceremony: '🧺',
    lunch_party: '🥙',
    kitty_party: '☕',
    bachelorette: '👰',
    bachelor_party: '🤴',
    graduation_party: '🎓',
    get_together: '🍻',
    diwali_party: '🪔',
    ganpati_celebration: '🐘',
    holi_bash: '🎨',
    christmas_party: '🎄',
    eid_mubarak: '🌙',
    new_year_eve: '🎆'
  };

  const upcomingTasks = [
    { task: 'Book wedding venue', dueDate: '2 weeks left', priority: 'high' },
    { task: 'Send save the dates', dueDate: '1 month left', priority: 'medium' },
    { task: 'Book photographer', dueDate: '3 weeks left', priority: 'high' },
    { task: 'Order wedding invitations', dueDate: '6 weeks left', priority: 'low' }
  ];

  const handleBack = () => {
    navigate('/user/requirements', { state: { editMode: true } });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return '#10b981';
      case 'Pending with Discussion': return '#f59e0b';
      case 'Pending with Budget': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!eventData) return null;

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden font-['Outfit'] pb-40 bg-transparent">
      {/* Background Image for the whole page */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" style={{ backgroundImage: "url('/uservendorre%20page%20bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1 }} />
      
      {/* HEADER NAVIGATION */}
      <div className="relative z-20 w-full px-6 pt-0 flex justify-between items-center -mt-2">
        <button 
          onClick={handleBack}
          className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center border border-gray-100 text-[#301024] hover:bg-gray-50 transition-all active:scale-90"
        >
          <Icon name="chevronDown" size="sm" className="rotate-90" />
        </button>
        <div className="w-9 h-9 bg-white shadow-sm rounded-xl flex items-center justify-center border border-gray-100 text-[#301024]">
           <Icon name="users" size="sm" />
        </div>
      </div>

      {/* DASHBOARD HERO */}
      <div className="relative z-20 w-full max-w-md pt-2 px-8 text-center space-y-1 mb-8">
        <h1 className="text-[#641A3D] text-3xl font-black leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
          {getDashboardTitle()}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
           <span className="w-6 h-[1px] bg-[#641A3D]/20"></span>
           <Icon name="heart" size="xs" style={{ color: '#D9B78B' }} />
           <span className="w-6 h-[1px] bg-[#641A3D]/20"></span>
        </div>
        <p className="text-[#641A3D]/60 text-[9px] font-bold tracking-[0.2em] uppercase mt-2">
          Your complete event planning toolkit
        </p>
      </div>

      <div className="relative z-20 w-full max-w-sm px-4 space-y-8">
        
        {/* WHAT WE PROVIDE SECTION */}
        <div className="text-center space-y-6">
          <h2 className="text-[#641A3D] text-[12px] font-bold uppercase tracking-[0.2em]" style={{ fontFamily: '"Playfair Display", serif' }}>
            What We Provide?
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {planningTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => handleToolNavigation(tool)}
                className="group cursor-pointer transition-transform active:scale-95"
              >
                <div className="relative h-32 rounded-[1.5rem] bg-white shadow-sm border border-white flex flex-col justify-end">
                  <div className="absolute top-0 left-0 right-0 h-20 rounded-t-[1.5rem] overflow-hidden">
                    <img 
                      src={`https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop&q=80&sig=${tool.id}`} 
                      alt={tool.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-[3.5rem] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                     <Icon name={tool.icon} size="xs" style={{ color: '#BE185D' }} />
                  </div>
                  <div className="h-12 flex flex-col justify-end items-center pb-2 px-1">
                    <h3 className="text-[#641A3D] text-[8px] font-black uppercase tracking-widest leading-none text-center">
                      {tool.title}
                    </h3>
                    <p className="text-[7px] text-[#8E95A4] mt-0.5 text-center px-2 truncate w-full">
                       {tool.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planning Progress Summary Bar */}
        <div
          className="p-3.5 rounded-[1.5rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white cursor-pointer active:scale-95 transition-transform flex items-center justify-between"
          onClick={handlePlanningProgressClick}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FDF4F7] flex items-center justify-center shrink-0">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BE185D" strokeWidth="2"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>
            </div>
            <div className="flex-1">
              <h3 className="text-[12px] font-bold text-[#301024] leading-tight mb-0.5">Planning Progress</h3>
              <p className="text-[9px] text-[#8E95A4]">Track your wedding planning journey</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-28 flex-col items-end justify-center mt-1">
            <div className="text-[11px] font-bold text-[#BE185D] leading-tight flex items-center gap-1 w-full justify-end">
              <span>32%</span> <span className="text-[#8E95A4] font-normal">Completed</span>
            </div>
            <div className="w-full h-1.5 bg-[#FDF4F7] rounded-full overflow-hidden mt-1">
               <div className="h-full bg-[#BE185D] rounded-full w-[32%]"></div>
            </div>
          </div>
          <Icon name="chevronRight" size="xs" className="ml-2 text-gray-400" />
        </div>

        {/* YOUR SACRED CEREMONIES */}
        {eventData.subcategories && eventData.subcategories.length > 0 && (
          <div className="text-center pt-2">
             <h4 className="text-[#8E95A4] text-[9px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 justify-center mb-4">
                <span className="w-8 h-[1px] bg-[#8E95A4]/30" />
                Your Sacred Ceremonies
                <span className="w-8 h-[1px] bg-[#8E95A4]/30" />
             </h4>
             
             <div className="flex justify-between gap-2 overflow-x-auto pb-4 scrollbar-hide px-1">
               {eventData.subcategories.map((subId, index) => {
                 const label = eventData?.subcategoryLabels?.[index] || subId;
                 const getStyle = (id) => {
                   if (id.includes('wedding') || id.includes('roka')) return { icon: 'heart', color: '#E10079' };
                   if (id.includes('engagement')) return { icon: 'rings', color: '#8B5CF6' };
                   if (id.includes('mehendi') || id.includes('sangeet')) return { icon: 'music', color: '#E10079' };
                   if (id.includes('haldi')) return { icon: 'sparkles', color: '#D97706' };
                   return { icon: 'star', color: '#10B981' };
                 };
                 const style = getStyle(subId);

                 return (
                   <div
                     key={subId}
                     className="flex flex-col items-center gap-2 p-3 rounded-[1.5rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white min-w-[75px] flex-1 cursor-pointer active:scale-95 transition-transform"
                     onClick={() => setSelectedCeremony(subId)}
                   >
                     <div className="w-8 h-8 flex items-center justify-center mb-1">
                       <Icon name={style.icon} size="sm" style={{ color: style.color }} />
                     </div>
                     <span className="text-[7.5px] font-bold text-[#301024] text-center uppercase tracking-widest leading-tight w-full break-words">{label}</span>
                   </div>
                 );
               })}
             </div>
          </div>
        )}

        {/* Upcoming Tasks */}
        <div className="px-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-[#301024] flex items-center gap-2" style={{ fontFamily: '"Playfair Display", serif' }}>
              <Icon name="calendar" size="xs" style={{ color: '#8B5CF6' }} /> Upcoming Tasks
            </h2>
            <button className="text-[10px] text-[#8E95A4] font-medium flex items-center gap-1 hover:text-[#301024]">
              View All <Icon name="chevronRight" size="xs" />
            </button>
          </div>

          <div className="space-y-2">
            {upcomingTasks.map((item, index) => {
              const getTaskStyle = (priority) => {
                if (priority === 'high') return { icon: 'warning', color: '#F43F5E', bg: '#FFE4E6' };
                if (priority === 'medium') return { icon: 'clock', color: '#D97706', bg: '#FEF3C7' };
                return { icon: 'check', color: '#10B981', bg: '#D1FAE5' };
              };
              const style = getTaskStyle(item.priority);

              return (
                <div
                  key={index}
                  className="p-3 rounded-[1.2rem] bg-white shadow-sm border border-white flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: style.bg }}>
                       <Icon name={style.icon} size="xs" style={{ color: style.color }} />
                    </div>
                    <div>
                      <p className="font-bold text-[12px] text-[#301024] leading-tight mb-0.5">{item.task}</p>
                      <p className="text-[10px] text-[#8E95A4]">{item.dueDate}</p>
                    </div>
                  </div>
                  <Icon name="chevronRight" size="xs" className="text-gray-300" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex gap-3 px-2 pt-2">
          <button
            onClick={() => navigate('/user/vendors')}
            className="flex-1 py-3 rounded-full text-[12px] font-bold text-[#BE185D] bg-[#FDF4F7] border border-[#BE185D]/20 active:scale-95 transition-transform"
          >
            Browse Vendors
          </button>
          <button
            onClick={() => navigate('/user/inspirations')}
            className="flex-1 py-3 rounded-full text-[12px] font-bold text-white bg-[#BE185D] shadow-md shadow-[#BE185D]/30 active:scale-95 transition-transform"
          >
            Get Inspired
          </button>
        </div>
      </div>
      
      {/* Sticky Check List Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button
          onClick={() => navigate('/user/tools/checklist')}
          className="py-3 px-10 rounded-full font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform pointer-events-auto bg-[#641A3D] text-white"
        >
          <Icon name="checkList" size="xs" />
          <span className="text-[13px] tracking-widest uppercase">CHECK LIST</span>
        </button>
      </div>


      {/* Ceremony Detail Modal */}
      {(selectedCeremony === 'roka' || selectedCeremony === 'engagement' || selectedCeremony === 'mehendi' || selectedCeremony === 'sangeet' || selectedCeremony === 'haldi') && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-0 pb-0">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedCeremony(null)} />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-[40px] overflow-hidden shadow-2xl transition-transform duration-500 ease-out transform translate-y-0"
            style={{ backgroundColor: theme.semantic.background.primary }}
          >
            {/* Header / Pull bar */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-gray-200" />

            <div
              className="p-8 pt-10 max-h-[90vh] overflow-y-auto"
              data-lenis-prevent
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black mb-1" style={{ color: theme.semantic.text.primary }}>
                    {selectedCeremony === 'roka' ? '💍 Roka Ceremony' :
                      selectedCeremony === 'engagement' ? '💕 Engagement Ceremony' :
                        selectedCeremony === 'mehendi' ? '🌿 Mehendi Ceremony' :
                          selectedCeremony === 'sangeet' ? '🎵 Sangeet Night' : '💛 Haldi Ceremony'}
                  </h2>
                  <p className="text-sm font-medium" style={{ color: theme.colors.primary[500] }}>
                    {selectedCeremony === 'roka' ? 'A Sacred Commitment' :
                      selectedCeremony === 'engagement' ? 'A Public Declaration of Love' :
                        selectedCeremony === 'mehendi' ? 'Artistic Love & Tradition' :
                          selectedCeremony === 'sangeet' ? 'Musical Celebration of Joy' : 'Purification & Blessings'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCeremony(null)}
                  className="p-2.5 rounded-full transition-colors hover:bg-gray-100"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="close" size="sm" style={{ color: theme.semantic.text.primary }} />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="p-4 rounded-[24px] bg-indigo-50 border border-indigo-100/50 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl mb-2 shadow-sm">👥</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Who</div>
                  <div className="text-[11px] font-bold text-indigo-900 leading-tight text-center">
                    {selectedCeremony === 'roka' ? 'Close families' :
                      selectedCeremony === 'engagement' ? 'Full Guest List' :
                        selectedCeremony === 'mehendi' ? 'Ladies & Family' :
                          selectedCeremony === 'sangeet' ? 'Both Families' : 'Extended Family'}
                  </div>
                </div>
                <div className="p-4 rounded-[24px] bg-rose-50 border border-rose-100/50 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl mb-2 shadow-sm">📅</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">When</div>
                  <div className="text-[11px] font-bold text-rose-900 leading-tight text-center">
                    {selectedCeremony === 'roka' ? '6-12 mos' :
                      selectedCeremony === 'engagement' ? '8 Weeks Before' :
                        selectedCeremony === 'mehendi' ? '1-2 Days Before' :
                          selectedCeremony === 'sangeet' ? '1-2 Days Before' : 'Day of Wedding (Morning)'}
                  </div>
                </div>
                <div className="p-4 rounded-[24px] bg-emerald-50 border border-emerald-100/50 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl mb-2 shadow-sm">💰</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Budget</div>
                  <div className="text-[11px] font-bold text-emerald-900 leading-tight text-center">
                    {selectedCeremony === 'roka' ? '₹50k - 1.5L' :
                      selectedCeremony === 'engagement' ? '₹1.5L - 5L' :
                        selectedCeremony === 'mehendi' ? '₹20k - 1L' :
                          selectedCeremony === 'sangeet' ? '₹1L - 3.5L' : '₹15k - 60k'}
                  </div>
                </div>
              </div>

              <div className="mb-8 p-5 rounded-3xl" style={{ backgroundColor: theme.colors.primary[50] }}>
                <h3 className="text-base font-black mb-2 flex items-center gap-2" style={{ color: theme.colors.primary[700] }}>
                  {selectedCeremony === 'roka' ? '❤️ The Essence' :
                    selectedCeremony === 'engagement' ? '💍 The Essence' :
                      selectedCeremony === 'mehendi' ? '🌿 The Essence' :
                        selectedCeremony === 'sangeet' ? '🎸 The Essence' : '✨ The Essence'}
                </h3>
                <p className="text-sm leading-relaxed font-medium" style={{ color: theme.colors.primary[800] }}>
                  {selectedCeremony === 'roka' ? 'This is when both families officially say "yes" to the union. It\'s the formal handshake that makes everything real.' :
                    selectedCeremony === 'engagement' ? 'This is your public declaration of love and commitment. The rings you exchange symbolize the endless circle of your bond.' :
                      selectedCeremony === 'mehendi' ? 'Mehendi represents the bond between you and your partner. The deeper the color, the stronger the love — at least that\'s what the aunties will tell you!' :
                        selectedCeremony === 'sangeet' ? 'Pure joy in musical form. Both families come together to celebrate through dance, laughter, and maybe a few tears of happiness.' :
                          'Haldi purifies and blesses you before your big day. Plus, it\'s believed to give you that natural glow — though you\'ll definitely need a good scrub afterward!'}
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-black mb-4 px-1" style={{ color: theme.semantic.text.primary }}>
                  {selectedCeremony === 'haldi' ? '☀️ Haldi Essentials' :
                    selectedCeremony === 'sangeet' ? '💃 Typical Sangeet Flow' : '🔱 Process & Steps'}
                </h3>
                <div className="space-y-4">
                  {(selectedCeremony === 'roka' ? [
                    { title: 'Ganesh Puja', desc: 'seeking blessings for a smooth journey' },
                    { title: 'Tilak ceremony', desc: 'the groom receives the sacred mark of acceptance' },
                    { title: 'Gift exchange', desc: 'families share sweets, clothes, and jewelry' },
                    { title: 'Ring exchange', desc: "if you're ready for this step" }
                  ] : selectedCeremony === 'engagement' ? [
                    { title: 'Ring Selection', desc: 'Select and purchase engagement rings' },
                    { title: 'Venue & Menu', desc: 'Book venue and finalize catering menu' },
                    { title: 'Invitations', desc: 'Design and send digital or print invitations' },
                    { title: 'Theme Decor', desc: 'Plan decoration theme and color scheme' }
                  ] : selectedCeremony === 'mehendi' ? [
                    { title: 'Artist Booking', desc: 'Book mehendi artists 6-8 weeks in advance' },
                    { title: 'Seating Setup', desc: 'Arrange cushions and low tables for comfort' },
                    { title: 'Menu Planning', desc: 'Plan light refreshments: samosas, chai, juices' },
                    { title: 'Drying Station', desc: 'Set up mehendi drying area with fans' }
                  ] : selectedCeremony === 'sangeet' ? [
                    { title: "Grand Entry", desc: "Welcome & couple's entry — make it grand!" },
                    { title: "Introductions", desc: "Family introductions — let everyone mingle" },
                    { title: "Bride's Side Dances", desc: "Performances by bride's side — usually 3-4 dances" },
                    { title: "Couple's Special", desc: "Your moment to shine on the stage" }
                  ] : [
                    { title: 'Haldi Paste', desc: 'Prepare: turmeric + rose water + milk + honey' },
                    { title: 'Venue Setup', desc: 'Set up outdoor space or easily cleanable area' },
                    { title: 'Dress Code', desc: 'Arrange old clothes or yellow attire for all' },
                    { title: 'Wash Facilities', desc: 'Set up washing facilities nearby' }
                  ]).map((item, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                      <div>
                        <span className="font-black text-sm block" style={{ color: theme.semantic.text.primary }}>{item.title}</span>
                        <span className="text-sm font-medium" style={{ color: theme.semantic.text.secondary }}>{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-black mb-4 px-1" style={{ color: theme.semantic.text.primary }}>
                  {selectedCeremony === 'haldi' ? '✅ Ceremony Checklist' :
                    selectedCeremony === 'sangeet' ? '🎸 Performance Checklist' : '✅ Checklist'}
                </h3>
                <div className="space-y-3">
                  {(selectedCeremony === 'roka' ? [
                    'Book Pandit ji (if doing formal puja)',
                    'Arrange puja items: mithai, flowers',
                    'Purchase gifts for both families',
                    'Plan simple catering',
                    'Book photographer'
                  ] : selectedCeremony === 'engagement' ? [
                    'Arrange entertainment (DJ/live music)',
                    'Select outfits for couple & coordinate colors',
                    'Plan traditional gift exchange',
                    'Finalize guest RSVPs',
                    'Confirm vendor arrival times'
                  ] : selectedCeremony === 'mehendi' ? [
                    'Prepare mehendi favor boxes for guests',
                    'Arrange dhol player or playlist',
                    'Plan cleanup crew and supplies',
                    'Finalize mehendi designs for bride',
                    'Organize guest list'
                  ] : selectedCeremony === 'sangeet' ? [
                    'Hire a professional Choreographer',
                    'MC / Host booking for stage management',
                    'Finalize dance playlist with DJ',
                    'Schedule rehearsals for both families',
                    'Open dance floor segment planning'
                  ] : [
                    'Plan yellow-themed decorations',
                    'Arrange traditional breakfast after ceremony',
                    'Stock up on towels and cleaning supplies',
                    'Prepare floral jewelry for bride',
                    'Coordinate music for entry'
                  ]).map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:border-pink-100 hover:bg-pink-50/30 group">
                      <div className="w-6 h-6 rounded-lg border-2 border-pink-200 flex items-center justify-center bg-white transition-colors group-hover:border-pink-400">
                        <div className="w-2.5 h-2.5 rounded-sm bg-pink-500 opacity-0 transition-opacity group-hover:opacity-20" />
                      </div>
                      <span className="text-sm font-bold" style={{ color: theme.semantic.text.primary }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setSelectedCeremony(null)}
                className="w-full py-4 rounded-2xl text-base font-black shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                  color: 'white',
                  boxShadow: '0 10px 20px -5px rgba(236, 72, 153, 0.4)'
                }}
              >
                GOT IT
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningDashboard;