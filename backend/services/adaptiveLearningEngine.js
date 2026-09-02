const db = require("../db");

/**
 * Adaptive Learning Engine
 * Adjusts difficulty based on user performance and logs changes for GRC compliance.
 */
class AdaptiveLearningEngine {
  constructor() {
    this.DIFFICULTY_THRESHOLDS = {
      HIGH_PROFICIENCY: 85,
      LOW_PROFICIENCY: 50,
      FAST_RESPONSE: 30,
    };
  }

  async adaptDifficulty(userId, scenarioId, sessionId, accuracy, responseTime) {
    try {
      // scenarioId here is the slug-style id used throughout the attempt-
      // submission flow (e.g. "network-scanning"), not necessarily a row in
      // the `scenarios` table (a separate, AI-generated scenario catalog
      // with numeric ids) — so a lookup miss is expected, not an error.
      const numericScenarioId = Number(scenarioId);
      let currentDifficulty = 1;

      if (Number.isInteger(numericScenarioId)) {
        const scenarioResult = await db.query(
          "SELECT difficulty_level FROM scenarios WHERE id = $1",
          [numericScenarioId]
        );

        if (scenarioResult.rows.length > 0) {
          currentDifficulty = Number(scenarioResult.rows[0].difficulty_level) || 1;
        }
      }

      let adjustment = 0;
      let reason = "";

      if (
        Number(accuracy) > this.DIFFICULTY_THRESHOLDS.HIGH_PROFICIENCY &&
        Number(responseTime) < this.DIFFICULTY_THRESHOLDS.FAST_RESPONSE
      ) {
        adjustment = 1;
        reason = "User showed high proficiency with fast response time";
      } else if (Number(accuracy) < this.DIFFICULTY_THRESHOLDS.LOW_PROFICIENCY) {
        adjustment = -1;
        reason = "User showed low proficiency, reducing difficulty to maintain engagement";
      } else {
        reason = "User performance within acceptable range, maintaining current difficulty";
      }

      const newDifficulty = Math.max(1, Math.min(10, currentDifficulty + adjustment));

      if (adjustment !== 0 && Number.isInteger(numericScenarioId)) {
        await db.query(
          "UPDATE scenarios SET difficulty_level = $1 WHERE id = $2",
          [newDifficulty, numericScenarioId]
        );
      }

      await this.logPerformanceMetrics(
        userId,
        scenarioId,
        sessionId,
        accuracy,
        responseTime,
        adjustment,
        reason
      );

      await this.logAuditTrail(
        userId,
        scenarioId,
        sessionId,
        currentDifficulty,
        newDifficulty,
        reason
      );

      return {
        newDifficulty,
        reason,
        adjustment,
        previousDifficulty: currentDifficulty,
      };
    } catch (error) {
      console.error("Error in adaptDifficulty:", error);
      throw error;
    }
  }

  async logPerformanceMetrics(
    userId,
    scenarioId,
    sessionId,
    accuracy,
    responseTime,
    adjustment,
    reason
  ) {
    try {
      await db.query(
        `
          INSERT INTO performance_metrics
          (user_id, scenario_id, session_id, accuracy, avg_response_time, difficulty_adjustment, adaptive_resilience_score, ai_analysis, timestamp)
          VALUES ($1, $2, $3, $4, make_interval(secs => $5::double precision), $6, $7, $8, CURRENT_TIMESTAMP)
        `,
        [
          userId,
          scenarioId,
          sessionId,
          accuracy,
          responseTime,
          adjustment,
          null,
          reason,
        ]
      );
    } catch (error) {
      console.error("Error logging performance metrics:", error);
    }
  }

  async logAuditTrail(
    userId,
    scenarioId,
    sessionId,
    oldDifficulty,
    newDifficulty,
    reason
  ) {
    try {
      const details = {
        action: "difficulty_adjustment",
        scenario_id: scenarioId,
        session_id: sessionId,
        old_difficulty: oldDifficulty,
        new_difficulty: newDifficulty,
        reason,
        timestamp: new Date().toISOString(),
      };

      await db.query(
        `
          INSERT INTO audit_logs (user_id, action, details, timestamp)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `,
        [userId, "DIFFICULTY_ADJUSTMENT", JSON.stringify(details)]
      );
    } catch (error) {
      console.error("Error logging audit trail:", error);
    }
  }

  async getCurrentDifficulty(scenarioId) {
    try {
      const numericScenarioId = Number(scenarioId);
      if (!Number.isInteger(numericScenarioId)) {
        return 1;
      }

      const result = await db.query(
        "SELECT difficulty_level FROM scenarios WHERE id = $1",
        [numericScenarioId]
      );

      if (result.rows.length === 0) {
        return 1;
      }

      return Number(result.rows[0].difficulty_level) || 1;
    } catch (error) {
      console.error("Error getting current difficulty:", error);
      return 1;
    }
  }

  generateAdaptivePrompt(difficulty, basePrompt) {
    const difficultyDescriptions = {
      1: "very basic, beginner-friendly",
      2: "basic with simple concepts",
      3: "intermediate beginner",
      4: "moderately challenging",
      5: "intermediate level",
      6: "moderately advanced",
      7: "advanced concepts",
      8: "highly advanced",
      9: "expert level",
      10: "master level, extremely complex",
    };

    const difficultyDesc = difficultyDescriptions[difficulty] || "intermediate level";
    return String(basePrompt || "").replace("{difficulty}", difficultyDesc);
  }
}

module.exports = AdaptiveLearningEngine;