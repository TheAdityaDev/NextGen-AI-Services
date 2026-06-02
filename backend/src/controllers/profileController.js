const { User } = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

const get = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, { user: user.toAuthJSON() }, "Profile retrieved.");
});

const update = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { firstName, lastName } },
    { new: true, runValidators: true }
  );

  sendSuccess(res, { user: user.toAuthJSON() }, "Profile updated.");
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  const isValid = await user.comparePassword(currentPassword);

  if (!isValid) throw new AppError("Current password is incorrect.", 401);
  if (newPassword.length < 8) throw new AppError("New password must be at least 8 characters.", 400);

  user.password = newPassword;
  await user.save();

  sendSuccess(res, {}, "Password changed successfully.");
});

const billing = asyncHandler(async (req, res) => {
  const Tenant = require("../models/Tenant");
  const { Ticket } = require("../models/Ticket");

  const [tenant, ticketCount] = await Promise.all([
    Tenant.findOne({ tenantId: req.user.tenantId }).select("plan createdAt"),
    Ticket.countDocuments({ tenantId: req.user.tenantId }),
  ]);

  // Mock payment history for MVP
  const paymentHistory = [];

  sendSuccess(
    res,
    {
      plan: tenant?.plan || "free",
      usage: { tickets: ticketCount },
      paymentHistory,
      memberSince: tenant?.createdAt,
    },
    "Billing info retrieved."
  );
});

module.exports = { get, update, changePassword, billing };