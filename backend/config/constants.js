// risaq/constants/index.js
// Unified production-grade constants for Risaq

const API_PREFIX = "/api";
const APP_NAME = "Risaq";

/**
 * Server / App
 */
const SERVER_CONFIG = Object.freeze({
  APP_NAME,
  API_PREFIX,
  DEFAULT_PORT: 3001,
  DEFAULT_NODE_ENV: "development",
  SUPPORTED_NODE_ENVS: Object.freeze(["development", "test", "production"]),
});

/**
 * Branding / Progression
 * Keep display labels separate from future business logic when possible.
 */
const LEVELS = Object.freeze([
  Object.freeze({
    id: 0,
    key: "RECRUIT",
    name: "Recruit",
    minScore: 0,
    badge: "recruit",
  }),
  Object.freeze({
    id: 1,
    key: "ANALYST",
    name: "Analyst",
    minScore: 300,
    badge: "analyst",
  }),
  Object.freeze({
    id: 2,
    key: "DEFENDER",
    name: "Defender",
    minScore: 600,
    badge: "defender",
  }),
  Object.freeze({
    id: 3,
    key: "HUNTER",
    name: "Hunter",
    minScore: 900,
    badge: "hunter",
  }),
  Object.freeze({
    id: 4,
    key: "OPERATOR",
    name: "Operator",
    minScore: 1300,
    badge: "operator",
  }),
  Object.freeze({
    id: 5,
    key: "ELITE",
    name: "Elite",
    minScore: 1700,
    badge: "elite",
  }),
]);

/**
 * User Roles
 */
const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  LEARNER: "learner",
  INSTRUCTOR: "instructor",
});

/**
 * Database
 */
const DATABASE_TYPES = Object.freeze({
  IN_MEMORY: "in-memory",   // dev/test only
  POSTGRESQL: "postgresql", // production default
});

/**
 * Security / Auth
 */
const AUTH_CONFIG = Object.freeze({
  SESSION_COOKIE_NAME: "risaq.sid",
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  PASSWORD_RESET_EXPIRY_MINUTES: 15,
  MFA_ENABLED_BY_DEFAULT: false,
});

const RESERVED_USERNAMES = Object.freeze([
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "security",
  "risaq",
  "api",
  "null",
  "undefined",
  "owner",
  "superuser",
]);

const VALIDATION_RULES = Object.freeze({
  USERNAME: Object.freeze({
    MIN_LENGTH: 3,
    MAX_LENGTH: 24,
    PATTERN: /^[a-zA-Z0-9_]+$/,
    RESERVED: RESERVED_USERNAMES,
  }),

  PASSWORD: Object.freeze({
    MIN_LENGTH: 12,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
  }),

  EMAIL: Object.freeze({
    MAX_LENGTH: 254,
  }),

  BIO: Object.freeze({
    MAX_LENGTH: 500,
  }),
});

/**
 * Routes
 */
const ROUTES = Object.freeze({
  PAGES: Object.freeze({
    HOME: "/",
    AUTH: "/auth",
    DASHBOARD: "/dashboard",
    LEARNING: "/learn",
    TRAINING: "/training",
    PRACTICE: "/practice",
    TERMINAL: "/terminal",
    LEADERBOARD: "/leaderboard",
    ADMIN: "/admin",
    PROFILE: "/profile",
    ANALYZE_SCENARIO: "/analyze-scenario",
    LEARNER_PROFILE: "/learner-profile",
    AI_INSIGHTS: "/ai-insights",
    ANALYTICS: "/analytics",
    SETTINGS: "/settings",
  }),

  API: Object.freeze({
    PREFIX: API_PREFIX,

    HEALTH: `${API_PREFIX}/health`,

    AUTH_LOGIN: `${API_PREFIX}/auth/login`,
    AUTH_REGISTER: `${API_PREFIX}/auth/register`,
    AUTH_LOGOUT: `${API_PREFIX}/auth/logout`,
    AUTH_REFRESH: `${API_PREFIX}/auth/refresh`,
    AUTH_FORGOT_PASSWORD: `${API_PREFIX}/auth/forgot-password`,
    AUTH_RESET_PASSWORD: `${API_PREFIX}/auth/reset-password`,

    USERS_ME: `${API_PREFIX}/users/me`,
    USERS_ME_PROGRESS: `${API_PREFIX}/users/me/progress`,
    USERS_ME_SCORE: `${API_PREFIX}/users/me/score`,
    USERS_ME_SETTINGS: `${API_PREFIX}/users/me/settings`,

    LEADERBOARD: `${API_PREFIX}/leaderboard`,

    SCENARIOS: `${API_PREFIX}/scenarios`,
    SCENARIOS_ANALYZE: `${API_PREFIX}/scenarios/analyze`,

    ANALYTICS_OVERVIEW: `${API_PREFIX}/analytics/overview`,
    AI_INSIGHTS: `${API_PREFIX}/ai/insights`,

    ADMIN_USERS: `${API_PREFIX}/admin/users`,
    ADMIN_REPORTS: `${API_PREFIX}/admin/reports`,
  }),
});

/**
 * Leaderboard / XP defaults
 */
const GAMIFICATION_CONFIG = Object.freeze({
  DEFAULT_XP_PER_SCENARIO: 50,
  MAX_XP_PER_SCENARIO: 200,
  STREAK_BONUS_XP: 25,
});

/**
 * General app limits
 */
const APP_LIMITS = Object.freeze({
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
  MAX_SCENARIO_TITLE_LENGTH: 120,
  MAX_SCENARIO_DESCRIPTION_LENGTH: 2000,
});

/**
 * Helper utilities
 */
function getLevelByScore(score = 0) {
  const normalizedScore = Number.isFinite(score) ? score : 0;
  let currentLevel = LEVELS[0];

  for (const level of LEVELS) {
    if (normalizedScore >= level.minScore) {
      currentLevel = level;
    } else {
      break;
    }
  }

  return currentLevel;
}

function isReservedUsername(username = "") {
  return RESERVED_USERNAMES.includes(String(username).trim().toLowerCase());
}

module.exports = Object.freeze({
  SERVER_CONFIG,
  LEVELS,
  USER_ROLES,
  DATABASE_TYPES,
  AUTH_CONFIG,
  VALIDATION_RULES,
  ROUTES,
  GAMIFICATION_CONFIG,
  APP_LIMITS,
  getLevelByScore,
  isReservedUsername,
});