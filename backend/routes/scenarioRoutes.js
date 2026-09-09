const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requirePostgres } = require("../middleware/requirePostgres");
const {
  validateScenarioGenerate,
  validateScenarioAttempt,
} = require("../middleware/validation");
const { asyncHandler } = require("../middleware/errorHandler");
const { successResponse, errorResponse } = require("../utils/responseUtils");
const attackSimulator = require("../services/attackSimulator");
const CoreTrainingEngine = require("../services/coreTrainingEngine");
const AdaptiveLearningEngine = require("../services/adaptiveLearningEngine");
const adaptiveEngine = new AdaptiveLearningEngine();
const db = require("../db");

const trainingEngine = new CoreTrainingEngine();
const router = express.Router();

router.get("/attack-simulator/scenario/random", requireAuth, (req, res) => {
  try {
    const difficulty =
      typeof req.query.difficulty === "string" ? req.query.difficulty.trim() : "beginner";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : null;
    const scenario = attackSimulator.getRandomScenario(difficulty, category);

    if (!scenario) {
      return errorResponse(res, "No scenarios found", 404);
    }

    return successResponse(res, scenario, "Random scenario retrieved");
  } catch (error) {
    console.error("Random scenario error:", error);
    return errorResponse(res, "Failed to get scenario", 500);
  }
});

router.get("/attack-simulator/scenarios", requireAuth, (req, res) => {
  try {
    const difficulty =
      typeof req.query.difficulty === "string" ? req.query.difficulty.trim() : "all";
    const scenarios =
      difficulty === "all"
        ? attackSimulator.getAllScenarios()
        : attackSimulator.getScenariosByDifficulty(difficulty);

    return successResponse(
      res,
      { total: scenarios.length, scenarios },
      "Scenarios retrieved"
    );
  } catch (error) {
    console.error("Get scenarios error:", error);
    return errorResponse(res, "Failed to get scenarios", 500);
  }
});

router.post(
  "/scenarios/generate",
  requireAuth,
  validateScenarioGenerate,
  asyncHandler(async (req, res) => {
    const { scenarioId, basePrompt } = req.body;

    const adaptivePrompt = await trainingEngine.generateAdaptivePrompt(scenarioId, basePrompt);

    return successResponse(
      res,
      { adaptivePrompt, scenarioId },
      "Adaptive prompt generated"
    );
  })
);

router.post(
  "/attempts/submit",
  requireAuth,
  requirePostgres,
  validateScenarioAttempt,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { sessionId, scenarioId, userResponse, isCorrect, responseTime } = req.body;

    const attemptResult = await db.query(
      `
      INSERT INTO attempts (session_id, attempt_number, user_response, is_correct, response_time, ai_feedback, timestamp)
      VALUES (
        $1::VARCHAR(100),
        (SELECT COALESCE(MAX(attempt_number), 0) + 1 FROM attempts WHERE session_id = $1::VARCHAR(100)),
        $2, $3, make_interval(secs => $4::double precision), '', CURRENT_TIMESTAMP
      )
      RETURNING id, attempt_number
      `,
      [sessionId, userResponse, isCorrect, responseTime]
    );

    const attempt = attemptResult.rows[0];
    const accuracy = isCorrect ? 100 : 0;

    const adaptation = await adaptiveEngine.adaptDifficulty(
      userId,
      scenarioId,
      sessionId,
      accuracy,
      responseTime
    );

    return successResponse(
      res,
      { attempt, adaptation },
      "Attempt submitted and difficulty adapted"
    );
  })
);

module.exports = router;
