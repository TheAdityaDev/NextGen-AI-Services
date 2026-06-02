const CSAT = require("../models/CSAT");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendCreated } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, rating } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = { tenantId: req.user.tenantId };
  if (rating) filter.rating = parseInt(rating);

  const [responses, total] = await Promise.all([
    CSAT.find(filter)
      .populate("agentId", "firstName lastName")
      .populate("ticketId", "ticketNumber title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    CSAT.countDocuments(filter),
  ]);

  // Overall average
  const [avgResult] = await CSAT.aggregate([
    { $match: { tenantId: req.user.tenantId } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        negative: { $sum: { $cond: ["$isNegative", 1, 0] } },
        total: { $sum: 1 },
      },
    },
  ]);

  sendSuccess(
    res,
    {
      responses,
      total,
      summary: {
        avg: avgResult ? Math.round(avgResult.avg * 10) / 10 : 0,
        negativeCount: avgResult?.negative || 0,
        totalResponses: avgResult?.total || 0,
      },
    },
    "CSAT data retrieved."
  );
});

const submit = asyncHandler(async (req, res) => {
  const { ticketId, rating, feedback, customerEmail, customerName, agentId } = req.body;

  const existing = await CSAT.findOne({ ticketId });
  if (existing) throw new AppError("CSAT already submitted for this ticket.", 409);

  const csat = await CSAT.create({
    tenantId: req.user.tenantId,
    ticketId,
    rating,
    feedback,
    customerEmail,
    customerName,
    agentId,
  });

  sendCreated(res, { csat }, "CSAT submitted. Thank you for your feedback!");
});

module.exports = { list, submit };