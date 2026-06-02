const express = require("express");
const router = express.Router();

const { agentStep1, agentStep2 } = require("../../controllers/agentOnboardingController");

const {
  accountCreationRules,
  agentJoinWorkspaceRules,
} = require("../../validators/onboardingValidators");

const validate = require("../../middleware/validate");
const { onboardRateLimiter } = require("../../middleware/rateLimiter");
const { body } = require("express-validator");

router.use(onboardRateLimiter);

// Step 1 — Account creation
router.post("/step-1", accountCreationRules, validate, agentStep1);

// Step 2 — Join workspace via invite code
router.post(
  "/step-2",
  [
    body("sessionId").notEmpty().withMessage("sessionId is required"),
    ...agentJoinWorkspaceRules,
  ],
  validate,
  agentStep2
);

module.exports = router;