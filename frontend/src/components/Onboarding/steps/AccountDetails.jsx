import React, { useState, useEffect } from "react";
import { validateAccountDetailsForm, validatePassword, validatePasswordMatch, parseBackendErrors } from "../../../utils/validation";
import PasswordStrength from "../PasswordStrength";

const EyeIcon = ({ open }) =>
  open ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.2 4.3C2.8 5.3 1.7 6.7 1 8c1.3 2.7 4 5 7 5a8 8 0 0 0 3.8-1M6 3.2A8 8 0 0 1 8 3c3 0 5.7 2.3 7 5a10 10 0 0 1-1.8 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );

const AccountDetails = ({ formData, updateForm, onNext, onBack, showBack, onSubmit, loading, fieldErrors }) => {
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const f = formData;

  const set = (key) => (e) => {
    updateForm({ [key]: e.target.value });
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [key]: true }));
    
    // Clear errors for this field when user starts typing
    if (errors[key] || fieldErrors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  // Real-time validation
  useEffect(() => {
    const validation = validateAccountDetailsForm(f);
    const newErrors = {};
    
    // Only show errors for touched fields
    Object.keys(validation.errors).forEach(key => {
      if (touched[key]) {
        newErrors[key] = validation.errors[key];
      }
    });
    
    setErrors(newErrors);
  }, [f, touched]);

  // Handle field blur to mark as touched
  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const validate = () => {
    const validation = validateAccountDetailsForm(f);
    setErrors(validation.errors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true
    });
    return validation.isValid;
  };

  const handleContinue = async () => { 
    if (validate()) {
      if (onSubmit) {
        await onSubmit(f);
      } else {
        onNext();
      }
    }
  };

  // Merge local validation errors with API field errors
  const allErrors = { ...errors, ...parseBackendErrors(fieldErrors) };
  
  // Check field validity for visual states
  const getFieldState = (fieldName) => {
    if (allErrors[fieldName]) return 'error';
    if (touched[fieldName] && f[fieldName]) {
      // Special validation for password
      if (fieldName === 'password') {
        const passwordValidation = validatePassword(f[fieldName]);
        return passwordValidation.isValid ? 'success' : 'error';
      }
      // Special validation for confirm password
      if (fieldName === 'confirmPassword') {
        const matchValidation = validatePasswordMatch(f.password, f[fieldName]);
        return matchValidation.isValid ? 'success' : 'error';
      }
      return 'success';
    }
    return 'default';
  };

  return (
    <div className="account-details">
      {/* Name row */}
      <div className="ob-row">
        <div className={`ob-field ob-field--${getFieldState('firstName')}`}>
          <label>First name</label>
          <input
            type="text"
            placeholder="Ada"
            value={f.firstName || ""}
            onChange={set("firstName")}
            onBlur={() => handleBlur('firstName')}
          />
          {allErrors.firstName && <span className="ob-field__error">{allErrors.firstName}</span>}
        </div>
        <div className={`ob-field ob-field--${getFieldState('lastName')}`}>
          <label>Last name</label>
          <input
            type="text"
            placeholder="Lovelace"
            value={f.lastName || ""}
            onChange={set("lastName")}
            onBlur={() => handleBlur('lastName')}
          />
          {allErrors.lastName && <span className="ob-field__error">{allErrors.lastName}</span>}
        </div>
      </div>

      <div className={`ob-field ob-field--${getFieldState('email')}`}>
        <label>Email address</label>
        <input
          type="email"
          placeholder="ada@company.com"
          value={f.email || ""}
          onChange={set("email")}
          onBlur={() => handleBlur('email')}
        />
        {allErrors.email && <span className="ob-field__error">{allErrors.email}</span>}
      </div>

      <div className={`ob-field ob-field--password ob-field--${getFieldState('password')}`}>
        <label>Password</label>
        <div className="ob-field__helper">
          Minimum 8 characters, including uppercase letter and number
        </div>
        <input
          type={show.password ? "text" : "password"}
          placeholder="Create a strong password"
          value={f.password || ""}
          onChange={set("password")}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => {
            handleBlur('password');
            setIsPasswordFocused(false);
          }}
        />
        <button type="button" className="ob-field__eye" onClick={() => setShow(s => ({ ...s, password: !s.password }))}>
          <EyeIcon open={show.password} />
        </button>
        {allErrors.password && <span className="ob-field__error">{allErrors.password}</span>}
        
        {(isPasswordFocused || f.password) && (
          <PasswordStrength password={f.password} />
        )}
      </div>

      <div className={`ob-field ob-field--password ob-field--${getFieldState('confirmPassword')}`}>
        <label>Confirm password</label>
        <input
          type={show.confirm ? "text" : "password"}
          placeholder="Re-enter password"
          value={f.confirmPassword || ""}
          onChange={set("confirmPassword")}
          onBlur={() => handleBlur('confirmPassword')}
        />
        <button type="button" className="ob-field__eye" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}>
          <EyeIcon open={show.confirm} />
        </button>
        {allErrors.confirmPassword && <span className="ob-field__error">{allErrors.confirmPassword}</span>}
      </div>

      <div className="ob-actions">
        {showBack && (
          <button className="ob-btn ob-btn--ghost" type="button" onClick={onBack}>
            <span className="ob-arrow ob-arrow--back">
              <span className="ob-arrow__default">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="ob-arrow__hover">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </span>
            Back
          </button>
        )}
        <button className="ob-btn ob-btn--primary" type="button" onClick={handleContinue} disabled={loading}>
          {loading ? "Creating account..." : "Continue"}
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
    </div>
  );
};

export default AccountDetails;