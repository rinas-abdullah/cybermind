const RiskProfileService = require("./riskProfileService");
const BehavioralSecurityAnalyzer = require("./behavioralAnalyzer");

class RiskScoringService {
  constructor() {
    this.riskProfileService = new RiskProfileService();
    this.behavioralAnalyzer = new BehavioralSecurityAnalyzer();
  }

  createUserProfile(userId, username) {
    return this.riskProfileService.createProfile(userId, username);
  }

  getUserProfile(userId) {
    return this.riskProfileService.getProfile(userId);
  }

  updateProfileAfterScenario(userId, scenarioResult) {
    return this.riskProfileService.updateProfileAfterScenario(userId, scenarioResult);
  }

  calculateRiskScore(behavioralMetrics = {}) {
    const velocity = Number(behavioralMetrics.decisionVelocity || 0);
    const warning = Number(behavioralMetrics.warningAcknowledgment || 0);
    const verification = Number(behavioralMetrics.verificationBehavior || 0);
    const pressure = Number(behavioralMetrics.pressurePerformance || 0);
    const consistency = Number(behavioralMetrics.consistencyScore || 0);

    const velocityRisk = velocity <= 0 ? 50 : Math.max(0, Math.min(100, ((velocity - 9000) / 90) + 50));
    const warningRisk = 100 - warning;
    const verificationRisk = 100 - verification;
    const pressureRisk = Math.max(0, 100 - pressure);
    const consistencyRisk = Math.max(0, 100 - consistency);

    const composite = (velocityRisk * 0.25 + warningRisk * 0.2 + verificationRisk * 0.2 + pressureRisk * 0.2 + consistencyRisk * 0.15);
    const score = Math.round(Math.max(0, Math.min(100, composite)));

    let level = "medium";
    if (score >= 75) level = "high";
    else if (score <= 35) level = "low";

    return {
      riskScore: score,
      riskLevel: level,
      metrics: {
        velocityRisk: Math.round(velocityRisk),
        warningRisk: Math.round(warningRisk),
        verificationRisk: Math.round(verificationRisk),
        pressureRisk: Math.round(pressureRisk),
        consistencyRisk: Math.round(consistencyRisk),
      },
    };
  }

  evaluateUserRisk(userId) {
    const profile = this.getUserProfile(userId);
    if (!profile) return null;

    const behavioralMetrics = profile.behavioralMetrics || {};
    const riskResult = this.calculateRiskScore(behavioralMetrics);

    return {
      userId,
      riskProfile: profile,
      riskResult,
    };
  }

  describeRiskPersona(userId) {
    const profile = this.getUserProfile(userId);
    if (!profile) return null;

    const metrics = profile.behavioralMetrics || {};
    const riskDetails = this.calculateRiskScore(metrics);

    return {
      userId,
      riskPersona: profile.riskPersona || "Unclassified",
      likelihood: riskDetails,
    };
  }
}

module.exports = RiskScoringService;
