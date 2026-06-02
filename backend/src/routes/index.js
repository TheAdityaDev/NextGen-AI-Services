const express = require("express");
const router = express.Router();

// ─── Phase 1 routes (already exist) ──────────────────────────────
const authRoutes = require("./authRoutes");
const companyOnboardingRoutes = require("./onboarding/companyRoutes");
const agentOnboardingRoutes = require("./onboarding/agentRoutes");

// ─── Phase 2 routes (new) ─────────────────────────────────────────
const dashboardRoutes = require("./dashboardRoutes");
const widgetRoutes = require("./widgetRoutes");

// ─── Services ─────────────────────────────────────────────────────
const aiService = require("../services/aiService");

// ─── Public Routes (no auth required) ────────────────────────────
router.use("/auth", authRoutes);
router.use("/onboard/company", companyOnboardingRoutes);
router.use("/onboard/agent", agentOnboardingRoutes);
router.use("/widget", widgetRoutes);

// Health check (public)
router.get("/health", (req, res) => {
  const aiStatus = {
    enabled: aiService.isAIEnabled(),
    configured: !!process.env.GEMINI_API_KEY,
    autoReplyEnabled: process.env.AI_AUTO_REPLY_ENABLED === 'true',
    confidenceThreshold: process.env.AI_CONFIDENCE_THRESHOLD || 'not set',
  };

  res.json({
    success: true,
    message: "ChatFrame API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    ai: aiStatus,
  });
});

// ─── Protected Routes (auth required) ─────────────────────────────
router.use("/", dashboardRoutes);

module.exports = router;