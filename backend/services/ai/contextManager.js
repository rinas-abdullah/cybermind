function buildBehavioralContext(behavioralData = {}) {
  if (!behavioralData || typeof behavioralData !== "object") {
    return { summary: "No behavioral data provided" };
  }

  return {
    summary: `Decision speed ${behavioralData.decisionTimeMs || 0}ms, warnings acknowledged ${behavioralData.warningsAcknowledged || 0}, verifications performed ${behavioralData.verificationsPerformed || 0}`,
    riskProfile: {
      decisionVelocity: behavioralData.decisionTimeMs || 0,
      warningAcknowledgment: behavioralData.warningsAcknowledged || 0,
      verificationRate: behavioralData.verificationsPerformed || 0,
    },
    details: behavioralData,
  };
}

module.exports = {
  buildBehavioralContext,
};