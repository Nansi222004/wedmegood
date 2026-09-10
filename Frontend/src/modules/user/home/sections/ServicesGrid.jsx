import { useState, useEffect } from 'react';
import Icon from '../../../../components/ui/Icon';
import { services } from '../../../../data/services';
import { useTheme } from '../../../../hooks/useTheme';

const ServicesGrid = () => {
  const { theme } = useTheme();
  const [selectedServices, setSelectedServices] = useState([]);

  // Load selected services from localStorage on component mount
  useEffect(() => {
    const savedServices = localStorage.getItem('selectedServices');
    if (savedServices) {
      setSelectedServices(JSON.parse(savedServices));
    }
  }, []);

  // Save selected services to localStorage whenever selection changes
  useEffect(() => {
    localStorage.setItem('selectedServices', JSON.stringify(selectedServices));
  }, [selectedServices]);

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        // Remove service if already selected
        return prev.filter(s => s.id !== service.id);
      } else {
        // Add service if not selected
        return [...prev, service];
      }
    });
  };

  const isServiceSelected = (serviceId) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  return (
    <div className="w-full">
      {/* Visual Services Header */}
      <div className="mb-6">
        <div className="relative h-20 overflow-hidden rounded-xl mb-4">
          <img
            src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=80&fit=crop&q=80"
            alt="Wedding Services"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <span className="text-white font-medium">Services</span>
          </div>
        </div>
        <p 
          className="text-center text-xs"
          style={{ color: theme.semantic.text.secondary }}
        >
          Select the services you need (optional) - you can choose multiple
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {services.map((service) => {
          const isSelected = isServiceSelected(service.id);
          
          return (
            <div
              key={service.id}
              onClick={() => handleServiceToggle(service)}
              className="cursor-pointer transition-all duration-200 hover:scale-105"
            >
              <div
                className="p-4 rounded-xl border-2 text-center transition-all duration-200 relative"
                style={{
                  borderColor: isSelected 
                    ? theme.colors.primary[500] 
                    : theme.semantic.border.primary,
                  backgroundColor: isSelected 
                    ? theme.colors.primary[50] 
                    : theme.semantic.card.background,
                  boxShadow: isSelected 
                    ? `0 4px 12px -2px ${theme.colors.primary[500]}40`
                    : `0 2px 4px -1px ${theme.semantic.card.shadow}`,
                }}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div 
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.primary[500] }}
                  >
                    <Icon name="check" size="xs" color="white" />
                  </div>
                )}

                {/* Icon Container */}
                <div 
                  className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isSelected 
                      ? theme.colors.primary[100] 
                      : theme.colors.primary[50],
                  }}
                >
                  <Icon 
                    name={service.iconName} 
                    size="lg" 
                    color={isSelected ? 'primary' : 'muted'}
                  />
                </div>

                {/* Service Name */}
                <h3 
                  className="font-medium text-sm leading-tight mb-2"
                  style={{ 
                    color: isSelected 
                      ? theme.colors.primary[700] 
                      : theme.semantic.text.primary 
                  }}
                >
                  {service.name}
                </h3>

                {/* Service Description */}
                <p 
                  className="text-xs leading-tight"
                  style={{ 
                    color: theme.semantic.text.tertiary
                  }}
                >
                  {service.description}
                </p>

                {/* Popular Badge */}
                {service.popular && (
                  <div className="mt-2">
                    <span 
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1"
                      style={{
                        backgroundColor: theme.colors.secondary[100],
                        color: theme.colors.secondary[700]
                      }}
                    >
                      <Icon name="star" size="xs" />
                      Popular
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <div 
          className="mt-8 p-4 rounded-lg border"
          style={{
            backgroundColor: theme.colors.primary[25] || theme.colors.primary[50],
            borderColor: theme.colors.primary[200],
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 
              className="font-medium flex items-center gap-2"
              style={{ color: theme.colors.primary[700] }}
            >
              <Icon name="check" size="sm" color="primary" />
              {selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''} Selected
            </h3>
            <button
              onClick={() => setSelectedServices([])}
              className="text-xs hover:underline"
              style={{ color: theme.semantic.text.tertiary }}
            >
              Clear all
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedServices.map((service) => (
              <span
                key={service.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium gap-1"
                style={{
                  backgroundColor: theme.colors.primary[100],
                  color: theme.colors.primary[700]
                }}
              >
                <Icon name={service.iconName} size="xs" />
                {service.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleServiceToggle(service);
                  }}
                  className="ml-1 hover:opacity-70"
                >
                  <Icon name="close" size="xs" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesGrid;