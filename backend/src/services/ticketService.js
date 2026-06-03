const { Ticket, TICKET_STATUS } = require("../models/Ticket");
const { Notification } = require("../models/Notification");
const AppError = require("../utils/AppError");

/**
 * Get paginated, filtered ticket list for a tenant.
 */
const getTickets = async (tenantId, query = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    priority,
    assignedTo,
    channel,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = { tenantId };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (channel) filter.channel = channel;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { customerEmail: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortDir = sortOrder === "asc" ? 1 : -1;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName")
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get a single ticket by ID with messages.
 */
const getTicketById = async (tenantId, ticketId) => {
  const ticket = await Ticket.findOne({ _id: ticketId, tenantId })
    .populate("assignedTo", "firstName lastName email role")
    .populate("createdBy", "firstName lastName");

  if (!ticket) throw new AppError("Ticket not found.", 404);
  return ticket;
};

/**
 * Create a new ticket.
 */
const createTicket = async (tenantId, data, createdBy = null) => {
  
  try {
    const ticket = await Ticket.create({
      tenantId,
      ...data,
      createdBy,
    });
    
    return ticket;
  } catch (error) {
    throw error;
  }
};

/**
 * Update ticket fields (status, priority, assignedTo, etc.)
 */
const updateTicket = async (tenantId, ticketId, updates, actor) => {
  const ticket = await Ticket.findOne({ _id: ticketId, tenantId });
  if (!ticket) throw new AppError("Ticket not found.", 404);

  const actorId = actor?._id || actor;
  const actorRole = actor?.role;
  const prevStatus = ticket.status;

  // RBAC checks: agents can only update status or assign the ticket to themselves
  if (actorRole === "support_agent") {
    const allowedFields = ["status", "assignedTo"];
    const attemptedFields = Object.keys(updates);
    const invalidFields = attemptedFields.filter(
      (f) => !allowedFields.includes(f) && updates[f] !== undefined && String(updates[f]) !== String(ticket[f])
    );
    if (invalidFields.length > 0) {
      throw new AppError("Support agents are only authorized to update ticket status or assign tickets to themselves.", 403);
    }
    if (updates.assignedTo && String(updates.assignedTo) !== String(actorId)) {
      throw new AppError("Support agents can only assign tickets to themselves.", 403);
    }
  }

  // Apply updates
  Object.assign(ticket, updates);

  // Set resolvedAt when moving to resolved/closed
  if (
    ["resolved", "closed"].includes(updates.status) &&
    !["resolved", "closed"].includes(prevStatus)
  ) {
    ticket.resolvedAt = new Date();
  }

  await ticket.save();

  // Populate references for the API response
  await ticket.populate("assignedTo", "firstName lastName email role");
  await ticket.populate("createdBy", "firstName lastName");

  // Emit notification on escalation
  if (updates.status === "escalated" && prevStatus !== "escalated") {
    await Notification.create({
      tenantId,
      userId: ticket.assignedTo || actorId,
      type: "ticket_escalated",
      title: "Ticket Escalated",
      message: `Ticket #${ticket.ticketNumber} has been escalated.`,
      metadata: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
    });
  }

  // Notification on assignment
  if (updates.assignedTo && updates.assignedTo !== String(ticket.assignedTo)) {
    await Notification.create({
      tenantId,
      userId: updates.assignedTo,
      type: "ticket_assigned",
      title: "Ticket Assigned",
      message: `Ticket #${ticket.ticketNumber} has been assigned to you.`,
      metadata: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
    });
  }

  return ticket;
};

/**
 * Get ticket status distribution for a tenant.
 */
const getTicketStatusBreakdown = async (tenantId) => {
  return Ticket.aggregate([
    { $match: { tenantId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { status: "$_id", count: 1, _id: 0 } },
  ]);
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  getTicketStatusBreakdown,
};