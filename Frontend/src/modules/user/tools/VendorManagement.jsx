import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';

const VendorManagement = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [vendorData, setVendorData] = useState(null);

  // Simulate loading and fetch vendor data
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mock vendor data
      const mockData = {
        totalVendors: 12,
        bookedVendors: 6,
        pendingVendors: 4,
        quotedVendors: 2,
        categories: [
          { name: 'Photography', total: 3, booked: 1, pending: 1, quoted: 1, color: '#ec4899' },
          { name: 'Catering', total: 2, booked: 1, pending: 1, quoted: 0, color: '#f59e0b' },
          { name: 'Decoration', total: 2, booked: 1, pending: 0, quoted: 1, color: '#10b981' },
          { name: 'Makeup', total: 2, booked: 1, pending: 1, quoted: 0, color: '#8b5cf6' },
          { name: 'Music', total: 2, booked: 1, pending: 1, quoted: 0, color: '#06b6d4' },
          { name: 'Others', total: 1, booked: 1, pending: 0, quoted: 0, color: '#ef4444' }
        ],
        bookingTimeline: [
          { month: 'Jan', booked: 1 },
          { month: 'Feb', booked: 2 },
          { month: 'Mar', booked: 3 },
          { month: 'Apr', booked: 5 },
          { month: 'Current', booked: 6 }
        ],
        recentActivity: [
          { vendor: 'Royal Photography', action: 'Booked', date: '2 days ago', status: 'confirmed' },
          { vendor: 'Elite Catering', action: 'Quote Received', date: '5 days ago', status: 'pending' },
          { vendor: 'Dream Decorators', action: 'Meeting Scheduled', date: '1 week ago', status: 'pending' },
          { vendor: 'Glamour Makeup', action: 'Booked', date: '2 weeks ago', status: 'confirmed' }
        ],
        budgetAllocation: [
          { category: 'Photography', allocated: 75000, spent: 50000 },
          { category: 'Catering', allocated: 100000, spent: 80000 },
          { category: 'Decoration', allocated: 60000, spent: 45000 },
          { category: 'Makeup', allocated: 25000, spent: 20000 },
          { category: 'Music', allocated: 30000, spent: 25000 },
          { category: 'Others', allocated: 20000, spent: 15000 }
        ]
      };
      setVendorData(mockData);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    navigate('/user/planning-dashboard');
  };

  const getPercentage = (value, total) => ((value / total) * 100).toFixed(1);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="px-4 py-6">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mr-3"></div>
            <div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="w-24 h-4 bg-gray-200 rounded mb-4"></div>
                <div className="w-full h-48 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="text-center px-4">
          <Icon name="compare" size="xl" style={{ color: theme.colors.primary[300] }} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
            No Vendor Data
          </h2>
          <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
            Start booking vendors to see management analytics
          </p>
          <button
            onClick={() => navigate('/user/vendors')}
            className="px-6 py-3 rounded-lg font-medium"
            style={{ backgroundColor: theme.colors.primary[500], color: 'white' }}
          >
            Browse Vendors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.semantic.text.primary }}>
              Vendor Management
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
              Track and manage your wedding vendors
            </p>
          </div>
        </div>

        {/* Vendor Overview */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
            <p className="text-xs font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>Total</p>
            <p className="text-lg font-bold" style={{ color: theme.colors.primary[600] }}>
              {vendorData.totalVendors}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
            <p className="text-xs font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>Booked</p>
            <p className="text-lg font-bold" style={{ color: theme.colors.accent[600] }}>
              {vendorData.bookedVendors}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
            <p className="text-xs font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>Pending</p>
            <p className="text-lg font-bold" style={{ color: theme.colors.secondary[600] }}>
              {vendorData.pendingVendors}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
            <p className="text-xs font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>Quoted</p>
            <p className="text-lg font-bold" style={{ color: theme.colors.neutral[500] }}>
              {vendorData.quotedVendors}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="px-4 space-y-6">
        {/* Vendor Status Distribution */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Booking Status Overview
          </h3>
          
          <div className="relative mb-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="h-4 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${getPercentage(vendorData.bookedVendors, vendorData.totalVendors)}%`,
                  background: `linear-gradient(135deg, ${theme.colors.accent[400]} 0%, ${theme.colors.accent[600]} 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span style={{ color: theme.semantic.text.secondary }}>
                {getPercentage(vendorData.bookedVendors, vendorData.totalVendors)}% Booked
              </span>
              <span style={{ color: theme.semantic.text.secondary }}>
                {vendorData.bookedVendors} of {vendorData.totalVendors} vendors
              </span>
            </div>
          </div>

          {/* Status Legend */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.accent[500] }}></div>
              <div>
                <p className="text-xs font-medium" style={{ color: theme.semantic.text.primary }}>Booked</p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  {vendorData.bookedVendors} vendors
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.secondary[500] }}></div>
              <div>
                <p className="text-xs font-medium" style={{ color: theme.semantic.text.primary }}>Pending</p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  {vendorData.pendingVendors} vendors
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.neutral[400] }}></div>
              <div>
                <p className="text-xs font-medium" style={{ color: theme.semantic.text.primary }}>Quoted</p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  {vendorData.quotedVendors} vendors
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Vendor Categories
          </h3>
          <div className="space-y-4">
            {vendorData.categories.map((category, index) => (
              <div key={category.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                      {category.name}
                    </span>
                  </div>
                  <span className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                    {category.booked}/{category.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${getPercentage(category.booked, category.total)}%`,
                      backgroundColor: category.color,
                      animationDelay: `${index * 200}ms`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs" style={{ color: theme.semantic.text.secondary }}>
                  <span>Booked: {category.booked}</span>
                  <span>Pending: {category.pending}</span>
                  <span>Quoted: {category.quoted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Timeline */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Booking Timeline
          </h3>
          <div className="space-y-3">
            {vendorData.bookingTimeline.map((month, index) => (
              <div key={month.month} className="flex items-center space-x-4">
                <div className="w-16 text-xs font-medium" style={{ color: theme.semantic.text.secondary }}>
                  {month.month}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${(month.booked / vendorData.totalVendors) * 100}%`,
                        backgroundColor: theme.colors.primary[500],
                        animationDelay: `${index * 200}ms`
                      }}
                    />
                  </div>
                </div>
                <div className="w-8 text-xs font-bold text-right" style={{ color: theme.semantic.text.primary }}>
                  {month.booked}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget vs Spending */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Budget Allocation
          </h3>
          <div className="space-y-4">
            {vendorData.budgetAllocation.map((item, index) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                    {item.category}
                  </span>
                  <span className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                    ₹{item.spent.toLocaleString()} / ₹{item.allocated.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${getPercentage(item.spent, item.allocated)}%`,
                      backgroundColor: vendorData.categories.find(cat => cat.name === item.category)?.color || theme.colors.primary[500],
                      animationDelay: `${index * 200}ms`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {vendorData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.semantic.background.secondary }}>
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      activity.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                      {activity.vendor}
                    </p>
                    <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                      {activity.action} • {activity.date}
                    </p>
                  </div>
                </div>
                <span 
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    activity.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Management Insights */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Management Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.accent[50] }}>
              <Icon name="compare" size="sm" style={{ color: theme.colors.accent[500] }} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                  Booking Progress: {getPercentage(vendorData.bookedVendors, vendorData.totalVendors)}%
                </p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  You've booked {vendorData.bookedVendors} out of {vendorData.totalVendors} planned vendors.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.secondary[50] }}>
              <Icon name="star" size="sm" style={{ color: theme.colors.secondary[500] }} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                  Vendor Tip
                </p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  Follow up with pending vendors within 48 hours to secure bookings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default VendorManagement;