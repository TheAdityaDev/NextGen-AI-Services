const { getConversations, getMessages, sendMessage, summarizeConversation } = require("../services/inboxService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendCreated } = require("../utils/apiResponse");

const listConversations = asyncHandler(async (req, res) => {
  const conversations = await getConversations(req.user.tenantId, req.query);
  sendSuccess(res, { conversations }, "Conversations retrieved.");
});

const getConversation = asyncHandler(async (req, res) => {
  const data = await getMessages(req.user.tenantId, req.params.ticketId);
  sendSuccess(res, data, "Messages retrieved.");
});

const send = asyncHandler(async (req, res) => {
  const { content, senderType = "agent" } = req.body;

  const message = await sendMessage(req.user.tenantId, req.params.ticketId, {
    content,
    senderId: req.user._id,
    senderType,
  });

  // Emit via Socket.io for real-time delivery
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant:${req.user.tenantId}`).emit("message:new", {
      ticketId: req.params.ticketId,
      message,
    });
  }

  sendCreated(res, { message }, "Message sent.");
});

const summarize = asyncHandler(async (req, res) => {
  const summary = await summarizeConversation(req.user.tenantId, req.params.ticketId);
  sendSuccess(res, { summary }, "Conversation summarized.");
});

module.exports = { listConversations, getConversation, send, summarize };