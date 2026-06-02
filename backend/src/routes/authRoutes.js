const express = require("express");
const router = express.Router();

const { login, getMe, logout } = require("../controllers/authController");
const { loginRules } = require("../validators/onboardingValidators");
const validate = require("../middleware/validate");
const authMiddleware = require("../middleware/authMiddleware");
const { authRateLimiter } = require("../middleware/rateLimiter");

// POST /api/auth/login
router.post("/login", authRateLimiter, loginRules, validate, login);

// GET /api/auth/me — protected
router.get("/me", authMiddleware, getMe);

// POST /api/auth/logout — protected
router.post("/logout", authMiddleware, logout);

module.exports = router;