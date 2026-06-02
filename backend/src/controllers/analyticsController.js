const { getAnalyticsOverview } = require("../services/analyticsService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const overview = asyncHandler(async (req, res) => {
  const { range = "30d" } = req.query;
  const data = await getAnalyticsOverview(req.user.tenantId, range);
  sendSuccess(res, data, "Analytics retrieved.");
});

module.exports = { overview };