const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { validatePressureAttempt } = require("../middleware/validation");
const { successResponse, errorResponse } = require("../utils/responseUtils");
const { recordAttempt, getUserAttempts } = require("../data/pressureAttempts");

const router = express.Router();

router.post("/pressure/attempt", requireAuth, validatePressureAttempt, async (req, res) => {
  try {
    const attempt = await recordAttempt(req.user.userId, req.body);
    if (!attempt) {
      return errorResponse(res, "Invalid pressure attempt", 400);
    }
    return successResponse(res, attempt, "Pressure attempt recorded");
  } catch (error) {
    console.error("Record pressure attempt error:", error);
    return errorResponse(res, "Failed to record pressure attempt", 500);
  }
});

router.get("/pressure/stats", requireAuth, async (req, res) => {
  try {
    const attempts = await getUserAttempts(req.user.userId);
    const completedAttempts = attempts.filter((a) => a.completed);

    const stats = {
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      successRate: attempts.length
        ? Math.round((completedAttempts.length / attempts.length) * 100)
        : 0,
      averageRemainingMs: completedAttempts.length
        ? Math.round(
            completedAttempts.reduce((sum, a) => sum + (a.remainingMs || 0), 0) /
              completedAttempts.length
          )
        : 0,
    };

    return successResponse(res, stats, "Pressure stats computed");
  } catch (error) {
    console.error("Compute pressure stats error:", error);
    return errorResponse(res, "Failed to compute pressure stats", 500);
  }
});

module.exports = router;
