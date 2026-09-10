import { useTheme } from '../../hooks/useTheme.js';

const Card = ({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = true,
  hover = false,
  gradient = false,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const baseClasses = 'rounded-xl transition-all duration-200';
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const getCardStyles = () => {
    const cardStyles = theme.semantic.card;
    return {
      backgroundColor: gradient ? 'transparent' : cardStyles.background,
      borderColor: cardStyles.border,
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: shadow ? `0 1px 3px 0 ${cardStyles.shadow}, 0 1px 2px 0 ${cardStyles.shadow}` : 'none',
      background: gradient ? theme.semantic.background.gradient.card : cardStyles.background,
    };
  };

  const classes = `${baseClasses} ${paddings[padding]} ${hover ? 'cursor-pointer' : ''} ${className}`;

  return (
    <div
      className={classes}
      style={getCardStyles()}
      onMouseEnter={(e) => {
        if (hover) {
          e.target.style.backgroundColor = theme.semantic.card.hover;
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = `0 4px 6px -1px ${theme.semantic.card.shadow}, 0 2px 4px -1px ${theme.semantic.card.shadow}`;
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.target.style.backgroundColor = gradient ? 'transparent' : theme.semantic.card.background;
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = shadow ? `0 1px 3px 0 ${theme.semantic.card.shadow}, 0 1px 2px 0 ${theme.semantic.card.shadow}` : 'none';
          if (gradient) {
            e.target.style.background = theme.semantic.background.gradient.card;
          }
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '', ...props }) => {
  const { theme } = useTheme();
  
  return (
    <h3 
      className={`text-lg font-semibold ${className}`} 
      style={{ color: theme.semantic.text.primary }}
      {...props}
    >
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = '', ...props }) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className={className} 
      style={{ color: theme.semantic.text.secondary }}
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`mt-4 pt-4 ${className}`} 
      style={{ 
        borderTopColor: theme.semantic.border.primary,
        borderTopWidth: '1px',
        borderTopStyle: 'solid'
      }}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;