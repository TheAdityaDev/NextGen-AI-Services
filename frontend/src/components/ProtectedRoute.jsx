/**
 * Protected Route Component
 * Handles authentication and role-based authorization for protected pages
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoadingScreen = () => (
  <div className="auth-loading">
    <div className="auth-loading__spinner">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="60">
          <animate attributeName="stroke-dashoffset" dur="2s" values="60;0" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
    <p>Loading...</p>
  </div>
);

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  allowedRoles = null,
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, loading, initialized, user, getRoleBasedRoute } = useAuth();
  const location = useLocation();

  // Show loading while auth is being initialized
  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  // Handle public routes (login, signup, onboarding)
  if (!requireAuth) {
    if (isAuthenticated()) {
      // User is already authenticated, redirect to their role-based route
      return <Navigate to={getRoleBasedRoute()} replace />;
    }
    return children;
  }

  // Handle protected routes
  if (!isAuthenticated()) {
    // Save the attempted location for redirect after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // User doesn't have required role, redirect to their appropriate route
      return <Navigate to={getRoleBasedRoute()} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;