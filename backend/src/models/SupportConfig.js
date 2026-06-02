const mongoose = require("mongoose");

const supportConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    supportHoursOpen: {
      type: String,
      required: [true, "Support open time is required"],
      // e.g. "09:00"
    },
    supportHoursClose: {
      type: String,
      required: [true, "Support close time is required"],
      // e.g. "18:00"
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    outOfHoursMessage: {
      type: String,
      trim: true,
      default:
        "We are currently outside of support hours. We will get back to you as soon as possible.",
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    // Future: days of week, holiday schedules
    supportDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    isLiveChat: {
      type: Boolean,
      default: true,
    },
    isEmailSupport: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const SupportConfig = mongoose.model("SupportConfig", supportConfigSchema);

module.exports = SupportConfig;