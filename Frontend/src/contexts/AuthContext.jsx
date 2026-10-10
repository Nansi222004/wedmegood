import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { unregisterPushToken } from '../services/pushNotifications';
import { clearApiCache } from '../services/userApi';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wedmegood-u0n7.onrender.com/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing user session on app load
  useEffect(() => {
    const checkAuthState = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.isAuthenticated) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        localStorage.removeItem('user'); // Clear invalid data
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  // The API client fires this when the server rejects the stored token
  useEffect(() => {
    const handleUnauthorized = () => {
      clearApiCache();
      unregisterPushToken('user');
      localStorage.removeItem('user');
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const userData = {
          ...data.data.user,
          token: data.data.token,
          isAuthenticated: true
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        const errorMsg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.message;
        throw new Error(errorMsg || 'Login failed');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const newUserData = {
          ...data.data.user,
          token: data.data.token,
          isAuthenticated: true
        };
        
        localStorage.setItem('user', JSON.stringify(newUserData));
        setUser(newUserData);
        
        return { success: true, user: newUserData };
      } else {
        // If express-validator returns an array of errors, join them. Otherwise use the message.
        const errorMsg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.message;
        throw new Error(errorMsg || 'Registration failed');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const postAuth = async (path, body) => {
    const response = await fetch(`${API_BASE_URL}/user/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || (data.errors ? data.errors.map(e => e.msg).join(', ') : 'Request failed'));
    }
    return data;
  };

  // purpose: 'register' | 'login'
  const sendPhoneOtp = async (phone, purpose) => {
    try {
      const data = await postAuth('send-otp', { phone, purpose });
      return { success: true, devOtp: data.devOtp };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const verifySignupOtp = async (phone, otp) => {
    try {
      const data = await postAuth('verify-otp', { phone, otp });
      return { success: true, phoneVerificationToken: data.data.phoneVerificationToken };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loginWithOtp = async (phone, otp) => {
    try {
      const data = await postAuth('login-otp', { phone, otp });
      const userData = {
        ...data.data.user,
        token: data.data.token,
        isAuthenticated: true
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    clearApiCache();
    unregisterPushToken('user');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const updatedUser = { ...(prev || {}), ...updatedData, isAuthenticated: true };
      // Many pages re-sync the profile on mount; when nothing changed keep the same object so the
      // whole app (everything reading the auth context) is not re-rendered for no reason
      try {
        if (prev && JSON.stringify(prev) === JSON.stringify(updatedUser)) return prev;
      } catch (e) { /* fall through and update */ }
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error('Failed to sync updated user to localStorage', e);
      }
      return updatedUser;
    });
  };

  const continueAsGuest = () => {
    const guestUser = {
      _id: 'guest_user',
      name: 'Guest User',
      email: 'guest@utsavo.com',
      role: 'guest',
      isGuest: true,
      isAuthenticated: true,
      city: 'Hyderabad'
    };
    try {
      localStorage.setItem('user', JSON.stringify(guestUser));
    } catch (e) {
      console.error('Failed to set guest user in localStorage', e);
    }
    setUser(guestUser);
    return guestUser;
  };

  const isAuthenticated = user && user.isAuthenticated;

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    sendPhoneOtp,
    verifySignupOtp,
    loginWithOtp,
    logout,
    updateUser,
    continueAsGuest,
    isAuthenticated
  }), [user, isLoading, isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};