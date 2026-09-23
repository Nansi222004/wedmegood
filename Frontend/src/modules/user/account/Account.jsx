import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import EmptyState from '../../../components/ui/EmptyState';
import { userApi } from '../../../services/userApi';

const Account = () => {
  const { theme } = useTheme();
  const { cartState } = useCart();
  const { user, login, logout, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // Login form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

  const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Handle login form changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Clear form data after successful login
        setFormData({ email: '', password: '' });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-8 pb-24"
        style={{ backgroundColor: theme.semantic.background.primary }}
      >
        <Card className="w-full max-w-md">
          {/* Visual Login Header */}
          <div className="relative h-32 overflow-hidden rounded-t-lg">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=128&fit=crop&q=80"
              alt="Welcome"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <span className="text-white font-medium">Welcome</span>
            </div>
          </div>

          <Card.Content className="pt-6">
            {error && (
              <div 
                className="mb-4 p-3 rounded-lg text-sm"
                style={{ 
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca'
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p style={{ color: theme.semantic.text.secondary }}>
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="font-medium hover:underline"
                  style={{ 
                    color: theme.semantic.text.link,
                  }}
                  onMouseEnter={(e) => e.target.style.color = theme.semantic.text.linkHover}
                  onMouseLeave={(e) => e.target.style.color = theme.semantic.text.link}
                >
                  Sign up
                </Link>
              </p>
              
              <Link 
                to="/user/home" 
                className="block text-sm hover:underline"
                style={{ 
                  color: theme.semantic.text.tertiary,
                }}
                onMouseEnter={(e) => e.target.style.color = theme.semantic.text.secondary}
                onMouseLeave={(e) => e.target.style.color = theme.semantic.text.tertiary}
              >
                Continue as guest
              </Link>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // If user is authenticated, show profile/account details
  // Use real user data from auth context, with fallbacks
  const userData = {
    name: user?.name || 'User',
    phone: user?.phone || '',
    email: user?.email || 'user@email.com',
    profileImage: user?.profileImage || '',
    weddingDate: user?.weddingDate || null,
    city: user?.city || 'Indore',
    functionsCount: 4, // Haldi, Mehndi, Wedding, Reception
    hasSetBudget: true,
    monthlyIncome: user?.monthlyIncome || 75000 // ₹75,000 per month
  };

  // Mock budget data
  const [budgetData] = useState({
    totalBudget: 1000000, // ₹10,00,000
    spent: 320000, // ₹3,20,000
    remaining: 680000 // ₹6,80,000
  });

  // Activity data backed by real MongoDB statistics
  const [activityData, setActivityData] = useState({
    cartItems: cartState.totalItems,
    bookings: 0,
    shortlistedVendors: 0,
    favouriteVendors: 0,
    unreadMessages: 0,
    reviewsGiven: 0
  });

  // Payments data backed by real MongoDB statistics
  const [paymentsData, setPaymentsData] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    lastPaymentAmount: 0
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    const loadData = async () => {
      try {
        const [statsRes, profileRes] = await Promise.allSettled([
          userApi.getUserStats(),
          userApi.getUserProfile()
        ]);
        
        if (isMounted && profileRes.status === 'fulfilled' && profileRes.value?.success && profileRes.value.data?.user) {
          updateUser(profileRes.value.data.user);
        }

        if (isMounted && statsRes.status === 'fulfilled' && statsRes.value?.success && statsRes.value.data?.stats) {
          const s = statsRes.value.data.stats;
          setActivityData(prev => ({
            ...prev,
            bookings: s.bookingsCount || 0,
            reviewsGiven: s.reviewsCount || 0
          }));
          setPaymentsData(prev => ({
            ...prev,
            totalPayments: s.paymentsCount || 0
          }));
        }
      } catch (err) {
        console.warn('Could not fetch real user data in Account:', err.message);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const getBudgetProgress = () => {
    return (budgetData.spent / budgetData.totalBudget) * 100;
  };

  const formatWeddingDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not set';
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleNavigation = (path) => {
    // Handle special cases and navigation
    switch (path) {
      case '/user/profile/edit':
        navigate('/user/account/profile');
        break;
      case '/user/budget':
      case '/user/budget/setup':
      case '/user/budget/planner':
        navigate('/user/tools/budget');
        break;
      case '/user/wedding/details':
        navigate('/user/requirements');
        break;
      case '/user/bookings':
        navigate('/user/bookings');
        break;
      case '/user/shortlisted':
        navigate('/user/shortlist');
        break;
      case '/user/favourites':
        navigate('/user/favourites');
        break;
      case '/user/reviews':
        navigate('/user/account/reviews');
        break;
      case '/user/payments':
      case '/user/payments/history':
      case '/user/payments/pending':
        navigate('/user/account/payments');
        break;
      case '/user/profile/contact':
        navigate('/user/account/contact');
        break;
      case '/user/settings/notifications':
        navigate('/user/notifications');
        break;
      case '/user/settings/language':
        navigate('/user/language');
        break;
      case '/user/help':
        navigate('/user/help');
        break;
      case '/user/terms':
        navigate('/user/privacy');
        break;
      default:
        navigate(path);
    }
  };

  const handleLogout = () => {
    logout();
    // Stay on the same page, which will now show the login form
  };

  return (
    <div className="min-h-screen pb-32 relative bg-transparent">
      {/* Background Image for the whole page */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" style={{ backgroundImage: "url('/uservendorre%20page%20bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1 }} />
      
      {/* Editorial Profile Section */}
      <div className="px-4 mb-8 pt-8 relative z-10">
        <div 
          className="p-5 rounded-[2.5rem] shadow-sm border border-white relative overflow-hidden bg-white/90 backdrop-blur-sm"
        >
          {/* Floral background accents inside profile card */}
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: "url('/uservendorre%20page%20bg.png')", backgroundSize: '150%', backgroundPosition: 'center' }}></div>
          
          <div className="relative flex flex-col items-center text-center">
            {/* Cursive Text Top Right */}
            <div className="absolute top-0 right-2 text-right">
              <span className="font-[Caveat] text-[#BE185D]/60 text-xl leading-tight block -rotate-6">Planning</span>
              <span className="font-[Caveat] text-[#BE185D]/60 text-xl leading-tight block -rotate-6 ml-2">Beautiful</span>
              <span className="font-[Caveat] text-[#BE185D]/60 text-xl leading-tight block -rotate-6 ml-4">Moments ♥</span>
            </div>

            {/* High-End Profile Image */}
            <div className="relative group mt-2 mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-md flex items-center justify-center relative">
                {userData.profileImage && !imageError ? (
                  <img
                    src={formatImageUrl(userData.profileImage)}
                    alt={userData.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#E10079] flex items-center justify-center text-white text-3xl font-bold">
                    {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <button 
                onClick={() => handleNavigation('/user/profile/edit')}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[#BE185D] active:scale-90 transition-all border border-gray-100"
              >
                 <Icon name="camera" size="xs" />
              </button>
            </div>

            {/* Structured User Details */}
            <div className="space-y-1 w-full">
              <h1 
                className="text-[22px] font-bold leading-tight"
                style={{ color: '#301024', fontFamily: '"Playfair Display", serif' }}
              >
                {userData.name}
              </h1>
              
              <div className="flex flex-col items-center gap-1">
                 <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E95A4]">
                    {userData.phone}
                 </div>
                 <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8E95A4] truncate max-w-[200px]">
                    {userData.email}
                 </div>
              </div>

              <div className="pt-3">
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#FDF4F7] text-[9px] font-bold uppercase tracking-widest text-[#BE185D] border border-white">
                  Monthly: ₹{userData.monthlyIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutique Summary Sections */}
      <div className="px-4 space-y-4 relative z-10">
        <div className="text-center py-2 mb-2">
           <h4 className="text-[#8E95A4] text-[9px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 justify-center">
              <span className="w-8 h-[1px] bg-[#8E95A4]/30" />
              Planning Details
              <span className="w-8 h-[1px] bg-[#8E95A4]/30" />
           </h4>
        </div>

        {/* Wedding Budget Overview */}
        {userData.hasSetBudget ? (
          <div className="p-5 rounded-[2rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FDF4F7] flex items-center justify-center">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BE185D" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
                </div>
                <h3 className="text-[16px] font-bold" style={{ color: '#301024', fontFamily: '"Playfair Display", serif' }}>
                  Wedding Budget
                </h3>
              </div>
              <button
                onClick={() => handleNavigation('/user/budget')}
                className="text-[11px] font-bold text-[#301024] hover:text-[#BE185D] flex items-center gap-1"
              >
                Manage <Icon name="chevronRight" size="xs" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-5 divide-x divide-gray-100">
               {[
                 { label: 'Total', val: formatCurrency(budgetData.totalBudget), color: '#301024' },
                 { label: 'Spent', val: formatCurrency(budgetData.spent), color: '#E10079' },
                 { label: 'Left', val: formatCurrency(budgetData.remaining), color: '#10B981' }
               ].map((item, i) => (
                 <div key={i} className="text-center">
                    <div className="text-[11px] text-[#8E95A4] mb-0.5">{item.label}</div>
                    <div className="text-[15px] font-black tracking-tight" style={{ color: item.color }}>{item.val}</div>
                 </div>
               ))}
            </div>

            {/* Progress Bar */}
            <div className="relative pt-1">
              <div className="w-full h-2 bg-[#FDF4F7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E10079] rounded-full transition-all duration-500"
                  style={{ width: `${getBudgetProgress()}%` }}
                />
              </div>
              <p className="text-[9px] font-bold text-[#8E95A4] text-right mt-2 uppercase tracking-widest">
                {getBudgetProgress().toFixed(0)}% used
              </p>
            </div>
          </div>
        ) : (
          <Card className="p-4 mb-4 rounded-[2rem] bg-white/95 backdrop-blur-sm border border-white">
            <EmptyState
              icon="sparkles"
              title="Set Your Wedding Budget"
              description="Track your wedding expenses and stay within budget"
              actionText="Set Budget"
              onAction={() => handleNavigation('/user/budget/setup')}
            />
          </Card>
        )}

        {/* Wedding Details Card */}
        <div className="p-5 rounded-[2rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FDF4F7] flex items-center justify-center">
                 <Icon name="calendar" size="xs" style={{ color: '#BE185D' }} />
              </div>
              <h3 className="text-[16px] font-bold" style={{ color: '#301024', fontFamily: '"Playfair Display", serif' }}>
                Wedding Details
              </h3>
            </div>
            <button
              onClick={() => handleNavigation('/user/wedding/details')}
              className="px-3 py-1 rounded-full border border-gray-200 text-[11px] font-bold text-[#BE185D] flex items-center gap-1 bg-white hover:bg-gray-50"
            >
              <Icon name="edit" size="xs" /> Edit
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 divide-x divide-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-[#F5F3FF] flex items-center justify-center mb-2">
                <Icon name="calendar" size="xs" style={{ color: '#8B5CF6' }} />
              </div>
              <p className="text-[11px] font-bold text-[#301024] leading-tight mb-0.5">
                {formatWeddingDate(userData.weddingDate)}
              </p>
              <p className="text-[9px] text-[#8E95A4]">Wedding Date</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center mb-2">
                <Icon name="location" size="xs" style={{ color: '#D97706' }} />
              </div>
              <p className="text-[11px] font-bold text-[#301024] leading-tight mb-0.5">
                {userData.city}
              </p>
              <p className="text-[9px] text-[#8E95A4]">City</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-2">
                <Icon name="users" size="xs" style={{ color: '#6B7280' }} />
              </div>
              <p className="text-[11px] font-bold text-[#301024] leading-tight mb-0.5">
                {userData.functionsCount} Functions
              </p>
              <p className="text-[9px] text-[#8E95A4]">Functions</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Activity Section */}
      <div className="px-4 py-8 relative z-10">
        <div className="flex items-center gap-2 mb-5 px-2">
          <Icon name="heart" size="sm" style={{ color: '#E10079' }} />
          <h2 className="text-[20px] font-bold text-[#301024]" style={{ fontFamily: '"Playfair Display", serif' }}>
            My Wedding Tools
          </h2>
        </div>
        
        <div className="space-y-3">
          {/* My Cart */}
          <div 
            className="p-4 rounded-[1.5rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white cursor-pointer active:scale-95 transition-transform flex items-center justify-between"
            onClick={() => handleNavigation('/user/cart')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FDF4F7] flex items-center justify-center shrink-0">
                <Icon name="cart" size="sm" style={{ color: '#E10079' }} />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-[#301024] mb-0.5">My Cart</h3>
                <p className="text-[11px] text-[#8E95A4]">{activityData.cartItems} items</p>
              </div>
            </div>
            <Icon name="chevronRight" size="sm" style={{ color: '#8E95A4' }} />
          </div>

          {/* Completed Work */}
          <div 
            className="p-4 rounded-[1.5rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white cursor-pointer active:scale-95 transition-transform flex items-center justify-between"
            onClick={() => handleNavigation('/user/bookings')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF9C3] flex items-center justify-center shrink-0">
                <Icon name="check" size="sm" style={{ color: '#CA8A04' }} />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-[#301024] mb-0.5">Completed Work</h3>
                <p className="text-[11px] text-[#8E95A4]">{activityData.bookings} active bookings</p>
              </div>
            </div>
            <Icon name="chevronRight" size="sm" style={{ color: '#8E95A4' }} />
          </div>

          {/* Shortlisted Vendors */}
          <div 
            className="p-4 rounded-[1.5rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white cursor-pointer active:scale-95 transition-transform flex items-center justify-between"
            onClick={() => handleNavigation('/user/shortlisted')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#CCFBF1] flex items-center justify-center shrink-0">
                <Icon name="heart" size="sm" style={{ color: '#0F766E' }} />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-[#301024] mb-0.5">Shortlisted Vendors</h3>
                <p className="text-[11px] text-[#8E95A4]">{activityData.shortlistedVendors} vendors</p>
              </div>
            </div>
            <Icon name="chevronRight" size="sm" style={{ color: '#8E95A4' }} />
          </div>

          {/* Favourite Vendors */}
          <div 
            className="p-4 rounded-[1.5rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white cursor-pointer active:scale-95 transition-transform flex items-center justify-between"
            onClick={() => handleNavigation('/user/favourites')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0">
                <Icon name="star" size="sm" style={{ color: '#7E22CE' }} />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-[#301024] mb-0.5">Favourite Vendors</h3>
                <p className="text-[11px] text-[#8E95A4]">{activityData.favouriteVendors} vendors</p>
              </div>
            </div>
            <Icon name="chevronRight" size="sm" style={{ color: '#8E95A4' }} />
          </div>

          {/* Messages with Vendors */}
          <div 
            className="p-4 rounded-[1.5rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white cursor-pointer active:scale-95 transition-transform flex items-center justify-between"
            onClick={() => handleNavigation('/user/chats')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0 relative">
                <Icon name="chat" size="sm" style={{ color: '#7E22CE' }} />
                {activityData.unreadMessages > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                    {activityData.unreadMessages}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-[#301024] mb-0.5">Messages with Vendors</h3>
                <p className="text-[11px] text-[#8E95A4]">{activityData.unreadMessages} unread messages</p>
              </div>
            </div>
            <Icon name="chevronRight" size="sm" style={{ color: '#8E95A4' }} />
          </div>

          {/* Reviews Given */}
          <div 
            className="p-4 rounded-[1.5rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white cursor-pointer active:scale-95 transition-transform flex items-center justify-between"
            onClick={() => handleNavigation('/user/reviews')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF9C3] flex items-center justify-center shrink-0">
                <Icon name="star" size="sm" style={{ color: '#CA8A04' }} />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-[#301024] mb-0.5">Reviews Given</h3>
                <p className="text-[11px] text-[#8E95A4]">{activityData.reviewsGiven} reviews</p>
              </div>
            </div>
            <Icon name="chevronRight" size="sm" style={{ color: '#8E95A4' }} />
          </div>
        </div>
      </div>

      {/* Account & Settings */}
      <div className="px-4 py-2 relative z-10">
        <div className="flex items-center gap-2 mb-5 px-2">
          <h2 className="text-[20px] font-bold text-[#301024]" style={{ fontFamily: '"Playfair Display", serif' }}>
            Account & Settings
          </h2>
        </div>
        
        <div className="space-y-3">
          {/* Edit Profile */}
          <div 
            className="p-4 rounded-[1.5rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white cursor-pointer active:scale-95 transition-transform flex items-center justify-between"
            onClick={() => handleNavigation('/user/profile/edit')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Icon name="account" size="sm" style={{ color: '#6B7280' }} />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-[#301024] mb-0.5">Edit Profile</h3>
                <p className="text-[11px] text-[#8E95A4]">Update your personal information</p>
              </div>
            </div>
            <Icon name="chevronRight" size="sm" style={{ color: '#8E95A4' }} />
          </div>
          
          {/* Logout */}
          <div 
            className="p-4 rounded-[1.5rem] bg-white/95 backdrop-blur-sm shadow-sm border border-white cursor-pointer active:scale-95 transition-transform flex items-center justify-between"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Icon name="logout" size="sm" style={{ color: '#EF4444' }} />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-red-500 mb-0.5">Logout</h3>
                <p className="text-[11px] text-[#8E95A4]">Sign out of your account</p>
              </div>
            </div>
            <Icon name="chevronRight" size="sm" style={{ color: '#8E95A4' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;