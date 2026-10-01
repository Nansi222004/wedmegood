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
  const { user, login, logout, isAuthenticated, updateUser, continueAsGuest } = useAuth();
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
        <div className="w-full max-w-md bg-[#FAF6F0] rounded-[28px] border border-stone-200/80 shadow-2xl overflow-hidden relative">
          {/* Visual Login Header */}
          <div className="relative h-36 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=300&fit=crop&q=80"
              alt="Utsavo Welcome"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4F1325]/90 via-[#4F1325]/40 to-transparent" />
            <div className="absolute bottom-3 left-5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ECC880] block">
                Royal Guest Access
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white">Welcome to Utsavo</h2>
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#4F1325] to-[#651731] text-[#ECC880] font-semibold text-sm shadow-md hover:opacity-95 active:scale-95 transition-all mt-2 cursor-pointer"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-xs text-stone-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-[#651731] underline hover:text-[#4F1325]">
                  Sign up
                </Link>
              </p>

              <button
                type="button"
                onClick={() => {
                  if (typeof continueAsGuest === 'function') continueAsGuest();
                  navigate('/user/home');
                }}
                className="block text-xs font-medium text-stone-500 hover:text-stone-800 mx-auto cursor-pointer"
              >
                Continue as guest
              </button>
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
          <div className="p-6 rounded-[28px] shadow-sm border border-stone-200/80 relative overflow-hidden bg-white/95 backdrop-blur-sm">
            {/* Top Right Status Badge */}
            <div className="absolute top-4 right-4 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6F0] border border-stone-200/80 text-[11px] font-semibold text-[#4F1325]">
                <span className="text-[#D4AF37]">✦</span>
                <span>Utsavo Member</span>
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              {/* Profile Avatar */}
              <div className="relative group mt-1 mb-3">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm flex items-center justify-center border-2 border-stone-200/90">
                  {userData.profileImage && !imageError ? (
                    <img
                      src={formatImageUrl(userData.profileImage)}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#4F1325] to-[#651731] flex items-center justify-center text-[#ECC880] text-3xl font-bold font-sans">
                      {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleNavigation('/user/profile/edit')}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#4F1325] shadow-md flex items-center justify-center text-[#ECC880] active:scale-90 transition-all border border-white cursor-pointer"
                  title="Change Photo"
                >
                  <Icon name="camera" size="xs" />
                </button>
              </div>

              {/* User Identity */}
              <div className="space-y-1.5 w-full">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900 leading-tight">
                  {userData.name}
                </h1>

                <div className="flex items-center justify-center flex-wrap gap-2 text-xs text-stone-500 font-medium">
                  {userData.phone && <span>{userData.phone}</span>}
                  {userData.phone && userData.email && <span className="text-stone-300">•</span>}
                  <span className="truncate max-w-[240px] text-stone-500">{userData.email}</span>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF6F0] text-xs font-semibold text-stone-700 border border-stone-200/80">
                    <svg className="w-3.5 h-3.5 text-[#8B1E3F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{userData.city}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wedding Budget Overview */}
        <div className="px-5 space-y-4 relative z-10">
          <div className="p-5 rounded-[24px] bg-white/95 backdrop-blur-sm shadow-xs border border-stone-200/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FAF6F0] border border-amber-200/70 flex items-center justify-center text-[#B38728]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10" />
                    <path d="M12 20V4" />
                    <path d="M6 20v-6" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A8741A] block font-bold">
                    Financial Planner
                  </span>
                  <h3 className="text-base font-bold text-stone-900 tracking-tight">Wedding Budget</h3>
                </div>
              </div>
              <button
                onClick={() => handleNavigation('/user/budget')}
                className="text-xs font-semibold text-[#8B1E3F] hover:text-[#4F1325] flex items-center gap-1 cursor-pointer transition-colors"
              >
                Manage <Icon name="chevronRight" size="xs" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 divide-x divide-stone-200/70">
              {[
                { label: 'Total', val: formatCurrency(budgetData.totalBudget), color: '#1C1917' },
                { label: 'Spent', val: formatCurrency(budgetData.spent), color: '#651731' },
                { label: 'Remaining', val: formatCurrency(budgetData.remaining), color: '#0F766E' }
              ].map((item, i) => (
                <div key={i} className="text-center px-1">
                  <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-lg font-bold font-sans tracking-tight" style={{ color: item.color }}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="relative pt-1">
              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60">
                <div
                  className="h-full bg-gradient-to-r from-[#4F1325] to-[#651731] rounded-full transition-all duration-500"
                  style={{ width: `${getBudgetProgress()}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-stone-500 text-right mt-1.5 tracking-tight">
                {getBudgetProgress().toFixed(0)}% Utilized
              </p>
            </div>
          </div>

          {/* Wedding Details Card */}
          <div className="p-5 rounded-[24px] bg-white/95 backdrop-blur-sm shadow-xs border border-stone-200/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FAF6F0] border border-amber-200/70 flex items-center justify-center text-[#B38728]">
                  <Icon name="calendar" size="xs" />
                </div>
                <h3 className="text-base font-bold text-stone-900 tracking-tight">Celebration Itinerary</h3>
              </div>
              <button
                onClick={() => handleNavigation('/user/wedding/details')}
                className="px-3 py-1 rounded-full border border-stone-200 text-xs font-semibold text-stone-700 flex items-center gap-1.5 bg-white hover:bg-stone-50 transition-all shadow-2xs cursor-pointer"
              >
                <Icon name="edit" size="xs" /> Edit
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 divide-x divide-stone-200/70">
              <div className="flex flex-col items-center text-center px-1">
                <div className="w-8 h-8 rounded-full bg-[#FFF5F6] flex items-center justify-center mb-1 text-[#651731]">
                  <Icon name="calendar" size="xs" />
                </div>
                <p className="text-xs font-bold text-stone-900 leading-tight mb-0.5">
                  {formatWeddingDate(userData.weddingDate)}
                </p>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Date</p>
              </div>

              <div className="flex flex-col items-center text-center px-1">
                <div className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center mb-1 text-[#B38728]">
                  <Icon name="location" size="xs" />
                </div>
                <p className="text-xs font-bold text-stone-900 leading-tight mb-0.5">{userData.city}</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Destination</p>
              </div>

              <div className="flex flex-col items-center text-center px-1">
                <div className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center mb-1 text-[#4F1325]">
                  <Icon name="users" size="xs" />
                </div>
                <p className="text-xs font-bold text-stone-900 leading-tight mb-0.5">
                  {userData.functionsCount} Events
                </p>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Ceremonies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wedding Tools Section */}
        <div className="px-5 pt-6 pb-2 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">Celebration Services</h2>
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
                className="p-4 rounded-[20px] bg-white/95 backdrop-blur-sm shadow-xs border border-stone-200/80 hover:border-stone-300 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between group"
                onClick={() => handleNavigation(tool.path)}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFF5F6] to-[#FAF6F0] border border-amber-200/50 flex items-center justify-center text-[#4F1325] group-hover:scale-105 transition-transform">
                    <Icon name={tool.icon} size="sm" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-stone-800 group-hover:text-[#651731] transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-stone-500">{tool.subtitle}</p>
                  </div>
                </div>
                <div className="text-stone-400 group-hover:text-[#4F1325] group-hover:translate-x-0.5 transition-all">
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
            <h2 className="text-base font-bold text-stone-900 tracking-tight">Account & Preferences</h2>
          </div>

          <div className="space-y-2.5">
            <div
              className="p-4 rounded-[20px] bg-white/95 backdrop-blur-sm shadow-xs border border-stone-200/80 hover:border-stone-300 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between group"
              onClick={() => handleNavigation('/user/profile/edit')}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFF5F6] to-[#FAF6F0] border border-amber-200/50 flex items-center justify-center text-[#4F1325]">
                  <Icon name="account" size="sm" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-stone-800">Personal Profile</h3>
                  <p className="text-xs text-stone-500">Manage your personal details</p>
                </div>
              </div>
              <Icon name="chevronRight" size="xs" className="text-stone-400" />
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
                  <h3 className="font-semibold text-sm text-red-600">Logout</h3>
                  <p className="text-xs text-stone-500">Sign out from this device</p>
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