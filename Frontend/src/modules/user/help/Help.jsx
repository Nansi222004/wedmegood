import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useToast } from '../../../components/ui/Toast';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const Help = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const helpCategories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'booking', name: 'Booking', icon: 'calendar' },
    { id: 'payment', name: 'Payment', icon: 'creditCard' },
    { id: 'vendors', name: 'Vendors', icon: 'users' },
    { id: 'account', name: 'Account', icon: 'user' },
    { id: 'technical', name: 'Technical', icon: 'settings' }
  ];

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: 'phone',
      action: () => {
        showToast('Connecting to support...', 'info', 2000);
        // Implement actual contact functionality
      },
      color: theme.colors.primary[500]
    },
    {
      title: 'Live Chat',
      description: 'Chat with us in real-time',
      icon: 'chat',
      action: () => {
        showToast('Starting live chat...', 'info', 2000);
        // Implement live chat functionality
      },
      color: theme.colors.accent[500]
    },
    {
      title: 'Video Call',
      description: 'Schedule a video consultation',
      icon: 'video',
      action: () => {
        showToast('Scheduling video call...', 'info', 2000);
        // Implement video call scheduling
      },
      color: '#10b981'
    },
    {
      title: 'Email Support',
      description: 'Send us an email',
      icon: 'mail',
      action: () => {
        window.location.href = 'mailto:support@weddingapp.com';
      },
      color: '#f59e0b'
    }
  ];

  const faqs = [
    {
      id: 1,
      category: 'booking',
      question: 'How do I book a vendor?',
      answer: 'To book a vendor, browse through our vendor listings, select your preferred vendor, and click on "Book Now". You can then choose your preferred date, add any special requirements, and proceed with the booking process.'
    },
    {
      id: 2,
      category: 'booking',
      question: 'Can I cancel or modify my booking?',
      answer: 'Yes, you can cancel or modify your booking up to 48 hours before the event date. Go to "My Bookings" in your account, select the booking you want to modify, and choose the appropriate option. Cancellation policies may vary by vendor.'
    },
    {
      id: 3,
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, UPI payments, net banking, and digital wallets like Paytm, PhonePe, and Google Pay. You can also pay in installments for bookings above ₹50,000.'
    },
    {
      id: 4,
      category: 'payment',
      question: 'Is my payment information secure?',
      answer: 'Yes, absolutely. We use industry-standard SSL encryption and comply with PCI DSS standards to ensure your payment information is completely secure. We never store your card details on our servers.'
    },
    {
      id: 5,
      category: 'vendors',
      question: 'How are vendors verified?',
      answer: 'All our vendors go through a rigorous verification process including document verification, portfolio review, customer feedback analysis, and quality checks. We only onboard vendors who meet our high standards.'
    },
    {
      id: 6,
      category: 'vendors',
      question: 'What if I\'m not satisfied with a vendor\'s service?',
      answer: 'If you\'re not satisfied with a vendor\'s service, please contact our support team immediately. We have a resolution process in place and will work with both parties to find a satisfactory solution.'
    },
    {
      id: 7,
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to your Account settings, click on "Edit Profile", make the necessary changes, and save. You can update your personal information, contact details, wedding date, and preferences anytime.'
    },
    {
      id: 8,
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'On the login page, click "Forgot Password", enter your registered email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.'
    },
    {
      id: 9,
      category: 'technical',
      question: 'The app is running slowly. What should I do?',
      answer: 'Try clearing your browser cache, ensure you have a stable internet connection, and close other browser tabs. If the issue persists, try using a different browser or contact our technical support.'
    },
    {
      id: 10,
      category: 'technical',
      question: 'I\'m having trouble uploading photos. What should I do?',
      answer: 'Ensure your photos are in JPG, PNG, or WebP format and under 5MB each. Check your internet connection and try uploading one photo at a time. If issues persist, contact our support team.'
    }
  ];

  const helpfulResources = [
    {
      title: 'Wedding Planning Guide',
      description: 'Complete guide to planning your perfect wedding',
      icon: 'book',
      action: () => navigate('/user/planning-guide')
    },
    {
      title: 'Vendor Selection Tips',
      description: 'How to choose the right vendors for your wedding',
      icon: 'lightbulb',
      action: () => navigate('/user/vendor-tips')
    },
    {
      title: 'Budget Planning',
      description: 'Tips for managing your wedding budget effectively',
      icon: 'money',
      action: () => navigate('/user/tools/budget')
    },
    {
      title: 'Timeline Checklist',
      description: 'Month-by-month wedding planning timeline',
      icon: 'checkList',
      action: () => navigate('/user/tools/checklist')
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 py-4 border-b backdrop-blur-sm"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}95`,
          borderBottomColor: theme.semantic.border.light 
        }}
      >
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
              Help & Support
            </h1>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              We're here to help you plan your perfect wedding
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-4" style={{ color: theme.semantic.text.primary }}>
            Get Instant Help
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Card key={index} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                <div className="flex flex-col items-center text-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <Icon name={action.icon} size="md" style={{ color: action.color }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: theme.semantic.text.primary }}>
                    {action.title}
                  </h3>
                  <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                    {action.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Icon 
              name="search" 
              size="sm" 
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{ color: theme.semantic.text.secondary }}
            />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm"
              style={{
                backgroundColor: theme.semantic.background.accent,
                borderColor: theme.semantic.border.light,
                color: theme.semantic.text.primary
              }}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2">
            {helpCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === category.id ? 'shadow-md' : ''
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id 
                    ? theme.colors.primary[500] 
                    : theme.semantic.background.accent,
                  color: selectedCategory === category.id 
                    ? 'white' 
                    : theme.semantic.text.primary,
                  minWidth: 'fit-content'
                }}
              >
                <Icon name={category.icon} size="xs" />
                <span className="text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-4" style={{ color: theme.semantic.text.primary }}>
            Frequently Asked Questions
          </h2>
          
          {filteredFaqs.length === 0 ? (
            <Card className="p-6 text-center">
              <Icon name="search" size="lg" className="mx-auto mb-3" style={{ color: theme.semantic.text.secondary }} />
              <h3 className="font-semibold mb-2" style={{ color: theme.semantic.text.primary }}>
                No results found
              </h3>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                Try adjusting your search or category filter
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <Card key={faq.id} className="overflow-hidden">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-opacity-50 transition-colors"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <h3 className="font-medium text-sm pr-4" style={{ color: theme.semantic.text.primary }}>
                      {faq.question}
                    </h3>
                    <Icon 
                      name="chevronDown" 
                      size="sm" 
                      className={`transition-transform flex-shrink-0 ${expandedFaq === faq.id ? 'rotate-180' : ''}`}
                      style={{ color: theme.semantic.text.secondary }}
                    />
                  </button>
                  
                  {expandedFaq === faq.id && (
                    <div 
                      className="px-4 pb-4 border-t"
                      style={{ borderTopColor: theme.semantic.border.light }}
                    >
                      <p className="text-sm pt-3" style={{ color: theme.semantic.text.secondary }}>
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Helpful Resources */}
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-4" style={{ color: theme.semantic.text.primary }}>
            Helpful Resources
          </h2>
          <div className="space-y-3">
            {helpfulResources.map((resource, index) => (
              <Card key={index} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={resource.action}>
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-4"
                    style={{ backgroundColor: theme.semantic.background.accent }}
                  >
                    <Icon name={resource.icon} size="sm" style={{ color: theme.colors.primary[600] }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1" style={{ color: theme.semantic.text.primary }}>
                      {resource.title}
                    </h3>
                    <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                      {resource.description}
                    </p>
                  </div>
                  <Icon name="chevronDown" size="sm" className="-rotate-90" style={{ color: theme.semantic.text.tertiary }} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: theme.semantic.text.primary }}>
            Still Need Help?
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <Icon name="phone" size="sm" className="mr-3" style={{ color: theme.colors.primary[600] }} />
              <div>
                <p className="font-medium text-sm" style={{ color: theme.semantic.text.primary }}>
                  Call Us
                </p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  +91 98765 43210 (24/7 Support)
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Icon name="mail" size="sm" className="mr-3" style={{ color: theme.colors.primary[600] }} />
              <div>
                <p className="font-medium text-sm" style={{ color: theme.semantic.text.primary }}>
                  Email Us
                </p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  support@weddingapp.com
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Icon name="clock" size="sm" className="mr-3" style={{ color: theme.colors.primary[600] }} />
              <div>
                <p className="font-medium text-sm" style={{ color: theme.semantic.text.primary }}>
                  Support Hours
                </p>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  Monday - Sunday: 9:00 AM - 11:00 PM
                </p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => showToast('Opening contact form...', 'info', 2000)}
            className="w-full mt-6 py-3"
            style={{
              backgroundColor: theme.colors.primary[500],
              color: 'white'
            }}
          >
            <Icon name="chat" size="sm" className="mr-2" />
            Start Live Chat
          </Button>
        </Card>
      </div>
      
      {/* Toast Component */}
      <ToastComponent />
    </div>
  );
};

export default Help;