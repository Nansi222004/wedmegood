import { useTheme } from '../../hooks/useTheme';
import Icon from './Icon';
import Button from './Button';

const EmptyState = ({ 
  icon = 'sparkles', 
  title, 
  description, 
  actionText, 
  onAction,
  className = '' 
}) => {
  const { theme } = useTheme();

  return (
    <div className={`flex flex-col items-center justify-center py-8 px-4 text-center ${className}`}>
      {/* Icon */}
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: theme.semantic.background.accent }}
      >
        <Icon 
          name={icon} 
          size="xl" 
          style={{ color: theme.semantic.text.secondary }} 
        />
      </div>
      
      {/* Title */}
      <h3 
        className="text-lg font-bold mb-2"
        style={{ color: theme.semantic.text.primary }}
      >
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p 
          className="text-sm mb-6 max-w-sm"
          style={{ color: theme.semantic.text.secondary }}
        >
          {description}
        </p>
      )}
      
      {/* Action Button */}
      {actionText && onAction && (
        <Button
          onClick={onAction}
          variant="primary"
          size="sm"
          className="px-6"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;