const { User } = require("../models/User");
const { Ticket } = require("../models/Ticket");
const CSAT = require("../models/CSAT");
const AppError = require("../utils/AppError");
const { getRedis } = require("../config/redis");

/**
 * Get all agents for a tenant with their ticket counts and CSAT.
 */
const getTeamMembers = async (tenantId) => {
  const users = await User.find({
    tenantId,
    role: { $in: ["company_admin", "support_agent"] },
    isActive: true,
  })
    .select("firstName lastName email role isVerified lastLoginAt createdAt")
    .lean();

  const userIds = users.map((u) => u._id);

  // Ticket counts per agent
  const ticketCounts = await Ticket.aggregate([
    { $match: { tenantId, assignedTo: { $in: userIds } } },
    {
      $group: {
        _id: "$assignedTo",
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
      },
    },
  ]);

  const ticketMap = {};
  ticketCounts.forEach((t) => {
    ticketMap[t._id.toString()] = {
      total: t.total,
      open: t.open,
      resolved: t.resolved,
    };
  });

  // CSAT per agent
  const csatPerAgent = await CSAT.aggregate([
    { $match: { tenantId, agentId: { $in: userIds } } },
    { $group: { _id: "$agentId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const csatMap = {};
  csatPerAgent.forEach((c) => {
    csatMap[c._id.toString()] = {
      avg: Math.round(c.avg * 10) / 10,
      count: c.count,
    };
  });

  // Online status from Redis
  let onlineMap = {};
  try {
    const redis = getRedis();
    const pipeline = redis.pipeline();
    users.forEach((u) => pipeline.exists(`user:session:${u._id}`));
    const results = await pipeline.exec();
    users.forEach((u, i) => {
      onlineMap[u._id.toString()] = results[i][1] === 1;
    });
  } catch {
    // Redis unavailable — default all offline
  }

  return users.map((u) => ({
    ...u,
    tickets: ticketMap[u._id.toString()] || { total: 0, open: 0, resolved: 0 },
    csat: csatMap[u._id.toString()] || { avg: 0, count: 0 },
    isOnline: onlineMap[u._id.toString()] || false,
  }));
};

module.exports = { getTeamMembers };