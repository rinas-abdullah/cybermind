const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  validateAiMentorRequest,
  validateAiQuery,
  validateProcessAttempt,
} = require("../middleware/validation");
const { aiLimiter } = require("../middleware/rateLimiter");
const { successResponse, errorResponse, notFoundResponse } = require("../utils/responseUtils");
const { getAuthUserOrNull, canAccessUsername, canViewMentorHistory } = require("../utils/userAccess");
const { normalizeUsername, sanitizeQuestion, sanitizeContext, parseJsonString, clampNumber, sanitizeScenarioId } = require("../utils/requestUtils");
const { logInteraction, getUserLogs } = require("../data/aiLogs");
const AiMentorEngine = require("../services/aiMentorEngine");
const AiMentorService = require("../services/aiMentorService");
const LearnerProfileService = require("../services/ai/learnerProfileService");
const trainingEngine = require("../services/coreTrainingEngine");
const attackSimulator = require("../services/attackSimulator");
const { getAiClient, selectModel } = require("../services/ai/aiProvider");
const { buildBehavioralContext } = require("../services/ai/contextManager");
const { formatMentorResponse } = require("../services/ai/feedbackEngine");
const { asyncHandler } = require("../middleware/errorHandler");

const aiMentorService = new AiMentorService();
const learnerProfileService = new LearnerProfileService();
const mentorEngine = new AiMentorEngine();
const router = express.Router();

router.use("/ai", aiLimiter);

router.post(
  "/ai/mentor",
  requireAuth,
  validateAiMentorRequest,
  asyncHandler(async (req, res) => {
    const question = req.body.question;
    const context = req.body.context || "training";

    const username = req.user.username;
    const authUser = await getAuthUserOrNull(username);
    if (!authUser) {
      return notFoundResponse(res, "User");
    }

    const userLevel = authUser.profile?.level || authUser.level || 1;
    const rawResponse = await mentorEngine.generateResponse(question, userLevel, context);
    const mentorResponse = formatMentorResponse(rawResponse);

    const logEntry = await logInteraction(
      authUser.id,
      username,
      question,
      mentorResponse.explanation,
      userLevel,
      context
    );

    return successResponse(
      res,
      {
        question,
        explanation: mentorResponse.explanation,
        examples: mentorResponse.examples,
        prevention: mentorResponse.prevention,
        hint: mentorResponse.hint,
        topic: mentorResponse.topic,
        difficulty: mentorResponse.difficulty,
        userLevel,
        context,
        logId: logEntry.id,
        timestamp: logEntry.timestamp,
      },
      "AI mentor response generated"
    );
  })
);

router.post(
  "/ai/query",
  requireAuth,
  validateAiQuery,
  asyncHandler(async (req, res) => {
    const prompt = req.body.prompt;
    const model = selectModel(req.body.model);

    const client = getAiClient();
    if (!client) {
      return errorResponse(res, "AI provider not configured", 500);
    }

    const result = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      timeout: 15000,
    });

    return successResponse(
      res,
      {
        model,
        output: result.choices?.[0]?.message?.content || "",
      },
      "AI response generated"
    );
  })
);

router.get(
  "/ai/next-scenario/:username",
  requireAuth,
  asyncHandler(async (req, res) => {
    const username = normalizeUsername(req.params.username);
    if (!canAccessUsername(username, req.user)) {
      return errorResponse(res, "Forbidden", 403);
    }

    const behavioralData = parseJsonString(req.query?.behavioralData, {});
    const authUser = await getAuthUserOrNull(username);
    const userId = authUser?.id || 0;

    const scenariosList = attackSimulator.getAllScenarios ? attackSimulator.getAllScenarios() : [];

    try {
      const scenario = await trainingEngine.selectNextScenario(userId, scenariosList, behavioralData);
      return successResponse(res, scenario, "Adaptive scenario selected");
    } catch (error) {
      console.warn("Adaptive selection failed:", error.message);
      if (scenariosList.length > 0) {
        return successResponse(res, scenariosList[0], "Fallback scenario returned");
      }
      return errorResponse(res, "No scenarios available", 404);
    }
  })
);

router.post(
  "/ai/process-attempt",
  requireAuth,
  validateProcessAttempt,
  asyncHandler(async (req, res) => {
    const username = req.user.username;
    const scenarioId = sanitizeScenarioId(req.body.scenarioId);

    const score = clampNumber(req.body.score, 0, 1000, 0);
    const timeSpent = clampNumber(req.body.timeSpent, 0, 86400, 0);
    const incorrectAnswers = Array.isArray(req.body.incorrectAnswers)
      ? req.body.incorrectAnswers.slice(0, 50)
      : [];
    const behavioralData =
      typeof req.body.behavioralData === "object" && !Array.isArray(req.body.behavioralData)
        ? req.body.behavioralData
        : {};

    const authUser = await getAuthUserOrNull(username);
    const userId = authUser?.id || 0;
    const behavioralContext = buildBehavioralContext(behavioralData);

    const result = await trainingEngine.processScenarioAttempt(userId, scenarioId, {
      score,
      timeSpent,
      incorrectAnswers,
      behavioralData,
    });

    if (score >= 0) {
      await trainingEngine.completeScenario(username, scenarioId, score, timeSpent);
    }

    return successResponse(res, result, "Scenario processed");
  })
);

router.get(
  "/ai/mentor/history/:username",
  requireAuth,
  asyncHandler(async (req, res) => {
    const username = normalizeUsername(req.params.username);
    if (!canViewMentorHistory(username, req.user)) {
      return errorResponse(res, "Forbidden", 403);
    }

    const user = await getAuthUserOrNull(username);
    if (!user) {
      return notFoundResponse(res, "User");
    }

    const logs = getUserLogs(user.id);
    return successResponse(res, logs, `Retrieved ${logs.length} conversation logs for ${username}`);
  })
);

router.get(
  "/ai/learner-profile/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    if (!userId) return errorResponse(res, "User ID is required", 400);

    const profile = await learnerProfileService.getLearnerProfile(userId);
    if (!profile) return notFoundResponse(res, "Learner profile");

    return successResponse(res, profile, "Learner profile retrieved");
  })
);

module.exports = router;
