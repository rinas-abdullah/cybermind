class AdaptiveLearningService {
  constructor() {
    this.difficultyLevels = ["beginner", "intermediate", "advanced", "expert"];
  }

  normalizeRisk(riskScore = {}) {
    const score = Number(riskScore.riskScore ?? riskScore.score ?? 50);
    let riskLevel = String(riskScore.riskLevel || riskScore.level || "medium").toLowerCase();

    if (Number.isFinite(score)) {
      if (score >= 80) riskLevel = "very-high";
      else if (score >= 60) riskLevel = "high";
      else if (score >= 40) riskLevel = "medium";
      else if (score >= 20) riskLevel = "low";
      else riskLevel = "very-low";
    }

    return { score: Math.max(0, Math.min(100, score)), level: riskLevel };
  }

  normalizeBehavior(behaviorAnalysis = {}) {
    return {
      decisionVelocity: Number(behaviorAnalysis.decisionVelocity ?? 0),
      warningAcknowledgment: Number(behaviorAnalysis.warningAcknowledgment ?? 0),
      verificationBehavior: Number(behaviorAnalysis.verificationBehavior ?? 0),
      pressurePerformance: Number(behaviorAnalysis.pressurePerformance ?? 0),
      consistencyScore: Number(behaviorAnalysis.consistencyScore ?? 0),
      repeatedMistakes: Number(behaviorAnalysis.repeatedMistakes ?? 0),
    };
  }

  determineDifficulty(metaDifficulty = "intermediate", riskLevel, behavior) {
    const idx = this.difficultyLevels.indexOf(metaDifficulty) >= 0 ? this.difficultyLevels.indexOf(metaDifficulty) : 1;

    if (riskLevel === "very-high" || riskLevel === "high") {
      return "decrease";
    }

    if (behavior.decisionVelocity < 3000 || behavior.warningAcknowledgment < 50) {
      return "maintain";
    }

    if (behavior.consistencyScore >= 80 && behavior.verificationBehavior >= 70 && behavior.pressurePerformance >= 70) {
      return "increase";
    }

    return "maintain";
  }

  recommendFocusSkills(behavior) {
    const skills = [];
    if (behavior.warningAcknowledgment < 70) skills.push("Phishing awareness");
    if (behavior.verificationBehavior < 70) skills.push("Verification practices");
    if (behavior.decisionVelocity < 3000 || behavior.decisionVelocity > 15000) skills.push("Decision pacing");
    if (behavior.pressurePerformance < 60) skills.push("Stress-based decision making");
    if (behavior.consistencyScore < 60) skills.push("Consistency in scenario response");
    if (skills.length === 0) skills.push("Advanced threat modeling");
    return skills;
  }

  determineRemediation(behavior) {
    return behavior.repeatedMistakes > 2 || behavior.warningAcknowledgment < 40 || behavior.verificationBehavior < 40;
  }

  selectScenarioType(scenarioType, riskLevel, behavior) {
    if (riskLevel === "very-high" || riskLevel === "high") {
      return scenarioType || "reinforcement";
    }

    if (behavior.warningAcknowledgment < 60 || behavior.verificationBehavior < 60) {
      return "phishing";
    }

    if (behavior.pressurePerformance < 60) {
      return "timed-response";
    }

    return scenarioType || "advanced-case";
  }

  buildLearningPath(scenarioType, difficultyAdjustment, focusSkills, remediationNeeded) {
    const path = [];

    if (remediationNeeded) {
      path.push("Zoom workshop: risk awareness and verification fundamentals");
    }

    if (difficultyAdjustment === "increase") {
      path.push(`Move to a harder ${scenarioType} scenario`);
    } else if (difficultyAdjustment === "decrease") {
      path.push(`Revisit core ${scenarioType} concepts with medium difficulty`);
    } else {
      path.push(`Continue current progression with diversified ${scenarioType} drills`);
    }

    focusSkills.forEach((skill) => {
      path.push(`Skill drill: ${skill}`);
    });

    return path;
  }

  generateAdaptivePlan({ scenarioType, riskScore, behaviorAnalysis, userAction, learnerProfile = {} }) {
    const normalizedRisk = this.normalizeRisk(riskScore);
    const normalizedBehavior = this.normalizeBehavior(behaviorAnalysis);

    const difficultyAdjustment = this.determineDifficulty(learnerProfile.currentDifficulty || "intermediate", normalizedRisk.level, normalizedBehavior);
    const focusSkills = this.recommendFocusSkills(normalizedBehavior);
    const remediationNeeded = this.determineRemediation(normalizedBehavior);
    const nextScenarioType = this.selectScenarioType(scenarioType, normalizedRisk.level, normalizedBehavior);

    const adaptiveReason = `Risk=${normalizedRisk.level}, warnings=${normalizedBehavior.warningAcknowledgment}%, verification=${normalizedBehavior.verificationBehavior}%, consistent=${normalizedBehavior.consistencyScore}%.`;

    return {
      nextScenarioType,
      difficultyAdjustment,
      focusSkills,
      remediationNeeded,
      adaptiveReason,
      recommendedLearningPath: this.buildLearningPath(nextScenarioType, difficultyAdjustment, focusSkills, remediationNeeded),
      meta: {
        userAction: String(userAction || "").trim(),
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

module.exports = AdaptiveLearningService;
