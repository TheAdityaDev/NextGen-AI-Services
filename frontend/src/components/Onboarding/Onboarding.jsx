import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Onboarding.scss";
import Logo from "../Logo/Logo";
import RoleSelect from "./steps/RoleSelect";
import AccountDetails from "./steps/AccountDetails";
import CompanyIdentity from "./steps/business/CompanyIdentity";
import CompanyDetails from "./steps/business/CompanyDetails";
import SupportConfig from "./steps/business/SupportConfig";
import JoinCompany from "./steps/agent/JoinCompany";
import apiService from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const FLOW_MAP = {
  business: [
    { component: RoleSelect,       title: "Who are you?",            subtitle: "Choose how you'll be using NextGen AI Services." },
    { component: AccountDetails,   title: "Create your account",     subtitle: "You're one step away from smarter support." },
    { component: CompanyIdentity,  title: "Your company identity",   subtitle: "Let's set up your brand presence." },
    { component: CompanyDetails,   title: "Tell us about your work", subtitle: "A few details so we can tailor your experience." },
    { component: SupportConfig,    title: "Configure support",       subtitle: "Define how your team handles customer queries." },
  ],
  agent: [
    { component: RoleSelect,     title: "Who are you?",        subtitle: "Choose how you'll be using NextGen AI Services." },
    { component: AccountDetails, title: "Create your account", subtitle: "You're one step away from smarter support." },
    { component: JoinCompany,    title: "Join your team",      subtitle: "Connect with your company's workspace." },
  ],
};

const DEFAULT_FLOW = [
  { component: RoleSelect, title: "Who are you?", subtitle: "Choose how you'll be using NextGen AI Services." },
];

const SUCCESS_CONTENT = {
  business: {
    title: "Your workspace is ready",
    subtitle: "NextGen AI Services is set up and waiting for your team. Start inviting agents and configuring your AI support.",
    cta: "Go to Dashboard",
    ctaHref: "/dashboard",
    items: [
      "Workspace created successfully",
      "AI support configured",
      "Ready to invite your team",
    ],
  },
  agent: {
    title: "You're in the team",
    subtitle: "You've joined your company's NextGen AI Services workspace. Head to your workspace to start resolving customer queries.",
    cta: "Open Workspace",
    ctaHref: "/workspace",
    items: [
      "Account created successfully",
      "Joined company workspace",
      "Ready to handle support",
    ],
  },
};

const SuccessScreen = ({ role, formData }) => {
  const content = SUCCESS_CONTENT[role];
  const name = formData.firstName || "there";

  return (
    <div className="ob-success">
      <div className="ob-success__icon">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="13" stroke="rgba(160,255,180,0.5)" strokeWidth="1.2"/>
          <path d="M8 14l4 4 8-8" stroke="rgba(160,255,180,0.9)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1 className="ob-success__title">
        Hey {name}, {content.title.toLowerCase()}
      </h1>
      <p className="ob-success__subtitle">{content.subtitle}</p>

      <ul className="ob-success__list">
        {content.items.map((item) => (
          <li key={item} className="ob-success__item">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="7" fill="rgba(160,255,180,0.12)"/>
              <path d="M4 7l2 2 4-4" stroke="rgba(160,255,180,0.8)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {item}
          </li>
        ))}
      </ul>

      <div className="ob-success__bar">
        <div className="ob-success__fill" />
      </div>

      <a href={content.ctaHref} className="ob-success__cta">
        {content.cta}
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
      </a>
    </div>
  );
};

const Onboarding = () => {
  const [role, setRole] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [direction, setDirection] = useState("forward");
  const [done, setDone] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const flow = role ? FLOW_MAP[role] : DEFAULT_FLOW;
  const totalSteps = role ? flow.length : 1;
  const currentStep = flow[stepIndex];
  const StepComponent = currentStep.component;

  const updateForm = (data) => setFormData((prev) => ({ ...prev, ...data }));

  const clearErrors = () => {
    setError(null);
    setFieldErrors({});
  };

  const handleApiError = (error) => {
    if (error.message === 'Too many attempts, please wait') {
      setError(error.message);
      setFieldErrors({});
    } else if (error.validationErrors) {
      // Handle field-level validation errors from backend
      setFieldErrors(error.validationErrors);
      setError(null);
    } else {
      setError(error.message || 'Something went wrong. Please try again.');
      setFieldErrors({});
    }
  };

  const handleAccountDetailsSubmit = async (data) => {
    setLoading(true);
    clearErrors();
    
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      };

      const response = await apiService.companyOnboardingStep1(payload);
      
      if (response.success) {
        setSessionId(response.data.sessionId);
        goNext();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentAccountSubmit = async (data) => {
    setLoading(true);
    clearErrors();
    
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      };

      const response = await apiService.agentOnboardingStep1(payload);
      
      if (response.success) {
        setSessionId(response.data.sessionId);
        goNext();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyIdentitySubmit = async (data) => {
    setLoading(true);
    clearErrors();
    
    try {
      const payload = {
        sessionId,
        companyName: data.companyName,
        companyWebsite: data.companyWebsite,
        companyLogo: data.companyLogo,
      };

      const response = await apiService.companyOnboardingStep2(payload);
      
      if (response.success) {
        goNext();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyDetailsSubmit = async (data) => {
    setLoading(true);
    clearErrors();
    
    try {
      const payload = {
        sessionId,
        industryType: data.industryType,
        countryRegion: data.countryRegion
      };

      const response = await apiService.companyOnboardingStep3(payload);
      
      if (response.success) {
        goNext();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupportConfigSubmit = async (data) => {
    setLoading(true);
    clearErrors();
    
    try {
      const payload = {
        sessionId,
        supportHoursOpen: data.supportHoursOpen || '09:00',
        supportHoursClose: data.supportHoursClose || '17:00',
        outOfHoursMessage: data.outOfHoursMessage
      };

      const response = await apiService.companyOnboardingStep4(payload);
      
      if (response.success) {
        // Save auth data and redirect
        login(response.data.user, response.data.tokens.accessToken);
        setDone(true);
        
        // Redirect after showing success screen
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCompanySubmit = async (data) => {
    setLoading(true);
    clearErrors();
    
    try {
      const payload = {
        sessionId,
        inviteCode: data.inviteCode
      };

      const response = await apiService.agentOnboardingStep2(payload);
      
      if (response.success) {
        // Save auth data and redirect
        login(response.data.user, response.data.tokens.accessToken);
        setDone(true);
        
        // Redirect after showing success screen
        setTimeout(() => {
          const userRole = response.data.user.role;
          if (userRole === 'support_agent') {
            navigate('/workspace');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    setDirection("forward");
    setStepIndex((i) => Math.min(i + 1, flow.length - 1));
  };

  const goBack = () => {
    setDirection("back");
    if (stepIndex === 0) return;
    if (stepIndex === 1) {
      setRole(null);
      setStepIndex(0);
    } else {
      setStepIndex((i) => i - 1);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setDirection("forward");
    setStepIndex(1);
  };

  const handleFinish = () => {
    
    setDone(true);
  };

  const handleStepSubmit = async (data) => {
    clearErrors();
    
    // Determine which API call to make based on current step and role
    if (stepIndex === 1) { // Account Details step
      if (role === 'business') {
        await handleAccountDetailsSubmit(data);
      } else if (role === 'agent') {
        await handleAgentAccountSubmit(data);
      }
    } else if (role === 'business') {
      if (stepIndex === 2) { // Company Identity
        await handleCompanyIdentitySubmit(data);
      } else if (stepIndex === 3) { // Company Details
        await handleCompanyDetailsSubmit(data);
      } else if (stepIndex === 4) { // Support Config
        await handleSupportConfigSubmit(data);
      }
    } else if (role === 'agent' && stepIndex === 2) { // Join Company
      await handleJoinCompanySubmit(data);
    }
  };

  const isLast = stepIndex === flow.length - 1;

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
        {done ? (
          <SuccessScreen role={role} formData={formData} />
        ) : (
          <>
            {/* Progress bar */}
            {role && (
              <div className="onboarding__progress">
                <span className="onboarding__progress-label">
                  Step {stepIndex} of {totalSteps - 1}
                </span>
                <div className="onboarding__progress-track">
                  <div
                    className="onboarding__progress-fill"
                    style={{ width: `${(stepIndex / (totalSteps - 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Header */}
            <div className="onboarding__header">
              <h1 className="onboarding__title">{currentStep.title}</h1>
              <p className="onboarding__subtitle">{currentStep.subtitle}</p>
            </div>

            {/* Step content */}
            <div className={`onboarding__step onboarding__step--${direction}`} key={stepIndex}>
              {error && (
                <div className="onboarding__error">
                  {error}
                </div>
              )}
              <StepComponent
                formData={formData}
                updateForm={updateForm}
                onNext={stepIndex === 0 ? handleRoleSelect : goNext}
                onBack={goBack}
                onFinish={handleFinish}
                onSubmit={handleStepSubmit}
                isLast={isLast}
                showBack={stepIndex > 0}
                role={role}
                loading={loading}
                fieldErrors={fieldErrors}
              />
            </div>
          </>
        )}
      </div>

      {/* Sign in link */}
      {!done && stepIndex === 0 && (
        <p className="onboarding__signin">
          Already have an account?{" "}
          <a href="/login">Sign in</a>
        </p>
      )}
    </div>
  );
};

export default Onboarding;