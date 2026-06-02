const mongoose = require("mongoose");

const csatSchema = new mongoose.Schema(
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
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Feedback cannot exceed 1000 characters"],
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    customerName: {
      type: String,
      trim: true,
      default: "Anonymous",
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isNegative: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-flag negative ratings
csatSchema.pre("save", function (next) {
  this.isNegative = this.rating <= 2;
  next();
});

csatSchema.index({ tenantId: 1, createdAt: -1 });
csatSchema.index({ tenantId: 1, rating: 1 });
csatSchema.index({ ticketId: 1 }, { unique: true }); // one CSAT per ticket

const CSAT = mongoose.model("CSAT", csatSchema);
module.exports = CSAT;