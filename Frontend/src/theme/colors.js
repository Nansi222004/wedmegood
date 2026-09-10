// Centralized theme configuration - Single source of truth for all colors
export const themeConfig = {
  // Core color palette
  colors: {
    // Primary brand colors (Purple/Violet)
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c7d2fe',
      400: '#a78bfa',
      500: '#7c3aed', // Main Designer Purple
      600: '#6d28d9',
      700: '#5b21b6',
      800: '#4c1d95',
      900: '#3b0764',
      950: '#2e1065',
    },
    lilac: {
      light: '#a78bfa', // Light violet
      dark: '#4c1d95',  // Dark violet
      floral: '#ddd6fe',
    },
    
    // Secondary colors (Amber/Gold)
    secondary: {
      50: '#fffcf0',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308', // Elegant Gold
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
      950: '#422006',
    },
    
    // Accent colors (Emerald/Green)
    accent: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981', // Main accent
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    
    // Neutral colors (Gray scale)
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Semantic color mappings
  semantic: {
    // Background colors
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      accent: '#f5f3ff',
      gradient: {
        primary: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        hero: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
        card: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
      },
    },
    
    // Text colors
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
      muted: '#d1d5db',
      accent: '#7c3aed',
      link: '#7c3aed',
      linkHover: '#6d28d9',
    },
    
    // Border colors
    border: {
      primary: '#e5e7eb',
      secondary: '#d1d5db',
      accent: '#ddd6fe',
      focus: '#7c3aed',
      error: '#ef4444',
    },
    
    // Interactive states
    interactive: {
      hover: '#f9fafb',
      active: '#f3f4f6',
      focus: '#f5f3ff',
      disabled: '#f3f4f6',
    },
    
    // Component-specific colors
    card: {
      background: '#ffffff',
      border: '#e5e7eb',
      shadow: 'rgba(0, 0, 0, 0.05)',
      hover: '#f9fafb',
    },
    
    button: {
      primary: {
        background: '#7c3aed',
        backgroundHover: '#6d28d9',
        text: '#ffffff',
        border: '#7c3aed',
      },
      secondary: {
        background: '#f59e0b',
        backgroundHover: '#d97706',
        text: '#ffffff',
        border: '#f59e0b',
      },
      outline: {
        background: 'transparent',
        backgroundHover: '#f5f3ff',
        text: '#7c3aed',
        border: '#ddd6fe',
        borderHover: '#7c3aed',
      },
      ghost: {
        background: 'transparent',
        backgroundHover: '#f5f3ff',
        text: '#7c3aed',
        border: 'transparent',
      },
    },
    
    input: {
      background: '#ffffff',
      border: '#d1d5db',
      borderFocus: '#7c3aed',
      text: '#111827',
      placeholder: '#9ca3af',
    },
    
    navigation: {
      background: '#ffffff',
      border: '#e5e7eb',
      text: '#4b5563',
      textActive: '#7c3aed',
      backgroundActive: '#f5f3ff',
      backgroundHover: '#f9fafb',
    },
  },
};

// Theme variants
export const themes = {
  light: {
    name: 'light',
    ...themeConfig,
  },
  
  dark: {
    name: 'dark',
    colors: {
      ...themeConfig.colors,
    },
    semantic: {
      ...themeConfig.semantic,
      background: {
        primary: '#111827',
        secondary: '#1f2937',
        tertiary: '#374151',
        accent: '#2e1065',
        gradient: {
          primary: 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 100%)',
          hero: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
          card: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        },
      },
      text: {
        primary: '#f9fafb',
        secondary: '#d1d5db',
        tertiary: '#9ca3af',
        inverse: '#111827',
        muted: '#6b7280',
        accent: '#c084fc',
        link: '#c084fc',
        linkHover: '#ede9fe',
      },
      card: {
        background: '#1f2937',
        border: '#374151',
        shadow: 'rgba(0, 0, 0, 0.3)',
        hover: '#374151',
      },
      navigation: {
        background: '#1f2937',
        border: '#374151',
        text: '#d1d5db',
        textActive: '#c084fc',
        backgroundActive: '#2e1065',
        backgroundHover: '#374151',
      },
    },
  },
};

export const defaultTheme = themes.light;

// CSS variable names mapping
export const cssVariables = {
  primary: {
    50: '--color-primary-50',
    100: '--color-primary-100',
    200: '--color-primary-200',
    300: '--color-primary-300',
    400: '--color-primary-400',
    500: '--color-primary-500',
    600: '--color-primary-600',
    700: '--color-primary-700',
    800: '--color-primary-800',
    900: '--color-primary-900',
    950: '--color-primary-950',
  },
  secondary: {
    50: '--color-secondary-50',
    100: '--color-secondary-100',
    200: '--color-secondary-200',
    300: '--color-secondary-300',
    400: '--color-secondary-400',
    500: '--color-secondary-500',
    600: '--color-secondary-600',
    700: '--color-secondary-700',
    800: '--color-secondary-800',
    900: '--color-secondary-900',
    950: '--color-secondary-950',
  },
  accent: {
    50: '--color-accent-50',
    100: '--color-accent-100',
    200: '--color-accent-200',
    300: '--color-accent-300',
    400: '--color-accent-400',
    500: '--color-accent-500',
    600: '--color-accent-600',
    700: '--color-accent-700',
    800: '--color-accent-800',
    900: '--color-accent-900',
    950: '--color-accent-950',
  },
  background: {
    primary: '--color-bg-primary',
    secondary: '--color-bg-secondary',
    tertiary: '--color-bg-tertiary',
  },
  text: {
    primary: '--color-text-primary',
    secondary: '--color-text-secondary',
    tertiary: '--color-text-tertiary',
    inverse: '--color-text-inverse',
  },
  card: {
    background: '--color-card-bg',
    border: '--color-card-border',
    shadow: '--color-card-shadow',
  },
  status: {
    success: '--color-success',
    warning: '--color-warning',
    error: '--color-error',
    info: '--color-info',
  },
};