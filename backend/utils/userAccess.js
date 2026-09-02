const db = require("../db");
const demoAuthService = require("../services/demoAuthService");

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

async function getAuthUserOrNull(username) {
  const safeUsername = normalizeUsername(username);
  if (!safeUsername) return null;

  const demoUser = demoAuthService.findDemoUserByUsername(safeUsername);
  if (demoUser) return demoUser;

  if (db && typeof db.query === "function") {
    try {
      const { rows } = await db.query(
        `SELECT id, username, role, institution_id FROM users WHERE username = $1 LIMIT 1`,
        [safeUsername]
      );
      if (Array.isArray(rows) && rows.length > 0) {
        return rows[0];
      }
    } catch (error) {
      console.warn("[userAccess.getAuthUserOrNull] DB fallback failed:", error.message);
    }
  }

  return null;
}

function canAccessUsername(requestedUsername, reqUser) {
  if (!requestedUsername || !reqUser) return false;
  const requested = normalizeUsername(requestedUsername).toLowerCase();
  const current = normalizeUsername(reqUser.username).toLowerCase();
  const role = String(reqUser.role || "learner").toLowerCase();

  return (
    requested === current || role === "admin" || role === "instructor"
  );
}

function canManageUserProfile(requestedUsername, reqUser) {
  if (!requestedUsername || !reqUser) return false;
  const requested = normalizeUsername(requestedUsername).toLowerCase();
  const current = normalizeUsername(reqUser.username).toLowerCase();
  const role = String(reqUser.role || "learner").toLowerCase();

  return requested === current || role === "admin";
}

function canViewMentorHistory(requestedUsername, reqUser) {
  return canManageUserProfile(requestedUsername, reqUser);
}

module.exports = {
  normalizeUsername,
  getAuthUserOrNull,
  canAccessUsername,
  canManageUserProfile,
  canViewMentorHistory,
};
