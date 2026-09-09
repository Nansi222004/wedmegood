import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import EmptyState from '../../../components/ui/EmptyState';

const Account = () => {
  const { theme } = useTheme();
  const { cartState } = useCart();
  const { user, login, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Login form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    phone: user?.phone || '+91 98765 43210',
    email: user?.email || 'user@email.com',
    profileImage: user?.profileImage || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    weddingDate: user?.weddingDate || '2024-12-15',
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

  // Mock activity data
  const [activityData] = useState({
    cartItems: cartState.totalItems,
    bookings: 2,
    shortlistedVendors: 8,
    favouriteVendors: 5,
    unreadMessages: 3,
    reviewsGiven: 1
  });

  // Mock payments data
  const [paymentsData] = useState({
    totalPayments: 5,
    pendingPayments: 2,
    lastPaymentAmount: 25000
  });

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
    const date = new Date(dateString);
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
    <div className="min-h-screen pb-32 px-6" style={{ backgroundColor: '#EAE1D8' }}>
      
      {/* Editorial Profile Section - Compact */}
      <div className="py-4">
        <div 
          className="p-5 rounded-[2rem] shadow-md border border-white relative overflow-hidden"
          style={{ backgroundColor: 'white' }}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            {/* High-End Profile Image - Slimmed */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-[4px] border-[#EAE1D8]/20 shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&q=80"
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button 
                onClick={() => handleNavigation('/user/profile/edit')}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-[#3D2B2B] active:scale-90 transition-all border border-gray-100"
              >
                 <Icon name="plan" size="xs" />
              </button>
            </div>

            {/* Structured User Details - High Density */}
            <div className="space-y-2 w-full">
              <div>
                <h1 
                  className="text-xl font-bold leading-tight"
                  style={{ color: '#3D2B2B', fontFamily: '"Playfair Display", serif' }}
                >
                  {userData.name}
                </h1>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                 <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#3D2B2B]/40" style={{ fontFamily: '"Outfit", sans-serif' }}>
                    {userData.phone}
                 </div>
                 <div className="text-[9px] font-black uppercase tracking-[0.15em] text-[#3D2B2B]/40 truncate max-w-[200px]" style={{ fontFamily: '"Outfit", sans-serif' }}>
                    {userData.email}
                 </div>
              </div>

              <div className="pt-1">
                <span className="inline-block px-3 py-1 rounded-full bg-[#EAE1D8]/20 text-[8px] font-black uppercase tracking-widest text-[#3D2B2B]/60 border border-white/50">
                  Monthly: ₹{userData.monthlyIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutique Summary Sections - Compact */}
      <div className="space-y-8">
        <div className="text-center py-2">
           <h4 className="text-[#3D2B2B]/30 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 justify-center">
              <span className="w-6 h-[1px] bg-[#3D2B2B]/10" />
              Planning Details
              <span className="w-6 h-[1px] bg-[#3D2B2B]/10" />
           </h4>
        </div>

        {/* Wedding Budget Overview - Compact */}
        {userData.hasSetBudget ? (
          <div 
            className="p-5 rounded-[2rem] bg-white shadow-sm border border-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-sm font-bold"
                style={{ color: '#3D2B2B', fontFamily: '"Playfair Display", serif' }}
              >
                Wedding Budget
              </h3>
              <button
                onClick={() => handleNavigation('/user/budget')}
                className="text-[9px] font-black uppercase tracking-widest text-[#3D2B2B]/40 hover:text-[#3D2B2B]"
              >
                Manage
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
               {[
                 { label: 'Total', val: formatCurrency(budgetData.totalBudget), color: '#3D2B2B' },
                 { label: 'Spent', val: formatCurrency(budgetData.spent), color: '#BE185D' },
                 { label: 'Left', val: formatCurrency(budgetData.remaining), color: '#15803D' }
               ].map((item, i) => (
                 <div key={i} className="text-center">
                    <div className="text-[8px] font-black uppercase text-[#3D2B2B]/30 mb-0.5 tracking-tighter">{item.label}</div>
                    <div className="text-sm font-black tracking-tight" style={{ color: item.color }}>{item.val}</div>
                 </div>
               ))}
            </div>

            {/* Progress Bar - Slim */}
            <div className="relative pt-1">
              <div 
                className="w-full h-1 bg-[#EAE1D8] rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-[#3D2B2B] rounded-full transition-all duration-500"
                  style={{ width: `${getBudgetProgress()}%` }}
                />
              </div>
              <p className="text-[8px] font-black text-[#3D2B2B]/20 text-right mt-1 uppercase tracking-widest">
                {getBudgetProgress().toFixed(0)}% used
              </p>
            </div>
          </div>
        ) : (
          <Card className="p-4 mb-4">
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
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 
              className="font-semibold text-base"
              style={{ color: theme.semantic.text.primary }}
            >
              Wedding Details
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigation('/user/wedding/details')}
            >
              Edit
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.primary[100] }}
              >
                <Icon name="rings" size="xs" style={{ color: theme.colors.primary[600] }} />
              </div>
              <div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: theme.semantic.text.primary }}
                >
                  {formatWeddingDate(userData.weddingDate)}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  Wedding Date
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.secondary[100] }}
              >
                <Icon name="location" size="xs" style={{ color: theme.colors.secondary[600] }} />
              </div>
              <div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: theme.semantic.text.primary }}
                >
                  {userData.city}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  City
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.accent[100] }}
              >
                <Icon name="sparkles" size="xs" style={{ color: theme.colors.accent[600] }} />
              </div>
              <div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: theme.semantic.text.primary }}
                >
                  {userData.functionsCount} Functions
                </p>
                <p 
                  className="text-xs"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  Haldi, Mehndi, Wedding, Reception
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* My Activity Section */}
      <div className="px-4 py-6">
        <div className="flex items-center space-x-2 mb-4">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.colors.accent[500] }}
          />
          <span 
            className="text-base"
            style={{ color: theme.semantic.text.primary }}
          >
            My Wedding Tools
          </span>
        </div>
        
        <div className="space-y-3">
          {/* My Cart */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/cart')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.primary[100] }}
                >
                  <Icon name="cart" size="sm" style={{ color: theme.colors.primary[600] }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    My Cart
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {activityData.cartItems} items
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Completed Work */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/bookings')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.secondary[100] }}
                >
                  <Icon name="check" size="sm" style={{ color: theme.colors.secondary[600] }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Completed Work
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {activityData.bookings} active bookings
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Shortlisted Vendors */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/shortlisted')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.accent[100] }}
                >
                  <Icon name="heart" size="sm" style={{ color: theme.colors.accent[600] }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Shortlisted Vendors
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {activityData.shortlistedVendors} vendors
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Favourite Vendors */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/favourites')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="star" size="sm" style={{ color: theme.semantic.text.secondary }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Favourite Vendors
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {activityData.favouriteVendors} vendors
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Messages with Vendors */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/chats')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center relative"
                  style={{ backgroundColor: theme.colors.primary[100] }}
                >
                  <Icon name="chat" size="sm" style={{ color: theme.colors.primary[600] }} />
                  {activityData.unreadMessages > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      {activityData.unreadMessages}
                    </div>
                  )}
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Messages with Vendors
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {activityData.unreadMessages} unread messages
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Reviews Given */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/reviews')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.secondary[100] }}
                >
                  <Icon name="star" size="sm" style={{ color: theme.colors.secondary[600] }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Reviews Given
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {activityData.reviewsGiven} review{activityData.reviewsGiven !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>
        </div>
      </div>

      {/* Payments & Budget Management */}
      <div className="px-4 py-6">
        <div className="flex items-center space-x-2 mb-4">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.colors.secondary[500] }}
          />
          <span 
            className="text-base"
            style={{ color: theme.semantic.text.primary }}
          >
            Payments & Spending
          </span>
        </div>
        
        <div className="space-y-3">
          {/* My Payments */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/payments')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.accent[100] }}
                >
                  <Icon name="money" size="sm" style={{ color: theme.colors.accent[600] }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    My Payments
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {paymentsData.totalPayments} payments made
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Payment History */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/payments/history')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="book" size="sm" style={{ color: theme.semantic.text.secondary }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Payment History
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    Last payment: {formatCurrency(paymentsData.lastPaymentAmount)}
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Pending Payments */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/payments/pending')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center relative"
                  style={{ backgroundColor: theme.colors.primary[100] }}
                >
                  <Icon name="clock" size="sm" style={{ color: theme.colors.primary[600] }} />
                  {paymentsData.pendingPayments > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: '#f59e0b' }}
                    >
                      {paymentsData.pendingPayments}
                    </div>
                  )}
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Pending Payments
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {paymentsData.pendingPayments} payments due
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Budget Planner */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/budget/planner')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.secondary[100] }}
                >
                  <Icon name="plan" size="sm" style={{ color: theme.colors.secondary[600] }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Budget Planner
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    Plan your wedding expenses
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>
        </div>
      </div>

      {/* Account & Settings */}
      <div className="px-4 py-6">
        <div className="flex items-center space-x-2 mb-4">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.colors.primary[400] }}
          />
          <span 
            className="text-base"
            style={{ color: theme.semantic.text.primary }}
          >
            Account & Settings
          </span>
        </div>
        
        <div className="space-y-3">
          {/* Edit Profile */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/profile/edit')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="account" size="sm" style={{ color: theme.semantic.text.secondary }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Edit Profile
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    Update your personal information
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Change Phone / Email */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/profile/contact')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="envelope" size="sm" style={{ color: theme.semantic.text.secondary }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Change Phone / Email
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    Update contact information
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Notification Settings */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/settings/notifications')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="settings" size="sm" style={{ color: theme.semantic.text.secondary }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Notification Settings
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    Manage your notifications
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Language */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/settings/language')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="globe" size="sm" style={{ color: theme.semantic.text.secondary }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Language
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    English (India)
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Help & Support */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/help')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="help" size="sm" style={{ color: theme.semantic.text.secondary }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Help & Support
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    Get help and contact support
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Terms & Privacy */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => handleNavigation('/user/terms')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="shield" size="sm" style={{ color: theme.semantic.text.secondary }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    Terms & Privacy
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    Terms of service and privacy policy
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>

          {/* Logout */}
          <Card 
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={handleLogout}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#fee2e2' }}
                >
                  <Icon name="logout" size="sm" style={{ color: '#dc2626' }} />
                </div>
                <div>
                  <h3 
                    className="font-medium text-base"
                    style={{ color: '#dc2626' }}
                  >
                    Logout
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    Sign out of your account
                  </p>
                </div>
              </div>
              <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-4"></div>
    </div>
  );
};

export default Account;