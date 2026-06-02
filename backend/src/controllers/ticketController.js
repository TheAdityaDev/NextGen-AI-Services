const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  getTicketStatusBreakdown,
} = require("../services/ticketService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendCreated } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

const listTickets = asyncHandler(async (req, res) => {
  const result = await getTickets(req.user.tenantId, req.query);
  sendSuccess(res, result, "Tickets retrieved.");
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await getTicketById(req.user.tenantId, req.params.id);
  sendSuccess(res, { ticket }, "Ticket retrieved.");
});

const create = asyncHandler(async (req, res) => {
  
  // Validate required fields before calling service
  if (!req.body.title || req.body.title.trim() === '') {
    throw new AppError('Title is required', 422);
  }
  
  if (!req.user.tenantId) {
    throw new AppError('User tenant ID is missing', 422);
  }
  
  try {
    const ticket = await createTicket(req.user.tenantId, req.body, req.user._id);
    sendCreated(res, { ticket }, "Ticket created.");
  } catch (error) {
    console.error('❌ Ticket creation error:', {
      name: error.name,
      message: error.message,
      errors: error.errors,
      stack: error.stack
    });
    throw error;
  }
});

const update = asyncHandler(async (req, res) => {
  const ticket = await updateTicket(
    req.user.tenantId,
    req.params.id,
    req.body,
    req.user
  );
  sendSuccess(res, { ticket }, "Ticket updated.");
});

const statusBreakdown = asyncHandler(async (req, res) => {
  const data = await getTicketStatusBreakdown(req.user.tenantId);
  sendSuccess(res, { breakdown: data }, "Status breakdown retrieved.");
});

module.exports = { listTickets, getTicket, create, update, statusBreakdown };