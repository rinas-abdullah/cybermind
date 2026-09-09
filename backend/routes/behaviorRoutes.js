const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { validateLabBehaviorEvent } = require("../middleware/validation");
const { successResponse, errorResponse } = require("../utils/responseUtils");
const { recordLabAttempt, getUserEvents } = require("../data/behaviorEvents");
const { computeFingerprint } = require("../services/behavioralFingerprintEngine");

const router = express.Router();

router.post("/behavior/lab-attempt", requireAuth, validateLabBehaviorEvent, async (req, res) => {
  try {
    const event = await recordLabAttempt(req.user.userId, req.body);
    if (!event) {
      return errorResponse(res, "Invalid lab behavior event", 400);
    }
    return successResponse(res, event, "Lab behavior event recorded");
  } catch (error) {
    console.error("Record lab behavior event error:", error);
    return errorResponse(res, "Failed to record lab behavior event", 500);
  }
});

router.get("/behavior/fingerprint", requireAuth, async (req, res) => {
  try {
    const events = await getUserEvents(req.user.userId);
    const fingerprint = computeFingerprint(events);
    return successResponse(res, fingerprint, "Behavioral fingerprint computed");
  } catch (error) {
    console.error("Compute behavioral fingerprint error:", error);
    return errorResponse(res, "Failed to compute behavioral fingerprint", 500);
  }
});

module.exports = router;
