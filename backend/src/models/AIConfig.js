const mongoose = require("mongoose");

const aiConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    autoEscalation: {
      type: Boolean,
      default: true,
    },
    suggestedReplies: {
      type: Boolean,
      default: true,
    },
    confidenceThreshold: {
      type: Number,
      default: 0.75,
      min: 0,
      max: 1,
    },
    responseTone: {
      type: String,
      enum: ["professional", "friendly", "formal", "casual"],
      default: "professional",
    },
    systemPrompt: {
      type: String,
      trim: true,
      default:
        "You are a helpful customer support assistant. Be concise, polite, and accurate. Always refer to the knowledge base before answering.",
      maxlength: [2000, "System prompt cannot exceed 2000 characters"],
    },
    escalationKeywords: {
      type: [String],
      default: ["refund", "cancel", "angry", "lawsuit", "fraud"],
    },
    maxAiRepliesPerTicket: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

const AIConfig = mongoose.model("AIConfig", aiConfigSchema);
module.exports = AIConfig;