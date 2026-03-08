// Environment Configuration - Environment-specific settings

require("dotenv").config();

const config = {
  // Server Configuration
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database Configuration
  database: {
    type: process.env.DB_TYPE || "in-memory", // 'in-memory', 'mongodb', 'mysql'

    mongodb: {
      uri: process.env.MONGODB_URI || "mongodb://localhost:27017/cybermind",
    },

    mysql: {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "cybermind",
    },
  },

  // Security
  jwt: {
    secret:
      process.env.JWT_SECRET || "cybermind-secret-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    credentials: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
  },
};

// Production Validation
if (config.nodeEnv === "production") {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === "cybermind-secret-key-change-in-production"
  ) {
    throw new Error("JWT_SECRET must be set in production");
  }
}

module.exports = Object.freeze(config);