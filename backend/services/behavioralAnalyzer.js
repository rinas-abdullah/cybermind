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
    // Behavioral thresholds for analysis
    this.thresholds = {
      fastDecision: 3000,  // < 3 seconds = fast
      slowDecision: 15000, // > 15 seconds = slow
      warningAcknowledgmentGood: 70,
      decisionConsistency: 0.15  // variance threshold
    };

    // Decision patterns and risk levels
    this.decisionPatterns = {
      'rushed': { score: 0.3, risk: 'high' },
      'thoughtful': { score: 0.8, risk: 'low' },
      'inconsistent': { score: 0.5, risk: 'medium' },
      'verification-focused': { score: 0.9, risk: 'low' }
    };

    this.pressureResponses = {
      'improved': 'User performs better under pressure',
      'degraded': 'User makes more mistakes when pressured',
      'consistent': 'User maintains performance regardless of pressure'
    };
  }

  /**
   * Analyze decision velocity (time taken to answer)
   */
  analyzeDecisionVelocity(decisionTimeMs, questionDifficulty) {
    const velocity =
      decisionTimeMs < this.thresholds.fastDecision ? 'fast' :
      decisionTimeMs > this.thresholds.slowDecision ? 'slow' :
      'moderate';

    return {
      timeMs: decisionTimeMs,
      classification: velocity,
      appropriateness: this.assessVelocityAppropriate(velocity, questionDifficulty),
      concern: velocity === 'fast' ? 'May not be thinking through implications' : 'Thorough thinking, but may lose focus',
      recommendation: velocity === 'fast' ? 'Slow down and analyze' : 'Make decisions more decisively'
    };
  }

  /**
   * Assess if decision velocity is appropriate for difficulty
   */
  assessVelocityAppropriate(velocity, difficulty) {
    const appropriate = {
      'fast-beginner': false, // Too rushed for basics
      'fast-intermediate': false,
      'fast-advanced': true, // Advanced can move faster
      'moderate-beginner': true,
      'moderate-intermediate': true,
      'moderate-advanced': true,
      'slow-beginner': true,
      'slow-intermediate': true,
      'slow-advanced': false  // Too slow for expert level
    };

    const key = `${velocity}-${difficulty}`;
    return appropriate[key] !== false;
  }

  /**
   * Analyze warning acknowledgment behavior
   */
  analyzeWarningResponse(warningsPresented, warningsAcknowledged, warningsHeeded) {
    const acknowledgmentRate = (warningsAcknowledged / warningsPresented) * 100;
    const heedingRate = (warningsHeeded / warningsAcknowledged) * 100;

    return {
      warningsPresented,
      warningsAcknowledged,
      warningsHeeded,
      acknowledgmentRate: Math.round(acknowledgmentRate),
      heedingRate: Math.round(heedingRate),
      pattern: this.classifyWarningPattern(acknowledgmentRate, heedingRate),
      risk: this.assessWarningRisk(acknowledgmentRate),
      concern: acknowledgmentRate < 50 ? 'Ignoring security warnings is critical vulnerability' : 'Good warning awareness',
      realWorldImplications: `In real attacks, ${acknowledgmentRate < 70 ? 'attackers exploit ignored warnings' : 'you would likely notice attacks'}`
    };
  }

  /**
   * Classify the user's warning acknowledgment pattern
   */
  classifyWarningPattern(acknowledgmentRate, heedingRate) {
    if (acknowledgmentRate > 80 && heedingRate > 80) return 'security-conscious';
    if (acknowledgmentRate < 30) return 'warning-dismissive';
    if (acknowledgmentRate > 70 && heedingRate < 50) return 'acknowledging-but-ignoring';
    return 'moderate-awareness';
  }

  /**
   * Assess risk from warning behavior
   */
  assessWarningRisk(acknowledgmentRate) {
    if (acknowledgmentRate > this.thresholds.warningAcknowledgmentGood) return 'low';
    if (acknowledgmentRate > 50) return 'medium';
    return 'high';
  }

  /**
   * Analyze verification behavior (double-checking work)
   */
  analyzeVerificationBehavior(actionsAttempted, verificationsPerformed) {
    const verificationRate = (verificationsPerformed / actionsAttempted) * 100;

    return {
      actionsAttempted,
      verificationsPerformed,
      verificationRate: Math.round(verificationRate),
      pattern: this.classifyVerificationPattern(verificationRate),
      securityValue: verificationRate > 60 ? 'high' : verificationRate > 30 ? 'moderate' : 'low',
      concern: verificationRate < 30 ? 'Not verifying actions leaves room for mistakes' : 'Good verification habit',
      realWorldContext: `Real security professionals verify ${verificationRate > 50 ? 'most actions' : 'some actions'}`
    };
  }

  /**
   * Classify verification pattern
   */
  classifyVerificationPattern(rate) {
    if (rate > 70) return 'verification-focused';
    if (rate > 40) return 'selective-verification';
    if (rate > 10) return 'minimal-verification';
    return 'no-verification';
  }

  /**
   * Analyze pressure response (timed scenarios)
   */
  analyzePressureResponse(normalScenarioScore, timedScenarioScore, timeLimit) {
    const performanceDelta = timedScenarioScore - normalScenarioScore;
    const response =
      performanceDelta > 10 ? 'improved' :
      performanceDelta < -10 ? 'degraded' :
      'consistent';

    return {
      normalScore: normalScenarioScore,
      timedScore: timedScenarioScore,
      timeLimit,
      performanceDelta,
      response,
      description: this.pressureResponses[response],
      realWorldImplication:
        response === 'improved' ? 'You think clearly under pressure - excellent for incident response' :
        response === 'degraded' ? 'Practice staying calm; real attacks create time pressure' :
        'You handle pressure well; consistent decision-making',
      developmentArea:
        response === 'degraded' ? 'Time management and calm decision-making under stress' :
        'Confidence in fast-paced environments'
    };
  }

  /**
   * Analyze decision consistency
   */
  analyzeDecisionConsistency(recentScores) {
    if (recentScores.length < 2) return null;

    const mean = recentScores.reduce((a, b) => a + b) / recentScores.length;
    const variance = recentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / recentScores.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / mean) * 100;

    return {
      recentScores,
      average: Math.round(mean),
      standardDeviation: Math.round(stdDev),
      consistency: coefficientOfVariation < this.thresholds.decisionConsistency * 100 ? 'high' : 'variable',
      pattern: coefficientOfVariation < 10 ? 'very-consistent' :
               coefficientOfVariation < 25 ? 'consistent' :
               'inconsistent',
      concern: coefficientOfVariation > 30 ? 'Your decision quality varies significantly' : 'Your decisions are reliable',
      development: `Focus on ${coefficientOfVariation > 30 ? 'consistent application of principles' : 'maintaining this consistency'}`
    };
  }

  /**
   * Identify behavioral security risks (persona-based)
   */
  identifyBehavioralRisks(userBehavior) {
    const risks = [];

    if (userBehavior.warningAcknowledgment < 50) {
      risks.push({
        type: 'warning-dismissal',
        severity: 'critical',
        description: 'Not acknowledging security warnings',
        realWorldImpact: 'Attackers exploit dismissed warnings to compromise accounts',
        mitigation: 'Train yourself to take every warning seriously'
      });
    }

    if (userBehavior.decisionVelocity < 2000) {
      risks.push({
        type: 'rushed-decisions',
        severity: 'high',
        description: 'Making decisions too quickly without analysis',
        realWorldImpact: 'Snap judgments lead to security mistakes',
        mitigation: 'Add a 5-second pause before clicking suspicious links'
      });
    }

    if (userBehavior.verificationRate < 20) {
      risks.push({
        type: 'no-verification',
        severity: 'high',
        description: 'Not verifying actions or information',
        realWorldImpact: 'Mistakes go unnoticed and compound',
        mitigation: 'Adopt a verification habit: always check sender addresses, URLs, and permissions'
      });
    }

    if (userBehavior.pressurePerformance < 0.6 && userBehavior.knowledgeLevel > 0.7) {
      risks.push({
        type: 'pressure-sensitivity',
        severity: 'medium',
        description: 'Performance drops significantly under time pressure',
        realWorldImpact: 'Real incidents involve time pressure and high stakes',
        mitigation: 'Practice timed scenarios; develop calm decision-making'
      });
    }

    return risks;
  }

  /**
   * Generate behavioral profile summary
   */
  generateBehavioralProfile(decisionVelocity, warningAcknowledgment, verificationRate,
                           pressurePerformance, consistencyScore) {
    return {
      summary: {
        decisionSpeed: decisionVelocity < 5000 ? 'Fast' : 'Thoughtful',
        warningAwareness: warningAcknowledgment > 70 ? 'High' : 'Needs improvement',
        thoroughness: verificationRate > 50 ? 'Thorough' : 'Efficient',
        underPressure: pressurePerformance > 0.7 ? 'Stable' : 'Variable',
        reliability: consistencyScore > 0.75 ? 'Consistent' : 'Variable'
      },

      strengths: this.identifyBehavioralStrengths(decisionVelocity, warningAcknowledgment, 
                                                  verificationRate, pressurePerformance),

      improvementAreas: this.identifyBehavioralImprovements(decisionVelocity, warningAcknowledgment, 
                                                             verificationRate, pressurePerformance),

      recommendations: this.generateBehavioralRecommendations(decisionVelocity, warningAcknowledgment, 
                                                               verificationRate, pressurePerformance),

      realWorldReadiness: this.assessRealWorldReadiness(decisionVelocity, warningAcknowledgment, 
                                                        verificationRate, pressurePerformance, consistencyScore)
    };
  }

  /**
   * Identify behavioral strengths
   */
  identifyBehavioralStrengths(decisionVelocity, warningAck, verification, pressure) {
    const strengths = [];

    if (warningAck > 70) strengths.push('Strong security awareness and warning recognition');
    if (verification > 60) strengths.push('Thorough verification habits');
    if (pressure > 0.7) strengths.push('Composed decision-making under pressure');
    if (decisionVelocity > 5000 && decisionVelocity < 15000) strengths.push('Balanced decision pace');

    return strengths.length > 0 ? strengths : ['Building security behavior foundations'];
  }

  /**
   * Identify improvement areas
   */
  identifyBehavioralImprovements(decisionVelocity, warningAck, verification, pressure) {
    const improvements = [];

    if (warningAck < 50) improvements.push('Improve warning recognition and response');
    if (verification < 30) improvements.push('Develop verification habits');
    if (pressure < 0.6) improvements.push('Build composure under time pressure');
    if (decisionVelocity < 3000) improvements.push('Slow down and think through decisions');

    return improvements.length > 0 ? improvements : ['Continue current strong practices'];
  }

  /**
   * Generate behavioral recommendations
   */
  generateBehavioralRecommendations(decisionVelocity, warningAck, verification, pressure) {
    const recommendations = [];

    if (warningAck < 70) {
      recommendations.push('Practice scenarios with prominent warning messages to build this reflex');
    }
    if (verification < 50) {
      recommendations.push('Add a deliberate verification step to every major decision');
    }
    if (pressure < 0.7) {
      recommendations.push('Tackle timed scenarios with increasingly aggressive time limits');
    }
    if (decisionVelocity < 3000) {
      recommendations.push('Slow down - read the entire question and all options before deciding');
    }

    return recommendations;
  }

  /**
   * Assess real-world readiness
   */
  assessRealWorldReadiness(decisionVelocity, warningAck, verification, pressure, consistency) {
    const score = (
      (warningAck / 100) * 0.35 +      // Warnings are critical (35%)
      ((100 - Math.abs(decisionVelocity - 9000) / 6000) / 100) * 0.2 +  // Balanced speed (20%)
      (verification / 100) * 0.25 +     // Thoroughness (25%)
      (pressure) * 0.2                  // Pressure handling (20%)
    );

    return {
      readinessScore: Math.round(score * 100),
      readinessLevel:
        score > 0.8 ? 'Highly Ready' :
        score > 0.6 ? 'Mostly Ready' :
        score > 0.4 ? 'Developing' :
        'Early Stage',
      summary:
        score > 0.8 ? 'Your behavioral patterns suggest readiness for real security scenarios' :
        score > 0.6 ? 'You\'re developing good security instincts; continue practice' :
        score > 0.4 ? 'Keep training; focus on warning awareness and decision quality' :
        'Continue fundamental training; build consistent habits',
      nextFocus: warningAck < 70 ? 'warning-acknowledgment' : 'pressure-scenarios'
    };
  }
}

module.exports = BehavioralSecurityAnalyzer;
