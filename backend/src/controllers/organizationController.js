const Tenant = require("../models/Tenant");
const SupportConfig = require("../models/SupportConfig");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const get = asyncHandler(async (req, res) => {
  const [tenant, supportConfig] = await Promise.all([
    Tenant.findOne({ tenantId: req.user.tenantId }),
    SupportConfig.findOne({ tenantId: req.user.tenantId }),
  ]);

  sendSuccess(res, { tenant, supportConfig }, "Organization settings retrieved.");
});

const update = asyncHandler(async (req, res) => {
  const { companyName, companyWebsite, companyLogo, industryType, countryRegion,
          supportHoursOpen, supportHoursClose, outOfHoursMessage, timezone } = req.body;

  const tenantUpdates = {};
  if (companyName) tenantUpdates.companyName = companyName;
  if (companyWebsite !== undefined) tenantUpdates.companyWebsite = companyWebsite;
  if (companyLogo !== undefined) tenantUpdates.companyLogo = companyLogo;
  if (industryType) tenantUpdates.industryType = industryType;
  if (countryRegion) tenantUpdates.countryRegion = countryRegion;

  const configUpdates = {};
  if (supportHoursOpen) configUpdates.supportHoursOpen = supportHoursOpen;
  if (supportHoursClose) configUpdates.supportHoursClose = supportHoursClose;
  if (outOfHoursMessage !== undefined) configUpdates.outOfHoursMessage = outOfHoursMessage;
  if (timezone) configUpdates.timezone = timezone;

  const [tenant, supportConfig] = await Promise.all([
    Tenant.findOneAndUpdate(
      { tenantId: req.user.tenantId },
      { $set: tenantUpdates },
      { new: true }
    ),
    SupportConfig.findOneAndUpdate(
      { tenantId: req.user.tenantId },
      { $set: configUpdates },
      { new: true }
    ),
  ]);

  sendSuccess(res, { tenant, supportConfig }, "Organization settings updated.");
});

module.exports = { get, update };