import { themeConfig, themes, defaultTheme } from './colors.js';

// Export theme configurations
export { themeConfig, themes, defaultTheme };

// Utility function to generate CSS variables from theme
export const generateCSSVariables = (theme) => {
  const cssVars = {};
  
  // Generate CSS variables for all color values
  const generateColorVars = (colors, prefix = '') => {
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        generateColorVars(value, `${prefix}${key}-`);
      } else {
        cssVars[`--color-${prefix}${key}`] = value;
      }
    });
  };
  
  // Generate variables for core colors
  generateColorVars(theme.colors);
  
  // Generate variables for semantic colors
  generateColorVars(theme.semantic);
  
  return cssVars;
};

// Utility function to apply theme to document
export const applyTheme = (theme) => {
  const cssVars = generateCSSVariables(theme);
  const root = document.documentElement;
  
  Object.entries(cssVars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

// Utility function to get theme value by path
export const getThemeValue = (theme, path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme);
};

// Theme class generator for Tailwind
export const generateThemeClasses = (theme) => {
  return {
    // Background classes
    'bg-theme-primary': { backgroundColor: theme.semantic.background.primary },
    'bg-theme-secondary': { backgroundColor: theme.semantic.background.secondary },
    'bg-theme-tertiary': { backgroundColor: theme.semantic.background.tertiary },
    'bg-theme-accent': { backgroundColor: theme.semantic.background.accent },
    'bg-theme-card': { backgroundColor: theme.semantic.card.background },
    
    // Text classes
    'text-theme-primary': { color: theme.semantic.text.primary },
    'text-theme-secondary': { color: theme.semantic.text.secondary },
    'text-theme-tertiary': { color: theme.semantic.text.tertiary },
    'text-theme-inverse': { color: theme.semantic.text.inverse },
    'text-theme-muted': { color: theme.semantic.text.muted },
    'text-theme-accent': { color: theme.semantic.text.accent },
    'text-theme-link': { color: theme.semantic.text.link },
    
    // Border classes
    'border-theme-primary': { borderColor: theme.semantic.border.primary },
    'border-theme-secondary': { borderColor: theme.semantic.border.secondary },
    'border-theme-accent': { borderColor: theme.semantic.border.accent },
    'border-theme-focus': { borderColor: theme.semantic.border.focus },
    
    // Interactive classes
    'hover-theme-primary': { '&:hover': { backgroundColor: theme.semantic.interactive.hover } },
    'hover-theme-card': { '&:hover': { backgroundColor: theme.semantic.card.hover } },
    'focus-theme-primary': { '&:focus': { borderColor: theme.semantic.border.focus } },
  };
};