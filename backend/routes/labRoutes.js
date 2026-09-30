// Server-side lab routes. The browser lists labs, starts an attempt, runs
// commands and submits flags through here; the server owns every flag, all
// XP and all completion/timing decisions (backend/services/labService.js).
// The browser never sends an XP amount, a completion flag or a trusted timing.

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  validateLabStart,
  validateLabCommand,
  validateLabSubmit,
  validateLabTimeout,
  validateLabForensics,
} = require("../middleware/validation");
const { successResponse, errorResponse, notFoundResponse } = require("../utils/responseUtils");
const { asyncHandler } = require("../middleware/errorHandler");
const labService = require("../services/labService");

const router = express.Router();

function pickLang(req) {
  const q = typeof req.query?.lang === "string" ? req.query.lang : req.body?.lang;
  return q === "ar" ? "ar" : "en";
}

// List labs (no flags, no command dictionaries) plus this user's completed set.
router.get(
  "/labs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await labService.listForUser(req.user.userId, pickLang(req));
    return successResponse(res, data, "Labs listed");
  })
);

// Start an attempt. Pressure Mode's deadline is stored server-side.
router.post(
  "/labs/:labId/start",
  requireAuth,
  validateLabStart,
  asyncHandler(async (req, res) => {
    const result = await labService.startAttempt(req.user, req.params.labId, {
      pressureMode: Boolean(req.body?.pressureMode),
      lang: pickLang(req),
    });
    if (!result) return notFoundResponse(res, "Lab");
    return successResponse(res, result, "Attempt started");
  })
);

// Run a command; the server returns the output lines to render.
router.post(
  "/labs/command",
  requireAuth,
  validateLabCommand,
  asyncHandler(async (req, res) => {
    const result = await labService.runCommand(req.user, req.body.attemptId, req.body.command, pickLang(req));
    if (!result) return notFoundResponse(res, "Attempt");
    return successResponse(res, result, "Command executed");
  })
);

// Submit a captured flag; the server validates and awards XP (once per lab).
router.post(
  "/labs/submit",
  requireAuth,
  validateLabSubmit,
  asyncHandler(async (req, res) => {
    const result = await labService.submitFlag(req.user, req.body.attemptId, req.body.flag);
    if (!result) return notFoundResponse(res, "Attempt");
    return successResponse(res, result, "Flag submitted");
  })
);

// Pressure Mode countdown hit zero on the client; the server records the
// failed timed run and clears the deadline.
router.post(
  "/labs/timeout",
  requireAuth,
  validateLabTimeout,
  asyncHandler(async (req, res) => {
    const result = await labService.timeout(req.user, req.body.attemptId);
    if (!result) return notFoundResponse(res, "Attempt");
    return successResponse(res, result, "Timeout recorded");
  })
);

// Forensics: after containment, the trainee picks which techniques happened
// and in what order. The server scores the investigation (0-100), saves it on
// the run, and returns the after-action report.
router.post(
  "/labs/forensics",
  requireAuth,
  validateLabForensics,
  asyncHandler(async (req, res) => {
    const result = await labService.submitForensics(req.user, req.body.attemptId, {
      selected: req.body.selected,
      entryPoint: req.body.entryPoint || null,
    });
    if (!result) return notFoundResponse(res, "Forensics challenge");
    return successResponse(res, result, "Forensics scored");
  })
);

module.exports = router;
