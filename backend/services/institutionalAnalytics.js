// ===== INSTITUTIONAL ANALYTICS LAYER =====

/**
 * Provides comprehensive analytics for instructors and institutions
 * Analyzes cohort data, generates insights, identifies common weaknesses,
 * recommends curriculum adjustments, enables data-driven decisions
 */

class InstitutionalAnalyticsEngine {
  constructor() {
    this.reportTypes = {
      cohort: 'Cohort-wide analysis and benchmarks',
      skillGap: 'Skills that most students struggle with',
      vulnerability: 'Common behavioral vulnerabilities',
      effectiveness: 'Training program effectiveness metrics',
      personaAnalysis: 'Behavioral persona distribution',
      recommendation: 'AI-powered curriculum recommendations',
      progress: 'Cohort progress over time',
      benchmark: 'Performance benchmarks and standards'
    };
  }

  /**
   * Generate comprehensive cohort analysis report
   */
  generateCohortReport(cohortUsers) {
    return {
      cohortSize: cohortUsers.length,

      overallMetrics: this.calculateCohortMetrics(cohortUsers),

      skillGaps: this.identifySkillGaps(cohortUsers),

      performanceDistribution: this.analyzePerformanceDistribution(cohortUsers),

      commonWeaknesses: this.identifyCommonWeaknesses(cohortUsers),

      behavioralPatterns: this.analyzeBehavioralPatterns(cohortUsers),

      recommendations: this.generateCohortRecommendations(cohortUsers),

      progressTrends: this.calculateProgressTrends(cohortUsers),

      riskSummary: this.identifyCohortRisks(cohortUsers)
    };
  }

  /**
   * Calculate overall cohort metrics
   */
  calculateCohortMetrics(cohortUsers) {
    const knowledgeLevels = cohortUsers.map(u => u.riskProfile?.knowledgeLevel || 0);
    const completedScenarios = cohortUsers.map(u => u.completedScenarios || 0);

    const avgKnowledge = knowledgeLevels.reduce((a, b) => a + b, 0) / cohortUsers.length;
    const avgScenarios = completedScenarios.reduce((a, b) => a + b, 0) / cohortUsers.length;
    const maxKnowledge = Math.max(...knowledgeLevels);
    const minKnowledge = Math.min(...knowledgeLevels);

    return {
      averageKnowledgeLevel: Math.round(avgKnowledge),
      averageScenariosCompleted: Math.round(avgScenarios),
      highestPerformer: Math.round(maxKnowledge),
      lowestPerformer: Math.round(minKnowledge),
      cohortSpread: Math.round(maxKnowledge - minKnowledge),
      readyForAdvanced: cohortUsers.filter(u => (u.riskProfile?.knowledgeLevel || 0) > 75).length,
      needsSupport: cohortUsers.filter(u => (u.riskProfile?.knowledgeLevel || 0) < 40).length
    };
  }

  /**
   * Identify skill gaps across cohort
   */
  identifySkillGaps(cohortUsers) {
    const skillMap = {};

    // Aggregate skill performance across cohort
    cohortUsers.forEach(user => {
      if (user.riskProfile?.skillMemory) {
        user.riskProfile.skillMemory.forEach(skill => {
          if (!skillMap[skill.skillName]) {
            skillMap[skill.skillName] = { totalAttempts: 0, totalSuccesses: 0, users: 0 };
          }
          skillMap[skill.skillName].totalAttempts += (skill.failureCount + skill.successCount);
          skillMap[skill.skillName].totalSuccesses += skill.successCount;
          skillMap[skill.skillName].users += 1;
        });
      }
    });

    // Calculate success rates and identify gaps
    const skillGaps = Object.entries(skillMap)
      .map(([skillName, data]) => ({
        skillName,
        successRate: data.totalAttempts > 0 ? (data.totalSuccesses / data.totalAttempts) * 100 : 0,
        usersAttempted: data.users,
        priority: (data.totalSuccesses / data.totalAttempts) < 0.5 ? 'critical' :
                 (data.totalSuccesses / data.totalAttempts) < 0.7 ? 'high' : 'medium'
      }))
      .sort((a, b) => a.successRate - b.successRate);

    return {
      totalSkillsTracked: Object.keys(skillMap).length,
      criticalGaps: skillGaps.filter(s => s.priority === 'critical'),
      highPriorityGaps: skillGaps.filter(s => s.priority === 'high'),
      allGaps: skillGaps
    };
  }

  /**
   * Analyze performance distribution across cohort
   */
  analyzePerformanceDistribution(cohortUsers) {
    const scores = cohortUsers.map(u => u.riskProfile?.knowledgeLevel || 0).sort((a, b) => a - b);

    const quartiles = {
      bottom25: scores.slice(0, Math.ceil(scores.length * 0.25)),
      middle50: scores.slice(Math.ceil(scores.length * 0.25), Math.ceil(scores.length * 0.75)),
      top25: scores.slice(Math.ceil(scores.length * 0.75))
    };

    return {
      median: this.median(scores),
      mean: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      standardDeviation: Math.round(this.calculateStdDev(scores)),
      quartiles: {
        bottom25: {
          range: `${Math.round(quartiles.bottom25[0])}-${Math.round(quartiles.bottom25[quartiles.bottom25.length - 1])}`,
          headcount: quartiles.bottom25.length,
          avgScore: Math.round(quartiles.bottom25.reduce((a, b) => a + b, 0) / quartiles.bottom25.length)
        },
        middle50: {
          range: `${Math.round(quartiles.middle50[0])}-${Math.round(quartiles.middle50[quartiles.middle50.length - 1])}`,
          headcount: quartiles.middle50.length,
          avgScore: Math.round(quartiles.middle50.reduce((a, b) => a + b, 0) / quartiles.middle50.length)
        },
        top25: {
          range: `${Math.round(quartiles.top25[0])}-${Math.round(quartiles.top25[quartiles.top25.length - 1])}`,
          headcount: quartiles.top25.length,
          avgScore: Math.round(quartiles.top25.reduce((a, b) => a + b, 0) / quartiles.top25.length)
        }
      },
      normalDistribution: this.checkNormalDistribution(scores)
    };
  }

  /**
   * Identify most common mistakes across cohort
   */
  identifyCommonWeaknesses(cohortUsers) {
    const mistakeMap = {};

    cohortUsers.forEach(user => {
      if (user.scenarioHistory) {
        user.scenarioHistory.forEach(attempt => {
          if (attempt.errors) {
            attempt.errors.forEach(error => {
              mistakeMap[error.type] = (mistakeMap[error.type] || 0) + 1;
            });
          }
        });
      }
    });

    const commonMistakes = Object.entries(mistakeMap)
      .map(([mistakeType, count]) => ({
        mistakeType,
        frequency: count,
        affectedPercentage: Math.round((count / cohortUsers.length) * 100),
        priority: count > cohortUsers.length * 0.6 ? 'critical' :
                 count > cohortUsers.length * 0.4 ? 'high' : 'medium'
      }))
      .sort((a, b) => b.frequency - a.frequency);

    return {
      totalMistakeTypes: Object.keys(mistakeMap).length,
      commonMistakes: commonMistakes.slice(0, 10),
      trainingFocus: commonMistakes.filter(m => m.priority === 'critical').map(m => m.mistakeType)
    };
  }

  /**
   * Analyze behavioral patterns across cohort
   */
  analyzeBehavioralPatterns(cohortUsers) {
    const personaCounts = {};
    const behavioralMetrics = {
      avgDecisionVelocity: 0,
      avgWarningAcknowledgment: 0,
      avgVerification: 0,
      avgPressurePerformance: 0,
      avgConsistency: 0
    };

    cohortUsers.forEach(user => {
      const persona = user.riskProfile?.riskPersona || 'unknown';
      personaCounts[persona] = (personaCounts[persona] || 0) + 1;

      if (user.riskProfile?.behavioralMetrics) {
        const metrics = user.riskProfile.behavioralMetrics;
        behavioralMetrics.avgDecisionVelocity += metrics.decisionVelocity || 0;
        behavioralMetrics.avgWarningAcknowledgment += metrics.warningAcknowledgment || 0;
        behavioralMetrics.avgVerification += metrics.verificationBehavior || 0;
        behavioralMetrics.avgPressurePerformance += metrics.pressurePerformance || 0;
        behavioralMetrics.avgConsistency += metrics.consistencyScore || 0;
      }
    });

    const count = cohortUsers.length;
    Object.keys(behavioralMetrics).forEach(key => {
      behavioralMetrics[key] = Math.round(behavioralMetrics[key] / count);
    });

    return {
      personaDistribution: personaCounts,
      dominantPersona: Object.entries(personaCounts).sort((a, b) => b[1] - a[1])[0],
      averageBehavioralMetrics: behavioralMetrics,
      warning: behavioralMetrics.avgWarningAcknowledgment < 65 ? 
               'Cohort shows low warning acknowledgment - critical training need' : 'Cohort demonstrates good warning awareness'
    };
  }

  /**
   * Generate curriculum recommendations
   */
  generateCohortRecommendations(cohortUsers) {
    const skillGaps = this.identifySkillGaps(cohortUsers);
    const weaknesses = this.identifyCommonWeaknesses(cohortUsers);

    const recommendations = [];

    // Recommend scenario focus
    skillGaps.criticalGaps.forEach(gap => {
      recommendations.push({
        type: 'skill-focus',
        skill: gap.skillName,
        urgency: 'critical',
        action: `Add 3+ scenarios focused on ${gap.skillName}`,
        reason: `Only ${Math.round(gap.successRate)}% of cohort masters this skill`,
        expectedImpact: 'Would improve cohort average by ~15-20%'
      });
    });

    // Recommend training adjustments
    weaknesses.trainingFocus.forEach(mistake => {
      recommendations.push({
        type: 'training-adjustment',
        focus: mistake,
        urgency: 'high',
        action: `Create pre-scenario tutorials on ${mistake}`,
        reason: `60%+ of cohort makes this error`,
        expectedImpact: 'Would reduce this error by ~40%'
      });
    });

    // Recommend pacing adjustments
    const performanceMetrics = this.analyzePerformanceDistribution(cohortUsers);
    if (performanceMetrics.stdDev > 20) {
      recommendations.push({
        type: 'pacing',
        urgency: 'medium',
        action: 'Create differentiated tracks: accelerated for top 25%, remedial for bottom 25%',
        reason: 'Wide spread in performance (IQR: ' + performanceMetrics.standardDeviation + ')',
        expectedImpact: 'Better engagement and learning across all levels'
      });
    }

    return recommendations;
  }

  /**
   * Calculate cohort progress over time
   */
  calculateProgressTrends(cohortUsers) {
    const progressByWeek = {};

    cohortUsers.forEach(user => {
      if (user.scenarioHistory) {
        user.scenarioHistory.forEach(attempt => {
          const week = this.getWeekNumber(new Date(attempt.completedAt));
          if (!progressByWeek[week]) {
            progressByWeek[week] = { totalScore: 0, count: 0 };
          }
          progressByWeek[week].totalScore += attempt.score;
          progressByWeek[week].count += 1;
        });
      }
    });

    const trends = Object.entries(progressByWeek)
      .map(([week, data]) => ({
        week: parseInt(week),
        averageScore: Math.round(data.totalScore / data.count),
        attempts: data.count
      }))
      .sort((a, b) => a.week - b.week);

    return {
      weeklyProgress: trends,
      trend: this.calculateTrend(trends.map(t => t.averageScore)),
      isImproving: trends.length > 1 && trends[trends.length - 1].averageScore > trends[0].averageScore,
      improvementRate: trends.length > 1 ? 
                       Math.round(((trends[trends.length - 1].averageScore - trends[0].averageScore) / trends[0].averageScore) * 100) : 0
    };
  }

  /**
   * Identify cohort-wide risks
   */
  identifyCohortRisks(cohortUsers) {
    const risks = [];
    const metrics = this.calculateCohortMetrics(cohortUsers);
    const behavioral = this.analyzeBehavioralPatterns(cohortUsers);

    // Risk: Low average knowledge
    if (metrics.averageKnowledgeLevel < 50) {
      risks.push({
        risk: 'Low baseline knowledge',
        severity: 'critical',
        affectedCount: cohortUsers.length,
        impact: 'Cohort lacks fundamental security understanding',
        mitigation: 'Increase beginner-level scenarios and foundational training'
      });
    }

    // Risk: Large performance gap
    if (metrics.cohortSpread > 40) {
      risks.push({
        risk: 'Large performance variance',
        severity: 'high',
        affectedCount: metrics.needsSupport,
        impact: 'Wide gap between best and worst learners',
        mitigation: 'Implement differentiated learning paths'
      });
    }

    // Risk: Low warning acknowledgment
    if (behavioral.averageBehavioralMetrics.avgWarningAcknowledgment < 60) {
      risks.push({
        risk: 'Poor warning recognition',
        severity: 'critical',
        affectedCount: cohortUsers.length,
        impact: 'Cohort vulnerable to attacks using prominent warnings',
        mitigation: 'Add warning-focused scenarios and teach warning interpretation'
      });
    }

    // Risk: Students stuck at skill
    const stallCount = cohortUsers.filter(u => (u.lastActivity && 
      new Date() - new Date(u.lastActivity) > 7 * 24 * 60 * 60 * 1000)).length;
    if (stallCount > cohortUsers.length * 0.2) {
      risks.push({
        risk: 'Learner disengagement',
        severity: 'high',
        affectedCount: stallCount,
        impact: `${stallCount} learners inactive for 7+ days`,
        mitigation: 'Follow up with disengaged learners; review difficulty levels'
      });
    }

    return {
      totalRisks: risks.length,
      criticalRisks: risks.filter(r => r.severity === 'critical'),
      allRisks: risks
    };
  }

  /**
   * Generate heatmap data for skill gaps
   */
  generateSkillGapHeatmap(cohortUsers) {
    const skillsByDifficulty = {};

    cohortUsers.forEach(user => {
      if (user.riskProfile?.skillMemory) {
        user.riskProfile.skillMemory.forEach(skill => {
          const key = `${skill.skillName}-intermediate`;
          if (!skillsByDifficulty[key]) {
            skillsByDifficulty[key] = { total: 0, successful: 0 };
          }
          skillsByDifficulty[key].total += 1;
          skillsByDifficulty[key].successful += (skill.successCount / (skill.successCount + skill.failureCount));
        });
      }
    });

    // Create heatmap structure
    const heatmapData = Object.entries(skillsByDifficulty)
      .map(([skillDiff, data]) => {
        const [skill, difficulty] = skillDiff.split('-');
        return {
          skill,
          difficulty,
          successRate: Math.round((data.successful / data.total) * 100),
          intensity: Math.round((data.successful / data.total) * 100) // 0-100 for color intensity
        };
      });

    return {
      heatmapData,
      criticalCells: heatmapData.filter(cell => cell.successRate < 50),
      visualizationData: heatmapData // Ready for Chart.js or similar
    };
  }

  /**
   * Export anonymized learner data for comparison
   */
  exportAnonymizedCohortData(cohortUsers) {
    return cohortUsers.map((user, index) => ({
      learnerID: `L${String(index + 1).padStart(3, '0')}`,
      knowledgeLevel: user.riskProfile?.knowledgeLevel || 0,
      riskPersona: user.riskProfile?.riskPersona || 'unknown',
      completedScenarios: user.completedScenarios || 0,
      weakestSkill: user.riskProfile?.skillMemory?.[0]?.skillName || 'unknown',
      warningAcknowledgment: user.riskProfile?.behavioralMetrics?.warningAcknowledgment || 0,
      decisionVelocity: user.riskProfile?.behavioralMetrics?.decisionVelocity || 0,
      joinedAt: user.createdAt,
      lastActive: user.lastActivity || user.updatedAt
    }));
  }

  // ===== HELPER FUNCTIONS =====

  median(values) {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  calculateStdDev(values) {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const sq = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(sq.reduce((a, b) => a + b) / values.length);
  }

  checkNormalDistribution(values) {
    // Simple check: if stdDev is ~15-16 for ~0-100 scale, likely normal
    return this.calculateStdDev(values) > 10 && this.calculateStdDev(values) < 25 ?
      'approximately-normal' : 'skewed';
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  calculateTrend(values) {
    if (values.length < 2) return 'insufficient-data';
    const firstHalf = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b) / Math.floor(values.length / 2);
    const secondHalf = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b) / Math.ceil(values.length / 2);
    return secondHalf > firstHalf ? 'improving' : secondHalf < firstHalf ? 'declining' : 'stable';
  }
}

module.exports = InstitutionalAnalyticsEngine;
