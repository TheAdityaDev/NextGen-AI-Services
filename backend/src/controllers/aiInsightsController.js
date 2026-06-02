const { getAIInsights } = require("../services/aiInsightsService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const get = asyncHandler(async (req, res) => {
  const data = await getAIInsights(req.user.tenantId);
  sendSuccess(res, data, "AI insights retrieved.");
});

module.exports = { get };