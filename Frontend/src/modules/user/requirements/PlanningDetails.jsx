import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const PlanningDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  
  // Get selected services from previous page
  const previouslySelectedServices = location.state?.selectedServices || [];
  
  // Planning form state
  const [planningData, setPlanningData] = useState({
    weddingType: '',
    eventTypes: [],
    weddingDate: '',
    city: '',
    aadharNumber: '',
    budgetRange: [100000, 1000000], // Default range ₹1L - ₹10L
    servicePreferences: {}
  });

  // Wedding types
  const weddingTypes = [
    {
      id: 'traditional',
      name: 'Traditional Wedding',
      description: 'Classic ceremonies with cultural rituals',
      icon: 'rings'
    },
    {
      id: 'destination',
      name: 'Destination Wedding',
      description: 'Celebrate at a beautiful location',
      icon: 'location'
    },
    {
      id: 'intimate',
      name: 'Intimate Wedding',
      description: 'Small gathering with close family',
      icon: 'heart'
    }
  ];

  // Event types
  const eventTypes = [
    { id: 'haldi', name: 'Haldi Ceremony', icon: 'sparkles' },
    { id: 'mehndi', name: 'Mehndi Ceremony', icon: 'heart' },
    { id: 'sangeet', name: 'Sangeet/Dance', icon: 'music' },
    { id: 'wedding', name: 'Wedding Ceremony', icon: 'rings' },
    { id: 'reception', name: 'Reception Party', icon: 'star' }
  ];

  // Service categories for preferences
  const serviceCategories = [
    { id: 'venues', name: 'Venues', icon: 'home' },
    { id: 'photographers', name: 'Photography', icon: 'camera' },
    { id: 'makeup', name: 'Makeup Artists', icon: 'sparkles' },
    { id: 'planners', name: 'Wedding Planners', icon: 'plan' },
    { id: 'catering', name: 'Catering', icon: 'star' },
    { id: 'entertainment', name: 'Entertainment', icon: 'music' }
  ];

  const handleWeddingTypeSelect = (type) => {
    setPlanningData(prev => ({ ...prev, weddingType: type }));
  };

  const handleEventTypeToggle = (eventId) => {
    setPlanningData(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventId)
        ? prev.eventTypes.filter(id => id !== eventId)
        : [...prev.eventTypes, eventId]
    }));
  };

  const handleServicePreferenceUpdate = (serviceId, preference) => {
    setPlanningData(prev => ({
      ...prev,
      servicePreferences: {
        ...prev.servicePreferences,
        [serviceId]: preference
      }
    }));
  };

  const handleBudgetChange = (value) => {
    setPlanningData(prev => ({ ...prev, budgetRange: value }));
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const handleSaveAndContinue = () => {
    // Save planning data
    const completeData = {
      ...planningData,
      selectedServices: previouslySelectedServices,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('weddingPlanningData', JSON.stringify(completeData));
    
    // Navigate to vendors with planning data
    navigate('/user/vendors', { 
      state: { 
        planningData: completeData,
        fromPlanning: true 
      } 
    });
  };

  const handleSkipForNow = () => {
    // Save minimal data
    const minimalData = {
      selectedServices: previouslySelectedServices,
      skipped: true,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('weddingPlanningData', JSON.stringify(minimalData));
    
    // Navigate to vendors
    navigate('/user/vendors', { 
      state: { 
        planningData: minimalData,
        fromPlanning: true 
      } 
    });
  };

  const handleBack = () => {
    navigate('/user/requirements');
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Visual Planning Banner - Replace large text header */}
      <div className="px-4 py-4">
        <div className="flex items-center mb-4">
          <button
            onClick={handleBack}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
        </div>

        {/* Visual Planning Card */}
        <div 
          className="relative rounded-2xl overflow-hidden mb-6"
          style={{ height: '120px' }}
        >
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=240&fit=crop&q=80"
            alt="Wedding Planning"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <div className="flex items-center space-x-2 mb-1">
              <Icon name="sparkles" size="sm" style={{ color: 'white' }} />
              <span className="text-white text-sm font-medium">Plan</span>
            </div>
            <p className="text-white/80 text-xs">Personalize your experience</p>
          </div>
        </div>

        {/* Smart Guidance */}
        <div 
          className="rounded-lg p-3 mb-6 flex items-center space-x-3"
          style={{ backgroundColor: theme.colors.primary[50] }}
        >
          <Icon name="lightbulb" size="sm" style={{ color: theme.colors.primary[600] }} />
          <p 
            className="text-xs"
            style={{ color: theme.colors.primary[700] }}
          >
            You can skip any section and update later. This helps us suggest better vendors.
          </p>
        </div>
      </div>

      {/* Wedding Type Selection */}
      <div className="px-4 mb-8">
        <h2 
          className="text-lg font-bold mb-4"
          style={{ color: theme.semantic.text.primary }}
        >
          What type of wedding are you planning?
        </h2>
        
        <div className="space-y-3">
          {weddingTypes.map((type) => (
            <Card
              key={type.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                planningData.weddingType === type.id ? 'ring-2' : ''
              }`}
              onClick={() => handleWeddingTypeSelect(type.id)}
              style={{
                borderColor: planningData.weddingType === type.id 
                  ? theme.colors.primary[500] 
                  : 'transparent'
              }}
            >
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: planningData.weddingType === type.id 
                      ? theme.colors.primary[100] 
                      : theme.semantic.background.accent 
                  }}
                >
                  <Icon 
                    name={type.icon} 
                    size="md" 
                    style={{ 
                      color: planningData.weddingType === type.id 
                        ? theme.colors.primary[600] 
                        : theme.semantic.text.secondary 
                    }} 
                  />
                </div>
                <div className="flex-1">
                  <h3 
                    className="font-semibold text-base"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    {type.name}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {type.description}
                  </p>
                </div>
                {planningData.weddingType === type.id && (
                  <Icon name="check" size="sm" style={{ color: theme.colors.primary[600] }} />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Event Types */}
      <div className="px-4 mb-8">
        <h2 
          className="text-lg font-bold mb-4"
          style={{ color: theme.semantic.text.primary }}
        >
          Which events will you have?
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          {eventTypes.map((event) => {
            const isSelected = planningData.eventTypes.includes(event.id);
            
            return (
              <Card
                key={event.id}
                className={`p-3 cursor-pointer transition-all duration-200 text-center ${
                  isSelected ? 'ring-2' : ''
                }`}
                onClick={() => handleEventTypeToggle(event.id)}
                style={{
                  borderColor: isSelected ? theme.colors.primary[500] : 'transparent',
                  backgroundColor: isSelected 
                    ? theme.colors.primary[50] 
                    : theme.semantic.card.background
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ 
                    backgroundColor: isSelected 
                      ? theme.colors.primary[100] 
                      : theme.semantic.background.accent 
                  }}
                >
                  <Icon 
                    name={event.icon} 
                    size="sm" 
                    style={{ 
                      color: isSelected 
                        ? theme.colors.primary[600] 
                        : theme.semantic.text.secondary 
                    }} 
                  />
                </div>
                <p 
                  className="text-sm font-medium"
                  style={{ 
                    color: isSelected 
                      ? theme.colors.primary[700] 
                      : theme.semantic.text.primary 
                  }}
                >
                  {event.name}
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Wedding Date & Location */}
      <div className="px-4 mb-8">
        <h2 
          className="text-lg font-bold mb-4"
          style={{ color: theme.semantic.text.primary }}
        >
          When and where?
        </h2>
        
        <div className="space-y-4">
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.semantic.text.primary }}
            >
              Tentative Wedding Date
            </label>
            <input
              type="date"
              value={planningData.weddingDate}
              onChange={(e) => setPlanningData(prev => ({ ...prev, weddingDate: e.target.value }))}
              className="w-full p-3 rounded-lg border"
              style={{
                backgroundColor: theme.semantic.card.background,
                borderColor: theme.semantic.border.light,
                color: theme.semantic.text.primary
              }}
            />
          </div>
          
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.semantic.text.primary }}
            >
              City / Location
            </label>
            <input
              type="text"
              value={planningData.city}
              onChange={(e) => setPlanningData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Enter your city"
              className="w-full p-3 rounded-lg border"
              style={{
                backgroundColor: theme.semantic.card.background,
                borderColor: theme.semantic.border.light,
                color: theme.semantic.text.primary
              }}
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.semantic.text.primary }}
            >
              Aadhar Card Number
            </label>
            <input
              type="text"
              value={planningData.aadharNumber}
              onChange={(e) => {
                // Format Aadhar number with spaces (XXXX XXXX XXXX)
                const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                if (value.length <= 12) {
                  setPlanningData(prev => ({ ...prev, aadharNumber: formattedValue }));
                }
              }}
              placeholder="1234 5678 9012"
              maxLength="14" // 12 digits + 2 spaces
              className="w-full p-3 rounded-lg border"
              style={{
                backgroundColor: theme.semantic.card.background,
                borderColor: theme.semantic.border.light,
                color: theme.semantic.text.primary
              }}
            />
            <p 
              className="text-xs mt-1"
              style={{ color: theme.semantic.text.secondary }}
            >
              Enter your 12-digit Aadhar number for identity verification
            </p>
          </div>
        </div>
      </div>

      {/* Budget Range */}
      <div className="px-4 mb-8">
        <h2 
          className="text-lg font-bold mb-4"
          style={{ color: theme.semantic.text.primary }}
        >
          Budget comfort range
        </h2>
        
        <Card className="p-4">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span 
                className="text-sm font-medium"
                style={{ color: theme.semantic.text.secondary }}
              >
                Budget Range
              </span>
              <span 
                className="text-lg font-bold"
                style={{ color: theme.colors.primary[600] }}
              >
                {formatCurrency(planningData.budgetRange[0])} - {formatCurrency(planningData.budgetRange[1])}
              </span>
            </div>
            
            {/* Simple budget selector */}
            <div className="space-y-2">
              {[
                { min: 50000, max: 200000, label: '₹50K - ₹2L' },
                { min: 200000, max: 500000, label: '₹2L - ₹5L' },
                { min: 500000, max: 1000000, label: '₹5L - ₹10L' },
                { min: 1000000, max: 2000000, label: '₹10L - ₹20L' },
                { min: 2000000, max: 5000000, label: '₹20L+' }
              ].map((range) => (
                <button
                  key={`${range.min}-${range.max}`}
                  onClick={() => handleBudgetChange([range.min, range.max])}
                  className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                    planningData.budgetRange[0] === range.min ? 'ring-2' : ''
                  }`}
                  style={{
                    backgroundColor: planningData.budgetRange[0] === range.min 
                      ? theme.colors.primary[50] 
                      : theme.semantic.background.accent,
                    borderColor: planningData.budgetRange[0] === range.min 
                      ? theme.colors.primary[500] 
                      : 'transparent',
                    color: theme.semantic.text.primary
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Service Preferences (Optional) */}
      <div className="px-4 mb-8">
        <h2 
          className="text-lg font-bold mb-2"
          style={{ color: theme.semantic.text.primary }}
        >
          Service Preferences
        </h2>
        <p 
          className="text-sm mb-4"
          style={{ color: theme.semantic.text.secondary }}
        >
          Optional: Set priority levels for different services
        </p>
        
        <div className="space-y-3">
          {serviceCategories.map((service) => {
            const preference = planningData.servicePreferences[service.id] || 'medium';
            
            return (
              <Card key={service.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.semantic.background.accent }}
                    >
                      <Icon name={service.icon} size="sm" style={{ color: theme.semantic.text.secondary }} />
                    </div>
                    <span 
                      className="font-medium"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {service.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleServicePreferenceUpdate(service.id, level)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                        preference === level ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: preference === level 
                          ? theme.colors.primary[100] 
                          : theme.semantic.background.accent,
                        color: preference === level 
                          ? theme.colors.primary[700] 
                          : theme.semantic.text.secondary,
                        borderColor: preference === level 
                          ? theme.colors.primary[500] 
                          : 'transparent'
                      }}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-8">
        <div className="space-y-3">
          <Button
            onClick={handleSaveAndContinue}
            className="w-full py-3 text-base font-medium"
            style={{
              backgroundColor: theme.colors.primary[500],
              color: 'white'
            }}
          >
            Save & Find Vendors
          </Button>
          
          <button
            onClick={handleSkipForNow}
            className="w-full py-3 text-sm font-medium rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: 'transparent',
              color: theme.semantic.text.secondary,
              border: `1px solid ${theme.semantic.border.light}`
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.semantic.background.accent;
              e.target.style.color = theme.semantic.text.primary;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = theme.semantic.text.secondary;
            }}
          >
            Skip for now - I'll update later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanningDetails;