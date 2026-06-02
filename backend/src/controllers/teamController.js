const { getTeamMembers } = require("../services/teamService");
const { getTenantByInviteCode } = require("../services/tenantService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const list = asyncHandler(async (req, res) => {
  const members = await getTeamMembers(req.user.tenantId);
  sendSuccess(res, { members }, "Team retrieved.");
});

// Returns the tenant's invite code so admin can share it
const getInviteCode = asyncHandler(async (req, res) => {
  const Tenant = require("../models/Tenant");
  const tenant = await Tenant.findOne({ tenantId: req.user.tenantId }).select("inviteCode companyName");
  sendSuccess(res, { inviteCode: tenant.inviteCode, companyName: tenant.companyName }, "Invite code retrieved.");
});

module.exports = { list, getInviteCode };