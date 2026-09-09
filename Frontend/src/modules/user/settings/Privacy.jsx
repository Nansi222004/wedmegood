import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const Privacy = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('privacy'); // privacy, terms, data

  const privacyContent = {
    lastUpdated: '15 January 2024',
    sections: [
      {
        title: 'Information We Collect',
        content: [
          'Personal information you provide when creating an account (name, email, phone number)',
          'Wedding details and preferences you share with us',
          'Communication with vendors through our platform',
          'Usage data and analytics to improve our services',
          'Location data to show relevant vendors in your area'
        ]
      },
      {
        title: 'How We Use Your Information',
        content: [
          'To provide and improve our wedding planning services',
          'To connect you with relevant vendors and services',
          'To send you important updates about your bookings',
          'To personalize your experience on our platform',
          'To ensure the security and integrity of our services'
        ]
      },
      {
        title: 'Information Sharing',
        content: [
          'We share your contact details with vendors only when you express interest',
          'We may share aggregated, non-personal data for analytics',
          'We do not sell your personal information to third parties',
          'We may disclose information if required by law or to protect our rights'
        ]
      },
      {
        title: 'Data Security',
        content: [
          'We use industry-standard encryption to protect your data',
          'Regular security audits and updates to our systems',
          'Secure payment processing through trusted partners',
          'Limited access to personal data on a need-to-know basis'
        ]
      },
      {
        title: 'Your Rights',
        content: [
          'Access and update your personal information anytime',
          'Request deletion of your account and associated data',
          'Opt-out of marketing communications',
          'Control your privacy settings and data sharing preferences'
        ]
      }
    ]
  };

  const termsContent = {
    lastUpdated: '15 January 2024',
    sections: [
      {
        title: 'Acceptance of Terms',
        content: [
          'By using our platform, you agree to these terms and conditions',
          'These terms may be updated from time to time',
          'Continued use constitutes acceptance of updated terms'
        ]
      },
      {
        title: 'Platform Usage',
        content: [
          'You must be at least 18 years old to use our services',
          'Provide accurate and complete information when registering',
          'Use the platform only for lawful wedding planning purposes',
          'Respect other users and vendors on the platform'
        ]
      },
      {
        title: 'Vendor Services',
        content: [
          'We facilitate connections between users and vendors',
          'We are not responsible for the quality of vendor services',
          'All agreements are directly between you and the vendor',
          'We may charge commission fees to vendors for successful bookings'
        ]
      },
      {
        title: 'Payment Terms',
        content: [
          'Platform fees are clearly disclosed before payment',
          'Refunds are subject to our refund policy',
          'You are responsible for all charges incurred on your account',
          'We use secure third-party payment processors'
        ]
      },
      {
        title: 'Limitation of Liability',
        content: [
          'We provide the platform "as is" without warranties',
          'We are not liable for vendor performance or service quality',
          'Our liability is limited to the amount paid for our services',
          'We are not responsible for any indirect or consequential damages'
        ]
      }
    ]
  };

  const dataContent = {
    lastUpdated: '15 January 2024',
    sections: [
      {
        title: 'Data Collection',
        content: [
          'Account information (name, email, phone, wedding details)',
          'Usage analytics and platform interaction data',
          'Communication logs with vendors and support',
          'Payment and transaction history',
          'Device and browser information for security'
        ]
      },
      {
        title: 'Data Storage',
        content: [
          'Data is stored on secure cloud servers in India',
          'Regular backups ensure data availability',
          'Data retention periods vary by data type',
          'Inactive accounts may be archived after 2 years'
        ]
      },
      {
        title: 'Data Access',
        content: [
          'You can access your data through your account settings',
          'Request a copy of all your data in portable format',
          'Update or correct your information at any time',
          'Delete specific data or your entire account'
        ]
      },
      {
        title: 'Third-Party Sharing',
        content: [
          'Vendors receive only necessary contact information',
          'Payment processors handle transaction data securely',
          'Analytics providers receive anonymized usage data',
          'No data sharing for marketing purposes without consent'
        ]
      }
    ]
  };

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'privacy':
        return privacyContent;
      case 'terms':
        return termsContent;
      case 'data':
        return dataContent;
      default:
        return privacyContent;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'privacy':
        return 'Privacy Policy';
      case 'terms':
        return 'Terms of Service';
      case 'data':
        return 'Data Policy';
      default:
        return 'Privacy Policy';
    }
  };

  const currentContent = getCurrentContent();

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
              Terms & Privacy
            </h1>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Legal information and policies
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 rounded-lg mb-6" style={{ backgroundColor: theme.semantic.background.accent }}>
          {[
            { id: 'privacy', label: 'Privacy', icon: 'shield' },
            { id: 'terms', label: 'Terms', icon: 'book' },
            { id: 'data', label: 'Data', icon: 'settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                activeTab === tab.id ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? theme.semantic.background.primary : 'transparent',
                color: activeTab === tab.id ? theme.semantic.text.primary : theme.semantic.text.secondary
              }}
            >
              <Icon name={tab.icon} size="xs" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <Card>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
                {getTabTitle()}
              </h2>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                Last updated: {currentContent.lastUpdated}
              </p>
            </div>

            <div className="space-y-6">
              {currentContent.sections.map((section, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-base mb-3" style={{ color: theme.semantic.text.primary }}>
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-3">
                        <div 
                          className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: theme.colors.primary[500] }}
                        />
                        <p className="text-sm leading-relaxed" style={{ color: theme.semantic.text.secondary }}>
                          {item}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Contact Information */}
            <div className="mt-8 pt-6 border-t" style={{ borderTopColor: theme.semantic.border.light }}>
              <h3 className="font-semibold text-base mb-3" style={{ color: theme.semantic.text.primary }}>
                Contact Us
              </h3>
              <div className="space-y-2">
                <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                  If you have any questions about this {getTabTitle().toLowerCase()}, please contact us:
                </p>
                <div className="flex items-center space-x-2">
                  <Icon name="envelope" size="xs" style={{ color: theme.colors.primary[600] }} />
                  <span className="text-sm" style={{ color: theme.colors.primary[600] }}>
                    privacy@utsavo.com
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="phone" size="xs" style={{ color: theme.colors.primary[600] }} />
                  <span className="text-sm" style={{ color: theme.colors.primary[600] }}>
                    +91 98765 43210
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t space-y-3" style={{ borderTopColor: theme.semantic.border.light }}>
              <Button
                onClick={() => navigate('/user/account/contact')}
                className="w-full"
                variant="outline"
              >
                <Icon name="envelope" size="sm" className="mr-2" />
                Contact Support
              </Button>
              
              {activeTab === 'data' && (
                <Button
                  onClick={() => {
                    // Simulate data export
                    alert('Your data export request has been submitted. You will receive an email with your data within 24 hours.');
                  }}
                  className="w-full"
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    color: 'white'
                  }}
                >
                  <Icon name="download" size="sm" className="mr-2" />
                  Export My Data
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;