import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';

const WeddingForm = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    venue: '',
    guestCount: '',
    budget: '',
    city: '',
    phone: '',
    email: '',
    weddingStyle: '',
    specialRequests: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Store form data (in real app, this would go to backend)
    localStorage.setItem('weddingFormData', JSON.stringify(formData));
    
    // Navigate to planning dashboard
    navigate('/user/planning-dashboard');
  };

  const handleBack = () => {
    navigate('/user/requirements');
  };

  const weddingStyles = [
    'Traditional Indian',
    'Modern Contemporary',
    'Destination Wedding',
    'Royal & Grand',
    'Intimate & Simple',
    'Fusion Style'
  ];

  const budgetRanges = [
    'Under ₹5 Lakhs',
    '₹5-10 Lakhs',
    '₹10-20 Lakhs',
    '₹20-50 Lakhs',
    '₹50 Lakhs - 1 Crore',
    'Above ₹1 Crore'
  ];

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header Section */}
      <div className="px-4 py-6">
        <div className="flex items-center mb-4">
          <button
            onClick={handleBack}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div>
            <h1 
              className="text-2xl font-bold"
              style={{ color: theme.semantic.text.primary }}
            >
              Wedding Details
            </h1>
            <p 
              className="text-sm mt-1"
              style={{ color: theme.semantic.text.secondary }}
            >
              Tell us about your dream wedding
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mb-6">
          <div 
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: theme.colors.primary[500] }}
          />
          <div 
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: theme.colors.primary[500] }}
          />
          <div 
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: theme.semantic.border.light }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 space-y-6">
        {/* Couple Details */}
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: theme.semantic.card.background }}
        >
          <h3 
            className="font-bold text-lg mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Couple Details
          </h3>
          
          <div className="space-y-4">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.semantic.text.secondary }}
              >
                Bride's Name
              </label>
              <input
                type="text"
                value={formData.brideName}
                onChange={(e) => handleInputChange('brideName', e.target.value)}
                className="wedding-form-input w-full p-3 rounded-lg border"
                style={{
                  backgroundColor: theme.semantic.input.background,
                  borderColor: theme.semantic.input.border,
                  color: theme.semantic.text.primary
                }}
                placeholder="Enter bride's name"
              />
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.semantic.text.secondary }}
              >
                Groom's Name
              </label>
              <input
                type="text"
                value={formData.groomName}
                onChange={(e) => handleInputChange('groomName', e.target.value)}
                className="w-full p-3 rounded-lg border"
                style={{
                  backgroundColor: theme.semantic.input.background,
                  borderColor: theme.semantic.input.border,
                  color: theme.semantic.text.primary
                }}
                placeholder="Enter groom's name"
              />
            </div>
          </div>
        </div>

        {/* Wedding Details */}
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: theme.semantic.card.background }}
        >
          <h3 
            className="font-bold text-lg mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Wedding Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.semantic.text.secondary }}
              >
                Wedding Date
              </label>
              <input
                type="date"
                value={formData.weddingDate}
                onChange={(e) => handleInputChange('weddingDate', e.target.value)}
                className="w-full p-3 rounded-lg border"
                style={{
                  backgroundColor: theme.semantic.input.background,
                  borderColor: theme.semantic.input.border,
                  color: theme.semantic.text.primary
                }}
              />
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.semantic.text.secondary }}
              >
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full p-3 rounded-lg border"
                style={{
                  backgroundColor: theme.semantic.input.background,
                  borderColor: theme.semantic.input.border,
                  color: theme.semantic.text.primary
                }}
                placeholder="Wedding city"
              />
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.semantic.text.secondary }}
              >
                Expected Guest Count
              </label>
              <input
                type="number"
                value={formData.guestCount}
                onChange={(e) => handleInputChange('guestCount', e.target.value)}
                className="w-full p-3 rounded-lg border"
                style={{
                  backgroundColor: theme.semantic.input.background,
                  borderColor: theme.semantic.input.border,
                  color: theme.semantic.text.primary
                }}
                placeholder="Number of guests"
              />
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.semantic.text.secondary }}
              >
                Budget Range
              </label>
              <select
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                className="w-full p-3 rounded-lg border"
                style={{
                  backgroundColor: theme.semantic.input.background,
                  borderColor: theme.semantic.input.border,
                  color: theme.semantic.text.primary
                }}
              >
                <option value="">Select budget range</option>
                {budgetRanges.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.semantic.text.secondary }}
              >
                Wedding Style
              </label>
              <select
                value={formData.weddingStyle}
                onChange={(e) => handleInputChange('weddingStyle', e.target.value)}
                className="w-full p-3 rounded-lg border"
                style={{
                  backgroundColor: theme.semantic.input.background,
                  borderColor: theme.semantic.input.border,
                  color: theme.semantic.text.primary
                }}
              >
                <option value="">Select wedding style</option>
                {weddingStyles.map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: theme.semantic.card.background }}
        >
          <h3 
            className="font-bold text-lg mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Contact Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.semantic.text.secondary }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full p-3 rounded-lg border"
                style={{
                  backgroundColor: theme.semantic.input.background,
                  borderColor: theme.semantic.input.border,
                  color: theme.semantic.text.primary
                }}
                placeholder="Your phone number"
              />
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.semantic.text.secondary }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full p-3 rounded-lg border"
                style={{
                  backgroundColor: theme.semantic.input.background,
                  borderColor: theme.semantic.input.border,
                  color: theme.semantic.text.primary
                }}
                placeholder="Your email address"
              />
            </div>
          </div>
        </div>

        {/* Special Requests */}
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: theme.semantic.card.background }}
        >
          <h3 
            className="font-bold text-lg mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Special Requests
          </h3>
          
          <textarea
            value={formData.specialRequests}
            onChange={(e) => handleInputChange('specialRequests', e.target.value)}
            rows={4}
            className="w-full p-3 rounded-lg border resize-none"
            style={{
              backgroundColor: theme.semantic.input.background,
              borderColor: theme.semantic.input.border,
              color: theme.semantic.text.primary
            }}
            placeholder="Any special requirements or preferences for your wedding..."
          />
        </div>
      </div>

      {/* Bottom spacing for sticky button */}
      <div className="h-8"></div>

      {/* Sticky Submit Button */}
      <div 
        className="fixed bottom-16 left-0 right-0 p-4 border-t safe-area-pb"
        style={{ 
          backgroundColor: theme.semantic.background.primary,
          borderTopColor: theme.semantic.border.light
        }}
      >
        <Button
          onClick={handleSubmit}
          className="w-full py-3 text-base font-bold transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            color: 'white'
          }}
        >
          Continue to Planning Dashboard
        </Button>
      </div>
    </div>
  );
};

export default WeddingForm;