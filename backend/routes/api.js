const express = require("express");
const router = express.Router();

// ===== DATA =====
const users = require("../data/users");
const {
  getUserProgress,
  updateUserProgress,
  completeScenario,
} = require("../data/progress");

// ===== UTILITIES =====
const { findUser, calculateLevel } = require("../utils/userUtils");
const {
  successResponse,
  errorResponse,
  notFoundResponse,
} = require("../utils/responseUtils");

// ===== CONFIG =====
const config = require("../config/environment");

// ===== MIDDLEWARE =====
const {
  validateScoreUpdate,
} = require("../middleware/validation");

// ===== ANALYTICS =====
const {
  generateInstitutionReport,
  generateUserReport,
  generateComplianceReport,
  getEngagementMetrics,
} = require("../utils/analytics");

// ==================================================
// BASIC API ROUTES
// ==================================================

router.get("/health", (req, res) => {
  return successResponse(
    res,
    {
      port: config.port,
      environment: config.nodeEnv,
      database: config.database.type,
      uptime: process.uptime(),
    },
    "CyberMind backend is running"
  );
});

const handleUpdateScore = (req, res) => {
  const { username, amount } = req.body;

  const user = findUser(username);

  if (!user) {
    return notFoundResponse(res, "User");
  }

  const numericAmount =
    typeof amount === "number" ? amount : Number(amount) || 0;

  user.points += numericAmount;
  user.level = calculateLevel(user.points);

  return successResponse(
    res,
    {
      username: user.username,
      points: user.points,
      level: user.level,
      role: user.role,
    },
    "Score updated successfully"
  );
};

router.post("/update-score", validateScoreUpdate, handleUpdateScore);
router.post("/updateScore", validateScoreUpdate, handleUpdateScore);

router.get("/leaderboard", (req, res) => {
  const publicBoard = [...users]
    .sort((a, b) => b.points - a.points)
    .map((u, index) => ({
      rank: index + 1,
      username: u.username,
      points: u.points,
      level: u.level,
    }));

  return successResponse(res, publicBoard, "Leaderboard retrieved successfully");
});

router.get("/user/:username", (req, res) => {
  const username = req.params.username;
  const user = findUser(username);

  if (!user) {
    return notFoundResponse(res, "User");
  }

  return successResponse(
    res,
    {
      username: user.username,
      points: user.points,
      level: user.level,
      role: user.role,
    },
    "User data retrieved successfully"
  );
});

// ==================================================
// PROGRESS ROUTES
// ==================================================

router.get("/progress/:username", (req, res) => {
  const username = req.params.username;
  const user = findUser(username);

  if (!user) {
    return notFoundResponse(res, "User");
  }

  const progress = getUserProgress(username);

  if (!progress) {
    const defaultProgress = updateUserProgress(username, {
      currentScenario: "basic-commands",
      completedScenarios: [],
      totalScore: user.points,
      level: user.level,
      streak: 0,
      adaptiveDifficulty: 1,
      achievements: ["first-login"],
      progress: {},
    });

    return successResponse(res, defaultProgress, "Default progress created");
  }

  return successResponse(res, progress, "Progress data retrieved successfully");
});

router.post("/progress", (req, res) => {
  const { username, scenarioId, score, timeSpent, status } = req.body;

  if (!username) {
    return errorResponse(res, "Username is required", 400);
  }

  const user = findUser(username);

  if (!user) {
    return notFoundResponse(res, "User");
  }

  try {
    let updatedProgress;

    if (status === "completed" && scenarioId && score !== undefined) {
      updatedProgress = completeScenario(
        username,
        scenarioId,
        Number(score) || 0,
        Number(timeSpent) || 0
      );

      user.points += Number(score) || 0;
      user.level = calculateLevel(user.points);
    } else {
      const currentProgress = getUserProgress(username);
      const updates = {};

      if (scenarioId) updates.currentScenario = scenarioId;

      if (score !== undefined) {
        updates.totalScore =
          (currentProgress?.totalScore ?? user.points) + (Number(score) || 0);
      }

      updates.lastActivity = new Date().toISOString();

      updatedProgress = updateUserProgress(username, updates);
    }

    return successResponse(
      res,
      {
        progress: updatedProgress,
        user: {
          username: user.username,
          points: user.points,
          level: user.level,
          role: user.role,
        },
      },
      "Progress updated successfully"
    );
  } catch (error) {
    console.error("Progress update failed:", error);
    return errorResponse(res, "Failed to update progress", 500);
  }
});

// ==================================================
// ANALYTICS ROUTES
// ==================================================

router.get("/analytics/institution", (req, res) => {
  try {
    const institution = req.query.institution || "CyberMind University";
    const report = generateInstitutionReport(institution);

    return successResponse(
      res,
      report,
      "Institution report generated successfully"
    );
  } catch (error) {
    console.error("Institution report error:", error);
    return errorResponse(res, "Failed to generate institution report", 500);
  }
});

router.get("/analytics/institution/:institution", (req, res) => {
  try {
    const institution = req.params.institution;
    const report = generateInstitutionReport(institution);

    return successResponse(
      res,
      report,
      "Institution report generated successfully"
    );
  } catch (error) {
    console.error("Institution report error:", error);
    return errorResponse(res, "Failed to generate institution report", 500);
  }
});

router.get("/analytics/user/:username", (req, res) => {
  try {
    const report = generateUserReport(req.params.username);

    if (!report) {
      return notFoundResponse(res, "User");
    }

    return successResponse(res, report, "User report generated successfully");
  } catch (error) {
    console.error("User report error:", error);
    return errorResponse(res, "Failed to generate user report", 500);
  }
});

router.get("/analytics/compliance", (req, res) => {
  try {
    const institution = req.query.institution || "CyberMind University";
    const report = generateComplianceReport(institution);

    return successResponse(
      res,
      report,
      "Compliance report generated successfully"
    );
  } catch (error) {
    console.error("Compliance report error:", error);
    return errorResponse(res, "Failed to generate compliance report", 500);
  }
});

router.get("/analytics/compliance/:institution", (req, res) => {
  try {
    const institution = req.params.institution;
    const report = generateComplianceReport(institution);

    return successResponse(
      res,
      report,
      "Compliance report generated successfully"
    );
  } catch (error) {
    console.error("Compliance report error:", error);
    return errorResponse(res, "Failed to generate compliance report", 500);
  }
});

router.get("/analytics/engagement", (req, res) => {
  try {
    const timeframe = parseInt(req.query.timeframe, 10) || 30;
    const metrics = getEngagementMetrics(timeframe);

    return successResponse(
      res,
      metrics,
      "Engagement metrics retrieved successfully"
    );
  } catch (error) {
    console.error("Engagement metrics error:", error);
    return errorResponse(res, "Failed to retrieve engagement metrics", 500);
  }
});

router.get("/analytics/engagement/:timeframe", (req, res) => {
  try {
    const timeframe = parseInt(req.params.timeframe, 10) || 30;
    const metrics = getEngagementMetrics(timeframe);

    return successResponse(
      res,
      metrics,
      "Engagement metrics retrieved successfully"
    );
  } catch (error) {
    console.error("Engagement metrics error:", error);
    return errorResponse(res, "Failed to retrieve engagement metrics", 500);
  }
});

module.exports = router;