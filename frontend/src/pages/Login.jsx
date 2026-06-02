/**
 * Login Page Component
 * Simple login form for existing users
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import Logo from '../components/Logo/Logo';
import '../components/Onboarding/Onboarding.scss';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (error) setError(null);
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await apiService.login(formData);
      
      if (response.success) {
        login(response.data.user, response.data.tokens.accessToken);
        
        // Role-based redirect
        const userRole = response.data.user.role;
        if (userRole === 'company_admin') {
          navigate('/dashboard');
        } else if (userRole === 'support_agent') {
          navigate('/workspace');
        } else {
          navigate('/dashboard'); // Default fallback
        }
      }
    } catch (error) {
      if (error.validationErrors) {
        // Handle field-level validation errors
        setFieldErrors(error.validationErrors);
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldState = (fieldName) => {
    if (fieldErrors[fieldName]) return 'error';
    if (formData[fieldName]) return 'success';
    return 'default';
  };

  return (
    <div className="onboarding">
      {/* Background effects */}
      <div className="onboarding__bg">
        <div className="onboarding__bg-glow onboarding__bg-glow--1" />
        <div className="onboarding__bg-glow onboarding__bg-glow--2" />
        <div className="onboarding__bg-grid" />
      </div>

      {/* Logo */}
      <Logo href="/" className="logo--fixed" />

      {/* Card */}
      <div className="onboarding__card">
        {/* Header */}
        <div className="onboarding__header">
          <h1 className="onboarding__title">Welcome back</h1>
          <p className="onboarding__subtitle">Sign in to your NextGen AI Services account.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="onboarding__error">
              {error}
            </div>
          )}

          <div className={`ob-field ob-field--${getFieldState('email')}`}>
            <label>Email address</label>
            <input
              type="email"
              name="email"
              placeholder="ada@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {fieldErrors.email && <span className="ob-field__error">{fieldErrors.email}</span>}
          </div>

          <div className={`ob-field ob-field--${getFieldState('password')}`}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {fieldErrors.password && <span className="ob-field__error">{fieldErrors.password}</span>}
          </div>

          <div className="ob-actions">
            <button 
              className="ob-btn ob-btn--primary" 
              type="submit" 
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? "Signing in..." : "Sign in"}
              <span className="ob-arrow">
                <span className="ob-arrow__default">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="ob-arrow__hover">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Sign up link */}
      <p className="onboarding__signin">
        Don't have an account?{" "}
        <Link to="/onboarding">Create account</Link>
      </p>
    </div>
  );
};

export default Login;
