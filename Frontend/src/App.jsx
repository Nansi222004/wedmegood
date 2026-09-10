import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { LenisProvider } from './providers/LenisProvider';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './router/index.jsx';
import VendorSplashScreen from './modules/vendor/components/VendorSplashScreen';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Check if we've already shown the splash in this session
    if (typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem('hasSeenSplash');
      if (hasSeen) return false;
      return true;
    }
    return true;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  return (
    <ThemeProvider>
      <LenisProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-theme-card">
                {showSplash && (
                  <VendorSplashScreen onComplete={handleSplashComplete} />
                )}
                <AppRouter />
              </div>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </LenisProvider>
    </ThemeProvider>
  );
}

export default App;
