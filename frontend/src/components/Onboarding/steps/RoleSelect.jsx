import React, { useState } from "react";

const ROLES = [
  {
    id: "business",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="8" width="22" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 14h22" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/>
        <circle cx="14" cy="14" r="2" fill="currentColor"/>
      </svg>
    ),
    label: "Business / Company",
    description: "Set up a workspace, configure AI support, and manage your team.",
  },
  {
    id: "agent",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 24c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M19 16l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: "Support Agent",
    description: "Join your company's workspace and start resolving customer queries.",
  },
];

const RoleSelect = ({ onNext }) => {
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (selected) onNext(selected);
  };

  return (
    <div className="role-select">
      <div className="role-select__cards">
        {ROLES.map((role) => (
          <button
            key={role.id}
            className={`role-card ${selected === role.id ? "role-card--active" : ""}`}
            onClick={() => setSelected(role.id)}
            type="button"
          >
            <div className="role-card__icon">{role.icon}</div>
            <div className="role-card__body">
              <span className="role-card__label">{role.label}</span>
              <span className="role-card__desc">{role.description}</span>
            </div>
            <div className="role-card__check">
              {selected === role.id && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="7" fill="#fafafa"/>
                  <path d="M4 7l2 2 4-4" stroke="#0f0f0f" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        className={`ob-btn ob-btn--primary ${!selected ? "ob-btn--disabled" : ""}`}
        onClick={handleContinue}
        disabled={!selected}
      >
        Continue
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
  );
};

export default RoleSelect;