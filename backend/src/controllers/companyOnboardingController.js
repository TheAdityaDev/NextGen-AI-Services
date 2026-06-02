const { v4: uuidv4 } = require("uuid");
const { createCompanyAdmin } = require("../services/authService");
const { createTenant } = require("../services/tenantService");
const SupportConfig = require("../models/SupportConfig");
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
 * POST /api/onboard/company/step-1
 * Collect account creation data. Store in Redis session.
 */
const companyStep1 = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Check email uniqueness early (better UX than failing at the end)
  const { User } = require("../models/User");
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  // Start a new onboarding session
  const sessionId = uuidv4();
  await setOnboardingSession(sessionId, {
    step: 1,
    account: { firstName, lastName, email, password },
  });

  sendSuccess(
    res,
    { sessionId, step: 1, nextStep: 2 },
    "Account details saved. Proceed to company identity.",
    200
  );
});

/**
 * POST /api/onboard/company/step-2
 * Collect company identity. Append to Redis session.
 */
const companyStep2 = asyncHandler(async (req, res) => {
  const { sessionId, companyName, companyWebsite } = req.body;

  const session = await getOnboardingSession(sessionId);
  if (!session) {
    throw new AppError("Onboarding session expired or not found. Please start again.", 404);
  }

  await setOnboardingSession(sessionId, {
    ...session,
    step: 2,
    company: { companyName, companyWebsite },
  });

  sendSuccess(
    res,
    { sessionId, step: 2, nextStep: 3 },
    "Company identity saved. Proceed to company details.",
    200
  );
});

/**
 * POST /api/onboard/company/step-3
 * Collect industry and region. Append to Redis session.
 */
const companyStep3 = asyncHandler(async (req, res) => {
  const { sessionId, industryType, countryRegion } = req.body;

  const session = await getOnboardingSession(sessionId);
  if (!session) {
    throw new AppError("Onboarding session expired or not found. Please start again.", 404);
  }

  await setOnboardingSession(sessionId, {
    ...session,
    step: 3,
    details: { industryType, countryRegion },
  });

  sendSuccess(
    res,
    { sessionId, step: 3, nextStep: 4 },
    "Company details saved. Proceed to support configuration.",
    200
  );
});

/**
 * POST /api/onboard/company/step-4
 * Collect support config. Persist everything to DB. Return JWT.
 * This is the final and only DB write for the entire flow.
 */
const companyStep4 = asyncHandler(async (req, res) => {
  const { sessionId, supportHoursOpen, supportHoursClose, outOfHoursMessage } = req.body;

  const session = await getOnboardingSession(sessionId);
  if (!session || !session.account || !session.company || !session.details) {
    throw new AppError(
      "Incomplete onboarding session. Please complete all steps.",
      400
    );
  }

  const { account, company, details } = session;

  // 1. Create the company admin user
  //    (password hashing handled by User model pre-save hook)
  const user = await createCompanyAdmin({
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    password: account.password,
    tenantId: null, // Will update after tenant creation
  });

  // 2. Create the tenant
  const tenant = await createTenant({
    companyName: company.companyName,
    companyWebsite: company.companyWebsite,
    industryType: details.industryType,
    countryRegion: details.countryRegion,
    createdBy: user._id,
  });

  // 3. Link user to tenant
  user.tenantId = tenant.tenantId;
  await user.save({ validateBeforeSave: false });

  // 4. Create support config
  await SupportConfig.create({
    tenantId: tenant.tenantId,
    supportHoursOpen,
    supportHoursClose,
    outOfHoursMessage: outOfHoursMessage || undefined,
  });

  // 5. Clean up Redis session
  await deleteOnboardingSession(sessionId);

  // 6. Issue JWT
  const tokens = generateAuthTokens(user);

  sendCreated(
    res,
    {
      user: user.toAuthJSON(),
      tenant: {
        tenantId: tenant.tenantId,
        inviteCode: tenant.inviteCode,
        companyName: tenant.companyName,
      },
      tokens,
    },
    "Company onboarding complete. Welcome to ChatFrame!"
  );
});

module.exports = { companyStep1, companyStep2, companyStep3, companyStep4 };