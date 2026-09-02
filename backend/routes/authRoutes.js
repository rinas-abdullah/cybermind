const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
} = require("../middleware/validation");
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
} = require("../controllers/authController");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/auth/register", registerLimiter, validateRegister, register);
router.post("/auth/signup", registerLimiter, validateRegister, register);
router.post("/auth/login", loginLimiter, validateLogin, login);
router.post("/auth/logout", requireAuth, logout);
router.get("/auth/me", requireAuth, getProfile);
router.get("/auth/profile", requireAuth, getProfile);
router.put(
  "/auth/profile/:username",
  requireAuth,
  validateProfileUpdate,
  updateProfile
);

module.exports = router;
