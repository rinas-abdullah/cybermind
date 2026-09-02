// User Utilities - Common user-related functions
// TODO: Move to userService when adding database

const { getAllDemoUsers, getDemoUserByUsername } = require("../data/users");

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Find a user by username (case-insensitive)
 * @param {string} username
 * @returns {object|null}
 */
function findUser(username) {
  if (typeof getDemoUserByUsername === "function") {
    return getDemoUserByUsername(username);
  }

  const cleanUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
  if (!cleanUsername) return null;

  const users = typeof getAllDemoUsers === "function" ? getAllDemoUsers() : [];
  return users.find((u) => String(u.username || "").toLowerCase() === cleanUsername) || null;
}

/**
 * Calculate user level based on points
 * @param {number} points
 * @returns {number}
 */
function calculateLevel(points) {
  const safePoints = Math.max(0, safeNumber(points, 0));

  if (safePoints >= 1700) return 5; // ELITE / LEGEND-equivalent
  if (safePoints >= 1300) return 4; // OPERATOR / VISIONARY-equivalent
  if (safePoints >= 900) return 3;  // HUNTER / VOYAGER-equivalent
  if (safePoints >= 600) return 2;  // DEFENDER / ADEPT-equivalent
  if (safePoints >= 300) return 1;  // ANALYST / APPRENTICE-equivalent
  return 0; // RECRUIT / NEWBIE-equivalent
}

/**
 * Get level name from level number
 * @param {number} level
 * @returns {string}
 */
function getLevelName(level) {
  const levelNames = {
    0: "RECRUIT",
    1: "ANALYST",
    2: "DEFENDER",
    3: "HUNTER",
    4: "OPERATOR",
    5: "ELITE",
  };

  return levelNames[safeNumber(level, -1)] || "UNKNOWN";
}

/**
 * Validate username format
 * @param {string} username
 * @returns {boolean}
 */
function isValidUsername(username) {
  if (!username || typeof username !== "string") return false;
  const trimmed = username.trim();
  return trimmed.length >= 3 && trimmed.length <= 20 && /^[a-zA-Z0-9_]+$/.test(trimmed);
}

/**
 * Validate password format
 * @param {string} password
 * @returns {boolean}
 */
function isValidPassword(password) {
  if (!password || typeof password !== "string") return false;
  if (password.length < 10 || password.length > 128) return false;

  return /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}

module.exports = {
  findUser,
  calculateLevel,
  getLevelName,
  isValidUsername,
  isValidPassword,
};