const pino = require("pino");
const { config } = require("../config/environment");

const logger = pino({
  level: config.logging.level || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { pid: false },
  redact: ["req.headers.authorization", "req.headers.cookie"],
});

function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = req.requestId || null;

  res.on("finish", () => {
    logger.info(
      {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Date.now() - startTime,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers["user-agent"],
      },
      "HTTP request completed"
    );
  });

  next();
}

function logException(error, context = {}) {
  logger.error(
    {
      ...context,
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    },
    "Unhandled exception"
  );
}

module.exports = {
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  debug: logger.debug.bind(logger),
  requestLogger,
  logException,
};
