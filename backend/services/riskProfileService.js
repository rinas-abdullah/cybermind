// ===== LEARNER RISK PROFILE SERVICE =====

/**
 * Maintains and updates the learner's cognitive risk profile
 * Tracks:
 * - Knowledge level
 * - Risk decision patterns
 * - Behavioral metrics
 * - Skill memory
 * - Learning retention
 */

class LearnerRiskProfileService {
  constructor() {
    this.profiles = new Map(); // In-memory storage (replace with DB)
  }

  /**
   * Create new learner profile
   */
  createProfile(userId, username) {
    const profile = {
      userId,
      username,
      knowledgeLevel: 0,
      riskPersona: 'Unclassified',
      successRate: 0,
      averageResponseTime: 0,
      completedScenarios: 0,
      
      // Behavioral metrics
      behavioralMetrics: {
        decisionVelocity: 0, // ms - how fast decisions made
        warningAcknowledgment: 100, // 0-100
        verificationBehavior: 100, // how often they verify
        pressurePerformance: 50, // performance under time
        consistencyScore: 50 // how consistent is behavior
      },
      
      // Persona scores
      personaScores: {
        carefulDefender: 20,
        fastButRisky: 20,
        socialEngTolerant: 20,
        reconSpecialist: 20,
        incidentResponder: 20
      },
      
      // Skill memory
      skillMemory: [],
      
      // Learning retention
      learningRetention: 100,
      
      // History
      scenarioAttempts: [],
      decisionHistory: [],
      
      // Timestamps
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    
    this.profiles.set(userId, profile);
    return profile;
  }

  /**
   * Update profile after scenario completion
   */
  updateProfileAfterScenario(userId, scenarioResult) {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    // Update knowledge level
    profile.knowledgeLevel = this.calculateKnowledgeLevel(profile, scenarioResult);
    
    // Update behavioral metrics
    this.updateBehavioralMetrics(profile, scenarioResult);
    
    // Update skill memory
    this.updateSkillMemory(profile, scenarioResult);
    
    // Classify behavioral persona
    profile.riskPersona = this.classifyPersona(profile);
    
    // Update learning retention
    profile.learningRetention = this.calculateRetention(profile);
    
    // Track decision patterns
    profile.decisionHistory.push(scenarioResult.decisions);
    profile.scenarioAttempts.push(scenarioResult);
    
    // Update timestamp
    profile.lastUpdated = new Date();
    
    return profile;
  }

  /**
   * Calculate knowledge level (0-100)
   */
  calculateKnowledgeLevel(profile, scenarioResult) {
    const currentKnowledge = profile.knowledgeLevel || 0;
    const newScore = scenarioResult.score;
    const completedCount = profile.completedScenarios + 1;
    
    // Weighted average: past performance + recent score
    const weightedKnowledge = (
      (currentKnowledge * (completedCount - 1) + newScore * 1) / completedCount
    );
    
    return Math.round(weightedKnowledge);
  }

  /**
   * Update behavioral metrics based on scenario performance
   */
  updateBehavioralMetrics(profile, scenarioResult) {
    const metrics = profile.behavioralMetrics;
    const decisions = scenarioResult.decisions;
    
    // Decision Velocity: measure of how fast they decide
    if (decisions.length > 0) {
      const avgTime = decisions.reduce((sum, d) => sum + (d.timeToAnswer || 0), 0) / decisions.length;
      metrics.decisionVelocity = Math.round(avgTime);
    }
    
    // Warning Acknowledgment: did they notice security warnings?
    const warningsMissed = decisions.filter(d => 
      d.ignoredWarnings === true
    ).length;
    metrics.warningAcknowledgment = Math.max(0, 100 - (warningsMissed * 10));
    
    // Pressure Performance: how well under time constraints
    if (scenarioResult.underPressure) {
      metrics.pressurePerformance = scenarioResult.score;
    }
    
    // Consistency: how consistent is their decision-making
    const recentScores = profile.scenarioAttempts
      .slice(-5)
      .map(a => a.score);
    
    if (recentScores.length > 1) {
      const variance = this.calculateVariance(recentScores);
      metrics.consistencyScore = Math.max(0, 100 - (variance / 5));
    }
  }

  /**
   * Update skill memory with new failures/successes
   */
  updateSkillMemory(profile, scenarioResult) {
    const skillsTestedThisRound = scenarioResult.skillsTested || [];
    
    skillsTestedThisRound.forEach(skill => {
      let skillRecord = profile.skillMemory.find(s => s.skillName === skill);
      
      if (!skillRecord) {
        skillRecord = {
          skillName: skill,
          failureCount: 0,
          successCount: 0,
          lastFailed: null,
          lastPassed: null,
          retentionConfidence: 100,
          reintroductionCount: 0
        };
        profile.skillMemory.push(skillRecord);
      }
      
      // Update based on whether they got it right
      if (scenarioResult.score > 70) { // Passed
        skillRecord.successCount++;
        skillRecord.lastPassed = new Date();
        skillRecord.retentionConfidence = Math.min(100, skillRecord.retentionConfidence + 5);
      } else { // Failed
        skillRecord.failureCount++;
        skillRecord.lastFailed = new Date();
        skillRecord.retentionConfidence = Math.max(0, skillRecord.retentionConfidence - 15);
      }
    });
  }

  /**
   * Classify user behavior into persona
   */
  classifyPersona(profile) {
    const metrics = profile.behavioralMetrics;
    
    // Score personas based on behavioral patterns
    const scores = {
      'Careful Defender': metrics.warningAcknowledgment * 0.8 + metrics.verificationBehavior * 0.2,
      'Fast but Risky': (100 - metrics.decisionVelocity / 10) * 0.7 + (100 - metrics.warningAcknowledgment) * 0.3,
      'Social Engineering Sensitive': metrics.warningAcknowledgment * 0.6 + metrics.consistencyScore * 0.4,
      'Recon Specialist': (100 - metrics.decisionVelocity / 10) * 0.5 + metrics.verificationBehavior * 0.5,
      'Incident Responder': metrics.pressurePerformance * 0.6 + metrics.consistencyScore * 0.4
    };
    
    // Return persona with highest score
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Calculate learning retention (how well they retain skills)
   */
  calculateRetention(profile) {
    if (profile.skillMemory.length === 0) return 100;
    
    const avgRetention = profile.skillMemory.reduce((sum, skill) => {
      return sum + skill.retentionConfidence;
    }, 0) / profile.skillMemory.length;
    
    return Math.round(avgRetention);
  }

  /**
   * Get user's profile
   */
  getProfile(userId) {
    return this.profiles.get(userId);
  }

  /**
   * Calculate variance of numbers
   */
  calculateVariance(numbers) {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    return variance;
  }

  /**
   * Predict next weakness for adaptive engine
   */
  predictNextWeakness(userId) {
    const profile = this.profiles.get(userId);
    if (!profile) return null;
    
    // Find skill with lowest retention
    const weakest = profile.skillMemory
      .sort((a, b) => a.retentionConfidence - b.retentionConfidence)[0];
    
    return weakest?.skillName || null;
  }

  /**
   * Export profile for institutional analytics
   */
  exportProfile(userId) {
    const profile = this.profiles.get(userId);
    if (!profile) return null;
    
    return {
      userId,
      username: profile.username,
      knowledgeLevel: profile.knowledgeLevel,
      riskPersona: profile.riskPersona,
      behavioralMetrics: profile.behavioralMetrics,
      skillMemory: profile.skillMemory,
      learningRetention: profile.learningRetention,
      completedScenarios: profile.scenarioAttempts.length,
      lastUpdated: profile.lastUpdated
    };
  }
}

module.exports = LearnerRiskProfileService;
