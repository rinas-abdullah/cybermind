// ===== INSTITUTIONAL ANALYTICS LAYER =====

/**
 * Provides comprehensive analytics for instructors and institutions
 * Analyzes cohort data, generates insights, identifies common weaknesses,
 * recommends curriculum adjustments, enables data-driven decisions
 */

class InstitutionalAnalyticsEngine {
  constructor() {
    this.reportTypes = {
      cohort: "Cohort-wide analysis and benchmarks",
      skillGap: "Skills that most students struggle with",
      vulnerability: "Common behavioral vulnerabilities",
      effectiveness: "Training program effectiveness metrics",
      personaAnalysis: "Behavioral persona distribution",
      recommendation: "AI-powered curriculum recommendations",
      progress: "Cohort progress over time",
      benchmark: "Performance benchmarks and standards",
    };
  }

  // ==================================================
  // HELPERS
  // ==================================================

  safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  safeString(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  safeDivide(numerator, denominator, fallback = 0) {
    const num = this.safeNumber(numerator, 0);
    const den = this.safeNumber(denominator, 0);
    if (den <= 0) return fallback;
    return num / den;
  }

  round(value, digits = 0) {
    const n = this.safeNumber(value, 0);
    const factor = Math.pow(10, digits);
    return Math.round(n * factor) / factor;
  }

  normalizeUser(user = {}) {
    const riskProfile =
      user && typeof user === "object"
        ? user.riskProfile && typeof user.riskProfile === "object"
          ? user.riskProfile
          : user
        : {};

    return {
      ...user,
      riskProfile,
      knowledgeLevel: this.safeNumber(riskProfile.knowledgeLevel, 0),
      completedScenarios: this.safeNumber(
        user.completedScenarios ?? riskProfile.completedScenarios,
        0
      ),
      riskPersona: this.safeString(riskProfile.riskPersona, "unknown"),
      skillMemory: this.safeArray(riskProfile.skillMemory),
      behavioralMetrics:
        riskProfile.behavioralMetrics && typeof riskProfile.behavioralMetrics === "object"
          ? riskProfile.behavioralMetrics
          : {},
      scenarioHistory: this.safeArray(user.scenarioHistory),
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
      lastActivity: user.lastActivity || null,
    };
  }

  normalizeUsers(cohortUsers = []) {
    return this.safeArray(cohortUsers)
      .filter((u) => u && typeof u === "object")
      .map((u) => this.normalizeUser(u));
  }

  // ==================================================
  // MAIN REPORT
  // ==================================================

  /**
   * Generate comprehensive cohort analysis report
   */
  generateCohortReport(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);

    if (users.length === 0) {
      return {
        cohortSize: 0,
        overallMetrics: {},
        skillGaps: { totalSkillsTracked: 0, criticalGaps: [], highPriorityGaps: [], allGaps: [] },
        performanceDistribution: {},
        commonWeaknesses: { totalMistakeTypes: 0, commonMistakes: [], trainingFocus: [] },
        behavioralPatterns: {},
        recommendations: [],
        progressTrends: { weeklyProgress: [], trend: "insufficient-data", isImproving: false, improvementRate: 0 },
        riskSummary: { totalRisks: 0, criticalRisks: [], allRisks: [] },
      };
    }

    return {
      cohortSize: users.length,
      overallMetrics: this.calculateCohortMetrics(users),
      skillGaps: this.identifySkillGaps(users),
      performanceDistribution: this.analyzePerformanceDistribution(users),
      commonWeaknesses: this.identifyCommonWeaknesses(users),
      behavioralPatterns: this.analyzeBehavioralPatterns(users),
      recommendations: this.generateCohortRecommendations(users),
      progressTrends: this.calculateProgressTrends(users),
      riskSummary: this.identifyCohortRisks(users),
    };
  }

  // ==================================================
  // METRICS
  // ==================================================

  /**
   * Calculate overall cohort metrics
   */
  calculateCohortMetrics(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);
    if (users.length === 0) return {};

    const knowledgeLevels = users.map((u) => u.knowledgeLevel);
    const completedScenarios = users.map((u) => u.completedScenarios);

    const avgKnowledge =
      knowledgeLevels.reduce((a, b) => a + b, 0) / knowledgeLevels.length;
    const avgScenarios =
      completedScenarios.reduce((a, b) => a + b, 0) / completedScenarios.length;
    const maxKnowledge = Math.max(...knowledgeLevels);
    const minKnowledge = Math.min(...knowledgeLevels);

    return {
      averageKnowledgeLevel: Math.round(avgKnowledge),
      averageScenariosCompleted: Math.round(avgScenarios),
      highestPerformer: Math.round(maxKnowledge),
      lowestPerformer: Math.round(minKnowledge),
      cohortSpread: Math.round(maxKnowledge - minKnowledge),
      readyForAdvanced: users.filter((u) => u.knowledgeLevel > 75).length,
      needsSupport: users.filter((u) => u.knowledgeLevel < 40).length,
    };
  }

  /**
   * Identify skill gaps across cohort
   */
  identifySkillGaps(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);
    const skillMap = {};

    users.forEach((user) => {
      user.skillMemory.forEach((skill) => {
        const skillName = this.safeString(skill.skillName, "unknown-skill");
        const successCount = Math.max(this.safeNumber(skill.successCount, 0), 0);
        const failureCount = Math.max(this.safeNumber(skill.failureCount, 0), 0);

        if (!skillMap[skillName]) {
          skillMap[skillName] = {
            totalAttempts: 0,
            totalSuccesses: 0,
            users: 0,
          };
        }

        skillMap[skillName].totalAttempts += successCount + failureCount;
        skillMap[skillName].totalSuccesses += successCount;
        skillMap[skillName].users += 1;
      });
    });

    const skillGaps = Object.entries(skillMap)
      .map(([skillName, data]) => {
        const successRatio = this.safeDivide(
          data.totalSuccesses,
          data.totalAttempts,
          0
        );
        return {
          skillName,
          successRate: Math.round(successRatio * 100),
          usersAttempted: data.users,
          priority:
            successRatio < 0.5
              ? "critical"
              : successRatio < 0.7
                ? "high"
                : "medium",
        };
      })
      .sort((a, b) => a.successRate - b.successRate);

    return {
      totalSkillsTracked: Object.keys(skillMap).length,
      criticalGaps: skillGaps.filter((s) => s.priority === "critical"),
      highPriorityGaps: skillGaps.filter((s) => s.priority === "high"),
      allGaps: skillGaps,
    };
  }

  /**
   * Analyze performance distribution across cohort
   */
  analyzePerformanceDistribution(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);
    const scores = users.map((u) => u.knowledgeLevel).sort((a, b) => a - b);

    if (scores.length === 0) {
      return {
        median: 0,
        mean: 0,
        standardDeviation: 0,
        quartiles: {},
        normalDistribution: "insufficient-data",
      };
    }

    const q1Index = Math.ceil(scores.length * 0.25);
    const q3Index = Math.ceil(scores.length * 0.75);

    const quartiles = {
      bottom25: scores.slice(0, q1Index),
      middle50: scores.slice(q1Index, q3Index),
      top25: scores.slice(q3Index),
    };

    const summarizeBucket = (bucket) => {
      if (!bucket || bucket.length === 0) {
        return {
          range: "0-0",
          headcount: 0,
          avgScore: 0,
        };
      }

      return {
        range: `${Math.round(bucket[0])}-${Math.round(bucket[bucket.length - 1])}`,
        headcount: bucket.length,
        avgScore: Math.round(bucket.reduce((a, b) => a + b, 0) / bucket.length),
      };
    };

    return {
      median: this.median(scores),
      mean: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      standardDeviation: Math.round(this.calculateStdDev(scores)),
      quartiles: {
        bottom25: summarizeBucket(quartiles.bottom25),
        middle50: summarizeBucket(quartiles.middle50),
        top25: summarizeBucket(quartiles.top25),
      },
      normalDistribution: this.checkNormalDistribution(scores),
    };
  }

  /**
   * Identify most common mistakes across cohort
   */
  identifyCommonWeaknesses(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);
    const mistakeMap = {};

    users.forEach((user) => {
      user.scenarioHistory.forEach((attempt) => {
        const errors = this.safeArray(attempt.errors);

        errors.forEach((error) => {
          const type = this.safeString(error?.type, "unknown-error");
          mistakeMap[type] = (mistakeMap[type] || 0) + 1;
        });
      });
    });

    const commonMistakes = Object.entries(mistakeMap)
      .map(([mistakeType, count]) => ({
        mistakeType,
        frequency: count,
        affectedPercentage:
          users.length > 0 ? Math.round((count / users.length) * 100) : 0,
        priority:
          count > users.length * 0.6
            ? "critical"
            : count > users.length * 0.4
              ? "high"
              : "medium",
      }))
      .sort((a, b) => b.frequency - a.frequency);

    return {
      totalMistakeTypes: Object.keys(mistakeMap).length,
      commonMistakes: commonMistakes.slice(0, 10),
      trainingFocus: commonMistakes
        .filter((m) => m.priority === "critical")
        .map((m) => m.mistakeType),
    };
  }

  /**
   * Analyze behavioral patterns across cohort
   */
  analyzeBehavioralPatterns(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);
    if (users.length === 0) return {};

    const personaCounts = {};
    const behavioralMetrics = {
      avgDecisionVelocity: 0,
      avgWarningAcknowledgment: 0,
      avgVerification: 0,
      avgPressurePerformance: 0,
      avgConsistency: 0,
    };

    users.forEach((user) => {
      const persona = user.riskPersona || "unknown";
      personaCounts[persona] = (personaCounts[persona] || 0) + 1;

      const metrics = user.behavioralMetrics || {};
      behavioralMetrics.avgDecisionVelocity += this.safeNumber(
        metrics.decisionVelocity,
        0
      );
      behavioralMetrics.avgWarningAcknowledgment += this.safeNumber(
        metrics.warningAcknowledgment,
        0
      );
      behavioralMetrics.avgVerification += this.safeNumber(
        metrics.verificationBehavior,
        0
      );
      behavioralMetrics.avgPressurePerformance += this.safeNumber(
        metrics.pressurePerformance,
        0
      );
      behavioralMetrics.avgConsistency += this.safeNumber(
        metrics.consistencyScore,
        0
      );
    });

    Object.keys(behavioralMetrics).forEach((key) => {
      behavioralMetrics[key] = Math.round(behavioralMetrics[key] / users.length);
    });

    const dominantPersona =
      Object.entries(personaCounts).sort((a, b) => b[1] - a[1])[0] || null;

    return {
      personaDistribution: personaCounts,
      dominantPersona,
      averageBehavioralMetrics: behavioralMetrics,
      warning:
        behavioralMetrics.avgWarningAcknowledgment < 65
          ? "Cohort shows weak warning acknowledgment and needs targeted reinforcement."
          : "Cohort demonstrates acceptable warning awareness overall.",
    };
  }

  // ==================================================
  // RECOMMENDATIONS
  // ==================================================

  /**
   * Generate curriculum recommendations
   */
  generateCohortRecommendations(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);
    const skillGaps = this.identifySkillGaps(users);
    const weaknesses = this.identifyCommonWeaknesses(users);

    const recommendations = [];

    skillGaps.criticalGaps.forEach((gap) => {
      recommendations.push({
        type: "skill-focus",
        skill: gap.skillName,
        urgency: "critical",
        action: `Add multiple scenarios focused on ${gap.skillName}.`,
        reason: `Only ${Math.round(gap.successRate)}% cohort success in this skill area.`,
        expectedImpact: "Would likely improve cohort performance significantly in this area.",
      });
    });

    weaknesses.trainingFocus.forEach((mistake) => {
      recommendations.push({
        type: "training-adjustment",
        focus: mistake,
        urgency: "high",
        action: `Create pre-scenario guidance and reinforcement on ${mistake}.`,
        reason: "A large portion of the cohort repeats this mistake pattern.",
        expectedImpact: "Should reduce repeated errors and improve retention.",
      });
    });

    const performanceMetrics = this.analyzePerformanceDistribution(users);
    if (performanceMetrics.standardDeviation > 20) {
      recommendations.push({
        type: "pacing",
        urgency: "medium",
        action:
          "Consider differentiated learning tracks for high performers and learners needing support.",
        reason: `Wide spread in cohort performance (std. dev. ${performanceMetrics.standardDeviation}).`,
        expectedImpact: "Can improve engagement and relevance across ability levels.",
      });
    }

    return recommendations;
  }

  // ==================================================
  // TRENDS
  // ==================================================

  /**
   * Calculate cohort progress over time
   */
  calculateProgressTrends(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);
    const progressByWeek = {};

    users.forEach((user) => {
      user.scenarioHistory.forEach((attempt) => {
        if (!attempt?.completedAt) return;

        const week = this.getWeekNumber(new Date(attempt.completedAt));
        if (!progressByWeek[week]) {
          progressByWeek[week] = { totalScore: 0, count: 0 };
        }

        progressByWeek[week].totalScore += this.safeNumber(attempt.score, 0);
        progressByWeek[week].count += 1;
      });
    });

    const trends = Object.entries(progressByWeek)
      .map(([week, data]) => ({
        week: parseInt(week, 10),
        averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
        attempts: data.count,
      }))
      .sort((a, b) => a.week - b.week);

    const firstScore = trends[0]?.averageScore || 0;
    const lastScore = trends[trends.length - 1]?.averageScore || 0;
    const improvementRate =
      trends.length > 1 && firstScore > 0
        ? Math.round(((lastScore - firstScore) / firstScore) * 100)
        : 0;

    return {
      weeklyProgress: trends,
      trend: this.calculateTrend(trends.map((t) => t.averageScore)),
      isImproving: trends.length > 1 && lastScore > firstScore,
      improvementRate,
    };
  }

  // ==================================================
  // RISKS
  // ==================================================

  /**
   * Identify cohort-wide risks
   */
  identifyCohortRisks(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);
    const risks = [];
    const metrics = this.calculateCohortMetrics(users);
    const behavioral = this.analyzeBehavioralPatterns(users);

    if ((metrics.averageKnowledgeLevel || 0) < 50) {
      risks.push({
        risk: "Low baseline knowledge",
        severity: "critical",
        affectedCount: users.length,
        impact: "The cohort may lack key security fundamentals.",
        mitigation:
          "Increase foundational scenarios and reinforce core security concepts.",
      });
    }

    if ((metrics.cohortSpread || 0) > 40) {
      risks.push({
        risk: "Large performance variance",
        severity: "high",
        affectedCount: metrics.needsSupport || 0,
        impact: "Large differences between high and low performers may reduce training efficiency.",
        mitigation: "Introduce differentiated learning paths and targeted support.",
      });
    }

    if (
      (behavioral.averageBehavioralMetrics?.avgWarningAcknowledgment || 0) < 60
    ) {
      risks.push({
        risk: "Poor warning recognition",
        severity: "critical",
        affectedCount: users.length,
        impact: "The cohort may miss visible danger signals during attacks.",
        mitigation:
          "Add warning-focused scenarios and train interpretation of suspicious indicators.",
      });
    }

    const stallCount = users.filter((u) => {
      if (!u.lastActivity) return false;
      return new Date() - new Date(u.lastActivity) > 7 * 24 * 60 * 60 * 1000;
    }).length;

    if (stallCount > users.length * 0.2) {
      risks.push({
        risk: "Learner disengagement",
        severity: "high",
        affectedCount: stallCount,
        impact: `${stallCount} learners have been inactive for more than 7 days.`,
        mitigation:
          "Follow up with inactive learners and review pacing or difficulty alignment.",
      });
    }

    return {
      totalRisks: risks.length,
      criticalRisks: risks.filter((r) => r.severity === "critical"),
      allRisks: risks,
    };
  }

  // ==================================================
  // VISUALIZATION
  // ==================================================

  /**
   * Generate heatmap data for skill gaps
   */
  generateSkillGapHeatmap(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);
    const skillsByDifficulty = {};

    users.forEach((user) => {
      user.skillMemory.forEach((skill) => {
        const skillName = this.safeString(skill.skillName, "unknown-skill");
        const key = `${skillName}::intermediate`;

        const successCount = Math.max(this.safeNumber(skill.successCount, 0), 0);
        const failureCount = Math.max(this.safeNumber(skill.failureCount, 0), 0);
        const successRate = this.safeDivide(
          successCount,
          successCount + failureCount,
          0
        );

        if (!skillsByDifficulty[key]) {
          skillsByDifficulty[key] = {
            total: 0,
            totalSuccessRate: 0,
          };
        }

        skillsByDifficulty[key].total += 1;
        skillsByDifficulty[key].totalSuccessRate += successRate;
      });
    });

    const heatmapData = Object.entries(skillsByDifficulty).map(([key, data]) => {
      const [skill, difficulty] = key.split("::");
      const avgSuccessRate =
        data.total > 0 ? (data.totalSuccessRate / data.total) * 100 : 0;

      return {
        skill,
        difficulty,
        successRate: Math.round(avgSuccessRate),
        intensity: Math.round(avgSuccessRate),
      };
    });

    return {
      heatmapData,
      criticalCells: heatmapData.filter((cell) => cell.successRate < 50),
      visualizationData: heatmapData,
    };
  }

  /**
   * Export anonymized learner data for comparison
   */
  exportAnonymizedCohortData(cohortUsers) {
    const users = this.normalizeUsers(cohortUsers);

    return users.map((user, index) => ({
      learnerID: `L${String(index + 1).padStart(3, "0")}`,
      knowledgeLevel: user.knowledgeLevel,
      riskPersona: user.riskPersona,
      completedScenarios: user.completedScenarios,
      weakestSkill: user.skillMemory?.[0]?.skillName || "unknown",
      warningAcknowledgment: this.safeNumber(
        user.behavioralMetrics?.warningAcknowledgment,
        0
      ),
      decisionVelocity: this.safeNumber(
        user.behavioralMetrics?.decisionVelocity,
        0
      ),
      joinedAt: user.createdAt,
      lastActive: user.lastActivity || user.updatedAt,
    }));
  }

  // ==================================================
  // STATS HELPERS
  // ==================================================

  median(values = []) {
    const arr = [...this.safeArray(values)].sort((a, b) => a - b);
    if (arr.length === 0) return 0;

    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0
      ? arr[mid]
      : (arr[mid - 1] + arr[mid]) / 2;
  }

  calculateStdDev(values = []) {
    const arr = this.safeArray(values).map((v) => this.safeNumber(v, 0));
    if (arr.length === 0) return 0;

    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance =
      arr.map((val) => Math.pow(val - mean, 2)).reduce((a, b) => a + b, 0) /
      arr.length;

    return Math.sqrt(variance);
  }

  checkNormalDistribution(values = []) {
    const stdDev = this.calculateStdDev(values);
    return stdDev > 10 && stdDev < 25
      ? "approximately-normal"
      : values.length < 2
        ? "insufficient-data"
        : "skewed";
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  calculateTrend(values = []) {
    const arr = this.safeArray(values).map((v) => this.safeNumber(v, 0));
    if (arr.length < 2) return "insufficient-data";

    const midpoint = Math.floor(arr.length / 2);
    const firstHalf = arr.slice(0, midpoint);
    const secondHalf = arr.slice(midpoint);

    const firstAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        : 0;
    const secondAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        : 0;

    if (secondAvg > firstAvg) return "improving";
    if (secondAvg < firstAvg) return "declining";
    return "stable";
  }
}

module.exports = InstitutionalAnalyticsEngine;