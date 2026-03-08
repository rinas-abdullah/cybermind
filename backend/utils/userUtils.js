// User Utilities - Common user-related functions
// TODO: Move to userService when adding database

const users = require('../data/users');

/**
 * Find a user by username (case-insensitive)
 * @param {string} username - The username to search for
 * @returns {object|null} - User object or null if not found
 */
function findUser(username) {
  return users.find(
    (u) => u.username.toLowerCase() === String(username).trim().toLowerCase()
  );
}

/**
 * Calculate user level based on points
 * @param {number} points - User's total points
 * @returns {number} - Level (0-5)
 */
function calculateLevel(points) {
  if (points >= 1700) return 5; // LEGEND
  if (points >= 1300) return 4; // VISIONARY
  if (points >= 900) return 3; // VOYAGER
  if (points >= 600) return 2; // ADEPT
  if (points >= 300) return 1; // APPRENTICE
  return 0; // NEWBIE
}

/**
 * Get level name from level number
 * @param {number} level - Level number
 * @returns {string} - Level name
 */
function getLevelName(level) {
  const levelNames = {
    0: 'NEWBIE',
    1: 'APPRENTICE',
    2: 'ADEPT',
    3: 'VOYAGER',
    4: 'VISIONARY',
    5: 'LEGEND'
  };
  return levelNames[level] || 'UNKNOWN';
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid
 */
function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false;
  const trimmed = username.trim();
  return trimmed.length >= 3 && trimmed.length <= 20 && /^[a-zA-Z0-9_]+$/.test(trimmed);
}

/**
 * Validate password format
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid
 */
function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 4;
}

module.exports = {
  findUser,
  calculateLevel,
  getLevelName,
  isValidUsername,
  isValidPassword
};