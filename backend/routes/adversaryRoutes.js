const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { validateAdversaryDefend } = require("../middleware/validation");
const { aiLimiter } = require("../middleware/rateLimiter");
const { successResponse, errorResponse, notFoundResponse } = require("../utils/responseUtils");
const { asyncHandler } = require("../middleware/errorHandler");
const adversaryEngine = require("../services/adversaryEngine");

const router = express.Router();

router.use("/adversary", aiLimiter);

// The list of defense ids a trainee can invoke and what each one means —
// the frontend terminal uses this to map typed commands to ids without
// duplicating the label text.
router.get(
  "/adversary/defenses",
  requireAuth,
  asyncHandler(async (req, res) => {
    return successResponse(res, adversaryEngine.getDefenseCatalog(), "Defense catalog");
  })
);

router.post(
  "/adversary/start",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = adversaryEngine.startSession(req.user.userId);
    return successResponse(res, result, "Adversary session started");
  })
);

router.post(
  "/adversary/defend",
  requireAuth,
  validateAdversaryDefend,
  asyncHandler(async (req, res) => {
    const { sessionId, defenseId } = req.body;
    const result = adversaryEngine.applyDefense(sessionId, defenseId);

    if (!result) {
      return notFoundResponse(res, "Adversary session");
    }

    return successResponse(
      res,
      result,
      result.contained
        ? "Adversary contained"
        : result.neutralized
        ? "Defense neutralized the current move — adversary pivoted"
        : "Defense recorded — adversary continues its current approach"
    );
  })
);

router.get(
  "/adversary/state/:sessionId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const state = adversaryEngine.getState(req.params.sessionId);
    if (!state) return notFoundResponse(res, "Adversary session");
    return successResponse(res, state, "Adversary session state");
  })
);

module.exports = router;
