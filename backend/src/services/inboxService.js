const { Ticket } = require("../models/Ticket");
const Message = require("../models/Message");
const AppError = require("../utils/AppError");
const aiService = require("./aiService");

/**
 * Get conversation list (open + in_progress tickets with last message).
 */
const getConversations = async (tenantId, query = {}) => {
  const { status = "open,in_progress", page = 1, limit = 30 } = query;

  const statuses = status.split(",").map((s) => s.trim());
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tickets = await Ticket.find({ tenantId, status: { $in: statuses }, isAiHandled: { $ne: true } })
    .populate("assignedTo", "firstName lastName")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Attach last message to each ticket
  const ticketIds = tickets.map((t) => t._id);
  const lastMessages = await Message.aggregate([
    { $match: { ticketId: { $in: ticketIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$ticketId",
        content: { $first: "$content" },
        senderType: { $first: "$senderType" },
        createdAt: { $first: "$createdAt" },
      },
    },
  ]);

  const lastMsgMap = {};
  lastMessages.forEach((m) => {
    lastMsgMap[m._id.toString()] = {
      content: m.content,
      senderType: m.senderType,
      createdAt: m.createdAt,
    };
  });

  const conversations = tickets.map((t) => ({
    ...t,
    lastMessage: lastMsgMap[t._id.toString()] || null,
  }));

  return conversations;
};

/**
 * Get all messages for a ticket (conversation thread).
 */
const getMessages = async (tenantId, ticketId) => {
  // Verify ticket belongs to tenant
  const ticket = await Ticket.findOne({ _id: ticketId, tenantId })
    .populate("assignedTo", "firstName lastName");
  if (!ticket) throw new AppError("Conversation not found.", 404);

  const messages = await Message.find({ tenantId, ticketId })
    .populate("senderId", "firstName lastName role")
    .sort({ createdAt: 1 })
    .lean();

  return { ticket, messages };
};

/**
 * Send a message in a ticket conversation.
 */
const sendMessage = async (tenantId, ticketId, { content, senderId, senderType, isAiGenerated = false, aiConfidence = null }) => {
  const ticket = await Ticket.findOne({ _id: ticketId, tenantId });
  if (!ticket) throw new AppError("Ticket not found.", 404);

  const message = await Message.create({
    tenantId,
    ticketId,
    senderId: senderId || null,
    senderType,
    content,
    isAiGenerated,
    aiConfidence,
  });

  // If agent responds, make sure ticket is no longer marked as AI handled
  if (senderType === "agent") {
    ticket.isAiHandled = false;
    
    // Set firstResponseAt if agent responds for the first time
    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }

    // Move ticket to in_progress when agent first responds
    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save({ validateBeforeSave: false });
  }

  await message.populate("senderId", "firstName lastName role");

  return message;
};

/**
 * Generate AI summary of a conversation thread.
 */
const summarizeConversation = async (tenantId, ticketId) => {
  const { ticket, messages } = await getMessages(tenantId, ticketId);
  
  if (!messages || messages.length === 0) {
    return "No messages in this conversation yet.";
  }

  const summary = await aiService.generateSummary(messages);
  return summary;
};

module.exports = { getConversations, getMessages, sendMessage, summarizeConversation };