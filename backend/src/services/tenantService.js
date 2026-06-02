const Tenant = require("../models/Tenant");
const { generateTenantId, generateInviteCode } = require("../utils/tenantUtils");
const AppError = require("../utils/AppError");

/**
 * Create a new tenant document.
 * Retries invite code generation on collision (extremely rare).
 */
const createTenant = async ({
  companyName,
  companyWebsite,
  companyLogo,
  industryType,
  countryRegion,
  createdBy,
}) => {
  const tenantId = generateTenantId(companyName);

  // Generate unique invite code with collision retry
  let inviteCode;
  let attempts = 0;
  while (attempts < 5) {
    inviteCode = generateInviteCode();
    const existing = await Tenant.findOne({ inviteCode });
    if (!existing) break;
    attempts++;
  }

  if (!inviteCode) {
    throw new AppError("Failed to generate a unique invite code. Please try again.", 500);
  }

  const tenant = await Tenant.create({
    tenantId,
    inviteCode,
    companyName,
    companyWebsite: companyWebsite || null,
    companyLogo: companyLogo || null,
    industryType: industryType || null,
    countryRegion: countryRegion || null,
    createdBy,
  });

  return tenant;
};

/**
 * Find a tenant by its unique tenantId.
 */
const getTenantById = async (tenantId) => {
  const tenant = await Tenant.findOne({ tenantId });
  if (!tenant) throw new AppError("Tenant not found.", 404);
  return tenant;
};

/**
 * Find and validate a tenant by invite code.
 * Used by agents joining a workspace.
 */
const getTenantByInviteCode = async (inviteCode) => {
  const normalized = inviteCode.trim().toUpperCase();
  const tenant = await Tenant.findOne({ inviteCode: normalized, isActive: true });

  if (!tenant) {
    throw new AppError(
      "Invalid or expired invite code. Please check with your company admin.",
      404
    );
  }

  return tenant;
};

module.exports = { createTenant, getTenantById, getTenantByInviteCode };