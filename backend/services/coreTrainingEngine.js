// ===== CORE TRAINING ENGINE - Service Integration =====

/**
 * Core Training Engine
 * Orchestrates all intelligent systems to create a cohesive adaptive learning platform
 *
 * Integration points:
 * 1. Called by scenario API routes
 * 2. Manages lifecycle of scenario attempts
 * 3. Coordinates all services for end-to-end learning experience
 */

const AdaptiveScenarioEngine = require("./adaptiveEngine");
const RiskProfileService = require("./riskProfileService");
const ExplainableAITutor = require("./aiTutor");
const BehavioralSecurityAnalyzer = require("./behavioralAnalyzer");
const InstitutionalAnalyticsEngine = require("./institutionalAnalytics");
const AdaptiveLearningEngine = require("./adaptiveLearningEngine");

class CoreTrainingEngine {
  constructor() {
    this.riskProfileService = new RiskProfileService();
    this.tutor = new ExplainableAITutor();
    this.behavioralAnalyzer = new BehavioralSecurityAnalyzer();
    this.analyticsEngine = new InstitutionalAnalyticsEngine();
    this.adaptiveLearningEngine = new AdaptiveLearningEngine();

    // In-memory storage (replace with database later)
    this.userProfiles = new Map();
    this.scenarioAttempts = new Map();
    this.cohortData = new Map();
  }

  // ==================================================
  // HELPERS
  // ==================================================

  safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  safeString(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  clamp(value, min, max, fallback = min) {
    const n = this.safeNumber(value, fallback);
    return Math.min(Math.max(n, min), max);
  }

  normalizeSkillMemory(skillMemory = []) {
    return this.safeArray(skillMemory)
      .filter((skill) => skill && typeof skill === "object")
      .map((skill) => ({
        skillName: this.safeString(skill.skillName, "unknown-skill"),
        retentionConfidence: this.clamp(skill.retentionConfidence, 0, 100, 0),
        successCount: Math.max(this.safeNumber(skill.successCount, 0), 0),
        failureCount: Math.max(this.safeNumber(skill.failureCount, 0), 0),
        lastPassed: skill.lastPassed || null,
        lastFailed: skill.lastFailed || null,
      }));
  }

  getProfileOrThrow(userId) {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error(`User profile not found: ${userId}`);
    }
    return profile;
  }

  getWeakestSkills(skillMemory = [], limit = 3) {
    return [...this.normalizeSkillMemory(skillMemory)]
      .sort((a, b) => a.retentionConfidence - b.retentionConfidence)
      .slice(0, limit)
      .map((s) => s.skillName);
  }

  getStrongestSkills(skillMemory = [], limit = 3) {
    return [...this.normalizeSkillMemory(skillMemory)]
      .sort((a, b) => b.retentionConfidence - a.retentionConfidence)
      .slice(0, limit)
      .map((s) => s.skillName);
  }

  calculateSkillSuccessRate(skill) {
    const successCount = Math.max(this.safeNumber(skill?.successCount, 0), 0);
    const failureCount = Math.max(this.safeNumber(skill?.failureCount, 0), 0);
    const total = successCount + failureCount;
    return total > 0 ? successCount / total : 0;
  }

  buildAdaptiveEngine(userProfile, availableScenarios = []) {
    return new AdaptiveScenarioEngine(
      userProfile,
      this.normalizeSkillMemory(userProfile?.skillMemory || []),
      this.safeArray(availableScenarios)
    );
  }

  // ==================================================
  // USER INITIALIZATION
  // ==================================================

  /**
   * Initialize new user in the training system
   * Called on user registration
   */
  initializeUser(userId, username) {
    const profile = this.riskProfileService.createProfile(userId, username);
    this.userProfiles.set(userId, profile);
    return profile;
  }

  // ==================================================
  // SCENARIO SELECTION
  // ==================================================

  /**
   * Select next scenario for a user
   * Called before training session
   *
   * Returns: Scenario with adaptive metadata and explanations
   */
  async selectNextScenario(userId, availableScenarios, behavioralData = {}) {
    const userProfile = this.getProfileOrThrow(userId);

    const adaptiveEngine = this.buildAdaptiveEngine(userProfile, availableScenarios);

    const selectedScenario = await adaptiveEngine.selectNextScenario(behavioralData);

    if (!selectedScenario) {
      throw new Error("No scenario available for selection");
    }

    const enrichedScenario = {
      ...selectedScenario,
      adaptiveMetadata: {
        ...(selectedScenario.adaptiveContext || {}),
        scenarioExplanation: this.tutor.explainScenarioSelection(
          {
            whySelected: selectedScenario?.adaptiveContext?.whySelected || "",
            skillTags: selectedScenario?.skillTags || [],
          },
          {
            ...userProfile,
            weakestSkill:
              this.getWeakestSkills(userProfile.skillMemory, 1)[0] ||
              "core security awareness",
            nextDifficulty: await adaptiveEngine.calculateAppropriateDifficulty(
              behavioralData
            ),
          }
        ),
        difficulty: this.calculateUserAppropriateDifficulty(userProfile),
        personalContext: this.generatePersonalContext(userProfile, selectedScenario),
      },
    };

    return enrichedScenario;
  }

  // ==================================================
  // ATTEMPT PROCESSING
  // ==================================================

  /**
   * Process scenario attempt
   * Called when user submits answers
   */
  async processScenarioAttempt(userId, scenarioId, scenarioResult = {}) {
    const userProfile = this.getProfileOrThrow(userId);

    const safeScenarioId = this.safeString(scenarioId, "unknown-scenario");
    const safeSkillsInvolved = this.safeArray(scenarioResult.skillsInvolved)
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => s.trim());

    const safeIncorrectAnswers = this.safeArray(scenarioResult.incorrectAnswers);
    const safeQuestions = this.safeArray(scenarioResult.questions);
    const safeScore = this.clamp(scenarioResult.score, 0, 1000, 0);
    const safeDecisionTimeMs = Math.max(
      this.safeNumber(scenarioResult.decisionTimeMs, 0),
      0
    );
    const safeTimeSpent = Math.max(this.safeNumber(scenarioResult.timeSpent, 0), 0);

    // 1. Log attempt
    const attemptId = `${userId}-${safeScenarioId}-${Date.now()}`;
    const attempt = {
      id: attemptId,
      userId,
      scenarioId: safeScenarioId,
      ...scenarioResult,
      score: safeScore,
      decisionTimeMs: safeDecisionTimeMs,
      timeSpent: safeTimeSpent,
      timestamp: new Date(),
    };
    this.scenarioAttempts.set(attemptId, attempt);

    // 2. Analyze behavioral metrics
    const behavioralAnalysis = this.behavioralAnalyzer.analyzeDecisionVelocity(
      safeDecisionTimeMs,
      scenarioResult.difficulty || this.calculateUserAppropriateDifficulty(userProfile)
    );

    // 3. Update user profile
    this.riskProfileService.updateProfileAfterScenario(userProfile, {
      score: safeScore,
      skillsInvolved: safeSkillsInvolved,
      decisionTimeMs: safeDecisionTimeMs,
      warningsPresented: this.safeNumber(scenarioResult.warningsPresented, 0),
      warningsAcknowledged: this.safeNumber(
        scenarioResult.warningsAcknowledged,
        0
      ),
      verificationsPerformed: this.safeNumber(
        scenarioResult.verificationsPerformed,
        0
      ),
      questionsAnswered: this.safeNumber(scenarioResult.questionsAnswered, 0),
      timeLimited: Boolean(scenarioResult.timeLimited),
      decisions: this.safeArray(scenarioResult.decisions),
    });

    // 4. Generate AI explanations for wrong answers
    const explanations = safeIncorrectAnswers
      .map((wrong) => {
        const question = safeQuestions[wrong?.questionIndex] || {
          type: "general",
          text: "Scenario question",
        };

        return this.tutor.explainWrongAnswer(
          question,
          wrong?.userAnswer || "unknown answer",
          wrong?.correctAnswer || "correct answer",
          {
            industry: "finance",
            frequency: "regularly",
            impact: "data breach or account compromise",
          }
        );
      })
      .filter(Boolean);

    // 5. Behavioral profile summary
    const behavioralMetrics = userProfile.behavioralMetrics || {};
    const scoreHistory = this.safeArray(userProfile.scoreHistory);

    const behavioralProfile = this.behavioralAnalyzer.generateBehavioralProfile(
      behavioralMetrics.decisionVelocity || safeDecisionTimeMs || 9000,
      behavioralMetrics.warningAcknowledgment || 0,
      behavioralMetrics.verificationBehavior || 0,
      behavioralMetrics.pressurePerformance || 0,
      scoreHistory.length > 1 ? 0.8 : 0.5
    );

    // 6. Persist learner progress
    try {
      const { completeScenario } = require("../data/progress");
      await completeScenario(
        userProfile.username,
        safeScenarioId,
        safeScore,
        safeTimeSpent
      );
    } catch (e) {
      console.warn("Failed to persist progress after attempt:", e.message);
    }

    const normalizedSkillMemory = this.normalizeSkillMemory(userProfile.skillMemory);
    const weakestSkill = this.getWeakestSkills(normalizedSkillMemory, 1)[0] || null;

    // 7. Return comprehensive feedback
    return {
      attemptId,
      score: safeScore,
      passed: safeScore >= 70,

      tutorFeedback: {
        wrongAnswers: explanations.length,
        explanations,
        keyTakeaways: explanations.map((e) => e.keyTakeaway),
        motivationalMessage: this.tutor.generateMotivation(
          this.safeNumber(userProfile.completedScenarios, 0) + 1,
          userProfile
        ),
      },

      behavioralInsights: {
        decisionVelocity: behavioralAnalysis,
        behavioralProfile,
        riskIdentified: this.behavioralAnalyzer.identifyBehavioralRisks(
          userProfile.behavioralMetrics || {}
        ),
      },

      userProgressUpdate: {
        newKnowledgeLevel: this.safeNumber(userProfile.knowledgeLevel, 0),
        newPersona: this.safeString(userProfile.riskPersona, "Unclassified"),
        skillsImproved: safeSkillsInvolved.filter((skillName) =>
          normalizedSkillMemory.find(
            (m) => m.skillName === skillName && m.successCount > 0
          )
        ),
        skillsNeedingWork: safeSkillsInvolved.filter((skillName) =>
          normalizedSkillMemory.find(
            (m) => m.skillName === skillName && m.failureCount > 1
          )
        ),
      },

      nextActions: {
        nextScenario: weakestSkill
          ? `Based on your ${userProfile.riskPersona}, the next scenario should reinforce ${weakestSkill}.`
          : "Continue with the next adaptive scenario in your path.",
        focusArea: weakestSkill,
        readyForAdvanced: this.safeNumber(userProfile.knowledgeLevel, 0) > 75,
      },
    };
  }

  // ==================================================
  // DASHBOARD
  // ==================================================

  /**
   * Get user dashboard data
   * Called to display user progress and recommendations
   */
  getUserDashboard(userId) {
    const userProfile = this.getProfileOrThrow(userId);
    const normalizedSkillMemory = this.normalizeSkillMemory(userProfile.skillMemory);
    const completedScenarios = this.safeNumber(userProfile.completedScenarios, 0);

    return {
      profile: {
        knowledgeLevel: this.safeNumber(userProfile.knowledgeLevel, 0),
        riskPersona: this.safeString(userProfile.riskPersona, "Unclassified"),
        completedScenarios,
      },

      stats: {
        overallScore: this.safeNumber(userProfile.knowledgeLevel, 0),
        scenariosCompleted: completedScenarios,
        skillsMastered: normalizedSkillMemory.filter(
          (s) => s.retentionConfidence > 80
        ).length,
        skillsInProgress: normalizedSkillMemory.filter(
          (s) => s.retentionConfidence > 40 && s.retentionConfidence <= 80
        ).length,
        skillsNeedingWork: normalizedSkillMemory.filter(
          (s) => s.retentionConfidence <= 40
        ).length,
      },

      skillMemory: normalizedSkillMemory.map((skill) => ({
        skillName: skill.skillName,
        retentionConfidence: skill.retentionConfidence,
        successRate: this.calculateSkillSuccessRate(skill),
        lastAttempted: skill.lastPassed || skill.lastFailed,
        status:
          skill.retentionConfidence > 80
            ? "mastered"
            : skill.retentionConfidence > 50
              ? "developing"
              : "needs-work",
      })),

      behavioralProfile: userProfile.behavioralMetrics || {},

      recommendations: {
        nextScenario:
          this.getWeakestSkills(normalizedSkillMemory, 1)[0]
            ? `Focus on ${this.getWeakestSkills(normalizedSkillMemory, 1)[0]}`
            : "Continue with your next recommended adaptive scenario.",
        focusAreas: this.getWeakestSkills(normalizedSkillMemory, 3),
        strengthAreas: this.getStrongestSkills(normalizedSkillMemory, 3),
      },

      progressChart: this.safeArray(userProfile.scoreHistory),
    };
  }

  // ==================================================
  // COHORT ANALYTICS
  // ==================================================

  /**
   * Get institutional analytics for cohort
   * Called by admin dashboard
   */
  getCohortAnalytics(cohortUserIds = []) {
    const cohortUsers = this.safeArray(cohortUserIds)
      .map((id) => this.userProfiles.get(id))
      .filter((u) => u !== undefined);

    if (cohortUsers.length === 0) {
      return { error: "No users in cohort" };
    }

    return {
      cohortReport: this.analyticsEngine.generateCohortReport(cohortUsers),
      skillGapHeatmap: this.analyticsEngine.generateSkillGapHeatmap(cohortUsers),
      anonymizedData:
        this.analyticsEngine.exportAnonymizedCohortData(cohortUsers),
      timestamp: new Date(),
    };
  }

  // ==================================================
  // LEARNING REPORT
  // ==================================================

  /**
   * Get learning report for user
   * Detailed progress and recommendations
   */
  getLearningReport(userId) {
    const userProfile = this.getProfileOrThrow(userId);

    const report = this.tutor.generateLearningReport(
      userId,
      this.safeNumber(userProfile.completedScenarios, 0),
      this.normalizeSkillMemory(userProfile.skillMemory),
      userProfile
    );

    report.behavioralAnalysis = this.behavioralAnalyzer.generateBehavioralProfile(
      userProfile.behavioralMetrics?.decisionVelocity || 9000,
      userProfile.behavioralMetrics?.warningAcknowledgment || 50,
      userProfile.behavioralMetrics?.verificationBehavior || 30,
      userProfile.behavioralMetrics?.pressurePerformance || 0.6,
      0.7
    );

    return report;
  }

  // ==================================================
  // SUPPORT HELPERS
  // ==================================================

  calculateUserAppropriateDifficulty(userProfile = {}) {
    const knowledgeLevel = this.safeNumber(userProfile.knowledgeLevel, 0);

    if (knowledgeLevel < 40) return "beginner";
    if (knowledgeLevel < 70) return "intermediate";
    if (knowledgeLevel < 90) return "advanced";
    return "expert";
  }

  // backward compatibility for old typo if used elsewhere
  calculateUserAppropiateDifficulty(userProfile = {}) {
    return this.calculateUserAppropriateDifficulty(userProfile);
  }

  generatePersonalContext(userProfile = {}, scenario = {}) {
    const helperEngine = this.buildAdaptiveEngine(userProfile, []);
    return {
      persona: this.safeString(userProfile.riskPersona, "Unclassified"),
      approach: helperEngine.suggestApproachFor(
        this.safeString(userProfile.riskPersona, "Unclassified")
      ),
      skillFocus: this.safeArray(scenario.skillTags),
      difficulty: this.calculateUserAppropriateDifficulty(userProfile),
    };
  }

  // ==================================================
  // PERSISTENCE HELPERS
  // ==================================================

  saveUserProfile(userId, profile) {
    this.userProfiles.set(userId, profile);
  }

  loadUserProfile(userId) {
    return this.userProfiles.get(userId);
  }

  getAllUserProfiles() {
    return Array.from(this.userProfiles.values());
  }

  getAttemptHistory(userId) {
    return Array.from(this.scenarioAttempts.values()).filter(
      (attempt) => attempt.userId === userId
    );
  }

  // ==================================================
  // ADAPTIVE PROMPT GENERATION
  // ==================================================

  /**
   * Generate adaptive prompt for OpenAI based on current difficulty
   * @param {number} scenarioId - Scenario ID to get current difficulty
   * @param {string} basePrompt - Base prompt template
   * @returns {string} - Adapted prompt with difficulty
   */
  async generateAdaptivePrompt(scenarioId, basePrompt) {
    const currentDifficulty = await this.adaptiveLearningEngine.getCurrentDifficulty(scenarioId);
    return this.adaptiveLearningEngine.generateAdaptivePrompt(currentDifficulty, basePrompt);
  }
}

module.exports = CoreTrainingEngine;