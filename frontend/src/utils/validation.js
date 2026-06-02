/**
 * ChatFrame Validation Utilities
 * Frontend validation that mirrors backend validation exactly
 */

// Generic required field validation
export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true, error: null };
};

// Password validation rules (must match backend exactly)
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password match validation
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, errors: ['Please confirm your password'] };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, errors: ['Passwords do not match'] };
  }
  
  return { isValid: true, errors: [] };
};

// Email validation
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, errors: ['Email is required'] };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, errors: ['Please provide a valid email address'] };
  }
  
  return { isValid: true, errors: [] };
};

// Name validation
export const validateName = (name, fieldName = 'Name') => {
  if (!name || !name.trim()) {
    return { isValid: false, errors: [`${fieldName} is required`] };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, errors: [`${fieldName} cannot exceed 50 characters`] };
  }
  
  return { isValid: true, errors: [] };
};

// Company name validation
export const validateCompanyName = (companyName) => {
  if (!companyName || !companyName.trim()) {
    return { isValid: false, errors: ['Company name is required'] };
  }
  
  if (companyName.trim().length > 100) {
    return { isValid: false, errors: ['Company name cannot exceed 100 characters'] };
  }
  
  return { isValid: true, errors: [] };
};

// Website URL validation
export const validateWebsite = (website) => {
  if (!website) {
    return { isValid: true, errors: [] }; // Optional field
  }
  
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return { isValid: true, errors: [] };
  } catch {
    return { isValid: false, errors: ['Company website must be a valid URL'] };
  }
};

// Invite code validation (matches backend CF-XXXXXXXX format)
export const validateInviteCode = (inviteCode) => {
  if (!inviteCode || !inviteCode.trim()) {
    return { isValid: false, errors: ['Invite / Company code is required'] };
  }
  
  // Backend expects CF-XXXXXXXX format
  if (!/^CF-[A-Z0-9]{8}$/.test(inviteCode.trim())) {
    return { isValid: false, errors: ['Invalid invite code format. Expected: CF-XXXXXXXX'] };
  }
  
  return { isValid: true, errors: [] };
};

// Industry validation
export const validateIndustry = (industry) => {
  if (!industry || !industry.trim()) {
    return { isValid: false, errors: ['Industry type is required'] };
  }
  
  return { isValid: true, errors: [] };
};

// Country validation
export const validateCountry = (country) => {
  if (!country || !country.trim()) {
    return { isValid: false, errors: ['Country/Region is required'] };
  }
  
  return { isValid: true, errors: [] };
};

// Support hours validation
export const validateSupportHours = (openHour, closeHour) => {
  const errors = {};
  
  if (!openHour) {
    errors.supportHoursOpen = 'Support open time is required';
  } else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(openHour)) {
    errors.supportHoursOpen = 'Support open time must be in HH:mm format (e.g. 09:00)';
  }
  
  if (!closeHour) {
    errors.supportHoursClose = 'Support close time is required';
  } else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(closeHour)) {
    errors.supportHoursClose = 'Support close time must be in HH:mm format (e.g. 18:00)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Out of hours message validation
export const validateOutOfHoursMessage = (message) => {
  if (message && message.length > 500) {
    return { isValid: false, errors: ['Message cannot exceed 500 characters'] };
  }
  
  return { isValid: true, errors: [] };
};

// Parse backend validation errors into frontend format
export const parseBackendErrors = (backendErrors) => {
  if (!backendErrors || typeof backendErrors !== 'object') {
    return {};
  }
  
  // If it's already in the right format, return as is
  if (!Array.isArray(backendErrors)) {
    return backendErrors;
  }
  
  // Convert array format to object format
  const errors = {};
  backendErrors.forEach(error => {
    if (error.path && error.msg) {
      errors[error.path] = error.msg;
    }
  });
  
  return errors;
};

// Form validation helpers
export const validateAccountDetailsForm = (formData) => {
  const errors = {};
  
  const firstNameValidation = validateName(formData.firstName, 'First name');
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.errors[0];
  }
  
  const lastNameValidation = validateName(formData.lastName, 'Last name');
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.errors[0];
  }
  
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors[0];
  }
  
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors[0];
  }
  
  const confirmPasswordValidation = validatePasswordMatch(formData.password, formData.confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.errors[0];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCompanyIdentityForm = (formData) => {
  const errors = {};
  
  const companyNameValidation = validateCompanyName(formData.companyName);
  if (!companyNameValidation.isValid) {
    errors.companyName = companyNameValidation.errors[0];
  }
  
  const websiteValidation = validateWebsite(formData.companyWebsite);
  if (!websiteValidation.isValid) {
    errors.companyWebsite = websiteValidation.errors[0];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCompanyDetailsForm = (formData) => {
  const errors = {};
  
  const industryValidation = validateIndustry(formData.industryType);
  if (!industryValidation.isValid) {
    errors.industryType = industryValidation.errors[0];
  }
  
  const countryValidation = validateCountry(formData.countryRegion);
  if (!countryValidation.isValid) {
    errors.countryRegion = countryValidation.errors[0];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateSupportConfigForm = (formData) => {
  const hoursValidation = validateSupportHours(formData.supportHoursOpen, formData.supportHoursClose);
  const messageValidation = validateOutOfHoursMessage(formData.outOfHoursMessage);
  
  const errors = { ...hoursValidation.errors };
  if (!messageValidation.isValid) {
    errors.outOfHoursMessage = messageValidation.errors[0];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateJoinCompanyForm = (formData) => {
  const errors = {};
  
  const inviteCodeValidation = validateInviteCode(formData.inviteCode);
  if (!inviteCodeValidation.isValid) {
    errors.inviteCode = inviteCodeValidation.errors[0];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};