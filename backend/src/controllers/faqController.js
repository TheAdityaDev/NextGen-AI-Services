const FAQ = require("../models/FAQ");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendCreated } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

const list = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 50 } = req.query;
  const tenantId = req.user.tenantId;

  const filter = { tenantId, isActive: true };
  if (category) filter.category = category;
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [faqs, total] = await Promise.all([
    FAQ.find(filter)
      .sort({ aiUsageCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    FAQ.countDocuments(filter),
  ]);

  // Get unique categories for this tenant
  const categories = await FAQ.distinct("category", { tenantId, isActive: true });

  sendSuccess(res, { faqs, total, categories }, "FAQs retrieved.");
});

const create = asyncHandler(async (req, res) => {
  const faq = await FAQ.create({
    tenantId: req.user.tenantId,
    ...req.body,
  });
  sendCreated(res, { faq }, "FAQ created.");
});

const update = asyncHandler(async (req, res) => {
  const faq = await FAQ.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!faq) throw new AppError("FAQ not found.", 404);
  sendSuccess(res, { faq }, "FAQ updated.");
});

const remove = asyncHandler(async (req, res) => {
  const faq = await FAQ.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    { $set: { isActive: false } },
    { new: true }
  );
  if (!faq) throw new AppError("FAQ not found.", 404);
  sendSuccess(res, {}, "FAQ deleted.");
});

module.exports = { list, create, update, remove };