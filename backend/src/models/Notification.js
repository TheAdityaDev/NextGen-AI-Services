const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "ticket_escalated",
  "ticket_assigned",
  "ticket_resolved",
  "new_message",
  "ai_alert",
  "csat_received",
  "agent_joined",
  "ai_milestone",
];

const notificationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });
notificationSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = { Notification, NOTIFICATION_TYPES };