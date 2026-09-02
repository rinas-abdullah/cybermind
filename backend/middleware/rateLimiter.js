const rateLimit = require("express-rate-limit");
const { config } = require("../config/environment");

function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later.",
      requestId: undefined,
      timestamp: new Date().toISOString(),
    },
    handler: (req, res) => {
      res.setHeader("X-RateLimit-Limit", String(options.max || config.rateLimit.max));
      if (req.requestId) {
        res.setHeader("X-Request-Id", req.requestId);
        res.locals.requestId = req.requestId;
      }
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later.",
        requestId: req.requestId || null,
        timestamp: new Date().toISOString(),
      });
    },
    ...options,
  });
}

const loginLimiter = createRateLimiter({
  max: Math.min(config.rateLimit.max, 8),
});

const registerLimiter = createRateLimiter({
  max: Math.min(config.rateLimit.max, 4),
});

const aiLimiter = createRateLimiter({
  max: Math.min(Math.floor(config.rateLimit.max * 0.5), 30),
});

module.exports = {
  loginLimiter,
  registerLimiter,
  aiLimiter,
  createRateLimiter,
};
