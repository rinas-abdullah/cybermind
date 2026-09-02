const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { validateScoreUpdate, validateProgressCompletion } = require("../middleware/validation");
const { getUserProgress, updateUserProgress, completeScenario } = require("../data/progress");
const demoAuthService = require("../services/demoAuthService");
const { calculateLevel } = require("../utils/userUtils");
const {
  normalizeUsername,
  getAuthUserOrNull,
  canAccessUsername,
} = require("../utils/userAccess");
const { successResponse, errorResponse, notFoundResponse } = require("../utils/responseUtils");

const router = express.Router();

router.post("/update-score", requireAuth, validateScoreUpdate, async (req, res) => {
  try {
    const username = req.user.username;
    const { amount } = req.body || {};
    const authUser = await getAuthUserOrNull(username);

    if (!authUser) {
      return notFoundResponse(res, "User");
    }

    const numericAmount = Number(amount);
    const currentTotal = Number(authUser.profile?.totalScore || authUser.points || 0);
    const newTotal = Math.max(0, currentTotal + numericAmount);
    const newLevel = calculateLevel(newTotal);

    const updatedUser =
      demoAuthService.updateDemoUserProfile?.(authUser.id, {
        totalScore: newTotal,
        level: newLevel,
      }) ||
      demoAuthService.updateUserProfile?.(authUser.id, {
        totalScore: newTotal,
        level: newLevel,
      });

    await updateUserProgress(username, {
      totalScore: newTotal,
    });

    return successResponse(
      res,
      {
        username: updatedUser?.username || authUser.username,
        points: updatedUser?.profile?.totalScore || newTotal,
        level: updatedUser?.profile?.level || newLevel,
      },
      "Score updated"
    );
  } catch (error) {
    console.error("Update score error:", error);
    return errorResponse(res, "Failed to update score", 500);
  }
});

router.get("/progress/:username", requireAuth, async (req, res) => {
  try {
    const username = normalizeUsername(req.params.username);

    if (!canAccessUsername(username, req.user)) {
      return errorResponse(res, "Forbidden", 403);
    }

    const authUser = await getAuthUserOrNull(username);
    if (!authUser) {
      return notFoundResponse(res, "User");
    }

    let progress = getUserProgress(username);
    if (!progress) {
      progress = await updateUserProgress(username, {
        currentScenario: "basic-commands",
        totalScore: authUser.profile?.totalScore || authUser.points || 0,
      });
    }

    return successResponse(res, progress, "Progress data retrieved");
  } catch (error) {
    console.error("Progress error:", error);
    return errorResponse(res, "Failed to retrieve progress", 500);
  }
});

router.post("/progress/complete", requireAuth, validateProgressCompletion, async (req, res) => {
  try {
    const username = req.user.username;
    const scenarioId = normalizeUsername(req.body?.scenarioId);
    const score = Number(req.body?.score || 0);
    const timeSpent = Number(req.body?.timeSpent || 0);

    if (!scenarioId) {
      return errorResponse(res, "Scenario ID is required", 400);
    }

    const progress = await completeScenario(username, scenarioId, score, timeSpent);

    if (!progress) {
      return errorResponse(res, "Failed to complete scenario", 500);
    }

    const authUser = await getAuthUserOrNull(username);
    if (authUser) {
      const updater =
        demoAuthService.updateDemoUserProfile || demoAuthService.updateUserProfile;

      if (typeof updater === "function") {
        updater.call(demoAuthService, authUser.id, {
          totalScore: progress.totalScore,
          level: progress.level,
          streak: progress.streak,
        });
      }
    }

    return successResponse(res, progress, "Scenario completed successfully");
  } catch (error) {
    console.error("Complete scenario error:", error);
    return errorResponse(res, "Failed to complete scenario", 500);
  }
});

module.exports = router;
