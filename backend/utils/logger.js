// Logger Utility - Centralized logging with different levels

const config = require('../config/environment');

class Logger {
  constructor() {
    this.level = config.logging.level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (Object.keys(meta).length > 0) {
      return `${baseMessage} ${JSON.stringify(meta)}`;
    }

    return baseMessage;
  }

  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  // Request logging middleware
  requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.info('Request completed', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    });

    next();
  }
}

module.exports = new Logger();