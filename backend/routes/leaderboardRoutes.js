const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { successResponse, errorResponse } = require("../utils/responseUtils");
const demoAuthService = require("../services/demoAuthService");

const router = express.Router();

router.get("/leaderboard", requireAuth, (req, res) => {
  try {
    const board =
      demoAuthService.getDemoLeaderboard?.() || demoAuthService.getLeaderboard?.() || [];

    const publicBoard = board.map((user) => ({
      rank: user.rank,
      username: user.username,
      points: user.points,
      level: user.level,
      completedScenarios: user.completedScenarios,
      riskPersona: user.riskPersona,
    }));

    return successResponse(res, publicBoard, "Leaderboard retrieved");
  } catch (error) {
    console.error("Leaderboard error:", error);
    return errorResponse(res, "Failed to retrieve leaderboard", 500);
  }
});

module.exports = router;
