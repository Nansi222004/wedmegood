import React, { createContext, useState, useEffect, useMemo } from 'react';
import { themes, defaultTheme, applyTheme } from '../theme';

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Get theme from localStorage or use default
    const savedTheme = localStorage.getItem('utsavo-chakra-theme');
    return savedTheme ? themes[savedTheme] || defaultTheme : defaultTheme;
  });

  // Apply theme to document when theme changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyTheme(currentTheme);
    }, 50); // Debounce to prevent excessive DOM updates

    return () => clearTimeout(timeoutId);
  }, [currentTheme.name]); // Only depend on theme name, not the entire object

  const changeTheme = (themeName) => {
    const newTheme = themes[themeName];
    if (newTheme) {
      setCurrentTheme(newTheme);
      localStorage.setItem('utsavo-chakra-theme', themeName);
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    theme: currentTheme,
    themeName: currentTheme.name,
    changeTheme,
    availableThemes: Object.keys(themes),
  }), [currentTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext, ThemeProvider };