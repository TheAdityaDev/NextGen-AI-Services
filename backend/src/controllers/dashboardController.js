const { getDashboardOverview } = require("../services/dashboardService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const overview = asyncHandler(async (req, res) => {
  const data = await getDashboardOverview(req.user.tenantId);
  sendSuccess(res, data, "Dashboard overview retrieved.");
});

module.exports = { overview };