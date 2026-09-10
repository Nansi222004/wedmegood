import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';

const GuestList = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [guestData, setGuestData] = useState(null);

  // Simulate loading and fetch guest data
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mock guest data
      const mockData = {
        totalInvited: 150,
        confirmed: 85,
        pending: 45,
        declined: 20,
        categories: [
          { name: 'Family', invited: 60, confirmed: 45, pending: 10, declined: 5, color: '#ec4899' },
          { name: 'Friends', invited: 50, confirmed: 25, pending: 20, declined: 5, color: '#f59e0b' },
          { name: 'Colleagues', invited: 25, confirmed: 10, pending: 10, declined: 5, color: '#10b981' },
          { name: 'Others', invited: 15, confirmed: 5, pending: 5, declined: 5, color: '#8b5cf6' }
        ],
        rsvpTrend: [
          { week: 'Week 1', confirmed: 15, pending: 135 },
          { week: 'Week 2', confirmed: 35, pending: 115 },
          { week: 'Week 3', confirmed: 55, pending: 95 },
          { week: 'Week 4', confirmed: 75, pending: 75 },
          { week: 'Current', confirmed: 85, pending: 65 }
        ],
        recentRSVPs: [
          { name: 'John & Sarah Smith', status: 'confirmed', date: '2 days ago' },
          { name: 'Mike Johnson', status: 'confirmed', date: '3 days ago' },
          { name: 'Lisa Brown', status: 'declined', date: '5 days ago' },
          { name: 'David Wilson', status: 'confirmed', date: '1 week ago' }
        ]
      };
      setGuestData(mockData);
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

  if (!guestData) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="text-center px-4">
          <Icon name="users" size="xl" style={{ color: theme.colors.accent[300] }} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
            No Guest Data
          </h2>
          <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
            Start creating your guest list to see analytics
          </p>
          <button
            onClick={() => navigate('/user/wedding-form')}
            className="px-6 py-3 rounded-lg font-medium"
            style={{ backgroundColor: theme.colors.accent[500], color: 'white' }}
          >
            Create Guest List
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
              Guest List
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
              Manage your wedding guest list and RSVPs
            </p>
          </div>
        </div>

        {/* Guest Overview */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
            <p className="text-xs font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>Invited</p>
            <p className="text-lg font-bold" style={{ color: theme.colors.primary[600] }}>
              {guestData.totalInvited}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
            <p className="text-xs font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>Confirmed</p>
            <p className="text-lg font-bold" style={{ color: theme.colors.accent[600] }}>
              {guestData.confirmed}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
            <p className="text-xs font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>Pending</p>
            <p className="text-lg font-bold" style={{ color: theme.colors.secondary[600] }}>
              {guestData.pending}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
            <p className="text-xs font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>Declined</p>
            <p className="text-lg font-bold" style={{ color: theme.colors.neutral[500] }}>
              {guestData.declined}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="px-4 space-y-6">
        {/* RSVP Status Pie Chart */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            RSVP Status Overview
          </h3>
          
          {/* Visual Pie Chart Representation */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <div 
                className="w-32 h-32 rounded-full"
                style={{ 
                  background: `conic-gradient(
                    ${theme.colors.accent[500]} 0deg ${(guestData.confirmed / guestData.totalInvited) * 360}deg,
                    ${theme.colors.secondary[500]} ${(guestData.confirmed / guestData.totalInvited) * 360}deg ${((guestData.confirmed + guestData.pending) / guestData.totalInvited) * 360}deg,
                    ${theme.colors.neutral[400]} ${((guestData.confirmed + guestData.pending) / guestData.totalInvited) * 360}deg 360deg
                  )`
                }}
              >
                <div 
                  className="absolute inset-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.semantic.background.primary }}
                >
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
                      {guestData.totalInvited}
                    </p>
                    <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                      Total
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.accent[500] }}></div>
              <div>
                <p className="text-xs font-medium" style={{ color: theme.semantic.text.primary }}>Confirmed</p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  {getPercentage(guestData.confirmed, guestData.totalInvited)}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.secondary[500] }}></div>
              <div>
                <p className="text-xs font-medium" style={{ color: theme.semantic.text.primary }}>Pending</p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  {getPercentage(guestData.pending, guestData.totalInvited)}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.neutral[400] }}></div>
              <div>
                <p className="text-xs font-medium" style={{ color: theme.semantic.text.primary }}>Declined</p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  {getPercentage(guestData.declined, guestData.totalInvited)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Category Breakdown */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Guest Categories
          </h3>
          <div className="space-y-4">
            {guestData.categories.map((category, index) => (
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
                    {category.confirmed}/{category.invited}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${getPercentage(category.confirmed, category.invited)}%`,
                      backgroundColor: category.color,
                      animationDelay: `${index * 200}ms`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs" style={{ color: theme.semantic.text.secondary }}>
                  <span>Confirmed: {category.confirmed}</span>
                  <span>Pending: {category.pending}</span>
                  <span>Declined: {category.declined}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RSVP Trend */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            RSVP Response Trend
          </h3>
          <div className="space-y-3">
            {guestData.rsvpTrend.map((week, index) => (
              <div key={week.week} className="flex items-center space-x-4">
                <div className="w-16 text-xs font-medium" style={{ color: theme.semantic.text.secondary }}>
                  {week.week}
                </div>
                <div className="flex-1 flex space-x-1">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${(week.confirmed / guestData.totalInvited) * 100}%`,
                          backgroundColor: theme.colors.accent[500],
                          animationDelay: `${index * 200}ms`
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="w-12 text-xs font-bold text-right" style={{ color: theme.semantic.text.primary }}>
                  {week.confirmed}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent RSVPs */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Recent RSVPs
          </h3>
          <div className="space-y-3">
            {guestData.recentRSVPs.map((rsvp, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.semantic.background.secondary }}>
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      rsvp.status === 'confirmed' ? 'bg-green-500' : 
                      rsvp.status === 'declined' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                      {rsvp.name}
                    </p>
                    <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                      {rsvp.date}
                    </p>
                  </div>
                </div>
                <span 
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    rsvp.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                    rsvp.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {rsvp.status.charAt(0).toUpperCase() + rsvp.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Guest List Insights */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Guest List Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.accent[50] }}>
              <Icon name="users" size="sm" style={{ color: theme.colors.accent[500] }} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                  Response Rate: {getPercentage(guestData.confirmed + guestData.declined, guestData.totalInvited)}%
                </p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  {guestData.confirmed + guestData.declined} out of {guestData.totalInvited} guests have responded.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.secondary[50] }}>
              <Icon name="star" size="sm" style={{ color: theme.colors.secondary[500] }} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                  Planning Tip
                </p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  Follow up with pending guests 2-3 weeks before the wedding.
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

export default GuestList;