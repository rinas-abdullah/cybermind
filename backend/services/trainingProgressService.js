// Training Progress Service - Current in-memory implementation
// Training progress service - demo in-memory in current bootstrapping, PostgreSQL target.

const progressStore = require("../data/progress");

class TrainingProgressService {
  constructor() {
    this.history = new Map(); // username -> training events[]
  }

  // ==================================================
  // HELPERS
  // ==================================================

  normalizeString(value, maxLength = 100) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
  }

  safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  clamp(value, min, max, fallback = min) {
    const n = this.safeNumber(value, fallback);
    return Math.min(Math.max(n, min), max);
  }

  ensureHistory(username) {
    if (!this.history.has(username)) {
      this.history.set(username, []);
    }
    return this.history.get(username);
  }

  addHistory(username, event) {
    const history = this.ensureHistory(username);
    history.push(event);

    // prevent unbounded growth
    if (history.length > 2000) {
      history.shift();
    }
  }

  getProgressStore() {
    return progressStore;
  }

  buildDefaultHistoryEvent(username, scenarioId, score, completed, extra = {}) {
    return {
      username,
      scenarioId,
      score,
      completed,
      timeSpent: this.safeNumber(extra.timeSpent, 0),
      attempts: this.safeNumber(extra.attempts, 0),
      source: this.normalizeString(extra.source || "training-progress-service", 80),
      timestamp: new Date().toISOString(),
    };
  }

  // ==================================================
  // CORE METHODS
  // ==================================================

  /**
   * Get user progress
   * @param {string} username
   * @returns {Promise<object>}
   */
  async getUserProgress(username) {
    const cleanUsername = this.normalizeString(username, 50);
    if (!cleanUsername) {
      return {
        success: false,
        error: "Username is required",
      };
    }

    const store = this.getProgressStore();
    const progress =
      typeof store.getUserProgress === "function"
        ? store.getUserProgress(cleanUsername)
        : null;

    if (!progress) {
      return {
        success: true,
        progress:
          typeof store.createDefaultProgress === "function"
            ? store.createDefaultProgress(cleanUsername)
            : null,
      };
    }

    return {
      success: true,
      progress,
    };
  }

  /**
   * Update progress for a scenario
   * @param {string} username
   * @param {string} scenarioId
   * @param {number} score
   * @param {boolean} completed
   * @param {object} options
   * @returns {Promise<object>}
   */
  async updateProgress(
    username,
    scenarioId,
    score,
    completed = false,
    options = {}
  ) {
    const cleanUsername = this.normalizeString(username, 50);
    const cleanScenarioId = this.normalizeString(scenarioId, 100);
    const safeScore = this.clamp(score, 0, 1000, 0);
    const safeCompleted = Boolean(completed);
    const timeSpent = Math.max(this.safeNumber(options.timeSpent, 0), 0);

    if (!cleanUsername) {
      return {
        success: false,
        error: "Username is required",
      };
    }

    if (!cleanScenarioId) {
      return {
        success: false,
        error: "Scenario ID is required",
      };
    }

    const store = this.getProgressStore();

    let updatedProgress = null;

    if (safeCompleted && typeof store.completeScenario === "function") {
      updatedProgress = await store.completeScenario(
        cleanUsername,
        cleanScenarioId,
        safeScore,
        timeSpent
      );
    } else if (typeof store.updateUserProgress === "function") {
      const current =
        typeof store.getUserProgress === "function"
          ? store.getUserProgress(cleanUsername)
          : null;

      const existingScenarioProgress =
        current?.progress?.[cleanScenarioId] || {};

      const attempts =
        this.safeNumber(existingScenarioProgress.attempts, 0) + 1;

      updatedProgress = await store.updateUserProgress(cleanUsername, {
        currentScenario: cleanScenarioId,
        progress: {
          [cleanScenarioId]: {
            status: "in_progress",
            score: Math.max(
              this.safeNumber(existingScenarioProgress.score, 0),
              safeScore
            ),
            attempts,
            timeSpent:
              this.safeNumber(existingScenarioProgress.timeSpent, 0) + timeSpent,
          },
        },
      });
    }

    if (!updatedProgress) {
      return {
        success: false,
        error: "Failed to update progress",
      };
    }

    this.addHistory(
      cleanUsername,
      this.buildDefaultHistoryEvent(
        cleanUsername,
        cleanScenarioId,
        safeScore,
        safeCompleted,
        {
          timeSpent,
          attempts:
            updatedProgress?.progress?.[cleanScenarioId]?.attempts || 1,
          source: options.source,
        }
      )
    );

    return {
      success: true,
      progress: updatedProgress,
      scenarioProgress: updatedProgress?.progress?.[cleanScenarioId] || null,
    };
  }

  /**
   * Get scenario statistics across all recorded user progress
   * @param {string} scenarioId
   * @returns {Promise<object>}
   */
  async getScenarioStats(scenarioId) {
    const cleanScenarioId = this.normalizeString(scenarioId, 100);

    if (!cleanScenarioId) {
      return {
        success: false,
        error: "Scenario ID is required",
      };
    }

    const store = this.getProgressStore();
    const progressData = Array.isArray(store.progressData) ? store.progressData : [];

    const scenarioEntries = [];

    for (const userProgress of progressData) {
      const scenarioProgress = userProgress?.progress?.[cleanScenarioId];
      if (scenarioProgress) {
        scenarioEntries.push({
          username: userProgress.username,
          status: scenarioProgress.status,
          score: this.safeNumber(scenarioProgress.score, 0),
          attempts: this.safeNumber(scenarioProgress.attempts, 0),
          timeSpent: this.safeNumber(scenarioProgress.timeSpent, 0),
        });
      }
    }

    const totalAttempts = scenarioEntries.reduce(
      (sum, entry) => sum + entry.attempts,
      0
    );
    const totalTime = scenarioEntries.reduce(
      (sum, entry) => sum + entry.timeSpent,
      0
    );
    const averageScore =
      scenarioEntries.length > 0
        ? Math.round(
            scenarioEntries.reduce((sum, entry) => sum + entry.score, 0) /
              scenarioEntries.length
          )
        : 0;

    const completionCount = scenarioEntries.filter(
      (entry) => entry.status === "completed"
    ).length;

    const completionRate =
      scenarioEntries.length > 0
        ? Math.round((completionCount / scenarioEntries.length) * 100)
        : 0;

    return {
      success: true,
      scenarioId: cleanScenarioId,
      stats: {
        usersAttempted: scenarioEntries.length,
        totalAttempts,
        averageScore,
        averageTimeSpent:
          scenarioEntries.length > 0
            ? Math.round(totalTime / scenarioEntries.length)
            : 0,
        completionCount,
        completionRate,
      },
      entries: scenarioEntries,
    };
  }

  /**
   * Get user training history
   * @param {string} username
   * @param {number} limit
   * @returns {Promise<object>}
   */
  async getTrainingHistory(username, limit = 100) {
    const cleanUsername = this.normalizeString(username, 50);
    const safeLimit = this.clamp(limit, 1, 500, 100);

    if (!cleanUsername) {
      return {
        success: false,
        error: "Username is required",
      };
    }

    const history = this.history.get(cleanUsername) || [];

    return {
      success: true,
      username: cleanUsername,
      totalEvents: history.length,
      history: [...history]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, safeLimit),
    };
  }

  /**
   * Optional helper: rebuild history from current progress snapshot
   */
  async rebuildHistoryFromProgress() {
    const store = this.getProgressStore();
    const progressData = Array.isArray(store.progressData) ? store.progressData : [];

    this.history.clear();

    for (const userProgress of progressData) {
      const username = this.normalizeString(userProgress?.username, 50);
      if (!username) continue;

      const progressEntries = userProgress?.progress || {};

      for (const [scenarioId, scenarioState] of Object.entries(progressEntries)) {
        this.addHistory(
          username,
          {
            username,
            scenarioId,
            score: this.safeNumber(scenarioState?.score, 0),
            completed: scenarioState?.status === "completed",
            timeSpent: this.safeNumber(scenarioState?.timeSpent, 0),
            attempts: this.safeNumber(scenarioState?.attempts, 0),
            source: "rebuild-history",
            timestamp: new Date().toISOString(),
          }
        );
      }
    }

    return {
      success: true,
      usersTracked: this.history.size,
    };
  }
}

module.exports = new TrainingProgressService();