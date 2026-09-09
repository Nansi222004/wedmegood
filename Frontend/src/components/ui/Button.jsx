import { useTheme } from '../../hooks/useTheme.js';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '', 
  ...props 
}) => {
  const { theme } = useTheme();
  
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';

  const getVariantStyles = () => {
    const buttonStyles = theme.semantic.button[variant];
    if (!buttonStyles) return '';
    
    return {
      backgroundColor: buttonStyles.background,
      color: buttonStyles.text,
      borderColor: buttonStyles.border,
      borderWidth: variant === 'outline' ? '2px' : '1px',
      borderStyle: 'solid',
    };
  };

  const getHoverStyles = () => {
    const buttonStyles = theme.semantic.button[variant];
    if (!buttonStyles) return {};
    
    return {
      ':hover': {
        backgroundColor: buttonStyles.backgroundHover,
        borderColor: buttonStyles.borderHover || buttonStyles.border,
      }
    };
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = `${baseClasses} ${sizes[size]} ${className}`;

  return (
    <button
      className={classes}
      style={{
        ...getVariantStyles(),
        ...(disabled ? {} : getHoverStyles()),
      }}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          const buttonStyles = theme.semantic.button[variant];
          e.target.style.backgroundColor = buttonStyles.backgroundHover;
          e.target.style.borderColor = buttonStyles.borderHover || buttonStyles.border;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          const buttonStyles = theme.semantic.button[variant];
          e.target.style.backgroundColor = buttonStyles.background;
          e.target.style.borderColor = buttonStyles.border;
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;