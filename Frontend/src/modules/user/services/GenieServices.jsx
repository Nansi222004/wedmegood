import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useToast } from '../../../components/ui/Toast';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';

const GenieServices = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  
  const [selectedService, setSelectedService] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Genie services data
  const genieServices = [
    {
      id: 1,
      title: 'Wedding Planning Assistance',
      icon: 'calendar',
      description: 'Get help with complete wedding planning from our experienced team. We assist you in vendor selection, budget planning, and timeline management.',
      features: ['Vendor recommendations', 'Budget planning', 'Timeline management', 'Coordination support'],
      price: '₹15,000',
      popular: true,
      color: theme.colors.secondary[500]
    },
    {
      id: 2,
      title: 'Vendor Coordination',
      icon: 'users',
      description: 'Let us handle all vendor communications and coordination. We ensure smooth collaboration between all your wedding vendors.',
      features: ['Vendor communication', 'Meeting coordination', 'Contract management', 'Payment tracking'],
      price: '₹10,000',
      popular: true,
      color: theme.colors.accent[500]
    },
    {
      id: 3,
      title: 'Day-of Coordination',
      icon: 'clock',
      description: 'Professional coordination on your wedding day to ensure everything runs smoothly. Focus on enjoying your day while we handle the logistics.',
      features: ['Timeline execution', 'Vendor management', 'Problem solving', 'Guest assistance'],
      price: '₹20,000',
      popular: true,
      color: theme.colors.primary[500]
    },
    {
      id: 4,
      title: 'Budget Management',
      icon: 'money',
      description: 'Professional help with wedding budget planning and expense tracking. Get guidance on smart spending and cost optimization.',
      features: ['Budget creation', 'Expense tracking', 'Cost optimization', 'Payment schedules'],
      price: '₹8,000',
      popular: false,
      color: theme.colors.secondary[600]
    },
    {
      id: 5,
      title: 'Venue Selection Help',
      icon: 'location',
      description: 'Expert assistance in finding and booking the perfect venue for your wedding. We help you compare options and negotiate prices.',
      features: ['Venue research', 'Site visits', 'Price negotiation', 'Booking assistance'],
      price: '₹12,000',
      popular: false,
      color: theme.colors.accent[600]
    },
    {
      id: 6,
      title: 'Guest Management',
      icon: 'user',
      description: 'Complete guest list management including RSVP tracking, seating arrangements, and guest communication.',
      features: ['Guest list management', 'RSVP tracking', 'Seating arrangements', 'Communication'],
      price: '₹7,000',
      popular: false,
      color: theme.colors.primary[600]
    }
  ];

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    showToast('This service will be available soon! Our team is working on it.', 'info', 3000);
  };

  const handleRequestService = () => {
    showToast('Thank you for your interest! We will notify you when this service is available.', 'success', 3000);
    setShowRequestForm(false);
    setSelectedService(null);
  };

  return (
    <div 
      className="min-h-screen pb-24"
      style={{ backgroundColor: theme.semantic.background.primary }}
    >
      <div className="px-3 sm:px-4 py-3 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
            style={{ 
              color: theme.semantic.text.secondary,
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.semantic.background.accent}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Icon name="chevronLeft" size="sm" />
            <span className="hidden xs:inline">Back</span>
          </button>
          
          <h1 
            className="text-base sm:text-lg font-bold text-center flex-1 mx-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Genie Services
          </h1>
          
          <div className="w-12 sm:w-16"></div>
        </div>

        {/* Hero Banner */}
        <div 
          className="mb-6 p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.secondary[500]} 0%, ${theme.colors.accent[500]} 100%)`,
            boxShadow: `0 8px 24px ${theme.colors.secondary[500]}40`
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="user" size="lg" style={{ color: 'white' }} />
              <span className="text-white text-xs font-semibold px-2 py-1 bg-white/20 rounded-full">
                Professional Services
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Wedding Planning Services
            </h2>
            <p className="text-white/90 text-sm">
              Professional assistance for your perfect wedding
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-8">
          <h2 
            className="text-lg font-bold mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            How Our Services Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div 
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: theme.colors.secondary[100] }}
              >
                <span className="text-xl font-bold" style={{ color: theme.colors.secondary[600] }}>1</span>
              </div>
              <h3 className="font-semibold mb-2" style={{ color: theme.semantic.text.primary }}>
                Select Service
              </h3>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                Choose the service you need for your wedding
              </p>
            </Card>
            
            <Card className="p-4 text-center">
              <div 
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: theme.colors.accent[100] }}
              >
                <span className="text-xl font-bold" style={{ color: theme.colors.accent[600] }}>2</span>
              </div>
              <h3 className="font-semibold mb-2" style={{ color: theme.semantic.text.primary }}>
                Submit Request
              </h3>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                Fill in your wedding details and requirements
              </p>
            </Card>
            
            <Card className="p-4 text-center">
              <div 
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: theme.colors.primary[100] }}
              >
                <span className="text-xl font-bold" style={{ color: theme.colors.primary[600] }}>3</span>
              </div>
              <h3 className="font-semibold mb-2" style={{ color: theme.semantic.text.primary }}>
                Get Expert Help
              </h3>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                Our team will contact you and provide assistance
              </p>
            </Card>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-8">
          <h2 
            className="text-lg font-bold mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Available Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {genieServices.map((service) => (
              <Card 
                key={service.id}
                className="p-5 hover:shadow-xl transition-all cursor-pointer relative"
                onClick={() => handleServiceSelect(service)}
              >
                {/* Coming Soon Badge */}
                <div 
                  className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    color: 'white'
                  }}
                >
                  Coming Soon
                </div>
                
                {service.popular && (
                  <div 
                    className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: theme.colors.accent[500],
                      color: 'white'
                    }}
                  >
                    Popular
                  </div>
                )}
                
                <div 
                  className="w-14 h-14 rounded-full mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${service.color}20` }}
                >
                  <Icon name={service.icon} size="xl" style={{ color: service.color }} />
                </div>
                
                <h3 
                  className="text-lg font-bold mb-2"
                  style={{ color: theme.semantic.text.primary }}
                >
                  {service.title}
                </h3>
                
                <p 
                  className="text-sm mb-4 line-clamp-2"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  {service.description}
                </p>
                
                <div className="mb-4">
                  {service.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                      <Icon name="check" size="xs" style={{ color: theme.colors.accent[500] }} />
                      <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                  {service.features.length > 3 && (
                    <p className="text-xs mt-1" style={{ color: theme.semantic.text.secondary }}>
                      +{service.features.length - 3} more features
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: theme.semantic.border.light }}>
                  <div>
                    <span 
                      className="text-lg font-bold block"
                      style={{ color: service.price === 'Free' ? theme.colors.accent[600] : theme.colors.secondary[600] }}
                    >
                      {service.price}
                    </span>
                    <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                      (Coming Soon)
                    </span>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Notify Me
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Request Form Modal */}
        {showRequestForm && selectedService && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowRequestForm(false)}
          >
            <Card 
              className="max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
                  Request {selectedService.title}
                </h3>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <Icon name="close" size="sm" style={{ color: theme.semantic.text.secondary }} />
                </button>
              </div>
              
              <p className="text-sm mb-4" style={{ color: theme.semantic.text.secondary }}>
                {selectedService.description}
              </p>
              
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme.colors.secondary[50] }}>
                <p className="text-sm font-semibold mb-2" style={{ color: theme.semantic.text.primary }}>
                  Includes:
                </p>
                {selectedService.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <Icon name="check" size="xs" style={{ color: theme.colors.accent[500] }} />
                    <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between mb-4 p-3 rounded" style={{ backgroundColor: theme.semantic.background.secondary }}>
                <span className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                  Service Fee:
                </span>
                <span className="text-xl font-bold" style={{ color: theme.colors.secondary[600] }}>
                  {selectedService.price}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowRequestForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestService}
                  variant="primary"
                  className="flex-1"
                >
                  Confirm Request
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Benefits Section */}
        <div className="mb-8">
          <h2 
            className="text-lg font-bold mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Why Choose Our Services?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.colors.accent[100] }}
              >
                <Icon name="clock" size="sm" style={{ color: theme.colors.accent[600] }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: theme.semantic.text.primary }}>
                  Save Time
                </h3>
                <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                  Let our experts handle the planning while you enjoy your journey
                </p>
              </div>
            </Card>
            
            <Card className="p-4 flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.colors.secondary[100] }}
              >
                <Icon name="money" size="sm" style={{ color: theme.colors.secondary[600] }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: theme.semantic.text.primary }}>
                  Budget Friendly
                </h3>
                <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                  Get professional help at affordable prices
                </p>
              </div>
            </Card>
            
            <Card className="p-4 flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.colors.primary[100] }}
              >
                <Icon name="shield" size="sm" style={{ color: theme.colors.primary[600] }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: theme.semantic.text.primary }}>
                  Trusted Vendors
                </h3>
                <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                  Work with verified and reliable wedding vendors
                </p>
              </div>
            </Card>
            
            <Card className="p-4 flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.colors.accent[100] }}
              >
                <Icon name="star" size="sm" style={{ color: theme.colors.accent[600] }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: theme.semantic.text.primary }}>
                  Experienced Team
                </h3>
                <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                  Get guidance from experienced wedding planners
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <Card 
          className="p-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.secondary[50]} 100%)`
          }}
        >
          <Icon 
            name="phone" 
            size="2xl" 
            className="mx-auto mb-3"
            style={{ color: theme.colors.secondary[500] }} 
          />
          <h3 
            className="text-lg font-bold mb-2"
            style={{ color: theme.semantic.text.primary }}
          >
            Need Help with Your Wedding?
          </h3>
          <p 
            className="text-sm mb-4"
            style={{ color: theme.semantic.text.secondary }}
          >
            Contact our wedding planning team for personalized assistance
          </p>
          <button
            onClick={() => navigate('/user/help')}
            className="px-6 py-2.5 rounded-lg font-medium text-white"
            style={{ backgroundColor: theme.colors.secondary[500] }}
          >
            Contact Us
          </button>
        </Card>
      </div>
      
      {/* Toast Component */}
      <ToastComponent />
    </div>
  );
};

export default GenieServices;
