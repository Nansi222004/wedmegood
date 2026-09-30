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
        setFormData({ email: '', password: '' });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not authenticated, show luxury login form
  if (!isAuthenticated) {
    return (
      <div className="bg-[#EDE8E1] min-h-screen text-slate-800 antialiased font-sans flex items-center justify-center px-4 py-8 pb-28">
        <div className="w-full max-w-md bg-[#FAF6F0] rounded-[28px] border border-[#D4AF37]/30 shadow-2xl overflow-hidden relative">
          {/* Visual Login Header */}
          <div className="relative h-36 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=300&fit=crop&q=80"
              alt="Utsavo Welcome"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4F1325]/90 via-[#4F1325]/40 to-transparent" />
            <div className="absolute bottom-3 left-5">
              <span className="text-[10px] font-cinzel uppercase tracking-[0.2em] text-[#ECC880] block font-bold">
                Royal Guest Access
              </span>
              <h2 className="text-xl font-serif font-bold text-white">Welcome to Utsavo</h2>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4F1325] mb-1 font-cinzel">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#D4AF37]/35 text-sm text-[#4F1325] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4F1325] mb-1 font-cinzel">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#D4AF37]/35 text-sm text-[#4F1325] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#4F1325] to-[#651731] text-[#ECC880] font-bold text-xs uppercase tracking-widest shadow-md hover:opacity-95 active:scale-95 transition-all mt-2"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-xs text-[#651731]/70">
                Don't have an account?{' '}
                <Link to="/signup" className="font-bold text-[#4F1325] underline hover:text-[#651731]">
                  Sign up
                </Link>
              </p>

              <Link to="/user/home" className="block text-xs font-semibold text-[#8E95A4] hover:text-[#4F1325]">
                Continue as guest
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Real user data from auth context
  const userData = {
    name: user?.name || 'Celebration Host',
    phone: user?.phone || '',
    email: user?.email || 'host@utsavo.com',
    profileImage: user?.profileImage || '',
    weddingDate: user?.weddingDate || null,
    city: user?.city || 'Indore',
    functionsCount: 4,
    hasSetBudget: true,
    monthlyIncome: user?.monthlyIncome || 75000
  };

  const [budgetData] = useState({
    totalBudget: 1000000,
    spent: 320000,
    remaining: 680000
  });

  const [activityData, setActivityData] = useState({
    cartItems: cartState.totalItems,
    bookings: 0,
    shortlistedVendors: 0,
    favouriteVendors: 0,
    unreadMessages: 0,
    reviewsGiven: 0
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
          setActivityData((prev) => ({
            ...prev,
            bookings: s.bookingsCount || 0,
            reviewsGiven: s.reviewsCount || 0
          }));
        }
      } catch (err) {
        console.warn('Could not fetch real user data in Account:', err.message);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
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
        navigate('/user/account/payments');
        break;
      case '/user/profile/contact':
        navigate('/user/account/contact');
        break;
      default:
        navigate(path);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="bg-[#EDE8E1] min-h-screen text-slate-800 antialiased font-sans">
      <div className="max-w-[430px] md:max-w-4xl mx-auto min-h-screen bg-[#FAF6F0] relative overflow-hidden shadow-2xl pb-28">
        {/* Subtle Luxury Floral Watermarks */}
        <div className="floral-bg-corner-tl opacity-70 pointer-events-none" />
        <div className="floral-bg-corner-br opacity-70 pointer-events-none" />

        {/* Profile Card Section */}
        <div className="px-5 pt-6 mb-6 relative z-10">
          <div className="p-6 rounded-[28px] shadow-sm border border-[#D4AF37]/30 relative overflow-hidden bg-white/95 backdrop-blur-sm">
            {/* Top Right Script Calligraphy */}
            <div className="absolute top-4 right-5 text-right pointer-events-none">
              <span className="font-script text-[#D4AF37] text-2xl leading-none block -rotate-6">
                Celebrating Love
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              {/* Profile Avatar */}
              <div className="relative group mt-1 mb-3">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm flex items-center justify-center border-2 border-[#D4AF37]">
                  {userData.profileImage && !imageError ? (
                    <img
                      src={formatImageUrl(userData.profileImage)}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#4F1325] to-[#651731] flex items-center justify-center text-[#ECC880] text-3xl font-serif font-bold">
                      {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleNavigation('/user/profile/edit')}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#4F1325] shadow-md flex items-center justify-center text-[#ECC880] active:scale-90 transition-all border border-white"
                  title="Change Photo"
                >
                  <Icon name="camera" size="xs" />
                </button>
              </div>

              {/* User Identity */}
              <div className="space-y-1 w-full">
                <h1 className="text-2xl font-serif font-bold text-[#4F1325] leading-tight">
                  {userData.name}
                </h1>

                <div className="flex flex-col items-center gap-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E95A4]">
                    {userData.phone || '+91 98765 43210'}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8E95A4] truncate max-w-[220px]">
                    {userData.email}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-[#FAF6F0] text-[9px] font-bold uppercase tracking-widest text-[#651731] border border-[#D4AF37]/35 shadow-2xs font-cinzel">
                    Location: {userData.city}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wedding Budget Overview */}
        <div className="px-5 space-y-4 relative z-10">
          <div className="p-5 rounded-[24px] bg-white/95 backdrop-blur-sm shadow-xs border border-[#D4AF37]/25">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FAF6F0] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10" />
                    <path d="M12 20V4" />
                    <path d="M6 20v-6" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] font-cinzel uppercase tracking-[0.2em] text-[#D4AF37] block font-bold">
                    Financial Planner
                  </span>
                  <h3 className="text-base font-serif font-bold text-[#4F1325]">Wedding Budget</h3>
                </div>
              </div>
              <button
                onClick={() => handleNavigation('/user/budget')}
                className="text-xs font-bold text-[#651731] hover:text-[#4F1325] flex items-center gap-1 font-cinzel"
              >
                Manage <Icon name="chevronRight" size="xs" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 divide-x divide-[#D4AF37]/20">
              {[
                { label: 'Total', val: formatCurrency(budgetData.totalBudget), color: '#4F1325' },
                { label: 'Spent', val: formatCurrency(budgetData.spent), color: '#651731' },
                { label: 'Remaining', val: formatCurrency(budgetData.remaining), color: '#0F766E' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-[10px] text-[#8E95A4] uppercase tracking-wider mb-0.5">{item.label}</div>
                  <div className="text-base font-bold font-serif" style={{ color: item.color }}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="relative pt-1">
              <div className="w-full h-2 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#D4AF37]/20">
                <div
                  className="h-full bg-gradient-to-r from-[#4F1325] to-[#651731] rounded-full transition-all duration-500"
                  style={{ width: `${getBudgetProgress()}%` }}
                />
              </div>
              <p className="text-[9px] font-bold text-[#8E95A4] text-right mt-1.5 uppercase tracking-widest font-cinzel">
                {getBudgetProgress().toFixed(0)}% Utilized
              </p>
            </div>
          </div>

          {/* Wedding Details Card */}
          <div className="p-5 rounded-[24px] bg-white/95 backdrop-blur-sm shadow-xs border border-[#D4AF37]/25">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FAF6F0] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Icon name="calendar" size="xs" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#4F1325]">Celebration Itinerary</h3>
              </div>
              <button
                onClick={() => handleNavigation('/user/wedding/details')}
                className="px-3 py-1 rounded-full border border-[#D4AF37]/35 text-[11px] font-bold text-[#651731] flex items-center gap-1 bg-[#FAF6F0] hover:bg-white transition-all"
              >
                <Icon name="edit" size="xs" /> Edit
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 divide-x divide-[#D4AF37]/20">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-[#FFF5F6] flex items-center justify-center mb-1 text-[#651731]">
                  <Icon name="calendar" size="xs" />
                </div>
                <p className="text-[11px] font-bold text-[#4F1325] leading-tight mb-0.5">
                  {formatWeddingDate(userData.weddingDate)}
                </p>
                <p className="text-[9px] text-[#8E95A4] uppercase tracking-wider">Date</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center mb-1 text-[#D4AF37]">
                  <Icon name="location" size="xs" />
                </div>
                <p className="text-[11px] font-bold text-[#4F1325] leading-tight mb-0.5">{userData.city}</p>
                <p className="text-[9px] text-[#8E95A4] uppercase tracking-wider">Destination</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center mb-1 text-[#4F1325]">
                  <Icon name="users" size="xs" />
                </div>
                <p className="text-[11px] font-bold text-[#4F1325] leading-tight mb-0.5">
                  {userData.functionsCount} Events
                </p>
                <p className="text-[9px] text-[#8E95A4] uppercase tracking-wider">Ceremonies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wedding Tools Section */}
        <div className="px-5 pt-6 pb-2 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            <h2 className="text-lg font-serif font-bold text-[#4F1325]">Celebration Services</h2>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: 'Shortlisted Artisans',
                subtitle: `${activityData.shortlistedVendors} saved for review`,
                icon: 'heart',
                path: '/user/shortlisted'
              },
              {
                title: 'Treasured Favourites',
                subtitle: `${activityData.favouriteVendors} favorite vendors`,
                icon: 'star',
                path: '/user/favourites'
              },
              {
                title: 'Vendor Communications',
                subtitle: 'Direct messages with artisans',
                icon: 'chat',
                path: '/user/chats'
              },
              {
                title: 'Bookings & Orders',
                subtitle: `${activityData.bookings} confirmed bookings`,
                icon: 'check',
                path: '/user/bookings'
              },
              {
                title: 'My Cart',
                subtitle: `${activityData.cartItems} selected packages`,
                icon: 'cart',
                path: '/user/cart'
              }
            ].map((tool, idx) => (
              <div
                key={idx}
                className="p-4 rounded-[20px] bg-white/95 backdrop-blur-sm shadow-xs border border-[#D4AF37]/20 hover:border-[#D4AF37] cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between group"
                onClick={() => handleNavigation(tool.path)}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFF5F6] to-[#FAF6F0] border border-[#D4AF37]/30 flex items-center justify-center text-[#4F1325] group-hover:scale-105 transition-transform">
                    <Icon name={tool.icon} size="sm" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#4F1325] group-hover:text-[#651731] transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-[10px] text-[#8E95A4]">{tool.subtitle}</p>
                  </div>
                </div>
                <div className="text-[#D4AF37] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <Icon name="chevronRight" size="xs" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account & Settings */}
        <div className="px-5 pt-4 pb-4 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            <h2 className="text-lg font-serif font-bold text-[#4F1325]">Account & Preferences</h2>
          </div>

          <div className="space-y-2.5">
            <div
              className="p-4 rounded-[20px] bg-white/95 backdrop-blur-sm shadow-xs border border-[#D4AF37]/20 hover:border-[#D4AF37] cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between group"
              onClick={() => handleNavigation('/user/profile/edit')}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFF5F6] to-[#FAF6F0] border border-[#D4AF37]/30 flex items-center justify-center text-[#4F1325]">
                  <Icon name="account" size="sm" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#4F1325]">Personal Profile</h3>
                  <p className="text-[10px] text-[#8E95A4]">Manage your personal details</p>
                </div>
              </div>
              <Icon name="chevronRight" size="xs" className="text-[#D4AF37]" />
            </div>

            <div
              className="p-4 rounded-[20px] bg-white/95 backdrop-blur-sm shadow-xs border border-red-100 hover:border-red-200 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between group"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                  <Icon name="logout" size="sm" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-red-600">Logout</h3>
                  <p className="text-[10px] text-[#8E95A4]">Sign out from this device</p>
                </div>
              </div>
              <Icon name="chevronRight" size="xs" className="text-red-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;