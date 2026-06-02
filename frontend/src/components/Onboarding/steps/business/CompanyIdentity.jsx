import React, { useState, useEffect } from "react";
import { validateCompanyIdentityForm, parseBackendErrors } from "../../../../utils/validation";

const CompanyIdentity = ({ formData, updateForm, onNext, onBack, onSubmit, loading, fieldErrors }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const f = formData;
  const set = (key) => (e) => {
    updateForm({ [key]: e.target.value });
    setTouched(prev => ({ ...prev, [key]: true }));
    
    if (errors[key] || fieldErrors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  useEffect(() => {
    const validation = validateCompanyIdentityForm(f);
    const newErrors = {};
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
    const validation = validateCompanyIdentityForm(f);
    setErrors(validation.errors);
    setTouched({ companyName: true, companyWebsite: true });
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

  const allErrors = { ...errors, ...parseBackendErrors(fieldErrors) };
  
  const getFieldState = (fieldName) => {
    if (allErrors[fieldName]) return 'error';
    if (touched[fieldName] && f[fieldName]) return 'success';
    return 'default';
  };

  return (
    <div className="company-identity">
      <div className={`ob-field ob-field--${getFieldState('companyName')}`}>
        <label>Company name</label>
        <input
          type="text"
          placeholder="Acme Corp"
          value={f.companyName || ""}
          onChange={set("companyName")}
          onBlur={() => handleBlur('companyName')}
        />
        {allErrors.companyName && <span className="ob-field__error">{allErrors.companyName}</span>}
      </div>

      <div className="ob-field">
        <label>
          Company website
          <span className="ob-field__optional">optional</span>
        </label>
        <input
          type="url"
          placeholder="https://acme.com"
          value={f.companyWebsite || ""}
          onChange={set("companyWebsite")}
        />
      </div>

      <div className="ob-field">
        <label>
          Company logo
          <span className="ob-field__optional">optional</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                updateForm({ companyLogo: reader.result });
              };
              reader.readAsDataURL(file);
            }
          }}
          className="db-input"
          style={{ padding: '8px 12px', background: 'transparent', width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', color: 'inherit' }}
        />
        {f.companyLogo && (
          <div className="company-identity__logo-preview" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={f.companyLogo} alt="Logo preview" style={{ maxHeight: 50, borderRadius: 4 }} />
            <button
              type="button"
              onClick={() => updateForm({ companyLogo: null })}
              className="ob-btn ob-btn--ghost"
              style={{ padding: '4px 8px', fontSize: '12px', height: 'auto', minWidth: 'auto', border: '1px solid #d1d5db' }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="ob-actions">
        <button className="ob-btn ob-btn--ghost" type="button" onClick={onBack}>
          <span className="ob-arrow ob-arrow--back">
            <span className="ob-arrow__default"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="ob-arrow__hover"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          </span>
          Back
        </button>
        <button className="ob-btn ob-btn--primary" type="button" onClick={handleContinue} disabled={loading}>
          {loading ? "Saving..." : "Continue"}
          <span className="ob-arrow">
            <span className="ob-arrow__default"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="ob-arrow__hover"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default CompanyIdentity;