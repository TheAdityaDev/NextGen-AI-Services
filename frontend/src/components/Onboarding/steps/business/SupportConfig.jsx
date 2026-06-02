import React, { useState } from "react";
import { validateSupportConfigForm, parseBackendErrors } from "../../../../utils/validation";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: `${String(i).padStart(2, "0")}:00`, label: `${h}:00 ${ampm}` };
});

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SupportConfig = ({ formData, updateForm, onNext, onBack, isLast, onFinish, onSubmit, loading, fieldErrors }) => {
  const [errors, setErrors] = useState({});
  const f = formData;
  
  const set = (key) => (e) => {
    updateForm({ [key]: e.target.value });
    
    // Clear errors when user changes values
    if (errors[key] || fieldErrors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const validate = () => {
    // Ensure we have the current values including defaults
    const currentData = {
      supportHoursOpen: f.supportHoursOpen || '09:00',
      supportHoursClose: f.supportHoursClose || '17:00',
      outOfHoursMessage: f.outOfHoursMessage
    };
    
    const validation = validateSupportConfigForm(currentData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async () => {
    // Ensure we pass the current values including defaults
    const currentData = {
      supportHoursOpen: f.supportHoursOpen || '09:00',
      supportHoursClose: f.supportHoursClose || '17:00',
      outOfHoursMessage: f.outOfHoursMessage
    };
    
    if (!validate()) return;
    
    if (onSubmit) {
      await onSubmit(currentData);
    } else if (isLast) {
      onFinish();
    } else {
      onNext();
    }
  };

  // Merge local validation errors with API field errors
  const allErrors = { ...errors, ...parseBackendErrors(fieldErrors) };

  return (
    <div className="support-config">
      {/* Support hours */}
      <div className="ob-field">
        <label>Support hours</label>
        <div className="hours-row">
          <div className="ob-field ob-field--select ob-field--inline">
            <span className="hours-label">Opens at</span>
            <div className="ob-select-wrap">
              <select value={f.supportHoursOpen || "09:00"} onChange={set("supportHoursOpen")}>
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
              <ChevronIcon />
            </div>
          </div>
          <div className="ob-field ob-field--select ob-field--inline">
            <span className="hours-label">Closes at</span>
            <div className="ob-select-wrap">
              <select value={f.supportHoursClose || "17:00"} onChange={set("supportHoursClose")}>
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
              <ChevronIcon />
            </div>
          </div>
        </div>
        {(allErrors.supportHoursOpen || allErrors.supportHoursClose) && (
          <span className="ob-field__error">
            {allErrors.supportHoursOpen || allErrors.supportHoursClose}
          </span>
        )}
      </div>

      {/* Out-of-hours message */}
      <div className="ob-field">
        <label>
          Out-of-hours message
          <span className="ob-field__optional">optional</span>
        </label>
        <textarea
          placeholder="We're currently offline. We'll get back to you within 24 hours..."
          value={f.outOfHoursMessage || ""}
          onChange={set("outOfHoursMessage")}
          rows={3}
        />
        {allErrors.outOfHoursMessage && <span className="ob-field__error">{allErrors.outOfHoursMessage}</span>}
      </div>

      <div className="ob-actions">
        <button className="ob-btn ob-btn--ghost" type="button" onClick={onBack}>
          <span className="ob-arrow ob-arrow--back">
            <span className="ob-arrow__default"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="ob-arrow__hover"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          </span>
          Back
        </button>
        <button className="ob-btn ob-btn--primary" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Setting up workspace..." : (isLast ? "Launch NextGen AI" : "Continue")}
          <span className="ob-arrow">
            <span className="ob-arrow__default"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="ob-arrow__hover"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default SupportConfig;
