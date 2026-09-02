// Score Service - Current in-memory implementation
// Score service - demo in-memory currently (work in progress for PostgreSQL integration).

const authUsers = require("../data/authUsers");
const progressData = require("../data/progress");

class ScoreService {
  constructor() {
    this.scoreHistory = new Map(); // username -> [{ pointsBefore, delta, pointsAfter, levelBefore, levelAfter, reason, timestamp }]
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

  getUserByUsername(username) {
    const cleanUsername = this.normalizeString(username, 50);
    if (!cleanUsername) return null;
    return authUsers.findUserByUsername(cleanUsername) || null;
  }

  ensureHistory(username) {
    if (!this.scoreHistory.has(username)) {
      this.scoreHistory.set(username, []);
    }
    return this.scoreHistory.get(username);
  }

  addHistoryEntry(username, entry) {
    const history = this.ensureHistory(username);
    history.push(entry);

    // optional cap to prevent unbounded memory growth
    if (history.length > 1000) {
      history.shift();
    }
  }

  // ==================================================
  // CORE METHODS
  // ==================================================

  /**
   * Update user score safely
   * @param {string} username
   * @param {number} pointsToAdd
   * @param {object} options
   * @returns {Promise<object>}
   */
  async updateUserScore(username, pointsToAdd, options = {}) {
    const cleanUsername = this.normalizeString(username, 50);
    const delta = this.safeNumber(pointsToAdd, 0);

    if (!cleanUsername) {
      return {
        success: false,
        error: "Username is required",
      };
    }

    if (!Number.isFinite(delta)) {
      return {
        success: false,
        error: "Score delta must be a valid number",
      };
    }

    const user = this.getUserByUsername(cleanUsername);
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const currentPoints = this.safeNumber(user.profile?.totalScore, 0);
    const currentLevel = this.safeNumber(user.profile?.level, 1);

    const updatedPoints = Math.max(0, currentPoints + delta);
    const updatedLevel = this.calculateLevel(updatedPoints);

    const updatedUser = authUsers.updateUserProfile(user.id, {
      totalScore: updatedPoints,
      level: updatedLevel,
      streak:
        typeof options.streak === "number"
          ? Math.max(0, options.streak)
          : user.profile?.streak ?? 0,
    });

    // Sync with progress store if available
    try {
      if (
        progressData &&
        typeof progressData.updateUserProgress === "function"
      ) {
        await progressData.updateUserProgress(cleanUsername, {
          totalScore: updatedPoints,
        });
      }
    } catch (err) {
      console.warn("Failed to sync score with progress store:", err.message);
    }

    const entry = {
      username: cleanUsername,
      pointsBefore: currentPoints,
      delta,
      pointsAfter: updatedPoints,
      levelBefore: currentLevel,
      levelAfter: updatedLevel,
      reason: this.normalizeString(options.reason || "manual-update", 120),
      scenarioId: this.normalizeString(options.scenarioId || "", 100) || null,
      source: this.normalizeString(options.source || "score-service", 80),
      timestamp: new Date().toISOString(),
    };

    this.addHistoryEntry(cleanUsername, entry);

    return {
      success: true,
      user: updatedUser,
      scoreChange: entry,
    };
  }

  /**
   * Get chronological score history for a user
   * @param {string} username
   * @returns {Promise<object>}
   */
  async getUserScoreHistory(username) {
    const cleanUsername = this.normalizeString(username, 50);

    if (!cleanUsername) {
      return {
        success: false,
        error: "Username is required",
      };
    }

    const user = this.getUserByUsername(cleanUsername);
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const history = this.scoreHistory.get(cleanUsername) || [];

    return {
      success: true,
      username: cleanUsername,
      currentPoints: this.safeNumber(user.profile?.totalScore, 0),
      currentLevel: this.safeNumber(user.profile?.level, 1),
      history: [...history].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      ),
    };
  }

  /**
   * Optional helper: reset user score history
   * @param {string} username
   * @returns {Promise<object>}
   */
  async clearUserScoreHistory(username) {
    const cleanUsername = this.normalizeString(username, 50);

    if (!cleanUsername) {
      return {
        success: false,
        error: "Username is required",
      };
    }

    this.scoreHistory.delete(cleanUsername);

    return {
      success: true,
      message: "Score history cleared",
    };
  }

  /**
   * Level calculation
   */
  calculateLevel(points) {
    const safePoints = Math.max(0, this.safeNumber(points, 0));

    if (safePoints >= 1700) return 5; // LEGEND
    if (safePoints >= 1300) return 4; // VISIONARY
    if (safePoints >= 900) return 3; // VOYAGER
    if (safePoints >= 600) return 2; // ADEPT
    if (safePoints >= 300) return 1; // APPRENTICE
    return 0; // NEWBIE
  }

  /**
   * Optional helper: get points needed for next level
   */
  getNextLevelInfo(points) {
    const safePoints = Math.max(0, this.safeNumber(points, 0));
    const currentLevel = this.calculateLevel(safePoints);

    const thresholds = [
      { level: 0, minPoints: 0, name: "NEWBIE" },
      { level: 1, minPoints: 300, name: "APPRENTICE" },
      { level: 2, minPoints: 600, name: "ADEPT" },
      { level: 3, minPoints: 900, name: "VOYAGER" },
      { level: 4, minPoints: 1300, name: "VISIONARY" },
      { level: 5, minPoints: 1700, name: "LEGEND" },
    ];

    const current = thresholds.find((t) => t.level === currentLevel);
    const next = thresholds.find((t) => t.level === currentLevel + 1) || null;

    return {
      currentLevel,
      currentName: current?.name || "NEWBIE",
      points: safePoints,
      nextLevel: next?.level ?? null,
      nextName: next?.name ?? null,
      pointsToNextLevel: next ? Math.max(0, next.minPoints - safePoints) : 0,
      maxLevelReached: !next,
    };
  }
}

module.exports = new ScoreService();