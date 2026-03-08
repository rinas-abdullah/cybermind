// ===== CORE TRAINING ENGINE - Service Integration =====

/**
 * Core Training Engine
 * Orchestrates all 6 intelligent systems to create a cohesive adaptive learning platform
 * 
 * Integration points:
 * 1. Called by scenario API routes
 * 2. Manages lifecycle of scenario attempts
 * 3. Coordinates all services for end-to-end learning experience
 */

const AdaptiveScenarioEngine = require('./adaptiveEngine');
const RiskProfileService = require('./riskProfileService');
const ExplainableAITutor = require('./aiTutor');
const BehavioralSecurityAnalyzer = require('./behavioralAnalyzer');
const InstitutionalAnalyticsEngine = require('./institutionalAnalytics');

class CoreTrainingEngine {
  constructor() {
    this.adaptiveEngine = new AdaptiveScenarioEngine();
    this.riskProfileService = new RiskProfileService();
    this.tutor = new ExplainableAITutor();
    this.behavioralAnalyzer = new BehavioralSecurityAnalyzer();
    this.analyticsEngine = new InstitutionalAnalyticsEngine();

    // In-memory storage (replace with database)
    this.userProfiles = new Map();
    this.scenarioAttempts = new Map();
    this.cohortData = new Map();
  }

  /**
   * Initialize new user in the training system
   * Called on user registration
   */
  initializeUser(userId, username) {
    const profile = this.riskProfileService.createProfile(userId, username);
    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Select next scenario for a user
   * Called before training session
   * 
   * Returns: Scenario with adaptive metadata and explanations
   */
  selectNextScenario(userId, availableScenarios) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error(`User profile not found: ${userId}`);
    }

    // Get adaptive selection
    const selectedScenario = this.adaptiveEngine.selectNextScenario(
      userProfile,
      userProfile.skillMemory,
      availableScenarios
    );

    // Enrich with explanations
    const enrichedScenario = {
      ...selectedScenario,
      adaptiveMetadata: {
        whySelected: this.tutor.explainScenarioSelection(
          selectedScenario.adaptiveMetadata || {},
          userProfile
        ),
        difficulty: this.calculateUserAppropiateDifficulty(userProfile),
        personalContext: this.generatePersonalContext(userProfile, selectedScenario)
      }
    };

    return enrichedScenario;
  }

  /**
   * Process scenario attempt
   * Called when user submits answers
   * 
   * Full lifecycle:
   * 1. Log attempt
   * 2. Analyze behavioral metrics
   * 3. Update skill memory
   * 4. Generate AI explanations
   * 5. Update risk profile
   * 6. Classify behavioral persona
   * 7. Return comprehensive feedback
   */
  processScenarioAttempt(userId, scenarioId, scenarioResult) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error(`User profile not found: ${userId}`);
    }

    // 1. Log attempt
    const attemptId = `${userId}-${scenarioId}-${Date.now()}`;
    const attempt = {
      id: attemptId,
      userId,
      scenarioId,
      ...scenarioResult,
      timestamp: new Date()
    };
    this.scenarioAttempts.set(attemptId, attempt);

    // 2. Analyze behavioral metrics
    const behavioralAnalysis = this.behavioralAnalyzer.analyzeDecisionVelocity(
      scenarioResult.decisionTimeMs,
      scenarioResult.difficulty
    );

    // 3. Update user profile (core operation)
    this.riskProfileService.updateProfileAfterScenario(userProfile, {
      score: scenarioResult.score,
      skillsInvolved: scenarioResult.skillsInvolved,
      decisionTimeMs: scenarioResult.decisionTimeMs,
      warningsPresented: scenarioResult.warningsPresented,
      warningsAcknowledged: scenarioResult.warningsAcknowledged,
      verificationsPerformed: scenarioResult.verificationsPerformed,
      questionsAnswered: scenarioResult.questionsAnswered,
      timeLimited: scenarioResult.timeLimited,
      decisions: scenarioResult.decisions
    });

    // 4. Generate AI explanations
    const explanations = scenarioResult.incorrectAnswers?.map(wrong => {
      const question = scenarioResult.questions?.[wrong.questionIndex];
      return this.tutor.explainWrongAnswer(
        question,
        wrong.userAnswer,
        wrong.correctAnswer,
        { industry: 'finance', frequency: 'regularly', impact: 'data breach' }
      );
    }) || [];

    // 5. Behavioral profile summary
    const behavioralProfile = this.behavioralAnalyzer.generateBehavioralProfile(
      scenarioResult.decisionTimeMs,
      userProfile.behavioralMetrics?.warningAcknowledgment || 0,
      userProfile.behavioralMetrics?.verificationBehavior || 0,
      userProfile.behavioralMetrics?.pressurePerformance || 0,
      (userProfile.scoreHistory?.slice(-10) || []).length > 0 ? 1 : 0.5
    );

    // 6. Return comprehensive feedback
    return {
      attemptId,
      score: scenarioResult.score,
      passed: scenarioResult.score >= 70,

      // Explainable AI feedback
      explanations,
      tutorFeedback: {
        wrongAnswers: explanations.length,
        keyTakeaways: explanations.map(e => e.keyTakeaway),
        motivationalMessage: this.tutor.generateMotivation(
          userProfile.completedScenarios + 1,
          userProfile
        )
      },

      // Behavioral insights
      behavioralInsights: {
        decisionVelocity: behavioralAnalysis,
        behavioralProfile,
        riskIdentified: this.behavioralAnalyzer.identifyBehavioralRisks(userProfile.behavioralMetrics)
      },

      // Profile updates
      userProgressUpdate: {
        newKnowledgeLevel: userProfile.knowledgeLevel,
        newPersona: userProfile.riskPersona,
        skillsImproved: scenarioResult.skillsInvolved.filter(s =>
          userProfile.skillMemory.find(m => m.skillName === s && m.successCount > 0)
        ),
        skillsNeedingWork: scenarioResult.skillsInvolved.filter(s =>
          userProfile.skillMemory.find(m => m.skillName === s && m.failureCount > 1)
        )
      },

      // Next steps
      nextActions: {
        nextScenario: `Based on your ${userProfile.riskPersona}, the next scenario focuses on ${userProfile.skillMemory[0]?.skillName}`,
        focusArea: userProfile.skillMemory[0]?.skillName,
        readyForAdvanced: userProfile.knowledgeLevel > 75
      }
    };
  }

  /**
   * Get user dashboard data
   * Called to display user progress and recommendations
   */
  getUserDashboard(userId) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error(`User profile not found: ${userId}`);
    }

    return {
      profile: {
        knowledgeLevel: userProfile.knowledgeLevel,
        riskPersona: userProfile.riskPersona,
        completedScenarios: userProfile.completedScenarios
      },

      stats: {
        overallScore: userProfile.knowledgeLevel,
        scenariosCompleted: userProfile.completedScenarios,
        skillsMastered: userProfile.skillMemory.filter(s => s.retentionConfidence > 80).length,
        skillsInProgress: userProfile.skillMemory.filter(s => 40 < s.retentionConfidence && s.retentionConfidence <= 80).length,
        skillsNeedingWork: userProfile.skillMemory.filter(s => s.retentionConfidence <= 40).length
      },

      skillMemory: userProfile.skillMemory.map(skill => ({
        skillName: skill.skillName,
        retentionConfidence: skill.retentionConfidence,
        successRate: skill.successCount / (skill.successCount + skill.failureCount),
        lastAttempted: skill.lastPassed || skill.lastFailed,
        status:
          skill.retentionConfidence > 80 ? 'mastered' :
          skill.retentionConfidence > 50 ? 'developing' : 'needs-work'
      })),

      behavioralProfile: userProfile.behavioralMetrics,

      recommendations: {
        nextScenario: `Focus on ${userProfile.skillMemory[0]?.skillName}`,
        focusAreas: userProfile.skillMemory
          .sort((a, b) => a.retentionConfidence - b.retentionConfidence)
          .slice(0, 3)
          .map(s => s.skillName),
        strengthAreas: userProfile.skillMemory
          .filter(s => s.retentionConfidence > 80)
          .map(s => s.skillName)
      },

      progressChart: userProfile.scoreHistory
    };
  }

  /**
   * Get institutional analytics for cohort
   * Called by admin dashboard
   */
  getCohortAnalytics(cohortUserIds) {
    const cohortUsers = cohortUserIds
      .map(id => this.userProfiles.get(id))
      .filter(u => u !== undefined);

    if (cohortUsers.length === 0) {
      return { error: 'No users in cohort' };
    }

    return {
      cohortReport: this.analyticsEngine.generateCohortReport(cohortUsers),
      skillGapHeatmap: this.analyticsEngine.generateSkillGapHeatmap(cohortUsers),
      anonymizedData: this.analyticsEngine.exportAnonymizedCohortData(cohortUsers),
      timestamp: new Date()
    };
  }

  /**
   * Get learning report for user
   * Detailed progress and recommendations
   */
  getLearningReport(userId) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error(`User profile not found: ${userId}`);
    }

    const report = this.tutor.generateLearningReport(
      userId,
      userProfile.completedScenarios,
      userProfile.skillMemory,
      userProfile
    );

    // Add behavioral analysis
    report.behavioralAnalysis = this.behavioralAnalyzer.generateBehavioralProfile(
      userProfile.behavioralMetrics?.decisionVelocity || 9000,
      userProfile.behavioralMetrics?.warningAcknowledgment || 50,
      userProfile.behavioralMetrics?.verificationBehavior || 30,
      userProfile.behavioralMetrics?.pressurePerformance || 0.6,
      0.7
    );

    return report;
  }

  // ===== HELPER METHODS =====

  calculateUserAppropiateDifficulty(userProfile) {
    const knowledgeLevel = userProfile.knowledgeLevel;
    if (knowledgeLevel < 40) return 'beginner';
    if (knowledgeLevel < 70) return 'intermediate';
    return 'advanced';
  }

  generatePersonalContext(userProfile, scenario) {
    return {
      persona: userProfile.riskPersona,
      approach: this.adaptiveEngine.suggestApproachFor(
        scenario,
        userProfile.riskPersona
      ),
      skillFocus: scenario.skillTags,
      difficulty: this.calculateUserAppropiateDifficulty(userProfile)
    };
  }

  // ===== PERSISTENCE HELPERS (Replace with Database) =====

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
    return Array.from(this.scenarioAttempts.values())
      .filter(attempt => attempt.userId === userId);
  }
}

module.exports = CoreTrainingEngine;
