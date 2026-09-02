const crypto = require("crypto");

function generateRequestId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function requestIdMiddleware(req, res, next) {
  const incomingRequestId =
    (req.headers && req.headers["x-request-id"]) ||
    (req.headers && req.headers["x-correlation-id"]);

  const requestId =
    typeof incomingRequestId === "string" && incomingRequestId.trim()
      ? incomingRequestId.trim()
      : generateRequestId();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

module.exports = {
  requestIdMiddleware,
};
