const { Ticket } = require("../models/Ticket");
const Message = require("../models/Message");
const FAQ = require("../models/FAQ");

const getAIInsights = async (tenantId) => {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // ── AI message stats ───────────────────────────────────────────
  const [aiMsgStats] = await Message.aggregate([
    { $match: { tenantId, isAiGenerated: true, createdAt: { $gte: since30d } } },
    {
      $group: {
        _id: null,
        totalReplies: { $sum: 1 },
        avgConfidence: { $avg: "$aiConfidence" },
        lowConfidenceCount: {
          $sum: {
            $cond: [{ $lt: ["$aiConfidence", 0.6] }, 1, 0],
          },
        },
      },
    },
  ]);

  // ── Escalated AI tickets (AI couldn't handle) ──────────────────
  const escalatedAI = await Ticket.countDocuments({
    tenantId,
    isAiHandled: true,
    status: "escalated",
    createdAt: { $gte: since30d },
  });

  // ── Top FAQ usage ──────────────────────────────────────────────
  const topFAQs = await FAQ.find({ tenantId, isActive: true })
    .sort({ aiUsageCount: -1 })
    .limit(5)
    .select("question aiUsageCount category")
    .lean();

  // ── AI resolution trend (7d) ───────────────────────────────────
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const aiTrend = await Ticket.aggregate([
    { $match: { tenantId, isAiHandled: true, createdAt: { $gte: since7d } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } },
  ]);

  // ── Learning suggestions (FAQs with 0 usage) ──────────────────
  const unusedFAQs = await FAQ.countDocuments({
    tenantId,
    isActive: true,
    aiUsageCount: 0,
  });

  const suggestions = [];
  if (unusedFAQs > 0) {
    suggestions.push(`${unusedFAQs} FAQ entries have never been used by AI — consider rewriting them.`);
  }
  if ((aiMsgStats?.avgConfidence || 0) < 0.7) {
    suggestions.push("Average AI confidence is below 70%. Consider expanding your knowledge base.");
  }
  if (escalatedAI > 5) {
    suggestions.push(`${escalatedAI} AI-handled tickets were escalated this month. Review common escalation triggers.`);
  }

  return {
    summary: {
      totalAiReplies: aiMsgStats?.totalReplies || 0,
      avgConfidence: aiMsgStats?.avgConfidence
        ? Math.round(aiMsgStats.avgConfidence * 100)
        : 0,
      hallucinationFlags: aiMsgStats?.lowConfidenceCount || 0,
      escalatedByAI: escalatedAI,
    },
    topFAQs,
    aiTrend,
    suggestions,
  };
};

module.exports = { getAIInsights };