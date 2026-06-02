const { Ticket } = require("../models/Ticket");
const Message = require("../models/Message");
const CSAT = require("../models/CSAT");

/**
 * Get full dashboard overview for a tenant.
 * Uses MongoDB aggregation pipelines for performance.
 */
const getDashboardOverview = async (tenantId) => {
  const now = new Date();
  const startOf30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const startOf7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // ── Core ticket stats ──────────────────────────────────────────
  const [ticketStats] = await Ticket.aggregate([
    { $match: { tenantId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        escalated: { $sum: { $cond: [{ $eq: ["$status", "escalated"] }, 1, 0] } },
        aiHandled: { $sum: { $cond: ["$isAiHandled", 1, 0] } },
        avgConfidence: { $avg: "$aiConfidence" },
      },
    },
  ]);

  const stats = ticketStats || {
    total: 0, open: 0, inProgress: 0,
    resolved: 0, escalated: 0, aiHandled: 0, avgConfidence: 0,
  };

  const aiResolutionRate = stats.total > 0
    ? Math.round((stats.aiHandled / stats.total) * 100)
    : 0;

  // ── CSAT average ───────────────────────────────────────────────
  const [csatStats] = await CSAT.aggregate([
    { $match: { tenantId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const csatScore = csatStats ? Math.round(csatStats.avg * 10) / 10 : 0;

  // ── Avg response time (minutes) ────────────────────────────────
  const [responseStats] = await Ticket.aggregate([
    { $match: { tenantId, firstResponseAt: { $ne: null } } },
    {
      $project: {
        responseMinutes: {
          $divide: [
            { $subtract: ["$firstResponseAt", "$createdAt"] },
            60000,
          ],
        },
      },
    },
    { $group: { _id: null, avg: { $avg: "$responseMinutes" } } },
  ]);

  const avgResponseTime = responseStats
    ? Math.round(responseStats.avg)
    : 0;

  // ── 7-day ticket trend ─────────────────────────────────────────
  const ticketTrend = await Ticket.aggregate([
    { $match: { tenantId, createdAt: { $gte: startOf7Days } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } },
  ]);

  // ── Recent activity (last 10 tickets) ─────────────────────────
  const recentActivity = await Ticket.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("ticketNumber title status priority customerName createdAt channel")
    .lean();

  // ── Active conversations (open + in_progress) ─────────────────
  const activeConversations = stats.open + stats.inProgress;

  return {
    summary: {
      totalTickets: stats.total,
      activeConversations,
      aiResolutionRate,
      csatScore,
      avgResponseTime,
      escalated: stats.escalated,
    },
    ticketTrend,
    recentActivity,
    aiMetrics: {
      aiHandled: stats.aiHandled,
      avgConfidence: stats.avgConfidence
        ? Math.round(stats.avgConfidence * 100)
        : 0,
    },
  };
};

module.exports = { getDashboardOverview };