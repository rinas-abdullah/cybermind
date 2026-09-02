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
    this.profiles = new Map(); // In-memory storage (replace with DB later)
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

  safeString(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  now() {
    return new Date();
  }

  normalizeDecision(decision = {}) {
    return {
      timeToAnswer: Math.max(this.safeNumber(decision.timeToAnswer, 0), 0),
      ignoredWarnings: Boolean(decision.ignoredWarnings),
      verifiedAction: Boolean(decision.verifiedAction),
      correct:
        typeof decision.correct === "boolean"
          ? decision.correct
          : this.safeNumber(decision.score, 0) >= 70,
    };
  }

  normalizeScenarioResult(scenarioResult = {}) {
    return {
      score: this.clamp(scenarioResult.score, 0, 1000, 0),
      underPressure: Boolean(scenarioResult.underPressure),
      decisions: this.safeArray(scenarioResult.decisions).map((d) =>
        this.normalizeDecision(d)
      ),
      skillsTested: this.safeArray(scenarioResult.skillsTested)
        .filter((skill) => typeof skill === "string" && skill.trim())
        .map((skill) => skill.trim()),
      warningsPresented: Math.max(
        this.safeNumber(scenarioResult.warningsPresented, 0),
        0
      ),
      warningsAcknowledged: Math.max(
        this.safeNumber(scenarioResult.warningsAcknowledged, 0),
        0
      ),
      verificationsPerformed: Math.max(
        this.safeNumber(scenarioResult.verificationsPerformed, 0),
        0
      ),
      questionsAnswered: Math.max(
        this.safeNumber(scenarioResult.questionsAnswered, 0),
        0
      ),
      decisionTimeMs: Math.max(
        this.safeNumber(scenarioResult.decisionTimeMs, 0),
        0
      ),
      completedAt: scenarioResult.completedAt || this.now(),
    };
  }

  // ==================================================
  // PROFILE LIFECYCLE
  // ==================================================

  /**
   * Create new learner profile
   */
  createProfile(userId, username) {
    const profile = {
      userId,
      username: this.safeString(username, "unknown-user"),
      knowledgeLevel: 0,
      riskPersona: "Unclassified",
      successRate: 0,
      averageResponseTime: 0,
      completedScenarios: 0,

      // Behavioral metrics
      behavioralMetrics: {
        decisionVelocity: 0, // ms
        warningAcknowledgment: 100, // 0-100
        verificationBehavior: 100, // 0-100
        pressurePerformance: 50, // 0-100
        consistencyScore: 50, // 0-100
      },

      // Persona scores
      personaScores: {
        carefulDefender: 20,
        fastButRisky: 20,
        socialEngTolerant: 20,
        reconSpecialist: 20,
        incidentResponder: 20,
      },

      // Skill memory
      skillMemory: [],

      // Learning retention
      learningRetention: 100,

      // History
      scenarioAttempts: [],
      decisionHistory: [],

      // Timestamps
      createdAt: this.now(),
      lastUpdated: this.now(),
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

    const normalizedResult = this.normalizeScenarioResult(scenarioResult);

    // Track history first
    profile.scenarioAttempts.push(normalizedResult);
    profile.completedScenarios = profile.scenarioAttempts.length;
    profile.decisionHistory.push(normalizedResult.decisions);

    // Update knowledge level
    profile.knowledgeLevel = this.calculateKnowledgeLevel(
      profile,
      normalizedResult
    );

    // Update behavioral metrics
    this.updateBehavioralMetrics(profile, normalizedResult);

    // Update skill memory
    this.updateSkillMemory(profile, normalizedResult);

    // Update aggregate stats
    this.updateAggregatePerformance(profile);

    // Classify behavioral persona
    profile.riskPersona = this.classifyPersona(profile);

    // Update learning retention
    profile.learningRetention = this.calculateRetention(profile);

    // Update timestamp
    profile.lastUpdated = this.now();

    return profile;
  }

  // ==================================================
  // KNOWLEDGE / PERFORMANCE
  // ==================================================

  /**
   * Calculate knowledge level (0-100)
   */
  calculateKnowledgeLevel(profile, scenarioResult) {
    const currentKnowledge = this.safeNumber(profile.knowledgeLevel, 0);
    const newScore = this.clamp(scenarioResult.score, 0, 100, 0);
    const completedCount = Math.max(
      this.safeNumber(profile.completedScenarios, 0),
      1
    );

    const weightedKnowledge =
      (currentKnowledge * (completedCount - 1) + newScore) / completedCount;

    return Math.round(weightedKnowledge);
  }

  updateAggregatePerformance(profile) {
    const attempts = this.safeArray(profile.scenarioAttempts);

    if (attempts.length === 0) {
      profile.successRate = 0;
      profile.averageResponseTime = 0;
      return;
    }

    const passedCount = attempts.filter((a) => this.safeNumber(a.score, 0) >= 70).length;
    profile.successRate = Math.round((passedCount / attempts.length) * 100);

    const decisionTimes = attempts
      .map((a) => this.safeNumber(a.decisionTimeMs, 0))
      .filter((t) => t > 0);

    profile.averageResponseTime =
      decisionTimes.length > 0
        ? Math.round(
            decisionTimes.reduce((sum, t) => sum + t, 0) / decisionTimes.length
          )
        : 0;
  }

  // ==================================================
  // BEHAVIORAL METRICS
  // ==================================================

  /**
   * Update behavioral metrics based on scenario performance
   */
  updateBehavioralMetrics(profile, scenarioResult) {
    const metrics = profile.behavioralMetrics;
    const decisions = this.safeArray(scenarioResult.decisions);

    // Decision velocity
    if (scenarioResult.decisionTimeMs > 0) {
      metrics.decisionVelocity = Math.round(scenarioResult.decisionTimeMs);
    } else if (decisions.length > 0) {
      const avgTime =
        decisions.reduce((sum, d) => sum + this.safeNumber(d.timeToAnswer, 0), 0) /
        decisions.length;
      metrics.decisionVelocity = Math.round(avgTime);
    }

    // Warning acknowledgment
    const warningsPresented = Math.max(
      this.safeNumber(scenarioResult.warningsPresented, 0),
      0
    );
    const warningsAcknowledged = Math.max(
      this.safeNumber(scenarioResult.warningsAcknowledged, 0),
      0
    );

    if (warningsPresented > 0) {
      metrics.warningAcknowledgment = Math.round(
        (warningsAcknowledged / warningsPresented) * 100
      );
    } else if (decisions.length > 0) {
      const warningsMissed = decisions.filter((d) => d.ignoredWarnings === true).length;
      metrics.warningAcknowledgment = Math.max(0, 100 - warningsMissed * 10);
    }

    // Verification behavior
    const questionsAnswered = Math.max(
      this.safeNumber(scenarioResult.questionsAnswered, 0),
      0
    );
    const verificationsPerformed = Math.max(
      this.safeNumber(scenarioResult.verificationsPerformed, 0),
      0
    );

    if (questionsAnswered > 0) {
      metrics.verificationBehavior = Math.round(
        (verificationsPerformed / questionsAnswered) * 100
      );
    } else if (decisions.length > 0) {
      const verifiedCount = decisions.filter((d) => d.verifiedAction === true).length;
      metrics.verificationBehavior = Math.round(
        (verifiedCount / decisions.length) * 100
      );
    }

    // Pressure performance
    if (scenarioResult.underPressure) {
      metrics.pressurePerformance = this.clamp(scenarioResult.score, 0, 100, 0);
    }

    // Consistency
    const recentScores = this.safeArray(profile.scenarioAttempts)
      .slice(-5)
      .map((a) => this.safeNumber(a.score, 0));

    if (recentScores.length > 1) {
      const variance = this.calculateVariance(recentScores);
      metrics.consistencyScore = Math.max(0, Math.round(100 - variance / 5));
    }
  }

  // ==================================================
  // SKILL MEMORY
  // ==================================================

  /**
   * Update skill memory with new failures/successes
   */
  updateSkillMemory(profile, scenarioResult) {
    const skillsTestedThisRound = this.safeArray(scenarioResult.skillsTested);

    skillsTestedThisRound.forEach((skill) => {
      let skillRecord = profile.skillMemory.find((s) => s.skillName === skill);

      if (!skillRecord) {
        skillRecord = {
          skillName: skill,
          failureCount: 0,
          successCount: 0,
          lastFailed: null,
          lastPassed: null,
          retentionConfidence: 100,
          reintroductionCount: 0,
        };
        profile.skillMemory.push(skillRecord);
      }

      if (scenarioResult.score >= 70) {
        skillRecord.successCount += 1;
        skillRecord.lastPassed = this.now();
        skillRecord.retentionConfidence = Math.min(
          100,
          this.safeNumber(skillRecord.retentionConfidence, 100) + 5
        );
      } else {
        skillRecord.failureCount += 1;
        skillRecord.lastFailed = this.now();
        skillRecord.retentionConfidence = Math.max(
          0,
          this.safeNumber(skillRecord.retentionConfidence, 100) - 15
        );
      }
    });
  }

  // ==================================================
  // PERSONA / RETENTION
  // ==================================================

  /**
   * Classify user behavior into persona
   */
  classifyPersona(profile) {
    const metrics = profile.behavioralMetrics || {};

    const decisionVelocity = this.safeNumber(metrics.decisionVelocity, 0);
    const warningAcknowledgment = this.safeNumber(
      metrics.warningAcknowledgment,
      0
    );
    const verificationBehavior = this.safeNumber(
      metrics.verificationBehavior,
      0
    );
    const pressurePerformance = this.safeNumber(
      metrics.pressurePerformance,
      0
    );
    const consistencyScore = this.safeNumber(metrics.consistencyScore, 0);

    const speedFactor = Math.max(0, 100 - decisionVelocity / 100);

    const scores = {
      "Careful Defender":
        warningAcknowledgment * 0.5 + verificationBehavior * 0.5,
      "Fast but Risky":
        speedFactor * 0.6 + (100 - warningAcknowledgment) * 0.4,
      "Social Engineering Sensitive":
        warningAcknowledgment * 0.4 + consistencyScore * 0.6,
      "Recon Specialist":
        speedFactor * 0.4 + verificationBehavior * 0.6,
      "Incident Responder":
        pressurePerformance * 0.6 + consistencyScore * 0.4,
    };

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : "Unclassified";
  }

  /**
   * Calculate learning retention
   */
  calculateRetention(profile) {
    if (!this.safeArray(profile.skillMemory).length) return 100;

    const avgRetention =
      profile.skillMemory.reduce(
        (sum, skill) => sum + this.safeNumber(skill.retentionConfidence, 0),
        0
      ) / profile.skillMemory.length;

    return Math.round(avgRetention);
  }

  // ==================================================
  // ACCESSORS
  // ==================================================

  /**
   * Get user's profile
   */
  getProfile(userId) {
    return this.profiles.get(userId) || null;
  }

  /**
   * Calculate variance of numbers
   */
  calculateVariance(numbers) {
    const values = this.safeArray(numbers).map((n) => this.safeNumber(n, 0));
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return (
      values.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) /
      values.length
    );
  }

  /**
   * Predict next weakness for adaptive engine
   */
  predictNextWeakness(userId) {
    const profile = this.profiles.get(userId);
    if (!profile || !this.safeArray(profile.skillMemory).length) return null;

    const weakest = [...profile.skillMemory].sort(
      (a, b) =>
        this.safeNumber(a.retentionConfidence, 100) -
        this.safeNumber(b.retentionConfidence, 100)
    )[0];

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
      knowledgeLevel: this.safeNumber(profile.knowledgeLevel, 0),
      riskPersona: this.safeString(profile.riskPersona, "Unclassified"),
      behavioralMetrics: profile.behavioralMetrics || {},
      skillMemory: this.safeArray(profile.skillMemory),
      learningRetention: this.safeNumber(profile.learningRetention, 100),
      completedScenarios: this.safeArray(profile.scenarioAttempts).length,
      lastUpdated: profile.lastUpdated,
    };
  }
}

module.exports = LearnerRiskProfileService;