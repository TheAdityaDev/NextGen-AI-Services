const { v4: uuidv4 } = require("uuid");
const { createSupportAgent } = require("../services/authService");
const { getTenantByInviteCode } = require("../services/tenantService");
const { generateAuthTokens } = require("../utils/jwt");
const {
  setOnboardingSession,
  getOnboardingSession,
  deleteOnboardingSession,
} = require("../services/redisService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendCreated } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

/**
 * POST /api/onboard/agent/step-1
 * Collect agent account details. Store in Redis session.
 */
const agentStep1 = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Early uniqueness check
  const { User } = require("../models/User");
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const sessionId = uuidv4();
  await setOnboardingSession(sessionId, {
    step: 1,
    account: { firstName, lastName, email, password },
  });

  sendSuccess(
    res,
    { sessionId, step: 1, nextStep: 2 },
    "Account details saved. Proceed to join your workspace.",
    200
  );
});

/**
 * POST /api/onboard/agent/step-2
 * Validate invite code, create agent user, link to tenant. Return JWT.
 */
const agentStep2 = asyncHandler(async (req, res) => {
  const { sessionId, inviteCode } = req.body;

  const session = await getOnboardingSession(sessionId);
  if (!session || !session.account) {
    throw new AppError(
      "Onboarding session expired or not found. Please start again.",
      404
    );
  }

  // 1. Validate invite code and find tenant
  const tenant = await getTenantByInviteCode(inviteCode);

  // 2. Create agent user
  const { account } = session;
  const user = await createSupportAgent({
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    password: account.password,
    tenantId: tenant.tenantId,
  });

  // 3. Clean up Redis session
  await deleteOnboardingSession(sessionId);

  // 4. Issue JWT
  const tokens = generateAuthTokens(user);

  sendCreated(
    res,
    {
      user: user.toAuthJSON(),
      workspace: {
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
      },
      tokens,
    },
    `Welcome to ${tenant.companyName}! Your agent account is ready.`
  );
});

module.exports = { agentStep1, agentStep2 };