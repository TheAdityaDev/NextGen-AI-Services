const { getWidgetConfig, updateWidgetConfig, generateEmbedScript } = require("../services/widgetService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const get = asyncHandler(async (req, res) => {
  const config = await getWidgetConfig(req.user.tenantId);
  const embedScript = generateEmbedScript(config.widgetKey, config);
  sendSuccess(res, { config, embedScript }, "Widget config retrieved.");
});

const update = asyncHandler(async (req, res) => {
  const config = await updateWidgetConfig(req.user.tenantId, req.body);
  const embedScript = generateEmbedScript(config.widgetKey, config);
  sendSuccess(res, { config, embedScript }, "Widget config updated.");
});

module.exports = { get, update };