import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const Input = ({ 
  label,
  error,
  className = '',
  type = 'text',
  ...props 
}) => {
  const { theme } = useTheme();
  
  const baseClasses = 'w-full px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';
  
  const getInputStyles = () => {
    const inputStyles = theme.semantic.input;
    return {
      backgroundColor: inputStyles.background,
      borderColor: error ? theme.colors.error : inputStyles.border,
      borderWidth: '1px',
      borderStyle: 'solid',
      color: inputStyles.text,
    };
  };

  const getFocusStyles = () => {
    const inputStyles = theme.semantic.input;
    return {
      borderColor: inputStyles.borderFocus,
      ringColor: inputStyles.borderFocus,
    };
  };

  const classes = `${baseClasses} ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label 
          className="block text-sm font-medium"
          style={{ color: theme.semantic.text.primary }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        className={classes}
        style={getInputStyles()}
        onFocus={(e) => {
          e.target.style.borderColor = theme.semantic.input.borderFocus;
          e.target.style.boxShadow = `0 0 0 2px ${theme.semantic.input.borderFocus}25`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? theme.colors.error : theme.semantic.input.border;
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <p 
          className="text-sm"
          style={{ color: theme.colors.error }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;