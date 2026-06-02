const { Notification } = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {
    tenantId: req.user.tenantId,
    userId: req.user._id,
  };
  if (unreadOnly === "true") filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({
      tenantId: req.user.tenantId,
      userId: req.user._id,
      isRead: false,
    }),
  ]);

  sendSuccess(res, { notifications, total, unreadCount }, "Notifications retrieved.");
});

const markRead = asyncHandler(async (req, res) => {
  const { ids } = req.body; // array of notification IDs, or empty to mark all

  const filter = {
    tenantId: req.user.tenantId,
    userId: req.user._id,
  };
  if (ids && ids.length > 0) filter._id = { $in: ids };

  await Notification.updateMany(filter, { $set: { isRead: true } });
  sendSuccess(res, {}, "Notifications marked as read.");
});

module.exports = { list, markRead };