import React, { useState } from "react";

const ISSUE_TYPES = [
  "Delivery", "Orders", "Refund", "Billing", "Account Access", "Other",
];

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CustomerSupport = ({ formData, updateForm, onNext, onBack, isLast, onFinish }) => {
  const [errors, setErrors] = useState({});
  const f = formData;
  const set = (key) => (e) => updateForm({ [key]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!f.helpCompany?.trim()) errs.helpCompany = "Required";
    if (!f.issueType) errs.issueType = "Please select an issue type";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (isLast) onFinish();
    else onNext();
  };

  return (
    <div className="customer-support">
      <div className={`ob-field ${errors.helpCompany ? "ob-field--error" : ""}`}>
        <label>Which company do you need help with?</label>
        <input
          type="text"
          placeholder="e.g. Shopify, Amazon, Netflix..."
          value={f.helpCompany || ""}
          onChange={set("helpCompany")}
        />
        {errors.helpCompany && <span className="ob-field__error">{errors.helpCompany}</span>}
      </div>

      <div className="ob-field">
        <label>
          Order ID
          <span className="ob-field__optional">optional</span>
        </label>
        <input
          type="text"
          placeholder="#ORD-000000"
          value={f.orderId || ""}
          onChange={set("orderId")}
        />
      </div>

      <div className={`ob-field ob-field--select ${errors.issueType ? "ob-field--error" : ""}`}>
        <label>What kind of issue?</label>
        <div className="ob-select-wrap">
          <select value={f.issueType || ""} onChange={set("issueType")}>
            <option value="" disabled>Select issue type</option>
            {ISSUE_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <ChevronIcon />
        </div>
        {errors.issueType && <span className="ob-field__error">{errors.issueType}</span>}
      </div>

      <div className="ob-actions">
        <button className="ob-btn ob-btn--ghost" type="button" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <button className="ob-btn ob-btn--primary" type="button" onClick={handleSubmit}>
          {isLast ? "Get started" : "Continue"}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CustomerSupport;