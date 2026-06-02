const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    companyWebsite: {
      type: String,
      trim: true,
      default: null,
    },
    companyLogo: {
      type: String, // URL or file path
      default: null,
    },
    industryType: {
      type: String,
      trim: true,
      default: null,
    },
    countryRegion: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    plan: {
      type: String,
      enum: ["free", "starter", "pro", "enterprise"],
      default: "free",
    },
    // Future: agent seat limits, billing, etc.
    settings: {
      maxAgents: { type: Number, default: 5 },
      maxConversations: { type: Number, default: 500 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Tenant = mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;