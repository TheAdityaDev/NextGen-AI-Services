const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const widgetConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    widgetKey: {
      type: String,
      unique: true,
      default: () => `cfwk_${uuidv4().replace(/-/g, "").slice(0, 20)}`,
    },
    primaryColor: {
      type: String,
      default: "#6366f1",
      match: [/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"],
    },
    welcomeMessage: {
      type: String,
      trim: true,
      default: "👋 Hi there! How can we help you today?",
      maxlength: [200, "Welcome message cannot exceed 200 characters"],
    },
    widgetPosition: {
      type: String,
      enum: ["bottom-right", "bottom-left"],
      default: "bottom-right",
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    offlineMessage: {
      type: String,
      trim: true,
      default: "We are currently offline. Leave us a message and we will get back to you.",
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    companyLogo: {
      type: String,
      default: null,
    },
    showBranding: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const WidgetConfig = mongoose.model("WidgetConfig", widgetConfigSchema);
module.exports = WidgetConfig;