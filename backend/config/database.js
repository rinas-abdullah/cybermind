require("dotenv").config();

// Database Configuration - Future database integration
// This project currently uses in-memory data.
// This file is prepared for future MongoDB / MySQL integration
// without breaking the app right now.

const databaseConfig = {
  enabled: false,
  type: process.env.DB_TYPE || "in-memory",

  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/cybermind",
    options: {
      maxPoolSize: 10,
    },
  },

  mysql: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "cybermind",
    connectionLimit: 10,
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || "",
  },
};

async function connectDatabase() {
  return {
    success: true,
    message: "Using in-memory data. No external database connected.",
    type: databaseConfig.type,
  };
}

async function disconnectDatabase() {
  return {
    success: true,
    message: "No external database connection to close.",
  };
}

module.exports = {
  databaseConfig,
  connectDatabase,
  disconnectDatabase,
};