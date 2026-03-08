// Validation Middleware - Input validation and sanitization

/**
 * Validate score update request body
 */
const validateScoreUpdate = (req, res, next) => {
  const { username, amount } = req.body;

  const errors = [];

  if (!username || typeof username !== 'string') {
    errors.push('Username is required and must be a string');
  }

  if (amount === undefined || amount === null) {
    errors.push('Amount is required');
  } else if (isNaN(amount) || !isFinite(amount)) {
    errors.push('Amount must be a valid number');
  } else if (amount < -1000 || amount > 1000) {
    errors.push('Amount must be between -1000 and 1000');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize inputs
  req.body.username = String(username).trim();
  req.body.amount = Number(amount);

  next();
};

/**
 * General request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  // Recursively sanitize string inputs
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);

  next();
};

module.exports = {
  validateScoreUpdate,
  sanitizeRequest
};