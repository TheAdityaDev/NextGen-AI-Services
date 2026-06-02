/**
 * ChatFrame Authentication Context
 * Manages auth state, user data, and authentication flow
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

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
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = apiService.getStoredToken();
      
      if (token) {
        // Verify token is still valid by fetching user profile
        const response = await apiService.getUserProfile();
        if (response.success) {
          setUser(response.data.user);
        } else {
          // Token is invalid, clear it
          apiService.clearAuth();
        }
      }
    } catch (error) {
      // Token is invalid or network error, clear auth
      apiService.clearAuth();
      console.warn('Auth initialization failed:', error.message);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const login = (userData, token) => {
    if (token) {
      apiService.setToken(token);
    }
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.warn('Logout failed:', error.message);
    } finally {
      apiService.clearAuth();
      setUser(null);
      
      // Disconnect socket on logout
      if (typeof window !== 'undefined') {
        const { default: socketService } = await import('../services/socket');
        socketService.disconnect();
      }
    }
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  const isAuthenticated = () => {
    return !!user && !!apiService.getStoredToken();
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const isTenantAdmin = () => {
    return hasRole('company_admin');
  };

  const isSupportAgent = () => {
    return hasRole('support_agent');
  };

  const getTenantId = () => {
    return user?.tenantId;
  };

  const getUserId = () => {
    return user?.id || user?._id;
  };

  const getFullName = () => {
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  };

  const getRoleBasedRoute = () => {
    return '/dashboard';
  };

  const getDefaultRoute = () => {
    return getRoleBasedRoute();
  };

  const value = {
    // State
    user,
    loading,
    initialized,
    
    // Actions
    login,
    logout,
    updateUser,
    
    // Utilities
    isAuthenticated,
    hasRole,
    isTenantAdmin,
    isSupportAgent,
    getTenantId,
    getUserId,
    getFullName,
    getRoleBasedRoute,
    getDefaultRoute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};