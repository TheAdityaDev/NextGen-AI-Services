const mongoose = require("mongoose");

const TICKET_STATUS = ["open", "escalated", "in_progress", "resolved", "closed"];
const TICKET_PRIORITY = ["low", "medium", "high", "urgent"];
const TICKET_CHANNEL = ["live_chat", "email", "widget"];

const ticketSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    ticketNumber: {
      type: Number,
      // Don't make it required since it's auto-generated in pre-save hook
    },
    title: {
      type: String,
      required: [true, "Ticket title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: TICKET_STATUS,
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: TICKET_PRIORITY,
      default: "medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    customerName: {
      type: String,
      trim: true,
      default: "Anonymous",
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    channel: {
      type: String,
      enum: TICKET_CHANNEL,
      default: "live_chat",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    firstResponseAt: {
      type: Date,
      default: null,
    },
    isAiHandled: {
      type: Boolean,
      default: false,
    },
    aiConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for tenant-scoped queries
ticketSchema.index({ tenantId: 1, status: 1 });
ticketSchema.index({ tenantId: 1, assignedTo: 1 });
ticketSchema.index({ tenantId: 1, createdAt: -1 });
ticketSchema.index({ tenantId: 1, ticketNumber: 1 }, { unique: true });

// Auto-increment ticketNumber per tenant
ticketSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    
    const lastTicket = await this.constructor
      .findOne({ tenantId: this.tenantId })
      .sort({ ticketNumber: -1 })
      .select("ticketNumber")
      .lean();

    this.ticketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1001;
    next();
  } catch (error) {
    next(error);
  }
});

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = { Ticket, TICKET_STATUS, TICKET_PRIORITY };