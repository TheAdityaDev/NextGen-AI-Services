const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    senderType: {
      type: String,
      enum: ["agent", "customer", "ai"],
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    aiConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    attachments: {
      type: [String], // URLs
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ tenantId: 1, ticketId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;