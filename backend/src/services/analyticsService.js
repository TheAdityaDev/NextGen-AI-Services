const { Ticket } = require("../models/Ticket");
const Message = require("../models/Message");
const CSAT = require("../models/CSAT");
const { User } = require("../models/User");

const getAnalyticsOverview = async (tenantId, range = "30d") => {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // ── Volume by day ──────────────────────────────────────────────
  const volumeByDay = await Ticket.aggregate([
    { $match: { tenantId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        aiHandled: { $sum: { $cond: ["$isAiHandled", 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", total: 1, resolved: 1, aiHandled: 1, _id: 0 } },
  ]);

  // ── Status breakdown ───────────────────────────────────────────
  const statusBreakdown = await Ticket.aggregate([
    { $match: { tenantId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { status: "$_id", count: 1, _id: 0 } },
  ]);

  // ── Channel breakdown ──────────────────────────────────────────
  const channelBreakdown = await Ticket.aggregate([
    { $match: { tenantId, createdAt: { $gte: since } } },
    { $group: { _id: "$channel", count: { $sum: 1 } } },
    { $project: { channel: "$_id", count: 1, _id: 0 } },
  ]);

  // ── AI vs Human ────────────────────────────────────────────────
  const [aiStats] = await Ticket.aggregate([
    { $match: { tenantId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        aiHandled: { $sum: { $cond: ["$isAiHandled", 1, 0] } },
        escalated: { $sum: { $cond: [{ $eq: ["$status", "escalated"] }, 1, 0] } },
      },
    },
  ]);

  // ── Agent performance ──────────────────────────────────────────
  const agentPerformance = await Ticket.aggregate([
    {
      $match: {
        tenantId,
        assignedTo: { $ne: null },
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: "$assignedTo",
        totalAssigned: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $ne: ["$firstResponseAt", null] },
              {
                $divide: [
                  { $subtract: ["$firstResponseAt", "$createdAt"] },
                  60000,
                ],
              },
              null,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "agent",
      },
    },
    { $unwind: "$agent" },
    {
      $project: {
        agentId: "$_id",
        name: { $concat: ["$agent.firstName", " ", "$agent.lastName"] },
        totalAssigned: 1,
        resolved: 1,
        resolutionRate: {
          $round: [
            { $multiply: [{ $divide: ["$resolved", "$totalAssigned"] }, 100] },
            0,
          ],
        },
        avgResponseTime: { $round: ["$avgResponseTime", 0] },
        _id: 0,
      },
    },
    { $sort: { resolved: -1 } },
    { $limit: 10 },
  ]);

  // ── Busiest hours ──────────────────────────────────────────────
  const busiestHours = await Ticket.aggregate([
    { $match: { tenantId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        count: { $sum: 1 },
      },
    },
    { $project: { hour: "$_id", count: 1, _id: 0 } },
    { $sort: { hour: 1 } },
  ]);

  // ── CSAT trend ─────────────────────────────────────────────────
  const csatTrend = await CSAT.aggregate([
    { $match: { tenantId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", avg: { $round: ["$avg", 1] }, count: 1, _id: 0 } },
  ]);

  const totalTickets = aiStats?.total || 0;
  const aiHandled = aiStats?.aiHandled || 0;

  return {
    volumeByDay,
    statusBreakdown,
    channelBreakdown,
    aiVsHuman: {
      aiHandled,
      humanHandled: totalTickets - aiHandled,
      escalationRate: totalTickets > 0
        ? Math.round(((aiStats?.escalated || 0) / totalTickets) * 100)
        : 0,
      aiRate: totalTickets > 0
        ? Math.round((aiHandled / totalTickets) * 100)
        : 0,
    },
    agentPerformance,
    busiestHours,
    csatTrend,
    range,
  };
};

module.exports = { getAnalyticsOverview };