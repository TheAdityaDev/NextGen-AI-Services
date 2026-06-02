const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

// Controllers
const dashboardController = require("../controllers/dashboardController");
const ticketController = require("../controllers/ticketController");
const inboxController = require("../controllers/inboxController");
const analyticsController = require("../controllers/analyticsController");
const aiConfigController = require("../controllers/aiConfigController");
const aiInsightsController = require("../controllers/aiInsightsController");
const widgetController = require("../controllers/widgetController");
const teamController = require("../controllers/teamController");
const notificationController = require("../controllers/notificationController");
const csatController = require("../controllers/csatController");
const organizationController = require("../controllers/organizationController");
const profileController = require("../controllers/profileController");

// All routes below require authentication
router.use(authMiddleware);

// ─── Dashboard ────────────────────────────────────────────────────
router.get("/dashboard/overview", dashboardController.overview);

// ─── Tickets ──────────────────────────────────────────────────────
router.get("/tickets", ticketController.listTickets);
router.post("/tickets", ticketController.create);
router.get("/tickets/status-breakdown", ticketController.statusBreakdown);
router.get("/tickets/:id", ticketController.getTicket);
router.patch("/tickets/:id", ticketController.update);

// ─── Inbox / Live Chat ────────────────────────────────────────────
router.get("/inbox/conversations", inboxController.listConversations);
router.get("/inbox/:ticketId", inboxController.getConversation);
router.post("/inbox/:ticketId/send", inboxController.send);
router.post("/inbox/:ticketId/summarize", inboxController.summarize);

// ─── Analytics ────────────────────────────────────────────────────
router.get("/analytics/overview", analyticsController.overview);

// ─── AI Config ────────────────────────────────────────────────────
router.get("/ai-config", aiConfigController.get);
router.patch("/ai-config", roleMiddleware("company_admin"), aiConfigController.update);

// ─── AI Insights ──────────────────────────────────────────────────
router.get("/ai-insights", aiInsightsController.get);

// ─── Widget Config ────────────────────────────────────────────────
router.get("/widget-config", widgetController.get);
router.patch("/widget-config", roleMiddleware("company_admin"), widgetController.update);

// ─── Team ─────────────────────────────────────────────────────────
router.get("/team", roleMiddleware("company_admin"), teamController.list);
router.get("/team/invite-code", roleMiddleware("company_admin"), teamController.getInviteCode);

// ─── Notifications ────────────────────────────────────────────────
router.get("/notifications", notificationController.list);
router.patch("/notifications/mark-read", notificationController.markRead);

// ─── CSAT ─────────────────────────────────────────────────────────
router.get("/csat", roleMiddleware("company_admin"), csatController.list);
router.post("/csat", csatController.submit);

// ─── Organization Settings ────────────────────────────────────────
router.get("/organization", roleMiddleware("company_admin"), organizationController.get);
router.patch("/organization", roleMiddleware("company_admin"), organizationController.update);

// ─── Profile ──────────────────────────────────────────────────────
router.get("/profile", profileController.get);
router.patch("/profile", profileController.update);
router.patch("/profile/password", profileController.changePassword);

// ─── Billing ──────────────────────────────────────────────────────
router.get("/billing", roleMiddleware("company_admin"), profileController.billing);

module.exports = router;