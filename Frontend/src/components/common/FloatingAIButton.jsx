import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import Icon from '../ui/Icon';

const FloatingAIButton = ({ show = true }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
      <button
        onClick={() => navigate('/user/ai-assistant')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}
        style={{
          backgroundColor: theme.colors.accent[500],
          boxShadow: `0 4px 20px ${theme.colors.accent[500]}40`,
        }}
        title="AI Wedding Assistant"
      >
        <Icon name="sparkles" size="lg" style={{ color: 'white' }} />
        
        {/* Pulse animation */}
        <div 
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            backgroundColor: theme.colors.accent[500],
            opacity: 0.3
          }}
        />
      </button>
      
      {/* Tooltip */}
      {isHovered && (
        <div 
          className="absolute bottom-16 right-0 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg"
          style={{
            backgroundColor: theme.semantic.card.background,
            color: theme.semantic.text.primary,
            borderColor: theme.semantic.card.border,
            borderWidth: '1px'
          }}
        >
          AI Wedding Assistant
          <div 
            className="absolute top-full right-4 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${theme.semantic.card.background}`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FloatingAIButton;