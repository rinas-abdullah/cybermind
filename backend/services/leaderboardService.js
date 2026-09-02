// Leaderboard Service - Demo leaderboard logic (in-memory fallback)
// Real leaderboard should be built from PostgreSQL user progress in future.

const authUsers = require("../data/authUsers");

class LeaderboardService {
  constructor() {
    this.cache = {
      leaderboard: null,
      generatedAt: null,
      expiresAt: null,
    };

    this.defaultCacheTtlMs = 60 * 1000; // 1 minute
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

  isCacheValid() {
    return (
      this.cache.leaderboard &&
      Array.isArray(this.cache.leaderboard) &&
      this.cache.expiresAt &&
      Date.now() < this.cache.expiresAt
    );
  }

  buildLeaderboardData() {
    const rawLeaderboard =
      typeof authUsers.getLeaderboard === "function"
        ? authUsers.getLeaderboard()
        : [];

    return rawLeaderboard.map((user, index) => ({
      rank: this.safeNumber(user.rank, index + 1),
      username: this.normalizeString(user.username, 50),
      points: this.safeNumber(user.points, 0),
      level: this.safeNumber(user.level, 1),
      completedScenarios: this.safeNumber(user.completedScenarios, 0),
      riskPersona: this.normalizeString(user.riskPersona, 80) || "Unclassified",
    }));
  }

  invalidateCache() {
    this.cache = {
      leaderboard: null,
      generatedAt: null,
      expiresAt: null,
    };
  }

  // ==================================================
  // CORE METHODS
  // ==================================================

  /**
   * Get leaderboard
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getLeaderboard(limit = 50) {
    const safeLimit = Math.min(Math.max(this.safeNumber(limit, 50), 1), 500);

    if (!this.isCacheValid()) {
      await this.refreshLeaderboardCache();
    }

    const leaderboard = Array.isArray(this.cache.leaderboard)
      ? this.cache.leaderboard
      : [];

    return leaderboard.slice(0, safeLimit);
  }

  /**
   * Get a user's rank and nearby context
   * @param {string} username
   * @returns {Promise<object|null>}
   */
  async getUserRank(username) {
    const cleanUsername = this.normalizeString(username, 50);
    if (!cleanUsername) {
      return null;
    }

    if (!this.isCacheValid()) {
      await this.refreshLeaderboardCache();
    }

    const leaderboard = Array.isArray(this.cache.leaderboard)
      ? this.cache.leaderboard
      : [];

    const index = leaderboard.findIndex(
      (user) => user.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (index === -1) {
      return null;
    }

    const user = leaderboard[index];

    const surrounding = leaderboard.slice(
      Math.max(0, index - 2),
      Math.min(leaderboard.length, index + 3)
    );

    return {
      user,
      surrounding,
      totalUsers: leaderboard.length,
      percentile:
        leaderboard.length > 0
          ? Math.round(((leaderboard.length - index) / leaderboard.length) * 100)
          : 0,
    };
  }

  /**
   * Refresh in-memory leaderboard cache
   * @returns {Promise<object>}
   */
  async refreshLeaderboardCache() {
    const leaderboard = this.buildLeaderboardData();

    this.cache = {
      leaderboard,
      generatedAt: new Date().toISOString(),
      expiresAt: Date.now() + this.defaultCacheTtlMs,
    };

    return {
      success: true,
      count: leaderboard.length,
      generatedAt: this.cache.generatedAt,
      expiresAt: new Date(this.cache.expiresAt).toISOString(),
    };
  }

  /**
   * Optional helper: get cached metadata
   */
  async getCacheStatus() {
    return {
      valid: this.isCacheValid(),
      generatedAt: this.cache.generatedAt,
      expiresAt: this.cache.expiresAt
        ? new Date(this.cache.expiresAt).toISOString()
        : null,
      itemCount: Array.isArray(this.cache.leaderboard)
        ? this.cache.leaderboard.length
        : 0,
    };
  }
}

module.exports = new LeaderboardService();