const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      maxlength: [500, "Question cannot exceed 500 characters"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    aiUsageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ tenantId: 1, isActive: 1 });
faqSchema.index({ tenantId: 1, category: 1 });
// Text index for search
faqSchema.index({ question: "text", answer: "text" });

const FAQ = mongoose.model("FAQ", faqSchema);
module.exports = FAQ;