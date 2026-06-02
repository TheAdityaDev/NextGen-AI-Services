const { v4: uuidv4 } = require("uuid");

/**
 * Generate a unique tenantId from company name.
 * Format: cf_<slug>_<random6>
 * Example: cf_nike_a82x91
 */
const generateTenantId = (companyName) => {
  const slug = companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "_")  // replace non-alphanumeric with underscore
    .replace(/_+/g, "_")          // collapse multiple underscores
    .replace(/^_|_$/g, "")        // trim leading/trailing underscores
    .slice(0, 20);                 // max 20 chars for slug

  const random = uuidv4().replace(/-/g, "").slice(0, 6);

  return `cf_${slug}_${random}`;
};

/**
 * Generate a unique invite code for the company.
 * Format: CF-XXXXXXXX (uppercase alphanumeric)
 * Example: CF-92KDL2A3
 */
const generateInviteCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "CF-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = { generateTenantId, generateInviteCode };