import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import { useState, useEffect } from 'react';
import { useLenisContext } from '../../../providers/LenisProvider';

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

  // Load event data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('eventDetails');
    if (saved && saved !== 'null' && saved !== 'undefined') {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          setEventData(parsed);
        } else {
          navigate('/user/requirements', { replace: true });
        }
      } catch (e) {
        localStorage.removeItem('eventDetails');
        navigate('/user/requirements', { replace: true });
      }
    } else {
      navigate('/user/requirements', { replace: true });
    }

    const savedPlanningCategories = localStorage.getItem('planningCategories');
    if (savedPlanningCategories) {
      setPlanningCategories(JSON.parse(savedPlanningCategories));
    } else {
      // Default data if nothing in localStorage (for initial load)
      setPlanningCategories([
        {
          name: 'Venue',
          status: 'Confirmed',
          advancePaid: '₹25,000',
          balanceAmount: '₹75,000',
          totalBudget: '₹1,00,000',
          id: 'venue'
        },
        {
          name: 'Catering',
          status: 'Pending with Discussion',
          advancePaid: null,
          balanceAmount: null,
          totalBudget: '₹50,000',
          id: 'catering'
        },
        {
          name: 'Photography',
          status: 'Pending with Budget',
          advancePaid: null,
          balanceAmount: null,
          totalBudget: '₹30,000',
          id: 'photography'
        },
        {
          name: 'Decoration',
          status: 'Confirmed',
          advancePaid: '₹10,000',
          balanceAmount: '₹40,000',
          totalBudget: '₹50,000',
          id: 'decoration'
        },
        {
          name: 'Invitations',
          status: 'Pending with Discussion',
          advancePaid: null,
          balanceAmount: null,
          totalBudget: '₹15,000',
          id: 'invitations'
        },
        {
          name: 'Entertainment',
          status: 'Pending with Budget',
          advancePaid: null,
          balanceAmount: null,
          totalBudget: '₹20,000',
          id: 'entertainment'
        }
      ]);
    }
  }, []);

  // Update category status
  const updateCategoryStatus = (categoryId, newStatus) => {
    const updatedCategories = planningCategories.map(category =>
      category.id === categoryId
        ? { ...category, status: newStatus }
        : category
    );
    setPlanningCategories(updatedCategories);
    localStorage.setItem('planningCategories', JSON.stringify(updatedCategories));
  };

  // Update category financial details
  const updateCategoryFinancials = (categoryId, advancePaid, balanceAmount) => {
    const updatedCategories = planningCategories.map(category =>
      category.id === categoryId
        ? {
          ...category,
          advancePaid,
          balanceAmount,
          status: 'Confirmed' // Auto-update status when financials are added
        }
        : category
    );
    setPlanningCategories(updatedCategories);
    localStorage.setItem('planningCategories', JSON.stringify(updatedCategories));

    // Also update budget data
    updateBudgetData(updatedCategories);
  };

  // Update budget data based on planning categories
  const updateBudgetData = (categories) => {
    const confirmedCategories = categories.filter(cat => cat.status === 'Confirmed');
    const totalSpent = confirmedCategories.reduce((sum, cat) => {
      const advance = parseInt(cat.advancePaid?.replace(/[₹,]/g, '') || 0);
      return sum + advance;
    }, 0);

    const totalBudget = categories.reduce((sum, cat) => {
      const budget = parseInt(cat.totalBudget?.replace(/[₹,]/g, '') || 0);
      return sum + budget;
    }, 0);

    const budgetData = {
      totalBudget,
      spentAmount: totalSpent,
      remainingAmount: totalBudget - totalSpent,
      categories: categories.map(cat => ({
        name: cat.name,
        totalAmount: parseInt(cat.totalBudget?.replace(/[₹,]/g, '') || 0),
        advancePaid: parseInt(cat.advancePaid?.replace(/[₹,]/g, '') || 0),
        balanceAmount: parseInt(cat.balanceAmount?.replace(/[₹,]/g, '') || 0),
        spent: parseInt(cat.advancePaid?.replace(/[₹,]/g, '') || 0),
        color: getCategoryColor(cat.name)
      }))
    };

    localStorage.setItem('budgetData', JSON.stringify(budgetData));
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
    <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden font-['Outfit'] pb-40" style={{ backgroundColor: '#EAE1D8' }}>
      
      {/* HEADER NAVIGATION */}
      <div className="relative z-20 w-full px-6 pt-4 flex justify-between items-center">
        <button 
          onClick={handleBack}
          className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center border border-gray-100 text-[#3D2B2B] hover:bg-gray-50 transition-all active:scale-90"
        >
          <Icon name="chevronDown" size="sm" className="rotate-90" />
        </button>
        <div className="flex flex-col items-center">
           <img src="/assets/vendor/logo_theme.png" alt="Utsavo Logo" className="h-16 object-contain" />
        </div>
        <div className="w-9 h-9 bg-white shadow-sm rounded-xl flex items-center justify-center border border-gray-100 text-[#3D2B2B]">
           <Icon name="users" size="sm" />
        </div>
      </div>

      {/* DASHBOARD HERO */}
      <div className="relative z-20 w-full max-w-md pt-8 px-8 text-center space-y-1 mb-10">
        <h1 className="text-[#3D2B2B] text-4xl font-bold leading-tight" style={{ fontFamily: '"Great Vibes", cursive' }}>
          {getDashboardTitle()}
        </h1>
        <p className="text-[#3D2B2B]/40 text-[9px] font-bold tracking-[0.2em] uppercase" style={{ fontFamily: '"Outfit", sans-serif' }}>
          Your complete event planning toolkit
        </p>
      </div>

      <div className="relative z-20 w-full max-w-sm px-4 space-y-12">
        
        {/* WHAT WE PROVIDE SECTION */}
        <div className="text-center space-y-8">
          <h2 className="text-[#3D2B2B] text-2xl font-bold uppercase tracking-widest" style={{ fontFamily: '"Playfair Display", serif' }}>
            What We Provide?
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {planningTools.slice(0, 10).map((tool) => (
              <div
                key={tool.id}
                onClick={() => handleToolNavigation(tool)}
                className="group cursor-pointer space-y-2 transition-transform active:scale-95"
              >
                <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-sm border border-white">
                  <img 
                    src={`https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop&q=80&sig=${tool.id}`} 
                    alt={tool.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                     <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-center text-[#3D2B2B]">
                        <Icon name={tool.icon} size="xs" />
                     </div>
                  </div>
                </div>
                <div className="px-1 text-center">
                  <h3 className="text-[#3D2B2B] text-[9.5px] font-black uppercase tracking-widest leading-snug" style={{ fontFamily: '"Outfit", sans-serif' }}>
                    {tool.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ABOUT US SECTION (Inspired by Image 2) */}
        <div className="text-center py-10 space-y-6">
           <h2 className="text-[#3D2B2B] text-3xl font-bold uppercase tracking-widest border-t border-[#3D2B2B]/10 pt-10" style={{ fontFamily: '"Playfair Display", serif' }}>
             About Us
           </h2>
           
           <div className="flex justify-center py-2">
             <div className="w-10 h-10 rounded-full border-2 border-[#3D2B2B]/20 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-6 h-6 fill-[#3D2B2B]/60">
                   <path d="M50 85c-2-2-35-25-35-45 0-12 10-20 20-20 6 0 11 3 15 8 4-5 9-8 15-8 10 0 20 8 20 20 0 20-33 43-35 45z"/>
                </svg>
             </div>
           </div>

           <p className="text-[#3D2B2B]/70 text-[11px] leading-relaxed font-medium italic" style={{ fontFamily: '"Outfit", sans-serif' }}>
             At Utsavo, we create events where elegance meets emotion. Every story is unique, and we transform yours into a beautifully curated celebration filled with meaning and warmth. We blend refined design, thoughtful details, and seamless coordination to make your day truly unforgettable.
           </p>

           {/* SMALL DECORATIVE STRIP */}
           <div className="w-20 h-[1px] bg-[#3D2B2B]/20 mx-auto mt-4" />
        </div>

        {/* ADDITIONAL PLANNING SECTIONS (Original logic kept) */}
        <div className="space-y-12 pb-20">


            {/* Enhanced Planning Progress Section */}
            <div
              className="p-4 rounded-xl mb-6 cursor-pointer"
              onClick={handlePlanningProgressClick}
              style={{
                background: 'linear-gradient(135deg, #fdf2f8 0%, #fffbeb 100%)',
                border: `1px solid ${theme.semantic.border.accent}`
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-lg"
                  style={{ color: theme.semantic.text.primary }}
                >
                  Planning Progress
                </h3>
                <Icon
                  name="chevronDown"
                  size="sm"
                  className="-rotate-90"
                  style={{ color: theme.semantic.text.secondary }}
                />
              </div>

              {/* Planning Categories List */}
              <div className="space-y-3">
                {planningCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Cycle through statuses on click
                      const statuses = ['Pending with Discussion', 'Pending with Budget', 'Confirmed'];
                      const currentIndex = statuses.indexOf(category.status);
                      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                      updateCategoryStatus(category.id, nextStatus);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="font-medium text-sm"
                          style={{ color: theme.semantic.text.primary }}
                        >
                          {category.name}
                        </span>
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full cursor-pointer"
                          style={{
                            backgroundColor: `${getStatusColor(category.status)}20`,
                            color: getStatusColor(category.status)
                          }}
                        >
                          {category.status}
                        </span>
                      </div>

                      {category.status === 'Confirmed' && (
                        <div className="flex items-center gap-4 text-xs mb-2">
                          <span style={{ color: theme.semantic.text.secondary }}>
                            Advance: <span className="font-medium">{category.advancePaid}</span>
                          </span>
                          <span style={{ color: theme.semantic.text.secondary }}>
                            Balance: <span className="font-medium">{category.balanceAmount}</span>
                          </span>
                          <span style={{ color: theme.semantic.text.secondary }}>
                            Total: <span className="font-medium">{category.totalBudget}</span>
                          </span>
                        </div>
                      )}

                      {category.status !== 'Confirmed' && (
                        <div className="text-xs mb-2" style={{ color: theme.semantic.text.secondary }}>
                          Budget: {category.totalBudget}
                        </div>
                      )}

                      {/* Vendor Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVendorNavigation(category.name);
                        }}
                        className="w-full py-1 px-3 rounded text-xs font-medium transition-all duration-200"
                        style={{
                          backgroundColor: `${getStatusColor(category.status)}20`,
                          color: getStatusColor(category.status),
                          border: `1px solid ${getStatusColor(category.status)}40`
                        }}
                      >
                        Find {category.name} Vendors →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center mt-3" style={{ color: theme.semantic.text.tertiary }}>
                💡 Click on categories to change status
              </p>
            </div>

            {/* YOUR EVENTS SECTION */}
            {eventData.subcategories && eventData.subcategories.length > 0 && (
              <div className="mb-10">
                <h2 className="text-[#5D3E3E] text-[11px] font-black uppercase tracking-[0.2em] mb-4 text-center">Your Sacred Ceremonies</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                  {eventData.subcategories.map((subId, index) => {
                    const label = eventData?.subcategoryLabels?.[index] || subId;
                    const emoji = subcategoryEmojis[subId] || '✨';

                    return (
                      <div
                        key={subId}
                        className="flex flex-col items-center gap-3 p-5 rounded-[2.5rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg min-w-[140px]"
                      >
                        <div className="w-16 h-16 rounded-full bg-[#5D3E3E]/5 border border-[#5D3E3E]/10 flex items-center justify-center text-3xl">
                          {emoji}
                        </div>
                        <span className="text-[10px] font-black text-[#5D3E3E] text-center uppercase tracking-widest">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Tasks */}
            <div className="px-4 mb-8">
              <h2
                className="text-xl font-bold mb-4"
                style={{ color: theme.semantic.text.primary }}
              >
                Upcoming Tasks
              </h2>

              <div className="space-y-3">
                {upcomingTasks.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                      backgroundColor: theme.semantic.card.background,
                      border: `1px solid ${theme.semantic.card.border}`
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${item.priority === 'high' ? 'task-priority-high' :
                          item.priority === 'medium' ? 'task-priority-medium' : 'task-priority-low'
                          }`}
                      />
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: theme.semantic.text.primary }}
                        >
                          {item.task}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: theme.semantic.text.secondary }}
                        >
                          {item.dueDate}
                        </p>
                      </div>
                    </div>

                    <Icon
                      name="chevronDown"
                      size="sm"
                      className="-rotate-90"
                      style={{ color: theme.semantic.text.tertiary }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => navigate('/user/vendors')}
                  className="py-3 text-sm font-bold"
                  style={{
                    backgroundColor: theme.semantic.button.outline.background,
                    color: theme.colors.primary[500],
                    border: `2px solid ${theme.colors.primary[200]}`
                  }}
                >
                  Browse Vendors
                </Button>

                <Button
                  onClick={() => navigate('/user/inspirations')}
                  className="py-3 text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    color: 'white'
                  }}
                >
                  Get Inspired
                </Button>
              </div>
            </div>

        </div>
      </div>
      {/* Sticky Check List Button */}
      <div
        className="fixed bottom-20 left-0 right-0 p-4 z-50"
        style={{
          backgroundColor: `${theme.semantic.background.primary}CC`,
          backdropFilter: 'blur(8px)',
          borderTop: `1px solid ${theme.semantic.border.light}`
        }}
      >
        <button
          onClick={() => navigate('/user/tools/checklist')}
          className="mx-auto py-2.5 px-8 rounded-full font-bold flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-95"
          style={{
            backgroundColor: theme.colors.primary[500],
            color: 'white',
            boxShadow: `0 4px 12px -2px ${theme.colors.primary[500]}40`
          }}
        >
          <Icon name="checkList" size="sm" />
          <span className="text-sm">CHECK LIST</span>
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