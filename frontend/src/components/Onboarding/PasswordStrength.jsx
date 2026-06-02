/**
 * Password Strength Indicator Component
 * Shows real-time password validation feedback
 */

import React from 'react';
import { validatePassword } from '../../utils/validation';

const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const validation = validatePassword(password);
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /\d/.test(password) }
  ];

  // Calculate strength score
  let score = 0;
  if (password.length >= 8) score += 30;
  if (/[A-Z]/.test(password)) score += 30;
  if (/[a-z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 20;

  let strengthLabel = 'Weak';
  let strengthColor = '#ef4444';
  
  if (score >= 80) {
    strengthLabel = 'Strong';
    strengthColor = '#10b981';
  } else if (score >= 50) {
    strengthLabel = 'Fair';
    strengthColor = '#f59e0b';
  }

  return (
    <div className="password-strength">
      {/* Strength meter */}
      <div className="password-strength__meter">
        <div className="password-strength__label">
          Password strength: <span style={{ color: strengthColor }}>{strengthLabel}</span>
        </div>
        <div className="password-strength__meter-track">
          <div 
            className="password-strength__meter-fill"
            style={{ 
              width: `${Math.min(score, 100)}%`,
              backgroundColor: strengthColor 
            }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="password-strength__requirements">
        {requirements.map((req, index) => (
          <div 
            key={index}
            className={`password-strength__requirement ${req.met ? 'password-strength__requirement--checked' : ''}`}
          >
            <div className="password-strength__check">
              {req.met ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path 
                    d="M2 5l2 2 4-4" 
                    stroke="currentColor" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <div className="password-strength__dot" />
              )}
            </div>
            <span className="password-strength__label">{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;