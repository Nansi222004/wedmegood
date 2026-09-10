import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const AuthContext = createContext();

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

  const login = async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/auth/login`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/auth/register`, {
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

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const isAuthenticated = user && user.isAuthenticated;

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated
  }), [user, isLoading, isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};