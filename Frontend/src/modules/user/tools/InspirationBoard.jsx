import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';

const InspirationBoard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [inspirationData, setInspirationData] = useState(null);

  // Simulate loading and fetch inspiration data
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mock inspiration data - in real app, this would come from API/localStorage
      const mockData = {
        totalSaved: 47,
        categories: [
          { name: 'Decor Ideas', count: 15, color: '#ec4899' },
          { name: 'Bridal Looks', count: 12, color: '#f59e0b' },
          { name: 'Venue Styles', count: 8, color: '#10b981' },
          { name: 'Photography', count: 7, color: '#8b5cf6' },
          { name: 'Outfits', count: 5, color: '#06b6d4' }
        ],
        recentActivity: [
          { action: 'Saved', item: 'Mandap Decoration', category: 'Decor Ideas', time: '2 hours ago' },
          { action: 'Liked', item: 'Bridal Mehendi Look', category: 'Bridal Looks', time: '5 hours ago' },
          { action: 'Saved', item: 'Garden Wedding Setup', category: 'Venue Styles', time: '1 day ago' },
          { action: 'Saved', item: 'Pre-wedding Shoot', category: 'Photography', time: '2 days ago' }
        ],
        monthlyStats: [
          { month: 'Jan', saved: 8 },
          { month: 'Feb', saved: 12 },
          { month: 'Mar', saved: 15 },
          { month: 'Apr', saved: 12 }
        ]
      };
      setInspirationData(mockData);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    navigate('/user/planning-dashboard');
  };

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
          
          {/* Loading skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="w-24 h-4 bg-gray-200 rounded mb-4"></div>
                <div className="w-full h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!inspirationData) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="text-center px-4">
          <Icon name="heart" size="xl" style={{ color: theme.colors.primary[300] }} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
            No Inspiration Saved
          </h2>
          <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
            Start saving wedding ideas to see your inspiration analytics
          </p>
          <button
            onClick={() => navigate('/user/vendors')}
            className="px-6 py-3 rounded-lg font-medium"
            style={{ backgroundColor: theme.colors.primary[500], color: 'white' }}
          >
            Browse Ideas
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
              Inspiration Board
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
              Your saved wedding ideas and inspiration
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="bg-white rounded-xl p-4 mb-6" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <div className="text-center">
            <p className="text-3xl font-bold mb-1" style={{ color: theme.colors.primary[600] }}>
              {inspirationData.totalSaved}
            </p>
            <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
              Total Ideas Saved
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="px-4 space-y-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Ideas by Category
          </h3>
          <div className="space-y-4">
            {inspirationData.categories.map((category, index) => (
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
                  <span className="text-sm font-bold" style={{ color: theme.semantic.text.secondary }}>
                    {category.count}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${(category.count / inspirationData.totalSaved * 100)}%`,
                      backgroundColor: category.color,
                      animationDelay: `${index * 200}ms`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Activity Chart */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Monthly Activity
          </h3>
          <div className="flex items-end justify-between space-x-2 h-32">
            {inspirationData.monthlyStats.map((stat, index) => (
              <div key={stat.month} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full rounded-t-lg transition-all duration-1000 ease-out"
                  style={{ 
                    height: `${(stat.saved / 15) * 100}%`,
                    backgroundColor: theme.colors.primary[400],
                    minHeight: '8px',
                    animationDelay: `${index * 300}ms`
                  }}
                />
                <p className="text-xs mt-2 font-medium" style={{ color: theme.semantic.text.secondary }}>
                  {stat.month}
                </p>
                <p className="text-xs font-bold" style={{ color: theme.semantic.text.primary }}>
                  {stat.saved}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown Pie Chart Visual */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Category Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {inspirationData.categories.map((category) => (
              <div key={category.name} className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: `${category.color}10` }}>
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: theme.semantic.text.primary }}>
                    {category.name}
                  </p>
                  <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                    {((category.count / inspirationData.totalSaved) * 100).toFixed(1)}%
                  </p>
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
            {inspirationData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.semantic.background.secondary }}>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.colors.primary[100] }}
                >
                  <Icon 
                    name={activity.action === 'Saved' ? 'bookmark' : 'heart'} 
                    size="sm" 
                    style={{ color: theme.colors.primary[500] }} 
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                    {activity.action} "{activity.item}"
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ 
                      backgroundColor: theme.colors.primary[100], 
                      color: theme.colors.primary[700] 
                    }}>
                      {activity.category}
                    </span>
                    <span className="text-xs" style={{ color: theme.semantic.text.tertiary }}>
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inspiration Insights */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Inspiration Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.accent[50] }}>
              <Icon name="star" size="sm" style={{ color: theme.colors.accent[500] }} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                  Most Popular Category
                </p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  {inspirationData.categories[0].name} with {inspirationData.categories[0].count} saved ideas
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.secondary[50] }}>
              <Icon name="heart" size="sm" style={{ color: theme.colors.secondary[500] }} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                  Great Collection!
                </p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  You've saved {inspirationData.totalSaved} ideas across {inspirationData.categories.length} categories
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

export default InspirationBoard;