import React, { useState, useEffect } from "react";
import { validateJoinCompanyForm, parseBackendErrors } from "../../../../utils/validation";

const ShieldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M7.5 1.5L2 3.5v4.5c0 3.3 2.4 6 5.5 6.5C10.6 14 13 11.3 13 8V3.5L7.5 1.5Z"
      stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M5 7.5l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const JoinCompany = ({ formData, updateForm, onNext, onBack, isLast, onFinish, onSubmit, loading, fieldErrors }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const f = formData;
  
  const set = (key) => (e) => {
    updateForm({ [key]: e.target.value });
    setTouched(prev => ({ ...prev, [key]: true }));
    
    // Clear errors for this field when user starts typing
    if (errors[key] || fieldErrors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  // Real-time validation
  useEffect(() => {
    const validation = validateJoinCompanyForm(f);
    const newErrors = {};
    
    // Only show errors for touched fields
    Object.keys(validation.errors).forEach(key => {
      if (touched[key]) {
        newErrors[key] = validation.errors[key];
      }
    });
    
    setErrors(newErrors);
  }, [f, touched]);

  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const validate = () => {
    const validation = validateJoinCompanyForm(f);
    setErrors(validation.errors);
    setTouched({ inviteCode: true });
    return validation.isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    if (onSubmit) {
      await onSubmit(f);
    } else if (isLast) {
      onFinish();
    } else {
      onNext();
    }
  };

  // Merge local validation errors with API field errors
  const allErrors = { ...errors, ...parseBackendErrors(fieldErrors) };
  
  const getFieldState = (fieldName) => {
    if (allErrors[fieldName]) return 'error';
    if (touched[fieldName] && f[fieldName]) return 'success';
    return 'default';
  };

  return (
    <div className="join-company">
      <div className="join-company__hint">
        <ShieldIcon />
        <p>
          Your company admin will share a unique <strong>Company ID</strong> or{" "}
          <strong>Invite Code</strong> with you. Enter it below to join your workspace securely.
        </p>
      </div>

      <div className={`ob-field ob-field--code ob-field--${getFieldState('inviteCode')}`}>
        <label>Company ID / Invite Code</label>
        <input
          type="text"
          placeholder="e.g. CF-XXXXXXXX"
          value={f.inviteCode || ""}
          onChange={set("inviteCode")}
          onBlur={() => handleBlur('inviteCode')}
          spellCheck={false}
          autoComplete="off"
        />
        {allErrors.inviteCode && <span className="ob-field__error">{allErrors.inviteCode}</span>}
      </div>

      <p className="join-company__note">
        Don't have a code? Ask your support team manager to send you an invite from their NextGen AI Services dashboard.
      </p>

      <div className="ob-actions">
        <button className="ob-btn ob-btn--ghost" type="button" onClick={onBack}>
          <span className="ob-arrow ob-arrow--back">
            <span className="ob-arrow__default"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="ob-arrow__hover"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          </span>
          Back
        </button>
        <button className="ob-btn ob-btn--primary" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Joining workspace..." : (isLast ? "Join workspace" : "Continue")}
          <span className="ob-arrow">
            <span className="ob-arrow__default"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="ob-arrow__hover"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default JoinCompany;