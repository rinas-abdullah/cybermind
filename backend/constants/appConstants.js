// Application Constants - Centralized configuration

const SERVER_CONFIG = Object.freeze({
  PORT: Number(process.env.PORT) || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  API_PREFIX: "/api",
});

const LEVELS = Object.freeze([
  { id: 0, name: "NEWBIE", minScore: 0 },
  { id: 1, name: "APPRENTICE", minScore: 300 },
  { id: 2, name: "ADEPT", minScore: 600 },
  { id: 3, name: "VOYAGER", minScore: 900 },
  { id: 4, name: "VISIONARY", minScore: 1300 },
  { id: 5, name: "LEGEND", minScore: 1700 },
]);

const ROUTES = Object.freeze({
  HOME: "/",
  DASHBOARD: "/dashboard",
  TRAINING: "/training",
  TERMINAL: "/terminal",
  LEADERBOARD: "/leaderboard-page",
  ADMIN: "/admin",

  API: {
    HEALTH: "/api/health",
    UPDATE_SCORE: "/api/update-score",
    LEADERBOARD: "/api/leaderboard",
    USER: "/api/user",
    PROGRESS: "/api/progress",
  },
});

const VALIDATION_RULES = Object.freeze({
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },

  PASSWORD: {
    MIN_LENGTH: 4,
  },

  SCORE_UPDATE: {
    MIN_AMOUNT: -1000,
    MAX_AMOUNT: 1000,
  },
});

const DATABASE_TYPES = Object.freeze({
  IN_MEMORY: "in-memory",
  MONGODB: "mongodb",
  MYSQL: "mysql",
});

module.exports = {
  SERVER_CONFIG,
  LEVELS,
  ROUTES,
  VALIDATION_RULES,
  DATABASE_TYPES,
};