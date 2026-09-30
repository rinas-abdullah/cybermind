// Readiness Index routes. The index and its per-stage breakdown are computed
// entirely from what the server observed in training runs and behaviour events
// (backend/services/readinessService.js) — never from anything the client
// sends here.

const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { successResponse, errorResponse } = require("../utils/responseUtils");
const { asyncHandler } = require("../middleware/errorHandler");
const readinessService = require("../services/readinessService");
const demoAuthService = require("../services/demoAuthService");
const db = require("../db");

// userId -> username, working in both in-memory and PostgreSQL modes.
async function resolveUsername(userId) {
  const local = demoAuthService.findUserById(userId);
  if (local) return local.username;
  if (db.DB_TYPE === db.DATABASE_TYPES.POSTGRESQL) {
    try {
      const { rows } = await db.query("SELECT username FROM users WHERE id = $1", [userId]);
      return rows[0]?.username || null;
    } catch (error) {
      console.warn("[readiness] username lookup failed:", error.message);
    }
  }
  return null;
}

const router = express.Router();

// The signed-in user's own readiness.
router.get(
  "/readiness",
  requireAuth,
  asyncHandler(async (req, res) => {
    const readiness = await readinessService.computeReadiness(req.user.userId);
    return successResponse(res, readiness, "Readiness computed");
  })
);

// Team view — instructors and admins only.
router.get(
  "/readiness/team",
  requireAuth,
  requireRole("instructor", "admin"),
  asyncHandler(async (req, res) => {
    const team = await readinessService.computeTeamReadiness(resolveUsername);
    return successResponse(res, team, "Team readiness computed");
  })
);

module.exports = router;
