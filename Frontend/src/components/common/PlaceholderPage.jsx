import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import Icon from '../ui/Icon';
import Button from '../ui/Button';

const PlaceholderPage = ({ 
  title, 
  description, 
  icon = 'lightbulb',
  comingSoon = true 
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Wedding-related images for different page types
  const getPageImage = (title) => {
    const imageMap = {
      'My Bookings': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80',
      'Shortlisted Vendors': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=400&fit=crop&q=80',
      'Favourite Vendors': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=400&fit=crop&q=80',
      'Budget Planner': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop&q=80',
      'Wedding Checklist': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=400&fit=crop&q=80',
      'Guest List Manager': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop&q=80',
      'Wedding Timeline': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80',
      'Vendor Comparison': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=400&fit=crop&q=80',
      'Digital E-Invites': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=400&fit=crop&q=80',
      'Saved Inspirations': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80',
      'Hire Wedding Planner': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop&q=80',
      'Destination Wedding': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=400&fit=crop&q=80',
      'Decor Consultation': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=400&fit=crop&q=80',
      'Makeup Trial Booking': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80',
      'Pre-Wedding Shoot': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop&q=80',
      'Help & Support': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=400&fit=crop&q=80',
      'Frequently Asked Questions': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=400&fit=crop&q=80',
      'Contact Support': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80',
      'Notification Settings': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop&q=80',
      'Language Settings': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=400&fit=crop&q=80',
      'Privacy & Terms': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=400&fit=crop&q=80'
    };
    return imageMap[title] || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="px-4 py-4 border-b"
        style={{ 
          backgroundColor: theme.semantic.background.primary,
          borderBottomColor: theme.semantic.border.light
        }}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <h1 
            className="text-xl font-bold"
            style={{ color: theme.semantic.text.primary }}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        <img
          src={getPageImage(title)}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <div 
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.primary[100] }}
          >
            <Icon name={icon} size="lg" style={{ color: theme.colors.primary[600] }} />
          </div>
          
          {comingSoon && (
            <div 
              className="inline-flex items-center px-4 py-2 rounded-full mb-4"
              style={{ 
                backgroundColor: theme.colors.primary[100],
                color: theme.colors.primary[700]
              }}
            >
              <Icon name="clock" size="sm" className="mr-2" />
              <span className="text-sm font-medium">Coming Soon</span>
            </div>
          )}
          
          <p 
            className="text-sm mb-8 leading-relaxed"
            style={{ color: theme.semantic.text.secondary }}
          >
            {description}
          </p>
          
          <div className="space-y-4">
            <Button 
              variant="primary" 
              onClick={() => navigate('/user/home')}
              className="w-full"
            >
              Back to Home
            </Button>
            
            {comingSoon && (
              <p 
                className="text-xs"
                style={{ color: theme.semantic.text.tertiary }}
              >
                We're working hard to bring you this feature. Stay tuned!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 md:h-8"></div>
    </div>
  );
};

export default PlaceholderPage;