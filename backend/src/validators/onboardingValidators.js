const { body } = require("express-validator");

// ─── Shared ─────────────────────────────────────────────────────

const accountCreationRules = [
  body("firstName")
    .trim()
    .notEmpty().withMessage("First name is required")
    .isLength({ max: 50 }).withMessage("First name cannot exceed 50 characters"),

  body("lastName")
    .trim()
    .notEmpty().withMessage("Last name is required")
    .isLength({ max: 50 }).withMessage("Last name cannot exceed 50 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),

  body("confirmPassword")
    .notEmpty().withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

// ─── Company Onboarding ─────────────────────────────────────────

const companyIdentityRules = [
  body("companyName")
    .trim()
    .notEmpty().withMessage("Company name is required")
    .isLength({ max: 100 }).withMessage("Company name cannot exceed 100 characters"),

  body("companyWebsite")
    .optional({ checkFalsy: true })
    .isURL().withMessage("Company website must be a valid URL"),

  body("companyLogo")
    .optional({ checkFalsy: true })
    .isString(),
];

const companyDetailsRules = [
  body("industryType")
    .trim()
    .notEmpty().withMessage("Industry type is required"),

  body("countryRegion")
    .trim()
    .notEmpty().withMessage("Country/Region is required"),
];

const supportConfigRules = [
  body("supportHoursOpen")
    .notEmpty().withMessage("Support open time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Support open time must be in HH:mm format (e.g. 09:00)"),

  body("supportHoursClose")
    .notEmpty().withMessage("Support close time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Support close time must be in HH:mm format (e.g. 18:00)"),

  body("outOfHoursMessage")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage("Message cannot exceed 500 characters"),
];

// ─── Agent Onboarding ───────────────────────────────────────────

const agentJoinWorkspaceRules = [
  body("inviteCode")
    .trim()
    .notEmpty().withMessage("Invite / Company code is required")
    .matches(/^CF-[A-Z0-9]{8}$/)
    .withMessage("Invalid invite code format. Expected: CF-XXXXXXXX"),
];

// ─── Auth ───────────────────────────────────────────────────────

const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

module.exports = {
  accountCreationRules,
  companyIdentityRules,
  companyDetailsRules,
  supportConfigRules,
  agentJoinWorkspaceRules,
  loginRules,
};