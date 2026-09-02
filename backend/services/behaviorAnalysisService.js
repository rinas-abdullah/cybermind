const BehavioralSecurityAnalyzer = require("./behavioralAnalyzer");

class BehaviorAnalysisService {
  constructor() {
    this.analyzer = new BehavioralSecurityAnalyzer();
  }

  analyzeDecisionVelocity(decisionTimeMs, questionDifficulty = "intermediate") {
    return this.analyzer.analyzeDecisionVelocity(decisionTimeMs, questionDifficulty);
  }

  analyzeWarningResponse(warningsPresented, warningsAcknowledged, warningsHeeded) {
    return this.analyzer.analyzeWarningResponse(
      warningsPresented,
      warningsAcknowledged,
      warningsHeeded
    );
  }

  analyzeVerificationBehavior(actionsAttempted, verificationsPerformed) {
    return this.analyzer.analyzeVerificationBehavior(actionsAttempted, verificationsPerformed);
  }

  analyzePressureResponse(normalScenarioScore, timedScenarioScore, timeLimit) {
    return this.analyzer.analyzePressureResponse(normalScenarioScore, timedScenarioScore, timeLimit);
  }

  analyzeDecisionConsistency(recentScores = []) {
    return this.analyzer.analyzeDecisionConsistency(recentScores);
  }

  identifyBehavioralRisks(behaviorData = {}) {
    return this.analyzer.identifyBehavioralRisks(behaviorData);
  }

  generateBehavioralProfile(
    decisionVelocity,
    warningAcknowledgment,
    verificationRate,
    pressurePerformance,
    consistencyScore
  ) {
    return this.analyzer.generateBehavioralProfile(
      decisionVelocity,
      warningAcknowledgment,
      verificationRate,
      pressurePerformance,
      consistencyScore
    );
  }

  getFullBehaviorReport(userProfile = {}) {
    const metrics = userProfile.behavioralMetrics || {};

    return {
      decisionVelocity: this.analyzeDecisionVelocity(metrics.decisionVelocity || 0),
      warningResponse: this.analyzeWarningResponse(
        metrics.warningsPresented || 0,
        metrics.warningAcknowledgment || 0,
        metrics.verificationBehavior || 0
      ),
      verification: this.analyzeVerificationBehavior(
        metrics.questionsAnswered || 0,
        metrics.verificationsPerformed || 0
      ),
      pressure: this.analyzePressureResponse(
        metrics.pressurePerformance || 0,
        metrics.pressurePerformance || 0,
        30000
      ),
      consistency: this.analyzeDecisionConsistency(metrics.scoreHistory || []),
      profile: this.generateBehavioralProfile(
        metrics.decisionVelocity || 0,
        metrics.warningAcknowledgment || 0,
        metrics.verificationBehavior || 0,
        metrics.pressurePerformance || 0,
        (metrics.consistencyScore || 0) / 100
      ),
      risks: this.identifyBehavioralRisks(metrics),
    };
  }
}

module.exports = BehaviorAnalysisService;
