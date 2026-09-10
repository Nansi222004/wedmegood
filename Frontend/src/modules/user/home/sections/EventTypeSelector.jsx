import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../hooks/useTheme.js';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Icon from '../../../../components/ui/Icon';
import { eventTypes } from '../../../../data/events';

const EventTypeSelector = () => {
  const { theme } = useTheme();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  const handleEventSelect = (eventType) => {
    setSelectedEvent(eventType);
  };

  const handleContinue = () => {
    if (selectedEvent) {
      navigate('/user/requirements', { state: { eventType: selectedEvent } });
    }
  };

  const getEventCardStyles = (isSelected) => ({
    padding: '1.5rem',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: isSelected ? theme.colors.primary[500] : theme.semantic.border.accent,
    borderRadius: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: isSelected ? theme.colors.primary[50] : theme.semantic.background.accent,
    boxShadow: isSelected ? `0 4px 6px -1px ${theme.semantic.card.shadow}` : `0 1px 3px 0 ${theme.semantic.card.shadow}`,
  });

  return (
    <Card className="fade-in" shadow={true} hover={false}>
      {/* Visual Event Selection Header */}
      <div className="relative h-24 overflow-hidden rounded-t-lg">
        <img
          src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=96&fit=crop&q=80"
          alt="Event Planning"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <span className="text-white font-medium">Plan</span>
        </div>
      </div>
      
      <Card.Content className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {eventTypes.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventSelect(event)}
              style={getEventCardStyles(selectedEvent?.id === event.id)}
              onMouseEnter={(e) => {
                if (selectedEvent?.id !== event.id) {
                  e.target.style.borderColor = theme.colors.primary[400];
                  e.target.style.backgroundColor = theme.colors.primary[50];
                }
              }}
              onMouseLeave={(e) => {
                if (selectedEvent?.id !== event.id) {
                  e.target.style.borderColor = theme.semantic.border.accent;
                  e.target.style.backgroundColor = theme.semantic.background.accent;
                }
              }}
            >
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: selectedEvent?.id === event.id 
                        ? theme.colors.primary[100] 
                        : theme.colors.primary[50] 
                    }}
                  >
                    <Icon 
                      name={event.iconName} 
                      size="2xl" 
                      color={selectedEvent?.id === event.id ? 'primary' : 'muted'}
                    />
                  </div>
                </div>
                <h3 
                  className="font-semibold mb-2 text-lg"
                  style={{ color: theme.semantic.text.primary }}
                >
                  {event.name}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {selectedEvent && (
          <div className="text-center slide-up">
            <Button onClick={handleContinue} size="lg" className="px-8 flex items-center gap-2">
              Continue with {selectedEvent.name}
              <Icon name="arrow" size="sm" />
            </Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default EventTypeSelector;