class ScenarioAnalysisService {
  constructor(
    riskScoringService,
    behaviorAnalysisService,
    aiMentorService,
    adaptiveLearningService,
    learnerProfileService
  ) {
    if (
      !riskScoringService ||
      !behaviorAnalysisService ||
      !aiMentorService ||
      !adaptiveLearningService ||
      !learnerProfileService
    ) {
      throw new Error(
        "ScenarioAnalysisService requires riskScoringService, behaviorAnalysisService, aiMentorService, adaptiveLearningService, and learnerProfileService"
      );
    }

    this.riskScoringService = riskScoringService;
    this.behaviorAnalysisService = behaviorAnalysisService;
    this.aiMentorService = aiMentorService;
    this.adaptiveLearningService = adaptiveLearningService;
    this.learnerProfileService = learnerProfileService;
  }

  normalizeScenariosInput(payload = {}) {
    const decisionTime = Number(payload.decisionTime || 0);
    const ignoredWarnings = Number(payload.ignoredWarnings || 0);
    const repeatedMistakes = Number(payload.repeatedMistakes || 0);

    const bounded = (value, min, max) =>
      Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

    return {
      scenarioType:
        typeof payload.scenarioType === "string"
          ? payload.scenarioType.trim()
          : "unknown",
      userAction:
        typeof payload.userAction === "string"
          ? payload.userAction.trim()
          : "none",
      repeatedMistakes: bounded(repeatedMistakes, 0, 100),
      decisionVelocity: bounded(decisionTime, 0, 60000),
      warningAcknowledgment: bounded(100 - ignoredWarnings * 100, 0, 100),
      verificationBehavior: bounded(100 - repeatedMistakes * 10, 0, 100),
      pressurePerformance: bounded(100 - repeatedMistakes * 6, 0, 100),
      consistencyScore: bounded(100 - repeatedMistakes * 8, 0, 100),
    };
  }

  async analyzeScenario(payload = {}) {
    const normalized = this.normalizeScenariosInput(payload);

    const behaviorAnalysis = this.behaviorAnalysisService.generateBehavioralProfile(
      normalized.decisionVelocity,
      normalized.warningAcknowledgment,
      normalized.verificationBehavior,
      normalized.pressurePerformance,
      normalized.consistencyScore
    );

    const riskScore = this.riskScoringService.calculateRiskScore(behaviorAnalysis);

    let mentorAdvice;
    try {
      mentorAdvice = this.aiMentorService.generateStructuredAdvice({
        riskScore,
        behaviorAnalysis,
        userAction: normalized.userAction,
      });
    } catch (error) {
      mentorAdvice = {
        summary: {
          risk: `${riskScore.riskLevel.toUpperCase()} (score: ${riskScore.riskScore})`,
          behavior: behaviorAnalysis,
          action: this.aiMentorService?.summarizeAction
            ? this.aiMentorService.summarizeAction(normalized.userAction)
            : normalized.userAction,
        },
        explanation:
          "AI mentor advice temporarily unavailable. Using best-effort fallback.",
        real_world_impact:
          "AI mentor module error; use the risk and behavior data directly.",
        recommendation: ["Retry later or contact admin."],
      };
    }

    const adaptiveNextStep = this.adaptiveLearningService.generateAdaptivePlan({
      scenarioType: normalized.scenarioType,
      riskScore,
      behaviorAnalysis,
      userAction: normalized.userAction,
      learnerProfile: payload.learnerProfile || {},
    });

    const userId = payload.userId || "";
    let learnerProfile = null;

    if (userId) {
      try {
        await this.learnerProfileService.updateLearnerProfileFromAnalysis(userId, {
          scenarioType: normalized.scenarioType,
          userAction: normalized.userAction,
          riskScore,
          behaviorAnalysis,
          mentorAdvice,
          adaptiveNextStep,
          repeatedMistakes: normalized.repeatedMistakes,
        });

        learnerProfile = await this.learnerProfileService.getLearnerProfile(userId);
      } catch (err) {
        console.warn("Profile update/load failed:", err.message);
      }
    }

    return {
      riskScore,
      behaviorAnalysis,
      mentorAdvice,
      adaptiveNextStep,
      learnerProfile,
      scenarioType: normalized.scenarioType,
      userAction: normalized.userAction,
      meta: {
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

module.exports = ScenarioAnalysisService;