const express = require("express");
const { getOpenAIClient } = require("../services/ai/aiProvider");

const authRoutes = require("./authRoutes");
const aiRoutes = require("./aiRoutes");
const scenarioRoutes = require("./scenarioRoutes");
const progressRoutes = require("./progressRoutes");
const leaderboardRoutes = require("./leaderboardRoutes");
const adversaryRoutes = require("./adversaryRoutes");

const router = express.Router();

// ===== DATABASE =====
const db = require("../db");

// ===== MIDDLEWARE =====
const { requireAuth, requireRole } = require("../middleware/auth");
const { requirePostgres } = require("../middleware/requirePostgres");

// ===== DEMO AUTH / FALLBACK =====
const demoAuthService = require("../services/demoAuthService");

// ===== UTILITIES =====
const {
  successResponse,
  errorResponse,
  notFoundResponse,
} = require("../utils/responseUtils");

// ===== CONFIG =====
const envModule = require("../config/environment");
const config = envModule.config || envModule;

// ===== ANALYTICS =====
const {
  generateInstitutionReport,
  generateUserReport,
  generateComplianceReport,
  getEngagementMetrics,
} = require("../utils/analytics");

// ===== RISK SCORING / BEHAVIOR ANALYSIS =====
const RiskScoringService = require("../services/riskScoringService");
const BehaviorAnalysisService = require("../services/behaviorAnalysisService");
const riskScoringService = new RiskScoringService();
const behaviorAnalysisService = new BehaviorAnalysisService();

// ===== AI MENTOR =====
const AIMentorService = require("../services/aiMentorService");
const AdaptiveLearningService = require("../services/adaptiveLearningService");
const LearnerProfileService = require("../services/ai/learnerProfileService");
const ScenarioAnalysisService = require("../services/scenarioAnalysisService");
const aiMentorService = new AIMentorService();
const adaptiveLearningService = new AdaptiveLearningService();
const learnerProfileService = new LearnerProfileService();
const scenarioAnalysisService = new ScenarioAnalysisService(
  riskScoringService,
  behaviorAnalysisService,
  aiMentorService,
  adaptiveLearningService,
  learnerProfileService
);

// ===== AI CORE / PATHS =====
const aiCoreService = require("../services/aiCoreService");
const pathService = require("../services/pathService");

// ==================================================
// HELPERS
// ==================================================

function getConfigValue(...paths) {
  for (const path of paths) {
    let current = config;
    let valid = true;

    for (const key of path) {
      if (!current || typeof current !== "object" || !(key in current)) {
        valid = false;
        break;
      }
      current = current[key];
    }

    if (valid && current !== undefined) {
      return current;
    }
  }

  return undefined;
}

function getServerEnvironmentInfo() {
  return {
    port: getConfigValue(["server", "port"]) || 3001,
    environment:
      getConfigValue(["server", "nodeEnv"]) ||
      process.env.NODE_ENV ||
      "development",
    database: getConfigValue(["database", "type"]) || "in-memory",
  };
}

function normalizeUsername(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 50);
}

function normalizeRole(value) {
  if (typeof value !== "string") return "learner";
  return value.trim().toLowerCase() || "learner";
}

function getAuthUserOrNull(username) {
  if (!username) return null;
  return demoAuthService.findDemoUserByUsername
    ? demoAuthService.findDemoUserByUsername(username)
    : demoAuthService.findUserByUsername?.(username) || null;
}

function canAccessUsername(requestedUsername, reqUser) {
  if (!reqUser || !requestedUsername) return false;

  const requested = String(requestedUsername).toLowerCase();
  const current = String(reqUser.username || "").toLowerCase();
  const role = normalizeRole(reqUser.role);

  return current === requested || role === "admin" || role === "instructor";
}

// getOpenAIClient is imported from ../services/ai/aiProvider at the top of the file

function extractCiaCategoryFromText(text = "") {
  const normalized = String(text).toLowerCase();

  if (
    /\bconfidentiality\b/.test(normalized) ||
    /\bcia\s*:\s*confidentiality\b/.test(normalized)
  ) {
    return "confidentiality";
  }
  if (
    /\bintegrity\b/.test(normalized) ||
    /\bcia\s*:\s*integrity\b/.test(normalized)
  ) {
    return "integrity";
  }
  if (
    /\bavailability\b/.test(normalized) ||
    /\bcia\s*:\s*availability\b/.test(normalized)
  ) {
    return "availability";
  }
  return "unknown";
}

async function getAdminInstitutionStats(institutionId) {
  if (!db || typeof db.query !== "function") {
    throw new Error(
      "Database client not initialized. Ensure connection is active."
    );
  }

  const report = {
    institutionId,
    generatedAt: new Date().toISOString(),
    averageAccuracyBySection: [],
    topCiaFailureCategories: [],
    teamMaturity: {
      totalStudents: 0,
      averageAccuracy: 0,
      completionRate: 0,
      maturityScore: 0,
    },
    export: null,
  };

  const averageAccuracyQuery = `
    SELECT s.category,
      ROUND(AVG(pm.accuracy)::numeric, 2) AS average_accuracy
    FROM performance_metrics pm
    JOIN scenarios s ON s.id::text = pm.scenario_id
    JOIN users u ON u.id = pm.user_id
    WHERE u.institution_id = $1
    GROUP BY s.category
    ORDER BY average_accuracy DESC
  `;

  const { rows: accuracyRows } = await db.query(averageAccuracyQuery, [
    institutionId,
  ]);

  report.averageAccuracyBySection = accuracyRows.map((row) => ({
    category: row.category || "unknown",
    averageAccuracy: Number(row.average_accuracy) || 0,
  }));

  const logsQuery = `
    SELECT al.question AS prompt, al.response
    FROM ai_logs al
    JOIN users u ON u.id = al.user_id
    WHERE u.institution_id = $1
  `;

  const { rows: aiRows } = await db.query(logsQuery, [institutionId]);

  const ciaCounts = aiRows.reduce((acc, row) => {
    const promptCia = extractCiaCategoryFromText(row.prompt);
    const responseCia = extractCiaCategoryFromText(row.response);

    [promptCia, responseCia].forEach((category) => {
      if (!acc[category]) acc[category] = 0;
      acc[category] += 1;
    });

    return acc;
  }, {});

  report.topCiaFailureCategories = Object.entries(ciaCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maturityQuery = `
    SELECT
      COUNT(DISTINCT u.id) AS total_students,
      COALESCE(AVG(pm.accuracy), 0) AS average_accuracy,
      COALESCE(AVG(CASE WHEN p.completed THEN 1 ELSE 0 END), 0) AS completion_rate
    FROM users u
    LEFT JOIN performance_metrics pm ON pm.user_id = u.id
    LEFT JOIN progress p ON p.user_id = u.id
    WHERE u.institution_id = $1
  `;

  const { rows: maturityRows } = await db.query(maturityQuery, [institutionId]);

  if (maturityRows.length > 0) {
    const row = maturityRows[0];
    const totalStudents = Number(row.total_students) || 0;
    const averageAccuracy = Number(row.average_accuracy) || 0;
    const completionRate = Number(row.completion_rate) || 0;

    const maturityScore = Math.round(
      Math.min(
        100,
        averageAccuracy * 0.5 + completionRate * 0.3 + (totalStudents > 0 ? 20 : 0)
      )
    );

    report.teamMaturity = {
      totalStudents,
      averageAccuracy: Number(averageAccuracy.toFixed(2)),
      completionRate: Number((completionRate * 100).toFixed(2)),
      maturityScore,
    };
  }

  report.export = {
    summary: report.teamMaturity,
    accuracyBySection: report.averageAccuracyBySection,
    ciaFailureRankings: report.topCiaFailureCategories,
    meta: {
      generatedBy: "admin",
      institutionId,
      timestamp: report.generatedAt,
    },
  };

  return report;
}

// ==================================================
// BASIC API ROUTES
// ==================================================

router.get("/health", (req, res) => {
  const envInfo = getServerEnvironmentInfo();

  return successResponse(
    res,
    {
      ...envInfo,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    "Risaq backend is running"
  );
});

router.get("/config/public", (req, res) => {
  const pub = config.public || {};
  return successResponse(
    res,
    {
      siteUrl: pub.siteUrl || "",
      siteOrigin: pub.siteOrigin || "",
      localDomain: pub.localDomain || "",
      suggestedLocalUrl: pub.suggestedLocalUrl || "",
    },
    "Public site configuration"
  );
});

router.use(authRoutes);
router.use(aiRoutes);
router.use(scenarioRoutes);
router.use(progressRoutes);
router.use(leaderboardRoutes);
router.use(adversaryRoutes);

// ==================================================
// RISK SCORING & BEHAVIOR ANALYSIS ROUTES
// ==================================================

router.get("/risk/profile/:userId", requireAuth, (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return errorResponse(res, "Invalid user id", 400);

    const result = riskScoringService.evaluateUserRisk(userId);
    if (!result) return notFoundResponse(res, "Risk profile");

    return successResponse(res, result, "Risk profile calculated");
  } catch (error) {
    console.error("Risk profile error:", error);
    return errorResponse(res, "Failed to evaluate risk profile", 500);
  }
});

router.post("/risk/score", requireAuth, (req, res) => {
  try {
    const { userId, scenarioResult } = req.body || {};
    if (!userId || !scenarioResult) {
      return errorResponse(res, "Missing userId or scenarioResult", 400);
    }

    const profile = riskScoringService.updateProfileAfterScenario(
      userId,
      scenarioResult
    );
    const risk = riskScoringService.evaluateUserRisk(userId);

    return successResponse(res, { profile, risk }, "Risk scoring updated");
  } catch (error) {
    console.error("Risk score error:", error);
    return errorResponse(res, "Failed to score risk", 500);
  }
});

router.post("/behavior/analysis", requireAuth, (req, res) => {
  try {
    const {
      decisionVelocity,
      warningAcknowledgment,
      verificationRate,
      pressurePerformance,
      consistencyScore,
    } = req.body || {};

    const behaviorReport = behaviorAnalysisService.generateBehavioralProfile(
      Number(decisionVelocity || 0),
      Number(warningAcknowledgment || 0),
      Number(verificationRate || 0),
      Number(pressurePerformance || 0),
      Number(consistencyScore || 0)
    );

    return successResponse(res, behaviorReport, "Behavior analysis completed");
  } catch (error) {
    console.error("Behavior analysis error:", error);
    return errorResponse(res, "Failed to analyze behavior", 500);
  }
});

router.get("/behavior/report/:userId", requireAuth, (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return errorResponse(res, "Invalid user id", 400);

    const profile = riskScoringService.getUserProfile(userId);
    if (!profile) return notFoundResponse(res, "User");

    const report = behaviorAnalysisService.getFullBehaviorReport(profile);
    return successResponse(res, report, "Full behavior report generated");
  } catch (error) {
    console.error("Behavior report error:", error);
    return errorResponse(res, "Failed to generate behavior report", 500);
  }
});

router.post("/ai/mentor/risk-advice", requireAuth, (req, res) => {
  try {
    const { riskScore, behaviorAnalysis, userAction } = req.body || {};

    if (!riskScore || !behaviorAnalysis || !userAction) {
      return errorResponse(
        res,
        "riskScore, behaviorAnalysis and userAction are required",
        400
      );
    }

    const advice = aiMentorService.generateStructuredAdvice({
      riskScore,
      behaviorAnalysis,
      userAction,
    });

    return successResponse(
      res,
      advice,
      "Structured AI mentor advice generated"
    );
  } catch (error) {
    console.error("AI mentor risk advice error:", error);
    return errorResponse(res, "Failed to generate AI mentor advice", 500);
  }
});

router.post("/ai/analyze-scenario", requireAuth, (req, res) => {
  const {
    scenarioType,
    userAction,
    decisionTime,
    ignoredWarnings,
    repeatedMistakes,
  } = req.body || {};

  if (
    typeof scenarioType !== "string" ||
    typeof userAction !== "string" ||
    decisionTime === undefined ||
    ignoredWarnings === undefined ||
    repeatedMistakes === undefined
  ) {
    return errorResponse(
      res,
      "scenarioType, userAction, decisionTime, ignoredWarnings, and repeatedMistakes are required",
      400
    );
  }

  try {
    const fullResult = scenarioAnalysisService.analyzeScenario({
      userId: req.user.userId,
      scenarioType,
      userAction,
      decisionTime,
      ignoredWarnings,
      repeatedMistakes,
    });

    return successResponse(
      res,
      {
        riskScore: fullResult.riskScore,
        behaviorAnalysis: fullResult.behaviorAnalysis,
        mentorAdvice: fullResult.mentorAdvice,
        adaptiveNextStep: fullResult.adaptiveNextStep,
        learnerProfile: fullResult.learnerProfile,
        meta: {
          scenarioType: fullResult.scenarioType,
          userAction: fullResult.userAction,
          generatedAt: fullResult.meta.generatedAt,
        },
      },
      "Scenario analysis completed"
    );
  } catch (error) {
    console.error("Analyze scenario error:", error);
    return errorResponse(res, "Failed to execute scenario analysis", 500);
  }
});

// Note: GET /ai/learner-profile/:userId, POST /ai/mentor, POST /ai/query,
// GET /ai/mentor/history/:username, GET /ai/next-scenario/:username, and
// POST /ai/process-attempt are all handled by aiRoutes.js (mounted above via
// router.use(aiRoutes)) — they used to be re-defined here too, unreachable
// and subtly different from the real handlers. Removed rather than fixed.

// Note: POST /attempts/submit and POST /scenarios/generate are handled by
// scenarioRoutes.js (mounted above via router.use(scenarioRoutes)) — they
// used to be re-defined here too, unreachable. Removed.

// Note: POST /ai/mentor, POST /ai/query, GET /ai/mentor/history/:username,
// GET /ai/next-scenario/:username, and POST /ai/process-attempt used to be
// re-defined here too (unreachable duplicates of aiRoutes.js — see note
// above). Removed.

// ==================================================
// PATH / MODULE / TASK ROUTES
// ==================================================

router.post("/admin/paths", requireAuth, requireRole("admin"), requirePostgres, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return errorResponse(res, "Path name is required", 400);
    }

    const path = await pathService.createPath(name, description);
    return successResponse(res, path, "Path created");
  } catch (error) {
    console.error("Create path error:", error);
    return errorResponse(res, "Failed to create path", 500);
  }
});

router.post("/admin/modules", requireAuth, requireRole("admin"), requirePostgres, async (req, res) => {
  try {
    const { pathId, name, description, orderIndex } = req.body;
    if (!pathId || !name || !name.trim()) {
      return errorResponse(res, "Invalid module input", 400);
    }

    const moduleItem = await pathService.createModule(
      pathId,
      name,
      description,
      orderIndex || 1
    );

    return successResponse(res, moduleItem, "Module created");
  } catch (error) {
    console.error("Create module error:", error);
    return errorResponse(res, "Failed to create module", 500);
  }
});

router.post("/admin/tasks", requireAuth, requireRole("admin"), requirePostgres, async (req, res) => {
  try {
    const { moduleId, name, description, expectedOutput, difficultyLevel, orderIndex } =
      req.body;

    if (!moduleId || !name || !name.trim()) {
      return errorResponse(res, "Invalid task input", 400);
    }

    const task = await pathService.createTask(moduleId, {
      name,
      description,
      expectedOutput,
      difficultyLevel: difficultyLevel || 3,
      orderIndex: orderIndex || 1,
    });

    return successResponse(res, task, "Task created");
  } catch (error) {
    console.error("Create task error:", error);
    return errorResponse(res, "Failed to create task", 500);
  }
});

router.get("/paths", requireAuth, requirePostgres, async (req, res) => {
  try {
    const paths = await pathService.getPaths();
    return successResponse(res, paths, "Paths fetched");
  } catch (error) {
    console.error("Get paths error:", error);
    return errorResponse(res, "Failed to fetch paths", 500);
  }
});

router.get("/paths/:pathId", requireAuth, requirePostgres, async (req, res) => {
  try {
    const pathId = Number(req.params.pathId);
    if (!pathId) return errorResponse(res, "Invalid path id", 400);

    const structure = await pathService.getPathStructure(pathId, req.user.userId);
    if (!structure) return notFoundResponse(res, "Path");

    return successResponse(res, structure, "Path structure fetched");
  } catch (error) {
    console.error("Get path structure error:", error);
    return errorResponse(res, "Failed to fetch path structure", 500);
  }
});

router.post("/tasks/:taskId/action", requireAuth, requirePostgres, async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const userAction = (req.body?.action || "").toString();
    const systemResponseTime = Number(req.body?.systemResponseTime || 0);
    const userReactionTime = Number(req.body?.userReactionTime || 0);

    if (!taskId || !userAction) {
      return errorResponse(res, "Invalid task/action input", 400);
    }

    const attackerMove = await aiCoreService.getAttackerNextMove(
      req.user.userId,
      taskId,
      userAction
    );

    const resilienceScore = await aiCoreService.calculateAdaptiveResilienceScore(
      systemResponseTime,
      userReactionTime
    );

    await aiCoreService.storeAdaptiveResilienceMetric({
      userId: req.user.userId,
      scenarioId: null,
      sessionId: null,
      score: resilienceScore,
      contextText: `action:${userAction}; attackerMove:${attackerMove.nextMove};`,
    });

    return successResponse(
      res,
      {
        attackerMove,
        adaptiveResilienceScore: resilienceScore,
      },
      "Attacker move and resilience score generated"
    );
  } catch (error) {
    console.error("Attacker chain action error:", error);
    return errorResponse(res, "Failed to generate attacker next move", 500);
  }
});

router.post("/tasks/:taskId/submit", requireAuth, requirePostgres, async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    if (!taskId) return errorResponse(res, "Invalid task id", 400);

    const { submission } = req.body;
    if (typeof submission === "undefined") {
      return errorResponse(res, "Submission is required", 400);
    }

    const validation = await aiCoreService.validateTaskSubmission(
      req.user.userId,
      taskId,
      submission
    );

    const mark = await pathService.markTaskAttempt(
      req.user.userId,
      taskId,
      validation.isCorrect
    );

    let technicalResume = null;

    if (validation.isCorrect) {
      const task = await pathService.getTaskById(taskId);

      if (task) {
        await pathService.unlockNextTask(
          req.user.userId,
          task.module_id,
          task.order_index
        );

        const pathId = await pathService.getPathIdByTask(taskId);
        if (pathId) {
          const pathCompleted = await pathService.isPathCompletedForUser(
            req.user.userId,
            pathId
          );

          if (pathCompleted) {
            const resumeResult = await aiCoreService.generateTechnicalResume(
              req.user.userId,
              pathId
            );
            technicalResume = resumeResult.technicalResume;
          }
        }
      }
    }

    if (!validation.isCorrect && mark.attempts >= 2) {
      const hint = await aiCoreService.getSmartHint(req.user.userId, taskId);
      validation.hint = hint.hint;
    }

    return successResponse(
      res,
      {
        validation,
        taskProgress: mark,
        technicalResume,
      },
      "Task submission evaluated"
    );
  } catch (error) {
    console.error("Task submit error:", error);
    return errorResponse(res, "Failed to submit task", 500);
  }
});

// ==================================================
// AI CORE ROUTES
// ==================================================

router.post("/ai/generate-scenario", requireAuth, async (req, res) => {
  try {
    const output = await aiCoreService.generateDynamicScenario(req.user.userId);
    return successResponse(res, output, "AI dynamic scenario generated");
  } catch (error) {
    console.error("AI generate scenario error:", error);
    return errorResponse(res, "Failed to generate scenario", 500);
  }
});

router.get("/admin/ai-group-report", requireAuth, requireRole("admin"), requirePostgres, async (req, res) => {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) {
      return errorResponse(res, "Institution context required", 403);
    }

    const report = await aiCoreService.getAdminGroupReport(institutionId);
    return successResponse(res, report, "AI group report generated");
  } catch (error) {
    console.error("AI group report error:", error);
    return errorResponse(res, "Failed to generate AI report", 500);
  }
});

router.get("/ai/technical-resume", requireAuth, requirePostgres, async (req, res) => {
  try {
    const resume = await aiCoreService.getLatestTechnicalResume(req.user.userId);
    if (!resume) {
      return successResponse(
        res,
        { technicalResume: null },
        "No technical resume found"
      );
    }

    return successResponse(
      res,
      {
        technicalResume: resume.content,
        generatedAt: resume.generated_at,
      },
      "Technical resume retrieved"
    );
  } catch (error) {
    console.error("AI technical resume retrieval error:", error);
    return errorResponse(res, "Failed to retrieve technical resume", 500);
  }
});

// ==================================================
// ANALYTICS ROUTES
// ==================================================

router.get("/analytics/institution", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const institution =
      typeof req.query?.institution === "string"
        ? req.query.institution.trim()
        : "Risaq University";

    const report = generateInstitutionReport(institution);
    return successResponse(res, report, "Institution report generated");
  } catch (error) {
    console.error("Institution analytics error:", error);
    return errorResponse(res, "Failed to generate institution report", 500);
  }
});

router.get("/analytics/user/:username", requireAuth, async (req, res) => {
  try {
    const username = normalizeUsername(req.params.username);

    if (!canAccessUsername(username, req.user)) {
      return errorResponse(res, "Forbidden", 403);
    }

    const report = generateUserReport(username);
    return successResponse(res, report, "User report generated");
  } catch (error) {
    console.error("User analytics error:", error);
    return errorResponse(res, "Failed to generate user report", 500);
  }
});

router.get("/analytics/compliance", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const report = generateComplianceReport();
    return successResponse(res, report, "Compliance report generated");
  } catch (error) {
    console.error("Compliance analytics error:", error);
    return errorResponse(res, "Failed to generate compliance report", 500);
  }
});

router.get("/analytics/engagement", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const metrics = getEngagementMetrics();
    return successResponse(res, metrics, "Engagement metrics generated");
  } catch (error) {
    console.error("Engagement analytics error:", error);
    return errorResponse(res, "Failed to generate engagement metrics", 500);
  }
});

router.get("/admin/stats", requireAuth, requireRole("admin"), requirePostgres, async (req, res) => {
  try {
    const requestingInstitutionId = req.user?.institution_id;

    if (!requestingInstitutionId) {
      return errorResponse(res, "Institution context is required", 403);
    }

    const stats = await getAdminInstitutionStats(requestingInstitutionId);
    return successResponse(res, stats, "Admin institution stats generated");
  } catch (error) {
    console.error("Admin stats error:", error);
    return errorResponse(res, "Failed to generate admin statistics", 500);
  }
});

// ==================================================
// USER ANALYTICS ROUTES
// ==================================================

router.get("/analytics/user-id/:userId", requireAuth, async (req, res) => {
  try {
    const userId = String(req.params.userId || "");
    if (!userId) return errorResponse(res, "User ID is required", 400);

    if (String(req.user.userId) !== userId && req.user.role !== "admin") {
      return errorResponse(res, "Forbidden", 403);
    }

    const analytics = {
      timeRange: "Last 30 Days",
      dataPoints: 150,
      lastUpdated: new Date().toISOString(),
      totalScore: 2850,
      avgPerformance: 78,
      scenariosCompleted: 24,
      timeInvested: 45,
      progressToNext: 65,
      keyMetrics: {
        accuracy: 82,
        accuracyTrend: { value: "+5%", direction: "up" },
        avgResponseTime: 2.3,
        speedTrend: { value: "-0.2s", direction: "up" },
        completionRate: 89,
        completionTrend: { value: "+3%", direction: "up" },
        globalRank: 127,
      },
      charts: {
        scoreProgression: {
          labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
          data: [2100, 2250, 2450, 2850],
        },
        timeByCategory: {
          labels: ["Web Security", "Network Defense", "System Security", "Cryptography"],
          data: [15, 12, 10, 8],
        },
        skillDevelopment: {
          labels: [
            "SQL Injection",
            "XSS",
            "Network Scanning",
            "Password Cracking",
            "Social Engineering",
          ],
          data: [85, 72, 68, 91, 55],
        },
        weeklyActivity: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          data: [2.5, 3.1, 1.8, 4.2, 2.9, 1.2, 0.8],
        },
      },
      categoryPerformance: [
        { name: "Web Security", score: 85, completed: 8, timeSpent: 15 },
        { name: "Network Defense", score: 72, completed: 6, timeSpent: 12 },
        { name: "System Security", score: 68, completed: 5, timeSpent: 10 },
        { name: "Cryptography", score: 91, completed: 3, timeSpent: 8 },
      ],
      difficultyAnalysis: {
        beginner: 95,
        intermediate: 78,
        advanced: 65,
        expert: 45,
      },
      learningStreaks: {
        currentStreak: 7,
        longestStreak: 14,
        totalActiveDays: 28,
      },
      comparativeAnalysis: {
        globalPercentile: 73,
        peerRank: 45,
        aboveAverageIn: "Web Security, Cryptography",
      },
      aiRecommendations: [
        {
          type: "Skill Focus",
          title: "Deepen Network Defense Knowledge",
          description:
            "Your performance in intermediate network scenarios suggests focusing on advanced traffic analysis techniques.",
          priority: "high",
          id: "rec1",
        },
        {
          type: "Practice Schedule",
          title: "Increase Practice Frequency",
          description:
            "Maintaining a 7-day streak shows strong commitment. Consider daily 30-minute sessions for optimal progress.",
          priority: "medium",
          id: "rec2",
        },
        {
          type: "Learning Path",
          title: "Explore Malware Analysis",
          description:
            "Based on your cryptography skills, malware analysis would be a natural next progression.",
          priority: "low",
          id: "rec3",
        },
      ],
    };

    return successResponse(res, analytics, "User analytics retrieved");
  } catch (error) {
    console.error("User analytics error:", error);
    return errorResponse(res, "Failed to retrieve user analytics", 500);
  }
});

// ==================================================
// AI INSIGHTS ROUTES
// ==================================================

router.get("/ai/insights/:userId", requireAuth, async (req, res) => {
  try {
    const userId = String(req.params.userId || "");
    if (!userId) return errorResponse(res, "User ID is required", 400);

    if (String(req.user.userId) !== userId && req.user.role !== "admin") {
      return errorResponse(res, "Forbidden", 403);
    }

    const insights = {
      dataPoints: 180,
      lastAnalysis: new Date().toISOString(),
      performanceScore: 82,
      learningVelocity: "Accelerating",
      riskAssessment: "Low Risk",
      nextMilestone: "Advanced Network Scenarios",
      confidence: 88,
      performanceAnalytics: {
        overallScore: 82,
        improvementRate: 12,
        consistency: 78,
        completionRate: 89,
        analysis:
          "Your performance shows steady improvement with strong consistency in web security scenarios. Focus on network defense could yield significant gains.",
      },
      learningPatterns: {
        patterns: [
          { name: "Visual Learning", strength: 85 },
          { name: "Practical Application", strength: 78 },
          { name: "Theoretical Understanding", strength: 65 },
          { name: "Problem Solving", strength: 72 },
        ],
        summary:
          "You excel in visual and practical learning approaches. Consider incorporating more theoretical concepts through structured reading.",
      },
      skillGaps: {
        gaps: [
          {
            skill: "Advanced Network Analysis",
            severity: "medium",
            recommendation: "Focus on Wireshark and traffic analysis tools",
          },
          {
            skill: "Malware Reverse Engineering",
            severity: "high",
            recommendation: "Start with basic disassembly techniques",
          },
        ],
      },
      predictiveRecommendations: [
        {
          type: "Next Scenario",
          content:
            'Try the "Advanced Traffic Analysis" scenario to build on your network defense skills',
          confidence: 92,
          timeline: "Next 2 weeks",
        },
        {
          type: "Study Focus",
          content:
            "Dedicate time to understanding network protocols and their security implications",
          confidence: 85,
          timeline: "Ongoing",
        },
      ],
      trendAnalysis: {
        performanceTrend: "improving",
        learningAcceleration: "stable",
        focusAreas: "Web Security, Basic Cryptography",
        analysis:
          "Your learning trajectory is positive with consistent improvement. The next phase should focus on bridging skill gaps in network security.",
      },
      comparativeInsights: {
        peerRanking: "Top 25%",
        percentile: 78,
        strengthAreas: "Web application security, basic cryptography",
        improvementAreas: "Network traffic analysis, advanced system security",
      },
    };

    return successResponse(res, insights, "AI insights generated");
  } catch (error) {
    console.error("AI insights error:", error);
    return errorResponse(res, "Failed to generate AI insights", 500);
  }
});

router.post("/ai/generate-insights", requireAuth, async (req, res) => {
  try {
    const userId = String(req.body?.userId || "");
    if (!userId) return errorResponse(res, "User ID is required", 400);

    if (String(req.user.userId) !== userId && req.user.role !== "admin") {
      return errorResponse(res, "Forbidden", 403);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const insights = {
      dataPoints: 185,
      lastAnalysis: new Date().toISOString(),
      performanceScore: 85,
      learningVelocity: "Rapidly Improving",
      riskAssessment: "Low Risk",
      nextMilestone: "Expert Cryptography",
      confidence: 91,
      performanceAnalytics: {
        overallScore: 85,
        improvementRate: 15,
        consistency: 82,
        completionRate: 92,
        analysis:
          "Recent analysis shows accelerated learning with improved consistency. Your cryptography skills are approaching expert level.",
      },
      learningPatterns: {
        patterns: [
          { name: "Visual Learning", strength: 88 },
          { name: "Practical Application", strength: 82 },
          { name: "Theoretical Understanding", strength: 72 },
          { name: "Problem Solving", strength: 78 },
        ],
        summary:
          "Your learning patterns show well-rounded development across all dimensions. Continue balancing practical and theoretical approaches.",
      },
      skillGaps: {
        gaps: [
          {
            skill: "Advanced Malware Analysis",
            severity: "medium",
            recommendation: "Explore reverse engineering tools and techniques",
          },
        ],
      },
      predictiveRecommendations: [
        {
          type: "Achievement",
          content:
            "You're on track to complete the Cryptography path within the next week",
          confidence: 95,
          timeline: "1 week",
        },
        {
          type: "Next Challenge",
          content:
            "Consider attempting expert-level scenarios in your strongest areas",
          confidence: 88,
          timeline: "2-3 weeks",
        },
      ],
      trendAnalysis: {
        performanceTrend: "improving",
        learningAcceleration: "accelerating",
        focusAreas: "Cryptography, Web Security",
        analysis:
          "Excellent progress with accelerating learning velocity. Ready for advanced challenges.",
      },
      comparativeInsights: {
        peerRanking: "Top 20%",
        percentile: 82,
        strengthAreas: "Cryptography, Web Security, System Security",
        improvementAreas: "Advanced Network Defense",
      },
    };

    return successResponse(res, insights, "Fresh AI insights generated");
  } catch (error) {
    console.error("Generate insights error:", error);
    return errorResponse(res, "Failed to generate fresh insights", 500);
  }
});

module.exports = router;