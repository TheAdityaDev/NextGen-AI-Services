const AIConfig = require("../models/AIConfig");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const get = asyncHandler(async (req, res) => {
  let config = await AIConfig.findOne({ tenantId: req.user.tenantId });
  if (!config) {
    // Seed defaults on first access
    config = await AIConfig.create({ tenantId: req.user.tenantId });
  }
  sendSuccess(res, { config }, "AI config retrieved.");
});

const update = asyncHandler(async (req, res) => {
  const config = await AIConfig.findOneAndUpdate(
    { tenantId: req.user.tenantId },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );
  sendSuccess(res, { config }, "AI config updated.");
});

module.exports = { get, update };