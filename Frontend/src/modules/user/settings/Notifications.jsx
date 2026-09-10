import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';

const Notifications = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState({
    // Push Notifications
    pushEnabled: true,
    bookingUpdates: true,
    vendorMessages: true,
    paymentReminders: true,
    weddingReminders: true,
    
    // Email Notifications
    emailEnabled: true,
    weeklyDigest: true,
    promotionalEmails: false,
    vendorRecommendations: true,
    
    // SMS Notifications
    smsEnabled: true,
    urgentUpdates: true,
    bookingConfirmations: true,
    
    // In-App Notifications
    inAppEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { showToast, ToastComponent } = useToast();

  // Load saved notification preferences
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleToggle = (key, label) => {
    const newValue = !settings[key];
    setSettings(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Show toast notification
    if (newValue) {
      showToast(`${label} enabled`, 'success', 2000);
    } else {
      showToast(`${label} disabled`, 'info', 2000);
    }

    // Auto-save after a short delay
    setTimeout(() => {
      const updatedSettings = { ...settings, [key]: newValue };
      localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
    }, 500);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      setMessage('Notification preferences saved successfully!');
      showToast('All notification preferences saved!', 'success');
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
      
    } catch (error) {
      setMessage('Failed to save notification preferences. Please try again.');
      showToast('Failed to save preferences', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const CheckboxButton = ({ enabled, onToggle, disabled = false }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`checkbox-button ${enabled ? 'enabled' : ''} ${disabled ? 'disabled' : ''}`}
      style={{
        '--primary-color': theme.colors.primary[500],
        '--primary-dark': theme.colors.primary[600],
        '--accent-color': theme.colors.accent[500],
        '--accent-dark': theme.colors.accent[600]
      }}
    >
      {enabled && (
        <Icon name="check" size="xs" style={{ color: 'white' }} />
      )}
    </button>
  );

  const NotificationSection = ({ title, description, children }) => (
    <Card className="mb-4">
      <div className="p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-base" style={{ color: theme.semantic.text.primary }}>
            {title}
          </h3>
          {description && (
            <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
              {description}
            </p>
          )}
        </div>
        <div className="space-y-2">
          {children}
        </div>
      </div>
    </Card>
  );

  const NotificationItem = ({ label, description, enabled, onToggle, disabled = false }) => (
    <div className={`notification-item flex items-center justify-between p-3 rounded-lg ${disabled ? 'disabled' : ''}`}>
      <div className="flex-1 pr-4">
        <p className="font-medium text-sm leading-tight" style={{ color: theme.semantic.text.primary }}>
          {label}
        </p>
        {description && (
          <p className="text-xs mt-1 leading-tight" style={{ color: theme.semantic.text.secondary }}>
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        <CheckboxButton 
          enabled={enabled} 
          onToggle={() => onToggle(label)} 
          disabled={disabled} 
        />
      </div>
    </div>
  );

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
              Notification Settings
            </h1>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Manage your notification preferences
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {message && (
          <div 
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('successfully') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Push Notifications */}
        <NotificationSection
          title="Push Notifications"
          description="Receive instant notifications on your device"
        >
          <NotificationItem
            label="Enable Push Notifications"
            description="Allow the app to send push notifications"
            enabled={settings.pushEnabled}
            onToggle={(label) => handleToggle('pushEnabled', label)}
          />
          
          <NotificationItem
            label="Booking Updates"
            description="Get notified about booking confirmations and changes"
            enabled={settings.bookingUpdates}
            onToggle={(label) => handleToggle('bookingUpdates', label)}
            disabled={!settings.pushEnabled}
          />
          
          <NotificationItem
            label="Vendor Messages"
            description="Receive notifications when vendors message you"
            enabled={settings.vendorMessages}
            onToggle={(label) => handleToggle('vendorMessages', label)}
            disabled={!settings.pushEnabled}
          />
          
          <NotificationItem
            label="Payment Reminders"
            description="Get reminded about upcoming payments"
            enabled={settings.paymentReminders}
            onToggle={(label) => handleToggle('paymentReminders', label)}
            disabled={!settings.pushEnabled}
          />
          
          <NotificationItem
            label="Wedding Reminders"
            description="Important reminders about your wedding timeline"
            enabled={settings.weddingReminders}
            onToggle={(label) => handleToggle('weddingReminders', label)}
            disabled={!settings.pushEnabled}
          />
        </NotificationSection>

        {/* Email Notifications */}
        <NotificationSection
          title="Email Notifications"
          description="Receive updates and information via email"
        >
          <NotificationItem
            label="Enable Email Notifications"
            description="Allow us to send you emails"
            enabled={settings.emailEnabled}
            onToggle={(label) => handleToggle('emailEnabled', label)}
          />
          
          <NotificationItem
            label="Weekly Digest"
            description="Weekly summary of your wedding planning progress"
            enabled={settings.weeklyDigest}
            onToggle={(label) => handleToggle('weeklyDigest', label)}
            disabled={!settings.emailEnabled}
          />
          
          <NotificationItem
            label="Promotional Emails"
            description="Special offers and deals from vendors"
            enabled={settings.promotionalEmails}
            onToggle={(label) => handleToggle('promotionalEmails', label)}
            disabled={!settings.emailEnabled}
          />
          
          <NotificationItem
            label="Vendor Recommendations"
            description="Personalized vendor suggestions based on your preferences"
            enabled={settings.vendorRecommendations}
            onToggle={(label) => handleToggle('vendorRecommendations', label)}
            disabled={!settings.emailEnabled}
          />
        </NotificationSection>

        {/* SMS Notifications */}
        <NotificationSection
          title="SMS Notifications"
          description="Receive important updates via text message"
        >
          <NotificationItem
            label="Enable SMS Notifications"
            description="Allow us to send you text messages"
            enabled={settings.smsEnabled}
            onToggle={(label) => handleToggle('smsEnabled', label)}
          />
          
          <NotificationItem
            label="Urgent Updates"
            description="Critical updates that need immediate attention"
            enabled={settings.urgentUpdates}
            onToggle={(label) => handleToggle('urgentUpdates', label)}
            disabled={!settings.smsEnabled}
          />
          
          <NotificationItem
            label="Booking Confirmations"
            description="SMS confirmation for all your bookings"
            enabled={settings.bookingConfirmations}
            onToggle={(label) => handleToggle('bookingConfirmations', label)}
            disabled={!settings.smsEnabled}
          />
        </NotificationSection>

        {/* In-App Settings */}
        <NotificationSection
          title="In-App Settings"
          description="Customize how notifications appear in the app"
        >
          <NotificationItem
            label="In-App Notifications"
            description="Show notifications within the app"
            enabled={settings.inAppEnabled}
            onToggle={(label) => handleToggle('inAppEnabled', label)}
          />
          
          <NotificationItem
            label="Sound"
            description="Play sound for notifications"
            enabled={settings.soundEnabled}
            onToggle={(label) => handleToggle('soundEnabled', label)}
            disabled={!settings.inAppEnabled}
          />
          
          <NotificationItem
            label="Vibration"
            description="Vibrate device for notifications"
            enabled={settings.vibrationEnabled}
            onToggle={(label) => handleToggle('vibrationEnabled', label)}
            disabled={!settings.inAppEnabled}
          />
        </NotificationSection>

        {/* Quick Actions */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={() => {
              // Enable all notifications
              setSettings(prev => ({
                ...prev,
                pushEnabled: true,
                bookingUpdates: true,
                vendorMessages: true,
                paymentReminders: true,
                weddingReminders: true,
                emailEnabled: true,
                weeklyDigest: true,
                vendorRecommendations: true,
                smsEnabled: true,
                urgentUpdates: true,
                bookingConfirmations: true,
                inAppEnabled: true,
                soundEnabled: true,
                vibrationEnabled: true
              }));
              showToast('All notifications enabled!', 'success');
            }}
            variant="outline"
            className="w-full"
          >
            <Icon name="bell" size="sm" className="mr-2" />
            Enable All Notifications
          </Button>
          
          <Button
            onClick={() => {
              // Disable all non-essential notifications
              setSettings(prev => ({
                ...prev,
                pushEnabled: true,
                bookingUpdates: true,
                vendorMessages: false,
                paymentReminders: true,
                weddingReminders: true,
                emailEnabled: true,
                weeklyDigest: false,
                promotionalEmails: false,
                vendorRecommendations: false,
                smsEnabled: true,
                urgentUpdates: true,
                bookingConfirmations: true,
                inAppEnabled: true,
                soundEnabled: false,
                vibrationEnabled: false
              }));
              showToast('Essential notifications only!', 'info');
            }}
            variant="outline"
            className="w-full"
          >
            <Icon name="settings" size="sm" className="mr-2" />
            Essential Only
          </Button>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="w-full py-4 rounded-xl font-bold text-base"
          style={{
            backgroundColor: theme.colors.primary[500],
            color: 'white',
            minHeight: '56px'
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Icon name="check" size="sm" />
              <span>Save Notification Settings</span>
            </div>
          )}
        </Button>
      </div>
      
      {/* Toast Component */}
      <ToastComponent />
    </div>
  );
};

export default Notifications;