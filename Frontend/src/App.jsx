import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { LenisProvider } from './providers/LenisProvider';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import AppRouter from './router/index.jsx';
import UserSplashScreen from './components/common/UserSplashScreen';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Check if we've already shown the splash in this session
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('splash')) return true;
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
            <ToastProvider>
              <BrowserRouter>
                <div className="min-h-screen bg-theme-card overflow-x-hidden max-w-full">
                  {showSplash && (
                    <UserSplashScreen onComplete={handleSplashComplete} />
                  )}
                  <AppRouter />
                </div>
              </BrowserRouter>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </LenisProvider>
    </ThemeProvider>
  );
}

export default App;
