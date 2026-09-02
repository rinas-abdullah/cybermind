// ===== BEHAVIORAL SECURITY ANALYSIS =====

/**
 * Analyzes and tracks behavioral security metrics
 * Tracks:
 * - Decision velocity (time to decide)
 * - Warning acknowledgment patterns
 * - Verification behaviors
 * - Pressure response patterns
 * - Consistency in decision-making
 */

class BehavioralSecurityAnalyzer {
  constructor() {
    this.thresholds = {
      fastDecision: 3000, // < 3 sec
      slowDecision: 15000, // > 15 sec
      warningAcknowledgmentGood: 70,
      decisionConsistency: 0.15, // coefficient of variation threshold
    };

    this.decisionPatterns = {
      rushed: { score: 0.3, risk: "high" },
      thoughtful: { score: 0.8, risk: "low" },
      inconsistent: { score: 0.5, risk: "medium" },
      "verification-focused": { score: 0.9, risk: "low" },
    };

    this.pressureResponses = {
      improved: "User performs better under pressure",
      degraded: "User makes more mistakes when pressured",
      consistent: "User maintains performance regardless of pressure",
    };
  }

  // ==================================================
  // HELPERS
  // ==================================================

  safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  clamp(value, min, max, fallback = min) {
    const n = this.safeNumber(value, fallback);
    return Math.min(Math.max(n, min), max);
  }

  safePercentage(numerator, denominator) {
    const num = this.safeNumber(numerator, 0);
    const den = this.safeNumber(denominator, 0);
    if (den <= 0) return 0;
    return (num / den) * 100;
  }

  round(value, digits = 0) {
    const n = this.safeNumber(value, 0);
    const factor = Math.pow(10, digits);
    return Math.round(n * factor) / factor;
  }

  normalizeDifficulty(value) {
    const difficulty = String(value || "").trim().toLowerCase();

    if (["beginner", "easy", "basic", "1"].includes(difficulty)) return "beginner";
    if (["intermediate", "medium", "2", "3"].includes(difficulty)) return "intermediate";
    if (["advanced", "hard", "4", "5", "expert"].includes(difficulty)) return "advanced";

    return "intermediate";
  }

  // ==================================================
  // DECISION VELOCITY
  // ==================================================

  /**
   * Analyze decision velocity (time taken to answer)
   */
  analyzeDecisionVelocity(decisionTimeMs, questionDifficulty = "intermediate") {
    const timeMs = Math.max(this.safeNumber(decisionTimeMs, 0), 0);
    const difficulty = this.normalizeDifficulty(questionDifficulty);

    const velocity =
      timeMs < this.thresholds.fastDecision
        ? "fast"
        : timeMs > this.thresholds.slowDecision
          ? "slow"
          : "moderate";

    const concernMap = {
      fast: "May be deciding too quickly without fully evaluating the risk.",
      moderate: "Decision pace appears balanced for thoughtful analysis.",
      slow: "Careful thinking is good, but excessive delay may hurt response effectiveness.",
    };

    const recommendationMap = {
      fast: "Slow down slightly and examine the indicators before acting.",
      moderate: "Maintain this balanced pace while verifying key details.",
      slow: "Work on making confident decisions a bit more efficiently.",
    };

    return {
      timeMs,
      classification: velocity,
      appropriateness: this.assessVelocityAppropriate(velocity, difficulty),
      concern: concernMap[velocity],
      recommendation: recommendationMap[velocity],
    };
  }

  /**
   * Assess if decision velocity is appropriate for difficulty
   */
  assessVelocityAppropriate(velocity, difficulty) {
    const level = this.normalizeDifficulty(difficulty);

    const appropriate = {
      "fast-beginner": false,
      "fast-intermediate": false,
      "fast-advanced": true,
      "moderate-beginner": true,
      "moderate-intermediate": true,
      "moderate-advanced": true,
      "slow-beginner": true,
      "slow-intermediate": true,
      "slow-advanced": false,
    };

    const key = `${velocity}-${level}`;
    return appropriate[key] !== false;
  }

  // ==================================================
  // WARNING RESPONSE
  // ==================================================

  /**
   * Analyze warning acknowledgment behavior
   */
  analyzeWarningResponse(
    warningsPresented,
    warningsAcknowledged,
    warningsHeeded
  ) {
    const presented = Math.max(this.safeNumber(warningsPresented, 0), 0);
    const acknowledged = Math.max(this.safeNumber(warningsAcknowledged, 0), 0);
    const heeded = Math.max(this.safeNumber(warningsHeeded, 0), 0);

    const acknowledgmentRate = this.safePercentage(acknowledged, presented);
    const heedingRate = this.safePercentage(heeded, acknowledged);

    return {
      warningsPresented: presented,
      warningsAcknowledged: acknowledged,
      warningsHeeded: heeded,
      acknowledgmentRate: Math.round(acknowledgmentRate),
      heedingRate: Math.round(heedingRate),
      pattern: this.classifyWarningPattern(acknowledgmentRate, heedingRate),
      risk: this.assessWarningRisk(acknowledgmentRate),
      concern:
        acknowledgmentRate < 50
          ? "Ignoring or missing security warnings creates significant security exposure."
          : "Warning awareness appears reasonably strong.",
      realWorldImplications:
        acknowledgmentRate < 70
          ? "In real incidents, ignored warnings often become missed chances to stop an attack early."
          : "In real incidents, you would be more likely to notice risky signals before damage increases.",
    };
  }

  /**
   * Classify the user's warning acknowledgment pattern
   */
  classifyWarningPattern(acknowledgmentRate, heedingRate) {
    if (acknowledgmentRate > 80 && heedingRate > 80) return "security-conscious";
    if (acknowledgmentRate < 30) return "warning-dismissive";
    if (acknowledgmentRate > 70 && heedingRate < 50) return "acknowledging-but-ignoring";
    return "moderate-awareness";
  }

  /**
   * Assess risk from warning behavior
   */
  assessWarningRisk(acknowledgmentRate) {
    if (acknowledgmentRate > this.thresholds.warningAcknowledgmentGood) return "low";
    if (acknowledgmentRate > 50) return "medium";
    return "high";
  }

  // ==================================================
  // VERIFICATION BEHAVIOR
  // ==================================================

  /**
   * Analyze verification behavior
   */
  analyzeVerificationBehavior(actionsAttempted, verificationsPerformed) {
    const attempted = Math.max(this.safeNumber(actionsAttempted, 0), 0);
    const verified = Math.max(this.safeNumber(verificationsPerformed, 0), 0);

    const verificationRate = this.safePercentage(verified, attempted);

    return {
      actionsAttempted: attempted,
      verificationsPerformed: verified,
      verificationRate: Math.round(verificationRate),
      pattern: this.classifyVerificationPattern(verificationRate),
      securityValue:
        verificationRate > 60 ? "high" : verificationRate > 30 ? "moderate" : "low",
      concern:
        verificationRate < 30
          ? "Low verification increases the chance of missing subtle but important warning signs."
          : "Verification behavior is helping reduce avoidable mistakes.",
      realWorldContext:
        verificationRate > 50
          ? "This resembles the habits of cautious defenders who validate before acting."
          : "Developing a more deliberate verification habit would improve security performance in real environments.",
    };
  }

  /**
   * Classify verification pattern
   */
  classifyVerificationPattern(rate) {
    if (rate > 70) return "verification-focused";
    if (rate > 40) return "selective-verification";
    if (rate > 10) return "minimal-verification";
    return "no-verification";
  }

  // ==================================================
  // PRESSURE RESPONSE
  // ==================================================

  /**
   * Analyze pressure response (timed scenarios)
   */
  analyzePressureResponse(normalScenarioScore, timedScenarioScore, timeLimit) {
    const normalScore = Math.max(this.safeNumber(normalScenarioScore, 0), 0);
    const timedScore = Math.max(this.safeNumber(timedScenarioScore, 0), 0);
    const safeTimeLimit = Math.max(this.safeNumber(timeLimit, 0), 0);

    const performanceDelta = timedScore - normalScore;

    const response =
      performanceDelta > 10
        ? "improved"
        : performanceDelta < -10
          ? "degraded"
          : "consistent";

    return {
      normalScore,
      timedScore,
      timeLimit: safeTimeLimit,
      performanceDelta,
      response,
      description: this.pressureResponses[response],
      realWorldImplication:
        response === "improved"
          ? "You appear to stay effective under pressure, which is valuable in live incidents."
          : response === "degraded"
            ? "Time pressure may reduce your security judgment, so stress-tolerant practice would help."
            : "Your decisions remain relatively stable even when time pressure increases.",
      developmentArea:
        response === "degraded"
          ? "Time management, calm prioritization, and stress-aware decision-making"
          : "Maintaining composure and improving confidence in fast-paced situations",
    };
  }

  // ==================================================
  // CONSISTENCY
  // ==================================================

  /**
   * Analyze decision consistency
   */
  analyzeDecisionConsistency(recentScores = []) {
    const scores = Array.isArray(recentScores)
      ? recentScores
          .map((score) => this.safeNumber(score, NaN))
          .filter((score) => Number.isFinite(score))
      : [];

    if (scores.length < 2) {
      return {
        recentScores: scores,
        average: scores.length === 1 ? scores[0] : 0,
        standardDeviation: 0,
        consistency: "insufficient-data",
        pattern: "insufficient-data",
        concern: "More attempts are needed before consistency can be measured reliably.",
        development: "Continue practicing so decision patterns become measurable.",
      };
    }

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
      scores.length;
    const stdDev = Math.sqrt(variance);

    const coefficientOfVariation = mean !== 0 ? (stdDev / mean) * 100 : 100;

    return {
      recentScores: scores,
      average: Math.round(mean),
      standardDeviation: Math.round(stdDev),
      coefficientOfVariation: this.round(coefficientOfVariation, 2),
      consistency:
        coefficientOfVariation < this.thresholds.decisionConsistency * 100
          ? "high"
          : "variable",
      pattern:
        coefficientOfVariation < 10
          ? "very-consistent"
          : coefficientOfVariation < 25
            ? "consistent"
            : "inconsistent",
      concern:
        coefficientOfVariation > 30
          ? "Decision quality varies noticeably across attempts."
          : "Decision quality appears relatively stable.",
      development:
        coefficientOfVariation > 30
          ? "Focus on applying the same security principles consistently across scenarios."
          : "Maintain this level of consistency while improving speed and accuracy.",
    };
  }

  // ==================================================
  // BEHAVIORAL RISKS
  // ==================================================

  /**
   * Identify behavioral security risks
   */
  identifyBehavioralRisks(userBehavior = {}) {
    const warningAcknowledgment = this.safeNumber(
      userBehavior.warningAcknowledgment,
      0
    );
    const decisionVelocity = this.safeNumber(userBehavior.decisionVelocity, 0);
    const verificationRate = this.safeNumber(userBehavior.verificationRate, 0);
    const pressurePerformance = this.safeNumber(
      userBehavior.pressurePerformance,
      0
    );
    const knowledgeLevel = this.safeNumber(userBehavior.knowledgeLevel, 0);

    const risks = [];

    if (warningAcknowledgment < 50) {
      risks.push({
        type: "warning-dismissal",
        severity: "critical",
        description: "Security warnings are not being acknowledged reliably.",
        realWorldImpact:
          "Attackers often rely on users ignoring warnings before compromise escalates.",
        mitigation: "Train yourself to pause and evaluate every security warning seriously.",
      });
    }

    if (decisionVelocity > 0 && decisionVelocity < 2000) {
      risks.push({
        type: "rushed-decisions",
        severity: "high",
        description: "Decisions may be happening too quickly for careful risk analysis.",
        realWorldImpact:
          "Fast, impulsive choices can lead to missed signs in phishing, malware, and privilege decisions.",
        mitigation:
          "Add a brief pause before acting on suspicious requests or unexpected prompts.",
      });
    }

    if (verificationRate < 20) {
      risks.push({
        type: "no-verification",
        severity: "high",
        description: "Information and actions are not being verified often enough.",
        realWorldImpact:
          "Lack of verification allows deception and configuration mistakes to pass unnoticed.",
        mitigation:
          "Build a habit of checking senders, URLs, permissions, and context before acting.",
      });
    }

    if (pressurePerformance < 0.6 && knowledgeLevel > 0.7) {
      risks.push({
        type: "pressure-sensitivity",
        severity: "medium",
        description: "Performance drops significantly under time pressure.",
        realWorldImpact:
          "Real incidents often involve urgency, which can amplify mistakes if calm prioritization is weak.",
        mitigation:
          "Practice timed scenarios and build a repeatable response process for stressful moments.",
      });
    }

    return risks;
  }

  // ==================================================
  // PROFILE SUMMARY
  // ==================================================

  /**
   * Generate behavioral profile summary
   */
  generateBehavioralProfile(
    decisionVelocity,
    warningAcknowledgment,
    verificationRate,
    pressurePerformance,
    consistencyScore
  ) {
    const safeDecisionVelocity = Math.max(this.safeNumber(decisionVelocity, 0), 0);
    const safeWarningAck = this.clamp(warningAcknowledgment, 0, 100, 0);
    const safeVerification = this.clamp(verificationRate, 0, 100, 0);
    const safePressure = this.clamp(pressurePerformance, 0, 1, 0);
    const safeConsistency = this.clamp(consistencyScore, 0, 1, 0);

    return {
      summary: {
        decisionSpeed:
          safeDecisionVelocity === 0
            ? "Unknown"
            : safeDecisionVelocity < 5000
              ? "Fast"
              : "Thoughtful",
        warningAwareness: safeWarningAck > 70 ? "High" : "Needs improvement",
        thoroughness: safeVerification > 50 ? "Thorough" : "Needs improvement",
        underPressure: safePressure > 0.7 ? "Stable" : "Variable",
        reliability: safeConsistency > 0.75 ? "Consistent" : "Variable",
      },

      strengths: this.identifyBehavioralStrengths(
        safeDecisionVelocity,
        safeWarningAck,
        safeVerification,
        safePressure
      ),

      improvementAreas: this.identifyBehavioralImprovements(
        safeDecisionVelocity,
        safeWarningAck,
        safeVerification,
        safePressure
      ),

      recommendations: this.generateBehavioralRecommendations(
        safeDecisionVelocity,
        safeWarningAck,
        safeVerification,
        safePressure
      ),

      realWorldReadiness: this.assessRealWorldReadiness(
        safeDecisionVelocity,
        safeWarningAck,
        safeVerification,
        safePressure,
        safeConsistency
      ),
    };
  }

  /**
   * Identify behavioral strengths
   */
  identifyBehavioralStrengths(
    decisionVelocity,
    warningAck,
    verification,
    pressure
  ) {
    const strengths = [];

    if (warningAck > 70) {
      strengths.push("Strong warning awareness and security signal recognition");
    }

    if (verification > 60) {
      strengths.push("Good habit of verifying before acting");
    }

    if (pressure > 0.7) {
      strengths.push("Stable decision-making under pressure");
    }

    if (decisionVelocity >= 5000 && decisionVelocity <= 15000) {
      strengths.push("Balanced decision pace with room for thoughtful analysis");
    }

    return strengths.length > 0
      ? strengths
      : ["Security behavior foundations are still being built"];
  }

  /**
   * Identify improvement areas
   */
  identifyBehavioralImprovements(
    decisionVelocity,
    warningAck,
    verification,
    pressure
  ) {
    const improvements = [];

    if (warningAck < 50) {
      improvements.push("Improve warning recognition and response discipline");
    }

    if (verification < 30) {
      improvements.push("Develop a stronger verification habit before acting");
    }

    if (pressure < 0.6) {
      improvements.push("Build calm, structured decision-making under time pressure");
    }

    if (decisionVelocity > 0 && decisionVelocity < 3000) {
      improvements.push("Slow down slightly and evaluate decisions more carefully");
    }

    return improvements.length > 0
      ? improvements
      : ["Continue applying current strong security habits consistently"];
  }

  /**
   * Generate behavioral recommendations
   */
  generateBehavioralRecommendations(
    decisionVelocity,
    warningAck,
    verification,
    pressure
  ) {
    const recommendations = [];

    if (warningAck < 70) {
      recommendations.push(
        "Practice more scenarios with visible warnings to strengthen this response pattern."
      );
    }

    if (verification < 50) {
      recommendations.push(
        "Add an explicit verification step before any high-impact action."
      );
    }

    if (pressure < 0.7) {
      recommendations.push(
        "Use timed scenarios with gradually tighter limits to improve calm under pressure."
      );
    }

    if (decisionVelocity > 0 && decisionVelocity < 3000) {
      recommendations.push(
        "Read the full scenario and all options before making a decision."
      );
    }

    return recommendations.length > 0
      ? recommendations
      : ["Maintain current habits and continue reinforcing consistency."];
  }

  /**
   * Assess real-world readiness
   */
  assessRealWorldReadiness(
    decisionVelocity,
    warningAck,
    verification,
    pressure,
    consistency
  ) {
    const safeWarningAck = this.clamp(warningAck, 0, 100, 0);
    const safeVerification = this.clamp(verification, 0, 100, 0);
    const safePressure = this.clamp(pressure, 0, 1, 0);
    const safeConsistency = this.clamp(consistency, 0, 1, 0);
    const safeDecisionVelocity = Math.max(this.safeNumber(decisionVelocity, 0), 0);

    // Ideal decision speed band centers roughly around 9s
    let speedScore = 0.5;
    if (safeDecisionVelocity > 0) {
      speedScore = Math.max(
        0,
        Math.min(1, 1 - Math.abs(safeDecisionVelocity - 9000) / 9000)
      );
    }

    const score =
      (safeWarningAck / 100) * 0.3 +
      speedScore * 0.15 +
      (safeVerification / 100) * 0.2 +
      safePressure * 0.2 +
      safeConsistency * 0.15;

    const nextFocus =
      safeWarningAck < 70
        ? "warning-acknowledgment"
        : safeVerification < 50
          ? "verification"
          : safePressure < 0.7
            ? "pressure-scenarios"
            : "consistency";

    return {
      readinessScore: Math.round(score * 100),
      readinessLevel:
        score > 0.8
          ? "Highly Ready"
          : score > 0.6
            ? "Mostly Ready"
            : score > 0.4
              ? "Developing"
              : "Early Stage",
      summary:
        score > 0.8
          ? "Behavioral patterns suggest strong readiness for realistic security decision-making."
          : score > 0.6
            ? "Good security instincts are forming; continued practice will strengthen reliability."
            : score > 0.4
              ? "Behavior is developing, but warning awareness and verification need more reinforcement."
              : "Foundational habits still need development before real-world security readiness improves.",
      nextFocus,
    };
  }
}

module.exports = BehavioralSecurityAnalyzer;