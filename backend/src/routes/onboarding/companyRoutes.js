const express = require("express");
const router = express.Router();

const {
  companyStep1,
  companyStep2,
  companyStep3,
  companyStep4,
} = require("../../controllers/companyOnboardingController");

const {
  accountCreationRules,
  companyIdentityRules,
  companyDetailsRules,
  supportConfigRules,
} = require("../../validators/onboardingValidators");

const validate = require("../../middleware/validate");
const { onboardRateLimiter } = require("../../middleware/rateLimiter");
const { body } = require("express-validator");

// All company onboarding routes share the rate limiter
router.use(onboardRateLimiter);

// Step 1 — Account creation
router.post(
  "/step-1",
  accountCreationRules,
  validate,
  companyStep1
);

// Step 2 — Company identity
router.post(
  "/step-2",
  [
    body("sessionId").notEmpty().withMessage("sessionId is required"),
    ...companyIdentityRules,
  ],
  validate,
  companyStep2
);

// Step 3 — Company details
router.post(
  "/step-3",
  [
    body("sessionId").notEmpty().withMessage("sessionId is required"),
    ...companyDetailsRules,
  ],
  validate,
  companyStep3
);

// Step 4 — Support config (final step, triggers DB writes)
router.post(
  "/step-4",
  [
    body("sessionId").notEmpty().withMessage("sessionId is required"),
    ...supportConfigRules,
  ],
  validate,
  companyStep4
);

module.exports = router;