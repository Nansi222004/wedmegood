import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';

const WeddingTimeline = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState(null);

  // Simulate loading and fetch timeline data
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mock timeline data
      const weddingDate = new Date('2024-12-15');
      const today = new Date();
      const daysRemaining = Math.ceil((weddingDate - today) / (1000 * 60 * 60 * 24));
      
      const mockData = {
        weddingDate: weddingDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        daysRemaining: Math.max(0, daysRemaining),
        totalPlanningDays: 365,
        milestones: [
          { 
            title: '12 Months Before', 
            tasks: ['Set budget', 'Book venue', 'Create guest list'], 
            completed: 3, 
            total: 3,
            color: '#10b981'
          },
          { 
            title: '9 Months Before', 
            tasks: ['Book photographer', 'Order invitations', 'Book caterer'], 
            completed: 2, 
            total: 3,
            color: '#f59e0b'
          },
          { 
            title: '6 Months Before', 
            tasks: ['Book makeup artist', 'Order wedding cake', 'Plan honeymoon'], 
            completed: 1, 
            total: 3,
            color: '#8b5cf6'
          },
          { 
            title: '3 Months Before', 
            tasks: ['Final dress fitting', 'Confirm vendors', 'Send invitations'], 
            completed: 0, 
            total: 3,
            color: '#ec4899'
          },
          { 
            title: '1 Month Before', 
            tasks: ['Final headcount', 'Rehearsal dinner', 'Pack for honeymoon'], 
            completed: 0, 
            total: 3,
            color: '#06b6d4'
          },
          { 
            title: 'Wedding Week', 
            tasks: ['Confirm timeline', 'Relax and enjoy', 'Get married!'], 
            completed: 0, 
            total: 3,
            color: '#ef4444'
          }
        ],
        upcomingEvents: [
          { event: 'Venue visit', date: '2024-03-15', daysUntil: 10 },
          { event: 'Cake tasting', date: '2024-03-20', daysUntil: 15 },
          { event: 'Dress fitting', date: '2024-04-01', daysUntil: 27 },
          { event: 'Photography session', date: '2024-04-15', daysUntil: 41 }
        ]
      };
      setTimelineData(mockData);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    navigate('/user/planning-dashboard');
  };

  const getPercentage = (completed, total) => ((completed / total) * 100).toFixed(1);

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

  if (!timelineData) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="text-center px-4">
          <Icon name="clock" size="xl" style={{ color: theme.colors.primary[300] }} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
            No Timeline Data
          </h2>
          <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
            Set your wedding date to see timeline analytics
          </p>
          <button
            onClick={() => navigate('/user/wedding-form')}
            className="px-6 py-3 rounded-lg font-medium"
            style={{ backgroundColor: theme.colors.primary[500], color: 'white' }}
          >
            Set Wedding Date
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
              Wedding Timeline
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
              Track your wedding planning timeline
            </p>
          </div>
        </div>

        {/* Countdown Card */}
        <div 
          className="bg-white rounded-xl p-6 mb-6 text-center"
          style={{ 
            boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40`,
            background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.secondary[50]} 100%)`
          }}
        >
          <h2 className="text-3xl font-bold mb-2" style={{ color: theme.colors.primary[600] }}>
            {timelineData.daysRemaining}
          </h2>
          <p className="text-sm font-medium mb-1" style={{ color: theme.semantic.text.primary }}>
            Days Until Your Wedding
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            {timelineData.weddingDate}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="px-4 space-y-6">
        {/* Event Countdown Chart */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Planning Progress
          </h3>
          <div className="relative mb-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="h-4 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${100 - (timelineData.daysRemaining / timelineData.totalPlanningDays * 100)}%`,
                  background: `linear-gradient(135deg, ${theme.colors.primary[400]} 0%, ${theme.colors.primary[600]} 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span style={{ color: theme.semantic.text.secondary }}>
                Planning Started
              </span>
              <span style={{ color: theme.semantic.text.secondary }}>
                Wedding Day
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
              {Math.round(100 - (timelineData.daysRemaining / timelineData.totalPlanningDays * 100))}% of planning time completed
            </p>
          </div>
        </div>

        {/* Timeline Milestones */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Planning Milestones
          </h3>
          <div className="space-y-4">
            {timelineData.milestones.map((milestone, index) => (
              <div key={milestone.title} className="relative">
                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                      style={{ 
                        backgroundColor: milestone.completed === milestone.total ? milestone.color : 'white',
                        borderColor: milestone.color
                      }}
                    />
                    {index < timelineData.milestones.length - 1 && (
                      <div 
                        className="w-0.5 h-12 mt-2"
                        style={{ backgroundColor: theme.colors.neutral[200] }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                        {milestone.title}
                      </h4>
                      <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                        {milestone.completed}/{milestone.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                      <div 
                        className="h-1.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${getPercentage(milestone.completed, milestone.total)}%`,
                          backgroundColor: milestone.color,
                          animationDelay: `${index * 200}ms`
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      {milestone.tasks.slice(0, 2).map((task, taskIndex) => (
                        <p key={taskIndex} className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                          • {task}
                        </p>
                      ))}
                      {milestone.tasks.length > 2 && (
                        <p className="text-xs" style={{ color: theme.semantic.text.tertiary }}>
                          +{milestone.tasks.length - 2} more tasks
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Upcoming Events
          </h3>
          <div className="space-y-3">
            {timelineData.upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.semantic.background.secondary }}>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.primary[500] }}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                      {event.event}
                    </p>
                    <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: theme.colors.primary[600] }}>
                    {event.daysUntil}
                  </p>
                  <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                    days
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Insights */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Timeline Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.accent[50] }}>
              <Icon name="clock" size="sm" style={{ color: theme.colors.accent[500] }} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                  On Track!
                </p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  You have {timelineData.daysRemaining} days remaining for planning.
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
                  Focus on booking major vendors first, then move to smaller details.
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

export default WeddingTimeline;